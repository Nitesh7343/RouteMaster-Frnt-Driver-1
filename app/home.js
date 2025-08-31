import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const handleDriverPress = () => {
    router.push('/');
  };

  const handleUserPress = () => {
    router.push('/user');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Name at Top */}
      <View style={styles.header}>
        <Text style={styles.appName}>Route Master</Text>
      </View>

      {/* Logo Placeholder */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>RM</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Choose Account Type</Text>
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        {/* Driver Button */}
        <TouchableOpacity 
          style={styles.accountButton}
          onPress={handleDriverPress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>🚌</Text>
          </View>
          <Text style={styles.buttonText}>Driver</Text>
        </TouchableOpacity>

        {/* User Button */}
        <TouchableOpacity 
          style={styles.accountButton}
          onPress={handleUserPress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.buttonText}>User</Text>
        </TouchableOpacity>
      </View>

      {/* Made with Love */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ♥</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004D40', // Dark teal background matching your theme
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#FF6B00', // Orange background matching your theme
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 80,
  },
  accountButton: {
    backgroundColor: '#000000', // Black background
    borderWidth: 2,
    borderColor: '#FF6B00', // Orange border
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: (width - 120) / 2, // Responsive width
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonIcon: {
    marginBottom: 16,
  },
  iconText: {
    fontSize: 48,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: '#B0B0B0',
    fontSize: 16,
    fontWeight: '500',
  },
});


