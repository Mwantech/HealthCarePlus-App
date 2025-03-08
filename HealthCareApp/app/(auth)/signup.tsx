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
  Keyboard,
} from 'react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

// Import the useAuth hook
import { useAuth } from '../context/AuthContext'; 
import { BASE_URL } from '../api/api';

const { width } = Dimensions.get('window');



export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get signIn method from AuthContext
  const { signIn } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8; // Add more validation rules as needed
  };

  const handleSignup = async () => {
    try {
      Keyboard.dismiss(); // Dismiss keyboard when submitting
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
      const response = await axios.post(`${BASE_URL}/user/signup`, {
        name,
        email,
        password,
      });

      if (response.status === 201) {
        // Log the entire response to understand its structure
        console.log('Signup Response:', response.data);

        // More robust way to extract user data
        const token = response.data.token;
        const userData = response.data.user || response.data;

        // Ensure we have a valid user object
        const userToStore = {
          id: userData.id || userData._id, // Try both 'id' and '_id'
          email: userData.email || email,
          name: userData.name || name
        };

        // Use signIn method from AuthContext to store authentication state
        await signIn(token, userToStore);

        Alert.alert(
          'Success',
          'Account created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('./(tabs)/index'), // Navigate to home after signup
            },
          ]
        );
      }
    } catch (error) {
      // More detailed error logging
      console.error('Signup Error:', error);

      if (axios.isAxiosError(error)) {
        // Handle Axios errors
        if (error.response) {
          // Server responded with an error
          console.log('Error Response:', error.response.data);
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
      <Ionicons name={icon} size={20} color="#FF69B4" style={styles.inputIcon} />
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#A0A0A0"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <LinearGradient
        colors={['#000000', '#222222', '#333333']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://via.placeholder.com/150' }}
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
              <Ionicons name="lock-closed-outline" size={20} color="#FF69B4" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#A0A0A0"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#FF69B4"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#FF69B4" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#A0A0A0"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#FF69B4"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF69B4',
  },
  logo: {
    width: 80,
    height: 80,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FF69B4',
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 10,
  },
  signupButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.5)',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#FFFFFF',
  },
  loginLink: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },
});