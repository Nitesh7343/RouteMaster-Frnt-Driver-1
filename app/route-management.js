import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function RouteManagementScreen() {
  const [busNumber, setBusNumber] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromCitySearch, setFromCitySearch] = useState('');
  const [toCitySearch, setToCitySearch] = useState('');
  
  const router = useRouter();

  // Comprehensive list of Indian cities for suggestions
  const indianCities = [
    'Agra', 'Ahmedabad', 'Ajmer', 'Akola', 'Aligarh', 'Allahabad', 'Amravati', 'Amritsar', 'Anand', 'Aurangabad',
    'Bangalore', 'Bareilly', 'Belgaum', 'Bhavnagar', 'Bhopal', 'Bhubaneswar', 'Bikaner', 'Bokaro', 'Chandigarh', 'Chennai',
    'Coimbatore', 'Cuttack', 'Dehradun', 'Delhi', 'Dhanbad', 'Durgapur', 'Erode', 'Faridabad', 'Ghaziabad', 'Gorakhpur',
    'Gulbarga', 'Guntur', 'Gurgaon', 'Guwahati', 'Gwalior', 'Howrah', 'Hubli', 'Hyderabad', 'Indore', 'Jabalpur',
    'Jaipur', 'Jalandhar', 'Jalgaon', 'Jammu', 'Jamnagar', 'Jamshedpur', 'Jhansi', 'Jodhpur', 'Kakinada', 'Kannur',
    'Kanpur', 'Karnal', 'Kochi', 'Kolhapur', 'Kolkata', 'Kollam', 'Kota', 'Kozhikode', 'Kurnool', 'Lucknow',
    'Ludhiana', 'Madurai', 'Malappuram', 'Mangalore', 'Mathura', 'Meerut', 'Mumbai', 'Mysore', 'Nagpur', 'Nashik',
    'Nellore', 'Noida', 'Patna', 'Pondicherry', 'Pune', 'Raipur', 'Rajkot', 'Ranchi', 'Rourkela', 'Salem',
    'Sangli', 'Shimla', 'Siliguri', 'Solapur', 'Srinagar', 'Surat', 'Thane', 'Thiruvananthapuram', 'Thrissur', 'Tiruchirappalli',
    'Tirupati', 'Udaipur', 'Vadodara', 'Varanasi', 'Vasai-Virar', 'Vijayawada', 'Visakhapatnam', 'Warangal'
  ];

  // Generate time options for scroll wheel picker
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  // Bus number validation regex (format: UP32AB1234)
  const busNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;

  const validateBusNumber = (number) => {
    if (!number.trim()) {
      return 'Bus number is required';
    }
    if (!busNumberRegex.test(number.toUpperCase())) {
      return 'Invalid bus number format (e.g., UP32AB1234)';
    }
    return null;
  };

  const validateField = (fieldName, value) => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    return null;
  };

  const validateRoute = () => {
    if (fromCity && toCity && fromCity === toCity) {
      return 'Start and Destination cannot be the same';
    }
    return null;
  };

  const handleBusNumberChange = (text) => {
    setBusNumber(text.toUpperCase());
    const error = validateBusNumber(text);
    setErrors(prev => ({
      ...prev,
      busNumber: error
    }));
  };

  const handleFromCityChange = (city) => {
    setFromCity(city);
    setFromCitySearch(city);
    setShowFromSuggestions(false);
    
    // Clear previous route error
    setErrors(prev => ({
      ...prev,
      route: null
    }));
    
    // Check for route validation
    if (city && toCity) {
      const routeError = validateRoute();
      if (routeError) {
        setErrors(prev => ({
          ...prev,
          route: routeError
        }));
      }
    }
  };

  const handleToCityChange = (city) => {
    setToCity(city);
    setToCitySearch(city);
    setShowToSuggestions(false);
    
    // Clear previous route error
    setErrors(prev => ({
      ...prev,
      route: null
    }));
    
    // Check for route validation
    if (fromCity && city) {
      const routeError = validateRoute();
      if (routeError) {
        setErrors(prev => ({
          ...prev,
          route: routeError
        }));
      }
    }
  };

  const handleFromCitySearch = (text) => {
    setFromCitySearch(text);
    setShowFromSuggestions(text.length > 0);
    if (!text.trim()) {
      setFromCity('');
    }
  };

  const handleToCitySearch = (text) => {
    setToCitySearch(text);
    setShowToSuggestions(text.length > 0);
    if (!text.trim()) {
      setToCity('');
    }
  };

  const getFilteredCities = (searchText) => {
    if (!searchText.trim()) return [];
    return indianCities.filter(city => 
      city.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const handleStartTimeConfirm = (hour, minute, period) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    setShiftStartTime(timeString);
    setShowStartTimePicker(false);
  };

  const handleEndTimeConfirm = (hour, minute, period) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    setShiftEndTime(timeString);
    setShowEndTimePicker(false);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  const validateForm = () => {
    const newErrors = {};
    
    const busError = validateBusNumber(busNumber);
    if (busError) newErrors.busNumber = busError;
    
    const fromError = validateField('From city', fromCity);
    if (fromError) newErrors.fromCity = fromError;
    
    const toError = validateField('To city', toCity);
    if (toError) newErrors.toCity = toError;
    
    if (!shiftStartTime) {
      newErrors.shiftStartTime = 'Shift start time is required';
    }
    
    const routeError = validateRoute();
    if (routeError) newErrors.route = routeError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDone = () => {
    if (validateForm()) {
      Alert.alert(
        'Confirm Route',
        'Are you sure you want to save this route?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: () => {
              // Save route data and navigate to location sharing
              router.push('/location-sharing');
            },
          },
        ]
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderCitySuggestions = (visible, searchText, onCitySelect, onClose, isFromCity) => {
    if (!visible) return null;
    
    const filteredCities = getFilteredCities(searchText);
    
    return (
      <View style={styles.suggestionsContainer}>
        <FlatList
          data={filteredCities}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => onCitySelect(item)}
            >
              <Text style={styles.suggestionItemText}>{item}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEnabled={true}
          bounces={false}
        />
      </View>
    );
  };

  const renderTimePicker = (visible, onConfirm, onClose, title) => {
    const [selectedHour, setSelectedHour] = useState(1);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    const handleConfirm = () => {
      onConfirm(selectedHour, selectedMinute, selectedPeriod);
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={onClose} style={styles.timePickerButton}>
                <Text style={styles.timePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>{title}</Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.timePickerButton}>
                <Text style={[styles.timePickerButtonText, styles.timePickerButtonTextConfirm]}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerWheel}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Hour</Text>
                <View style={styles.timePickerScrollContainer}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    style={styles.timePickerScroll}
                    nestedScrollEnabled={true}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timePickerItem,
                          selectedHour === hour && styles.timePickerItemSelected
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[
                          styles.timePickerItemText,
                          selectedHour === hour && styles.timePickerItemTextSelected
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Minute</Text>
                <View style={styles.timePickerScrollContainer}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    style={styles.timePickerScroll}
                    nestedScrollEnabled={true}
                  >
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timePickerItem,
                          selectedMinute === minute && styles.timePickerItemSelected
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text style={[
                          styles.timePickerItemText,
                          selectedMinute === minute && styles.timePickerItemTextSelected
                        ]}>
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Period</Text>
                <View style={styles.timePickerScrollContainer}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    style={styles.timePickerScroll}
                    nestedScrollEnabled={true}
                  >
                    {periods.map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.timePickerItem,
                          selectedPeriod === period && styles.timePickerItemSelected
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                      >
                        <Text style={[
                          styles.timePickerItemText,
                          selectedPeriod === period && styles.timePickerItemTextSelected
                        ]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.timePickerSelectionIndicator} />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Route Master</Text>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>RM</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bus Number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, errors.busNumber ? styles.inputError : null]}
              placeholder="Enter Bus Number (e.g., UP32AB1234)"
              placeholderTextColor="#B0B0B0"
              value={busNumber}
              onChangeText={handleBusNumberChange}
              autoCapitalize="characters"
              maxLength={10}
            />
            <View style={[styles.inputUnderline, errors.busNumber ? styles.inputUnderlineError : null]} />
          </View>
          {errors.busNumber && (
            <Text style={styles.errorText}>{errors.busNumber}</Text>
          )}
          <Text style={styles.inputHint}>
            Format: 2 letters + 2 digits + 2 letters + 4 digits
          </Text>
        </View>

        <View style={styles.routeContainer}>
          <Text style={styles.label}>Route</Text>
          <View style={styles.routeInputs}>
            <View style={styles.routeField}>
              <Text style={styles.routeLabel}>From</Text>
              <View style={styles.cityInputContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.cityInput, errors.fromCity ? styles.inputError : null]}
                  placeholder="Type to search"
                  placeholderTextColor="#B0B0B0"
                  value={fromCitySearch}
                  onChangeText={handleFromCitySearch}
                  autoCapitalize="words"
                />
              </View>
              {renderCitySuggestions(
                showFromSuggestions,
                fromCitySearch,
                handleFromCityChange,
                () => setShowFromSuggestions(false),
                true
              )}
              {errors.fromCity && (
                <Text style={styles.errorText}>{errors.fromCity}</Text>
              )}
              <Text style={styles.cityHelperText}>Type to search</Text>
            </View>
            <View style={styles.routeField}>
              <Text style={styles.routeLabel}>To</Text>
              <View style={styles.cityInputContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.cityInput, errors.toCity ? styles.inputError : null]}
                  placeholder="Type to search"
                  placeholderTextColor="#B0B0B0"
                  value={toCitySearch}
                  onChangeText={handleToCitySearch}
                  autoCapitalize="words"
                />
              </View>
              {renderCitySuggestions(
                showToSuggestions,
                toCitySearch,
                handleToCityChange,
                () => setShowToSuggestions(false),
                false
              )}
              {errors.toCity && (
                <Text style={styles.errorText}>{errors.toCity}</Text>
              )}
              <Text style={styles.cityHelperText}>Type to search</Text>
            </View>
          </View>
          {errors.route && (
            <Text style={styles.errorText}>{errors.route}</Text>
          )}
        </View>

        <View style={styles.shiftContainer}>
          <Text style={styles.label}>Shift Timing</Text>
          <View style={styles.shiftButtons}>
            <TouchableOpacity 
              style={[styles.shiftButton, shiftStartTime ? styles.shiftButtonActive : null]}
              onPress={() => setShowStartTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.shiftButtonText, shiftStartTime ? styles.shiftButtonTextActive : null]}>
                Shift Start
              </Text>
              {shiftStartTime ? (
                <Text style={[styles.timeText, shiftStartTime ? styles.timeTextActive : null]}>
                  {formatTime(shiftStartTime)}
                </Text>
              ) : (
                <Text style={styles.timePlaceholder}>Select Time</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.shiftButton, shiftEndTime ? styles.shiftButtonActive : null]}
              onPress={() => setShowEndTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.shiftButtonText, shiftEndTime ? styles.shiftButtonTextActive : null]}>
                Shift End
              </Text>
              {shiftEndTime ? (
                <Text style={[styles.timeText, shiftEndTime ? styles.timeTextActive : null]}>
                  {formatTime(shiftEndTime)}
                </Text>
              ) : (
                <Text style={styles.timePlaceholder}>Select Time</Text>
              )}
            </TouchableOpacity>
          </View>
          {errors.shiftStartTime && (
            <Text style={styles.errorText}>{errors.shiftStartTime}</Text>
          )}
          <Text style={styles.shiftHint}>
            Use the scroll wheel picker to set your shift times
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.backButton]}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, styles.backButtonText]}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker Modals */}
      {renderTimePicker(
        showStartTimePicker,
        handleStartTimeConfirm,
        () => setShowStartTimePicker(false),
        'Select Start Time'
      )}
      
      {renderTimePicker(
        showEndTimePicker,
        handleEndTimeConfirm,
        () => setShowEndTimePicker(false),
        'Select End Time'
      )}
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
    backgroundColor: '#004D40',
    borderBottomWidth: 1,
    borderBottomColor: '#00695C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#FF6B00',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#004D40',
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputUnderline: {
    height: 2,
    backgroundColor: '#FF6B00',
    borderRadius: 1,
    marginTop: 4,
  },
  inputUnderlineError: {
    backgroundColor: '#FF5252',
  },
  inputError: {
    borderColor: '#FF5252',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputHint: {
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  routeContainer: {
    marginBottom: 25,
  },
  routeInputs: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeField: {
    marginBottom: 18,
  },
  routeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  cityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    position: 'relative',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#FF6B00',
  },
  cityInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    fontWeight: '500',
  },
  cityHelperText: {
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#004D40',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  shiftContainer: {
    marginBottom: 30,
  },
  shiftButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  shiftButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shiftButtonActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#E65100',
  },
  shiftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },
  shiftButtonTextActive: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 6,
    fontWeight: '500',
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  timePlaceholder: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 6,
    fontStyle: 'italic',
  },
  shiftHint: {
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backButtonText: {
    color: '#FF6B00',
  },
  // Time Picker Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContainer: {
    backgroundColor: '#004D40',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timePickerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  timePickerButtonTextConfirm: {
    color: '#FF6B00',
    fontWeight: '600',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timePickerWheel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    height: 200,
  },
  timePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  timePickerColumnLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 10,
    fontWeight: '500',
  },
  timePickerScrollContainer: {
    height: 150,
    width: screenWidth / 3 - 40,
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  timePickerItemSelected: {
    backgroundColor: '#FF6B00',
  },
  timePickerItemText: {
    fontSize: 18,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  timePickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timePickerSelectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    height: 50,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
    zIndex: -1,
  },
});



