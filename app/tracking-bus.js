import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'expo-maps';

const { width, height } = Dimensions.get('window');

export default function TrackingBusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { busId, busNumber } = params;

  // Dummy data for bus tracking
  const [busLocation, setBusLocation] = useState({
    latitude: 27.4924, // Mathura coordinates
    longitude: 77.6737,
  });
  const [eta, setEta] = useState('12:30 PM');
  const [currentStop, setCurrentStop] = useState('Mathura Junction');

  // Simulate bus movement (in real app, this would come from GPS)
  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation(prev => ({
        latitude: prev.latitude + 0.0001,
        longitude: prev.longitude + 0.0001,
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleBackToUserHome = () => {
    router.back();
  };

  const handleBackToMainHome = () => {
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Bus ID */}
      <View style={styles.header}>
        <View style={styles.busInfo}>
          <Text style={styles.busIdLabel}>Bus ID</Text>
          <Text style={styles.busIdValue}>{busNumber || 'UP32AB1234'}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToUserHome}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={handleBackToMainHome}
          >
            <Text style={styles.homeButtonText}>🏠</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 27.4924,
            longitude: 77.6737,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Bus Marker */}
          <Marker
            coordinate={busLocation}
            title="Your Bus"
            description={`Bus ${busNumber || 'UP32AB1234'}`}
            pinColor="#FF6B00"
          />
          
          {/* Route Markers */}
          <Marker
            coordinate={{ latitude: 27.4924, longitude: 77.6737 }}
            title="Mathura Junction"
            description="Starting Point"
            pinColor="#4CAF50"
          />
          <Marker
            coordinate={{ latitude: 27.1767, longitude: 78.0081 }}
            title="Agra Fort"
            description="Destination"
            pinColor="#FF5722"
          />
        </MapView>
        
        {/* Map Overlay Info */}
        <View style={styles.mapOverlay}>
          <View style={styles.locationInfo}>
            <Text style={styles.currentStopLabel}>Current Stop</Text>
            <Text style={styles.currentStopValue}>{currentStop}</Text>
          </View>
        </View>
      </View>

      {/* ETA Section */}
      <View style={styles.etaSection}>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>ETA</Text>
          <Text style={styles.etaValue}>{eta}</Text>
          <Text style={styles.etaSubtext}>Estimated Time of Arrival</Text>
        </View>
        
        {/* Additional Bus Info */}
        <View style={styles.busDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>Mathura → Agra</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Speed</Text>
            <Text style={styles.detailValue}>45 km/h</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>58 km</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004D40',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  busInfo: {
    flex: 1,
  },
  busIdLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  busIdValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  homeButtonText: {
    fontSize: 18,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  locationInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  currentStopLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  currentStopValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  etaSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  etaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  etaLabel: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  etaValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 8,
  },
  etaSubtext: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  busDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
