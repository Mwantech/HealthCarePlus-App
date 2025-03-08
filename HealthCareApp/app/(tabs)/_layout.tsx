import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';

const CustomColors = {
  light: {
    primary: '#FF1493', // Deep pink as the primary color
    background: '#FFFFFF',
    text: '#1F2937',
    tabBar: '#FFFFFF',
    label: '#666666',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#FF1493', // Deep pink as the primary color
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
            height: 60 + insets.bottom,
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0, 0, 0, 0.1)',
            paddingBottom: insets.bottom,
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
