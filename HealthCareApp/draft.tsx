import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // Replace with your actual signup API call
      const response = await mockSignupAPI(email, password, phone, referralCode);
      
      if (response.success) {
        await AsyncStorage.setItem('userToken', response.token);
        // Updated navigation path
        router.replace('/(tabs)/index');
      }
    } catch (error) {
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  };

  const mockSignupAPI = async (
    email: string,
    password: string,
    phone?: string,
    referralCode?: string
  ) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          token: 'mock-jwt-token',
        });
      }, 1000);
    });
  };

 return (
     <KeyboardAvoidingView
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       style={styles.container}
     >
       <View style={styles.logoContainer}>
         <Image
           
           style={styles.logo}
           resizeMode="contain"
         />
       </View>
 
       <View style={styles.formContainer}>
         <TextInput
           style={styles.input}
           placeholder="Email *"
           value={email}
           onChangeText={setEmail}
           keyboardType="email-address"
           autoCapitalize="none"
         />
 
         <View style={styles.passwordContainer}>
           <TextInput
             style={styles.passwordInput}
             placeholder="Password *"
             value={password}
             onChangeText={setPassword}
             secureTextEntry={!showPassword}
           />
           <TouchableOpacity
             onPress={() => setShowPassword(!showPassword)}
             style={styles.eyeIcon}
           >
             <Ionicons
               name={showPassword ? 'eye-off' : 'eye'}
               size={24}
               color="#666"
             />
           </TouchableOpacity>
         </View>
 
         <View style={styles.passwordContainer}>
           <TextInput
             style={styles.passwordInput}
             placeholder="Confirm Password *"
             value={confirmPassword}
             onChangeText={setConfirmPassword}
             secureTextEntry={!showConfirmPassword}
           />
           <TouchableOpacity
             onPress={() => setShowConfirmPassword(!showConfirmPassword)}
             style={styles.eyeIcon}
           >
             <Ionicons
               name={showConfirmPassword ? 'eye-off' : 'eye'}
               size={24}
               color="#666"
             />
           </TouchableOpacity>
         </View>
 
         <TextInput
           style={styles.input}
           placeholder="Phone Number (Optional)"
           value={phone}
           onChangeText={setPhone}
           keyboardType="phone-pad"
         />
 
         <TextInput
           style={styles.input}
           placeholder="Referral Code (Optional)"
           value={referralCode}
           onChangeText={setReferralCode}
           autoCapitalize="none"
         />
 
         <TouchableOpacity
           style={styles.signupButton}
           onPress={handleSignup}
         >
           <Text style={styles.signupButtonText}>Sign Up</Text>
         </TouchableOpacity>
 
         <View style={styles.loginContainer}>
           <Text style={styles.loginText}>Already have an account? </Text>
           <TouchableOpacity onPress={() => router.push('/login')}>
             <Text style={styles.loginLink}>Login</Text>
           </TouchableOpacity>
         </View>
       </View>
     </KeyboardAvoidingView>
   );
 }
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#fff',
   },
   logoContainer: {
     alignItems: 'center',
     marginTop: 60,
     marginBottom: 40,
   },
   logo: {
     width: 150,
     height: 150,
   },
   formContainer: {
     paddingHorizontal: 20,
   },
   input: {
     backgroundColor: '#f5f5f5',
     padding: 15,
     borderRadius: 10,
     marginBottom: 15,
   },
   passwordContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#f5f5f5',
     borderRadius: 10,
     marginBottom: 15,
   },
   passwordInput: {
     flex: 1,
     padding: 15,
   },
   eyeIcon: {
     padding: 15,
   },
   signupButton: {
     backgroundColor: '#007AFF',
     padding: 15,
     borderRadius: 10,
     alignItems: 'center',
     marginTop: 10,
   },
   signupButtonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: 'bold',
   },
   loginContainer: {
     flexDirection: 'row',
     justifyContent: 'center',
     marginTop: 20,
   },
   loginText: {
     color: '#666',
   },
   loginLink: {
     color: '#007AFF',
     fontWeight: 'bold',
   },
 });








 import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useColorScheme } from '@/hooks/useColorScheme';

