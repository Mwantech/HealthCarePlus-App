import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './context/AuthContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Export the useAuth hook for use in other components
export { useAuth } from './context/AuthContext';

// Custom hook to handle protected routes
export const useProtectedRoute = (isAuthenticated: boolean, isLoading: boolean, hasSeenOnboarding: boolean | null) => {
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && hasSeenOnboarding !== null) {
      // First check if user has seen onboarding
      if (!hasSeenOnboarding) {
        router.replace('/(auth)/Onboarding');
      } else if (!isAuthenticated) {
        // If they've seen onboarding but aren't authenticated
        router.replace('/(auth)/Welcome'); // Changed from login to Welcome
      } else {
        // If they're authenticated, go to main app
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, hasSeenOnboarding]);
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status', error);
        setHasSeenOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Use the modified protected route hook to handle navigation based on auth and onboarding state
  useProtectedRoute(isAuthenticated, isLoading, hasSeenOnboarding);

  // Show nothing while loading (or a loading spinner)
  if (isLoading || hasSeenOnboarding === null) {
    return null;
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding and Welcome screens */}
      <Stack.Screen 
        name="(auth)/Onboarding" 
        options={{ 
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="(auth)/Welcome"
        options={{ 
          animation: 'fade',
        }}
      />

      {/* Authentication Screens */}
      <Stack.Screen 
        name="(auth)/login"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="(auth)/signup"
        options={{
          presentation: 'card',
        }}
      />

      {/* Main App Group */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
        }} 
      />

      {/* Fallback for unmatched routes */}
      <Stack.Screen 
        name="+not-found" 
        options={{ 
          presentation: 'modal' 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Show nothing while fonts are loading
  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}