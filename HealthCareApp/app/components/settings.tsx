import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  // You can add any additional props if needed
}

const COLORS = {
  primary: '#FF4D8D', // Vibrant pink
  secondary: '#121212', // Rich black
  background: '#FFFFFF', // White
  backgroundAlt: '#F8F0F4', // Very light pink
  text: '#121212', // Dark text
  textLight: '#FFFFFF', // White text
  gray: '#888888', // Gray for less important text
  borderColor: '#FFCCE0', // Light pink border
  switchActive: '#FF4D8D', // Pink for active switches
  switchTrack: '#FFE0EB', // Light pink for switch track
};

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // State management for various settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
            router.replace('./(auth)/Welcome');
          } 
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            // Implement account deletion logic
            console.log("Delete account");
          } 
        }
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const SettingsSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingsItem: React.FC<{
    title: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }> = ({ title, onPress, rightElement }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingsItemText}>{title}</Text>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  // Custom switch component with our color scheme
  const CustomSwitch: React.FC<{
    value: boolean;
    onValueChange: (value: boolean) => void;
  }> = ({ value, onValueChange }) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E0E0E0', true: COLORS.switchTrack }}
      thumbColor={value ? COLORS.switchActive : '#FFFFFF'}
      ios_backgroundColor="#E0E0E0"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} /> {/* Empty view for layout balance */}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://via.placeholder.com/60' }}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <SettingsSection 
          title="Account" 
          icon={<MaterialIcons name="person-outline" size={24} color={COLORS.primary} />}
        >
          <SettingsItem title="Change Password" onPress={() => {}} />
          <SettingsItem title="Linked Accounts" onPress={() => {}} />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection 
          title="Notifications" 
          icon={<Ionicons name="notifications-outline" size={24} color={COLORS.primary} />}
        >
          <SettingsItem
            title="Push Notifications"
            rightElement={
              <CustomSwitch
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
            }
          />
          <SettingsItem
            title="Email Notifications"
            rightElement={
              <CustomSwitch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
              />
            }
          />
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection 
          title="Privacy & Security" 
          icon={<MaterialIcons name="security" size={24} color={COLORS.primary} />}
        >
          <SettingsItem
            title="Two-Factor Authentication"
            rightElement={
              <CustomSwitch
                value={twoFactorAuth}
                onValueChange={setTwoFactorAuth}
              />
            }
          />
          <SettingsItem title="App Permissions" onPress={() => {}} />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection 
          title="Preferences" 
          icon={<Ionicons name="settings-outline" size={24} color={COLORS.primary} />}
        >
          <SettingsItem
            title="Dark Mode"
            rightElement={
              <CustomSwitch
                value={darkMode}
                onValueChange={setDarkMode}
              />
            }
          />
          <SettingsItem title="Language" onPress={() => {}} />
          <SettingsItem title="Region" onPress={() => {}} />
        </SettingsSection>

        {/* Help & Support */}
        <SettingsSection 
          title="Help & Support" 
          icon={<MaterialIcons name="help-outline" size={24} color={COLORS.primary} />}
        >
          <SettingsItem title="FAQs" onPress={() => {}} />
          <SettingsItem title="Contact Support" onPress={() => {}} />
          <SettingsItem title="Send Feedback" onPress={() => {}} />
        </SettingsSection>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.textLight} />
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <MaterialCommunityIcons name="delete" size={20} color={COLORS.textLight} />
            <Text style={styles.actionButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    backgroundColor: COLORS.background,
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 2,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  section: {
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: COLORS.secondary,
  },
  sectionContent: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  settingsItemText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: COLORS.secondary,
  },
  deleteButton: {
    backgroundColor: '#FF365E', // Darker pink for delete button
  },
  actionButtonText: {
    color: COLORS.textLight,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  version: {
    color: COLORS.gray,
    fontSize: 12,
  },
});

export default SettingsPage;