import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import { BASE_URL } from '../api/api';
// Import the useAuth hook
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');


// Type definitions
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ApiError {
  message: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get signIn method from AuthContext
  const { signIn } = useAuth();

  // Configure axios defaults
  axios.defaults.baseURL = BASE_URL;
  axios.defaults.headers.post['Content-Type'] = 'application/json';

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
  };

  const validateInput = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      setError(null);
      if (!validateInput()) return;

      setIsLoading(true);

      const response = await axios.post<LoginResponse>(`${BASE_URL}/user/login`, {
        email: email.trim(),
        password: password.trim()
      });

      const { token, type, id } = response.data;

      // Store user data
      await AsyncStorage.multiSet([
        ['userToken', token],
        ['userId', id.toString()],
        ['userType', type]
      ]);

      // Navigate to main app
      router.replace('/(tabs)');

    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle Axios specific errors
        if (error.response) {
          // Server responded with error
          const errorData = error.response.data as ApiError;
          setError(errorData.message || 'Login failed');
        } else if (error.request) {
          // Request made but no response
          setError('Unable to reach the server. Please check your connection.');
        } else {
          // Error in request setup
          setError('An error occurred while setting up the request.');
        }
      } else {
        // Handle non-Axios errors
        setError('An unexpected error occurred');
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use password instead',
      });

      if (result.success) {
        // Note: In a real app, you'd want to implement proper biometric authentication
        // with your backend here instead of using a dummy token
        await AsyncStorage.setItem('userToken', 'biometric-token');
        router.replace('./(tabs)/index');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      setError('Biometric authentication failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#000000', '#222222', '#333333']}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#FF69B4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#FF69B4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#FF69B4"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('./forgot-password')}
            style={styles.forgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.loginButtonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          {isBiometricSupported && (
            <TouchableOpacity
              style={[styles.biometricButton, isLoading && styles.biometricButtonDisabled]}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <Ionicons name="finger-print-outline" size={22} color="#FF69B4" />
              <Text style={styles.biometricButtonText}>Use Biometrics</Text>
            </TouchableOpacity>
          )}

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to the app? </Text>
            <TouchableOpacity onPress={() => router.push('./signup')} disabled={isLoading}>
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FF69B4',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#FF69B4',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  signupLink: {
    color: '#FF69B4',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    fontSize: 14,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  biometricButtonDisabled: {
    opacity: 0.7,
  },
});