const CustomColors = {
  light: {
    primary: '#4086F4',
    background: '#FFFFFF',
    text: '#1F2937',
    tabBar: '#FFFFFF',
    label: '#666666',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#4086F4',
    background: '#1F2937',
    text: '#F9FAFB',
    tabBar: '#1F2937',
    label: '#AAAAAA',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const colors = CustomColors[isDark ? 'dark' : 'light'];
    const router = useRouter();

  return (
    <>
      {/* Top Header remains the same */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        ]}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}>
          HealthCare
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.label,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            height: 60 + insets.bottom, // Add safe area bottom padding
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0, 0, 0, 0.1)',
            bottom: 0,
            paddingBottom: insets.bottom, // Add padding for safe area
          },
        }}>
        <Tabs.Screen
                  name="index"
                  options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => (
                      <Ionicons name="home-outline" size={24} color={color} />
                    ),
                    tabBarLabelStyle: styles.tabBarLabel,
                  }}
                />
                <Tabs.Screen
                  name="symptom-checker"
                  options={{
                    title: 'Symptoms',
                    tabBarIcon: ({ focused }) => (
                      <View style={[
                        styles.floatingButton,
                        {
                          backgroundColor: colors.primary,
                        }
                      ]}>
                        <Ionicons
                          name="stethoscope"
                          size={28}
                          color="#FFFFFF"
                        />
                      </View>
                    ),
                    tabBarLabel: ({ color }) => (
                      <Text style={[styles.tabBarLabel, { color, marginTop: 10 }]}>
                        Symptoms
                      </Text>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="telemedicine"
                  options={{
                    title: 'Consult',
                    tabBarIcon: ({ color }) => (
                      <Ionicons name="videocam-outline" size={24} color={color} />
                    ),
                    tabBarLabelStyle: styles.tabBarLabel,
                  }}
                />
                <Tabs.Screen
                  name="test-kits"
                  options={{
                    title: 'Test Kits',
                    tabBarIcon: ({ color }) => (
                      <MaterialCommunityIcons name="test-tube" size={24} color={color} />
                    ),
                    tabBarLabelStyle: styles.tabBarLabel,
                  }}
                />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.select({ ios: 88, default: 64 }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    top: Platform.select({ ios: 48, default: 20 }),
    padding: 8,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 25, // Adjusted to account for tab bar padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
});








const TestKitSelection = ({ 
  kits, 
  selectedKits, 
  setSelectedKits, 
  nextStep 
}: { 
  kits: TestKit[];
  selectedKits: SelectedKit[];
  setSelectedKits: (kits: SelectedKit[]) => void;
  nextStep: () => void;
}) => {
  const handleSelectKit = (kit: TestKit) => {
    const existingKit = selectedKits.find((k) => k.id === kit.id);
    if (existingKit) {
      setSelectedKits(
        selectedKits.map((k) =>
          k.id === kit.id ? { ...k, quantity: k.quantity + 1 } : k
        )
      );
    } else {
      setSelectedKits([...selectedKits, { ...kit, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (kitId: string, quantity: string) => {
    const numQuantity = parseInt(quantity) || 1;
    setSelectedKits(
      selectedKits.map((k) =>
        k.id === kitId ? { ...k, quantity: numQuantity } : k
      )
    );
  };

  return (
    <View style={styles.stepContainer}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {kits.map((kit) => (
            <View key={kit.id} style={styles.kitCard}>
              <TouchableOpacity
                style={styles.kitItemContent}
                onPress={() => handleSelectKit(kit)}
              >
                <View style={styles.kitImagePlaceholder}>
                  <Ionicons name="medical" size={24} color="#2C3E50" />
                </View>
                <View style={styles.kitInfo}>
                  <Text style={styles.kitName}>{kit.name}</Text>
                  <Text style={styles.kitPrice}>${kit.price}</Text>
                </View>
                {selectedKits.some((k) => k.id === kit.id) && (
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(
                        kit.id, 
                        String(Math.max(1, (selectedKits.find(k => k.id === kit.id)?.quantity || 1) - 1))
                      )}
                    >
                      <Ionicons name="remove" size={20} color="#2C3E50" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.quantityInput}
                      keyboardType="numeric"
                      value={String(
                        selectedKits.find((k) => k.id === kit.id)?.quantity || 1
                      )}
                      onChangeText={(value) => handleQuantityChange(kit.id, value)}
                    />
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(
                        kit.id, 
                        String((selectedKits.find(k => k.id === kit.id)?.quantity || 0) + 1)
                      )}
                    >
                      <Ionicons name="add" size={20} color="#2C3E50" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 80 }} /> {/* Add padding at bottom for button */}
        </ScrollView>
      </View>
      <View style={styles.fixedButtonContainer}>
        <CustomButton 
          title="Review Order" 
          onPress={nextStep}
        />
      </View>
    </View>
  );
};





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

const { width } = Dimensions.get('window');

// API base URL configuration
const API_URL = 'http://192.168.9.195:3001';

// Type definitions
interface LoginResponse {
  token: string;
  type: string;
  id: number;
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

  // Configure axios defaults
  axios.defaults.baseURL = API_URL;
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

      const response = await axios.post<LoginResponse>('/api/user/login', {
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
      router.replace('/(tabs)/index');

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
        router.replace('/(tabs)/index');
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
        colors={['#4C669F', '#3B5998', '#192F6A']}
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
            <Ionicons name="mail-outline" size={22} color="#FFFFFF" style={styles.inputIcon} />
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
            <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" style={styles.inputIcon} />
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
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
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
              <ActivityIndicator color="#4C669F" />
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
              <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" />
              <Text style={styles.biometricButtonText}>Use Biometrics</Text>
            </TouchableOpacity>
          )}

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to the app? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')} disabled={isLoading}>
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
    color: '#E0E0E0',
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
    color: '#E0E0E0',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
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
    color: '#4C669F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
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



















import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

const API_URL = 'http://192.168.9.195:3001'; // Replace with your actual API URL

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8; // Add more validation rules as needed
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError('');

      // Input validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all required fields');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Make API call
      const response = await axios.post(`${API_URL}/user/signup`, {
        name,
        email,
        password,
      });

      if (response.status === 201) {
        Alert.alert(
          'Success',
          'Account created successfully! Please log in.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/login'),
            },
          ]
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle Axios errors
        if (error.response) {
          // Server responded with an error
          switch (error.response.status) {
            case 400:
              setError('User already exists');
              break;
            case 500:
              setError('Server error. Please try again later');
              break;
            default:
              setError('An unexpected error occurred');
          }
        } else if (error.request) {
          // Request made but no response received
          setError('Network error. Please check your internet connection');
        } else {
          setError('An unexpected error occurred');
        }
      } else if (error instanceof Error) {
        // Handle validation errors
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }

      Alert.alert('Error', error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ icon, ...props }) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitleText}>Sign up to get started!</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <InputField
            icon="person-outline"
            placeholder="Full Name *"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <InputField
            icon="mail-outline"
            placeholder="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 16,
  },
  signupButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
});