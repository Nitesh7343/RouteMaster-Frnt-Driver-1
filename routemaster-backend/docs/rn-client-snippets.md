# RouteMaster React Native Client Integration

This guide provides React Native code snippets and examples for integrating with the RouteMaster backend using Socket.IO for real-time communication.

## �� Prerequisites

### Required Dependencies

```bash
# Socket.IO client
npm install socket.io-client

# Location services (Expo)
expo install expo-location

# Navigation (optional)
npm install @react-navigation/native @react-navigation/stack

# Maps (optional)
npm install react-native-maps
# or for Expo
expo install react-native-maps
```

### Environment Setup

```javascript
// config/api.js
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-url:5001',
  SOCKET_URL: 'http://your-backend-url:5001',
  API_TIMEOUT: 10000,
};

export const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true,
};
```

## 🚗 Driver Application

### Driver Socket Service

```javascript
// services/driverSocket.js
import io from 'socket.io-client';
import { API_CONFIG, SOCKET_CONFIG } from '../config/api';

class DriverSocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.isConnected = false;
  }

  connect(token) {
    this.token = token;
    
    this.socket = io(`${API_CONFIG.SOCKET_URL}/driver`, {
      ...SOCKET_CONFIG,
      auth: { token }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🚗 Driver connected to Socket.IO');
      this.isConnected = true;
    });

    this.socket.on('bus:status', (data) => {
      console.log('📡 Bus status update:', data);
    });

    this.socket.on('bus:update', (data) => {
      console.log('📡 Bus movement update:', data);
    });
  }

  toggleBusStatus(busId, online) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('driver:toggle', { busId, online });
  }

  sendBusMovement(location, speed, heading) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('driver:move', {
      lng: location.longitude,
      lat: location.latitude,
      speed: speed || 0,
      heading: heading || 0,
      ts: Date.now()
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new DriverSocketService();
```

### Location Tracking Hook

```javascript
// hooks/useLocationTracking.js
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import DriverSocketService from '../services/driverSocket';

export const useLocationTracking = (busId, isOnline) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const lastLocationRef = useRef(null);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const startTracking = async () => {
    if (!isOnline) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    setIsTracking(true);

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    });

    setLocation(currentLocation);
    lastLocationRef.current = currentLocation;

    // Watch position updates
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation(newLocation);
        
        if (lastLocationRef.current) {
          const distance = calculateDistance(
            lastLocationRef.current.coords.latitude,
            lastLocationRef.current.coords.longitude,
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );

          // Send update if distance > 20m
          if (distance > 20) {
            DriverSocketService.sendBusMovement(
              newLocation.coords,
              newLocation.coords.speed,
              newLocation.coords.heading
            );
            lastLocationRef.current = newLocation;
          }
        }
      }
    );
  };

  useEffect(() => {
    if (isOnline) {
      startTracking();
    }
  }, [isOnline]);

  return { location, isTracking };
};
```

## 👤 User Application

### User Socket Service

```javascript
// services/userSocket.js
import io from 'socket.io-client';
import { API_CONFIG, SOCKET_CONFIG } from '../config/api';

class UserSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.subscribedBuses = new Set();
    this.subscribedRoutes = new Set();
    this.lastSeenCache = new Map();
  }

  connect() {
    this.socket = io(`${API_CONFIG.SOCKET_URL}/user`, {
      ...SOCKET_CONFIG
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('👤 User connected to Socket.IO');
      this.isConnected = true;
    });

    this.socket.on('bus:status', (data) => {
      console.log('📡 Bus status update:', data);
      this.handleBusStatusUpdate(data);
    });

    this.socket.on('bus:update', (data) => {
      console.log('📡 Bus movement update:', data);
      this.handleBusMovementUpdate(data);
    });
  }

  subscribeToBus(busId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe:bus', { busId });
    this.subscribedBuses.add(busId);
  }

  subscribeToRoute(routeId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe:route', { routeId });
    this.subscribedRoutes.add(routeId);
  }

  handleBusStatusUpdate(data) {
    this.lastSeenCache.set(data.busId, {
      lastSeen: new Date(),
      status: data.online ? 'online' : 'offline',
      lastOnlineAt: data.lastOnlineAt
    });
  }

  handleBusMovementUpdate(data) {
    this.lastSeenCache.set(data.busId, {
      lastSeen: new Date(),
      status: 'online',
      location: data.location,
      speed: data.speed,
      heading: data.heading
    });
  }

  isBusStale(busId, staleThresholdSeconds = 60) {
    const lastSeen = this.lastSeenCache.get(busId);
    if (!lastSeen) return true;

    const now = new Date();
    const timeDiff = (now - lastSeen.lastSeen) / 1000;
    return timeDiff > staleThresholdSeconds;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new UserSocketService();
```

### Bus API Service

