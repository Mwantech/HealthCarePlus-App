import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

import { BASE_URL } from '../api/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  validateToken: (token: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

// Create the context with a non-null default value
const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  validateToken: async () => false,
  isAuthenticated: false,
  isLoading: true,
  user: null
});

// Export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the useProtectedRoute hook
export const useProtectedRoute = (isAuthenticated: boolean, isLoading: boolean) => {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('./(auth)/Welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('./(tabs)/index');
    }
  }, [isAuthenticated, segments, isLoading]);
};

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadAuthState() {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const isValid = await validateToken(token);
          if (isValid) {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
              const userData = JSON.parse(userDataStr);
              setUser(userData);
              setIsAuthenticated(true);
            }
          } else {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
          }
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuthState();
  }, []);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/users/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation failed', error);
      return false;
    }
  };

  const authContext: AuthContextType = {
    signIn: async (token: string, userData: User) => {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    },
    signOut: async () => {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUser(null);
      setIsAuthenticated(false);
    },
    validateToken,
    isAuthenticated,
    isLoading,
    user
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Remove the default export to prevent potential issues