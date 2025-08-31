import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthHeader from './components/AuthHeader';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const validatePhoneNumber = (number) => {
    if (!number.trim()) {
      return 'Phone number is required';
    }
    if (!/^\d{10}$/.test(number)) {
      return 'Phone number must be exactly 10 digits';
    }
    return null;
  };

  const validatePassword = (pass) => {
    if (!pass.trim()) {
      return 'Password is required';
    }
    if (pass.length < 5) {
      return 'Password must be at least 5 characters long';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least 1 uppercase letter';
    }
    if (!/\d/.test(pass)) {
      return 'Password must contain at least 1 digit';
    }
    return null;
  };

  const handlePhoneNumberChange = (text) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numericText);
    
    // Clear previous error
    setErrors(prev => ({
      ...prev,
      phoneNumber: null
    }));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    
    // Clear previous error
    setErrors(prev => ({
      ...prev,
      password: null
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validateForm()) {
      // For demo purposes, let's assume credentials are valid
      // In a real app, you would check against a database
      router.push('/route-management');
    }
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <AuthHeader
              title="Welcome Back!"
              subtitle="Sign in to continue your journey"
            />

            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor="#B0B0B0"
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    maxLength={10}
                  />
                  <View style={[styles.inputUnderline, errors.phoneNumber ? styles.inputUnderlineError : null]} />
                </View>
                {errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, errors.password ? styles.inputError : null]}
                    placeholder="Enter your password"
                    placeholderTextColor="#B0B0B0"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <View style={[styles.inputUnderline, errors.password ? styles.inputUnderlineError : null]} />
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
                <Text style={styles.passwordHint}>
                  • At least 5 characters • 1 uppercase letter • 1 digit
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.signupButton}
                onPress={handleSignup}
                activeOpacity={0.8}
              >
                <Text style={styles.signupButtonText}>Create New Account</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputUnderline: {
    height: 2,
    backgroundColor: '#FF6B00',
    borderRadius: 1,
  },
  inputUnderlineError: {
    backgroundColor: '#FF5252',
  },
  inputError: {
    color: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  passwordHint: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