```javascript
// services/busApi.js
import { API_CONFIG } from '../config/api';

class BusApiService {
  async getBusDetails(busId) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/buses/${busId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.API_TIMEOUT,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching bus details:', error);
      throw error;
    }
  }

  async getNearbyBuses(latitude, longitude, radius = 2000) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/buses/near?lng=${longitude}&lat=${latitude}&r=${radius}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.API_TIMEOUT,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching nearby buses:', error);
      throw error;
    }
  }
}

export default new BusApiService();
```

### Live Map Component

```javascript
// components/LiveMap.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import UserSocketService from '../services/userSocket';
import BusApiService from '../services/busApi';

const LiveMap = ({ routeId, initialRegion }) => {
  const [buses, setBuses] = useState(new Map());
  const [routeData, setRouteData] = useState(null);
  const staleCheckInterval = useRef(null);

  useEffect(() => {
    initializeMap();
    return () => cleanup();
  }, [routeId]);

  const initializeMap = async () => {
    try {
      UserSocketService.connect();
      UserSocketService.subscribeToRoute(routeId);

      // Set up stale bus checking
      staleCheckInterval.current = setInterval(() => {
        const staleBuses = [];
        
        buses.forEach((bus, busId) => {
          if (UserSocketService.isBusStale(busId, 60)) {
            staleBuses.push(busId);
          }
        });

        // Fetch fresh data for stale buses
        staleBuses.forEach(async (busId) => {
          try {
            const freshData = await BusApiService.getBusDetails(busId);
            updateBusFromAPI(busId, freshData);
          } catch (error) {
            console.error(`Failed to refresh stale bus ${busId}:`, error);
          }
        });
      }, 30000);
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  };

  const updateBusLocation = (data) => {
    setBuses(prevBuses => {
      const newBuses = new Map(prevBuses);
      const existingBus = newBuses.get(data.busId) || {};
      
      newBuses.set(data.busId, {
        ...existingBus,
        location: data.location,
        speed: data.speed,
        heading: data.heading,
        online: true,
        lastUpdateAt: data.lastUpdateAt
      });

      return newBuses;
    });
  };

  const updateBusFromAPI = (busId, apiData) => {
    setBuses(prevBuses => {
      const newBuses = new Map(prevBuses);
      newBuses.set(busId, {
        ...apiData,
        lastUpdateAt: apiData.lastUpdateAt || new Date()
      });
      return newBuses;
    });
  };

  const cleanup = () => {
    if (staleCheckInterval.current) {
      clearInterval(staleCheckInterval.current);
    }
    UserSocketService.disconnect();
  };

  const getBusMarkerColor = (bus) => {
    if (!bus.online) return '#ff6b6b'; // Red for offline
    if (bus.speed > 0) return '#4ecdc4'; // Teal for moving
    return '#45b7d1'; // Blue for stationary
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Bus markers */}
        {Array.from(buses.values()).map((bus) => (
          <Marker
            key={bus.busId}
            coordinate={{
              latitude: bus.location?.coordinates[1] || 0,
              longitude: bus.location?.coordinates[0] || 0
            }}
            title={`Bus ${bus.busId}`}
            description={`Status: ${bus.online ? 'Online' : 'Offline'}`}
            pinColor={getBusMarkerColor(bus)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default LiveMap;
```

## 🔧 Configuration & Setup

### Environment Configuration

```javascript
// config/environment.js
export const ENV = {
  development: {
    API_BASE_URL: 'http://localhost:5001',
    SOCKET_URL: 'http://localhost:5001',
  },
  production: {
    API_BASE_URL: 'https://api.routemaster.com',
    SOCKET_URL: 'https://api.routemaster.com',
  },
};

export const getConfig = () => {
  const env = __DEV__ ? 'development' : 'production';
  return ENV[env];
};
```

## 📱 Testing & Debugging

### Socket.IO Debug Mode

```javascript
// Enable debug mode in development
if (__DEV__) {
  import('socket.io-client').then(({ io }) => {
    io.debug = true;
  });
}
```

## 🚀 Performance Optimization

### Location Update Throttling

```javascript
// utils/locationThrottle.js
export class LocationThrottler {
  constructor(minDistance = 20, minInterval = 5000) {
    this.minDistance = minDistance;
    this.minInterval = minInterval;
    this.lastLocation = null;
    this.lastUpdate = 0;
  }

  shouldUpdate(newLocation) {
    const now = Date.now();
    
    if (now - this.lastUpdate < this.minInterval) {
      return false;
    }

    if (this.lastLocation) {
      const distance = this.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      
      if (distance < this.minDistance) {
        return false;
      }
    }

    this.lastLocation = newLocation;
    this.lastUpdate = now;
    return true;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
```

This comprehensive React Native integration guide provides all the necessary code snippets and examples for building real-time driver and user applications that integrate seamlessly with the RouteMaster backend.
