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
import { useAuth } from '../context/AuthContext'; // Adjust the import path as needed

interface SettingsPageProps {
  // You can add any additional props if needed
}

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
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} /> {/* Empty view for layout balance */}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: user?.avatarUrl || 'https://via.placeholder.com/60' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <SettingsSection 
          title="Account" 
          icon={<MaterialIcons name="person-outline" size={24} color="#666" />}
        >
          <SettingsItem title="Change Password" onPress={() => {}} />
          <SettingsItem title="Linked Accounts" onPress={() => {}} />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection 
          title="Notifications" 
          icon={<Ionicons name="notifications-outline" size={24} color="#666" />}
        >
          <SettingsItem
            title="Push Notifications"
            rightElement={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
            }
          />
          <SettingsItem
            title="Email Notifications"
            rightElement={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
              />
            }
          />
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection 
          title="Privacy & Security" 
          icon={<MaterialIcons name="security" size={24} color="#666" />}
        >
          <SettingsItem
            title="Two-Factor Authentication"
            rightElement={
              <Switch
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
          icon={<Ionicons name="settings-outline" size={24} color="#666" />}
        >
          <SettingsItem
            title="Dark Mode"
            rightElement={
              <Switch
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
          icon={<MaterialIcons name="help-outline" size={24} color="#666" />}
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
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#fff" />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 12,
    color: '#333',
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  sectionContent: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingsItemText: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  logoutButton: {
    backgroundColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerLink: {
    color: '#666',
    fontSize: 12,
  },
  version: {
    color: '#999',
    fontSize: 12,
  },
});

export default SettingsPage;