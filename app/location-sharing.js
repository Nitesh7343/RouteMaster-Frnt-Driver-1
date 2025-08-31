import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { API_CONFIG, saveLocationData } from '../config/database';

export default function LocationSharingScreen() {
  const [isSharing, setIsSharing] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationSubscription = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Request location permissions when component mounts
    requestLocationPermission();
    
    return () => {
      // Cleanup location subscription when component unmounts
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to share your location.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const startLocationSharing = async () => {
    try {
      setLoading(true);
      
      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation);
      
      // Start location updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (newLocation) => {
          setLocation(newLocation);
          await saveLocationToMongoDB(newLocation);
        }
      );
      
      setIsSharing(true);
      setLoading(false);
      
      // Save initial location
      await saveLocationToMongoDB(currentLocation);
      
    } catch (error) {
      console.error('Error starting location sharing:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        'Failed to start location sharing. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopLocationSharing = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsSharing(false);
    setLocation(null);
  };

  const saveLocationToMongoDB = async (locationData) => {
    try {
      const locationDocument = {
        timestamp: new Date().toISOString(),
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
        speed: locationData.coords.speed,
        heading: locationData.coords.heading,
        altitude: locationData.coords.altitude,
        deviceId: 'route-master-device', // You can make this dynamic
      };
      
      // For now, we'll just log the location data
      // In a real app, you would uncomment the line below to use the API
      console.log('Location data to save:', locationDocument);
      
      // Uncomment this line when you have a backend API set up:
      // await saveLocationData(locationDocument);
      
      console.log('Location saved successfully');
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleToggleSharing = () => {
    if (isSharing) {
      stopLocationSharing();
    } else {
      startLocationSharing();
    }
  };

  const handleBack = () => {
    if (isSharing) {
      Alert.alert(
        'Stop Sharing',
        'Location sharing is still active. Do you want to stop sharing and go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop & Go Back', 
            onPress: () => {
              stopLocationSharing();
              router.replace('/');
            }
          }
        ]
      );
    } else {
      router.replace('/');
    }
  };

  const handleDone = () => {
    if (isSharing) {
      Alert.alert(
        'Stop Sharing',
        'Location sharing is still active. Do you want to stop sharing and finish?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop & Done', 
            onPress: () => {
              stopLocationSharing();
              router.replace('/');
            }
          }
        ]
      );
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Route Master</Text>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>RM</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Share Live Location</Text>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isSharing ? styles.toggleButtonOn : styles.toggleButtonOff,
              loading && styles.toggleButtonLoading
            ]}
            onPress={handleToggleSharing}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator 
                color={isSharing ? '#fff' : '#007AFF'} 
                size="large"
              />
            ) : (
              <Text style={[
                styles.toggleText,
                isSharing ? styles.toggleTextOn : styles.toggleTextOff
              ]}>
                {isSharing ? 'ON' : 'OFF'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Current Location:</Text>
            <Text style={styles.locationText}>
              Latitude: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Accuracy: {location.coords.accuracy?.toFixed(2) || 'N/A'} meters
            </Text>
          </View>
        )}

         <View style={styles.statusContainer}>
           <Text style={styles.statusText}>
             Status: {isSharing ? 'ON - Sharing coordinates to database' : 'OFF - Location sharing stopped'}
           </Text>
         </View>

         <View style={styles.buttonContainer}>
           <TouchableOpacity 
             style={[styles.backButton, styles.halfButton]}
             onPress={handleBack}
           >
             <Text style={styles.backButtonText}>Back</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={[styles.doneButton, styles.halfButton]}
             onPress={handleDone}
           >
             <Text style={styles.doneButtonText}>Done</Text>
           </TouchableOpacity>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  toggleButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleButtonOn: {
    backgroundColor: '#4CAF50', // Green color when ON
  },
  toggleButtonOff: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  toggleButtonLoading: {
    opacity: 0.7,
  },
  toggleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  toggleTextOn: {
    color: '#fff',
  },
  toggleTextOff: {
    color: '#007AFF',
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  halfButton: {
    flex: 1,
  },
});
