import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function UserHomeScreen() {
  const router = useRouter();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [availableBuses, setAvailableBuses] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dummy data for available buses
  const dummyBuses = [
    { id: '1', busNumber: 'UP32AB1234', departure: '10:00 AM', arrival: '12:30 PM', price: '₹150' },
    { id: '2', busNumber: 'UP32CD5678', departure: '11:00 AM', arrival: '1:30 PM', price: '₹180' },
    { id: '3', busNumber: 'UP32EF9012', departure: '12:00 PM', arrival: '2:30 PM', price: '₹160' },
    { id: '4', busNumber: 'UP32GH3456', departure: '1:00 PM', arrival: '3:30 PM', price: '₹170' },
  ];

  const handleSearchRoute = () => {
    if (fromLocation.trim() && toLocation.trim()) {
      setIsSearching(true);
      // Simulate API call delay
      setTimeout(() => {
        setAvailableBuses(dummyBuses);
        setIsSearching(false);
      }, 1000);
    }
  };

  const handleBusSelect = (bus) => {
    router.push({
      pathname: '/tracking-bus',
      params: { busId: bus.id, busNumber: bus.busNumber }
    });
  };

  const handleBackToHome = () => {
    router.replace('/home');
  };

  const renderBusItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.busItem}
      onPress={() => handleBusSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.busHeader}>
        <Text style={styles.busNumber}>{item.busNumber}</Text>
        <Text style={styles.busPrice}>{item.price}</Text>
      </View>
      <View style={styles.busDetails}>
        <Text style={styles.busTime}>
          {item.departure} → {item.arrival}
        </Text>
        <Text style={styles.busRoute}>
          {fromLocation} → {toLocation}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>RM</Text>
            </View>
            <Text style={styles.appTitle}>Route Master</Text>
          </View>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToHome}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.welcomeSubtext}>Find your perfect route</Text>
        </View>

        {/* Route Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>From</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter starting location"
              placeholderTextColor="#B0B0B0"
              value={fromLocation}
              onChangeText={setFromLocation}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>To</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              placeholderTextColor="#B0B0B0"
              value={toLocation}
              onChangeText={setToLocation}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchRoute}
            disabled={!fromLocation.trim() || !toLocation.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>
              {isSearching ? 'Searching...' : 'Search Route'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Buses Section */}
        {availableBuses.length > 0 && (
          <View style={styles.busesSection}>
            <Text style={styles.busesTitle}>Available Buses</Text>
            <Text style={styles.busesSubtitle}>
              for {fromLocation} → {toLocation}
            </Text>
            
            <FlatList
              data={availableBuses}
              renderItem={renderBusItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Empty State */}
        {!isSearching && availableBuses.length === 0 && fromLocation && toLocation && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No buses found for this route</Text>
            <Text style={styles.emptyStateSubtext}>Try different locations or time</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004D40',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#FF6B00',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  busesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  busesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  busesSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  busItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  busPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  busDetails: {
    gap: 4,
  },
  busTime: {
    fontSize: 16,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  busRoute: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
});
