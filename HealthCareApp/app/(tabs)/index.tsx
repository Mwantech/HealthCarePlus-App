import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5 
} from '@expo/vector-icons';

// Import the useAuth hook
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  
  // Get the current user from AuthContext
  const { user } = useAuth();
  
  // Colors
  const COLORS = {
    primary: '#FF4D88', // Pink
    secondary: '#FFD9E5', // Light Pink
    dark: '#111111', // Almost Black
    light: '#FFFFFF', // White
    gray: '#F3F3F3', // Light Gray
    text: '#303030', // Dark Gray Text
    textLight: '#787878', // Light Gray Text
  };

  const quickAccessFeatures = [
    { title: 'Consult a Doctor', icon: 'stethoscope', type: 'FontAwesome5', color: COLORS.gray, iconColor: COLORS.primary, route: 'telemedicine' },
    { title: 'Check Symptoms', icon: 'thermometer', type: 'FontAwesome5', color: COLORS.gray, iconColor: COLORS.primary, route: 'symptom-checker' },
    { title: 'Order Test Kits', icon: 'test-tube', type: 'MaterialCommunityIcons', color: COLORS.gray, iconColor: COLORS.primary, route: 'test-kits' },
    { title: 'Medical Records', icon: 'file-medical', type: 'FontAwesome5', color: COLORS.gray, iconColor: COLORS.primary, route: 'medical-records' }
  ];

  const featuredServices = [
    { title: 'Mental Health', description: 'Talk to expert therapists', icon: 'brain', type: 'FontAwesome5', color: COLORS.secondary, iconColor: COLORS.primary },
    { title: 'Vaccination', description: 'Book your shots today', icon: 'syringe', type: 'FontAwesome5', color: COLORS.secondary, iconColor: COLORS.primary },
    { title: 'Health Tracking', description: 'Monitor your vitals', icon: 'heartbeat', type: 'FontAwesome5', color: COLORS.secondary, iconColor: COLORS.primary }
  ];

  const renderIcon = (iconName, type, size = 24, color = COLORS.primary) => {
    switch (type) {
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      default:
        return <Ionicons name={iconName} size={size} color={color} />;
    }
  };

  const handleQuickAccessPress = (route) => {
    router.push(`/${route}`);
  };

  // Fixed user name parsing
  const userName = user?.name || 'User';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={{ 
          backgroundColor: COLORS.light, 
          padding: 20, 
          paddingTop: 60,
          shadowColor: COLORS.dark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.dark }}>
                Hello, {userName}!
              </Text>
              <Text style={{ color: COLORS.textLight, fontSize: 14 }}>
                How are you feeling today?
              </Text>
            </View>
            <TouchableOpacity style={{ 
              height: 45, 
              width: 45, 
              borderRadius: 22.5, 
              backgroundColor: COLORS.gray,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="notifications" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: COLORS.gray, 
            borderRadius: 12, 
            padding: 12,
            marginTop: 10
          }}>
            <Ionicons name="search" size={20} color={COLORS.textLight} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search for services or doctors..."
              placeholderTextColor={COLORS.textLight}
              style={{ flex: 1, color: COLORS.text, fontSize: 14 }}
            />
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Hero Section */}
          <View style={{ 
            backgroundColor: COLORS.primary, 
            padding: 24, 
            borderRadius: 20, 
            marginBottom: 30,
            shadowColor: COLORS.dark,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.light, marginBottom: 8 }}>
              Your Health, Our Priority
            </Text>
            <Text style={{ color: COLORS.light, opacity: 0.9, marginBottom: 16 }}>
              Schedule your next appointment with top specialists
            </Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: COLORS.light, 
                paddingVertical: 12,
                paddingHorizontal: 20, 
                borderRadius: 12,
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: COLORS.dark,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => handleQuickAccessPress('telemedicine')}
            >
              <Text style={{ color: COLORS.primary, fontWeight: '600', marginRight: 5 }}>Book Now</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Quick Access Tiles */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: COLORS.dark }}>Quick Access</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {quickAccessFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: COLORS.light,
                    padding: 16,
                    borderRadius: 16,
                    width: '48%',
                    marginBottom: 16,
                    alignItems: 'center',
                    shadowColor: COLORS.dark,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: COLORS.gray,
                  }}
                  onPress={() => handleQuickAccessPress(feature.route)}
                >
                  <View style={{ 
                    height: 60, 
                    width: 60, 
                    borderRadius: 30,
                    backgroundColor: COLORS.secondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10
                  }}>
                    {renderIcon(feature.icon, feature.type, 24, COLORS.primary)}
                  </View>
                  <Text style={{ fontWeight: '600', color: COLORS.dark, textAlign: 'center' }}>{feature.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Featured Services */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: COLORS.dark }}>Featured Services</Text>
            {featuredServices.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: COLORS.light,
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: COLORS.dark,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: COLORS.gray,
                }}
              >
                <View style={{ 
                  height: 50, 
                  width: 50, 
                  borderRadius: 25,
                  backgroundColor: COLORS.secondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16
                }}>
                  {renderIcon(service.icon, service.type, 22, COLORS.primary)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4, color: COLORS.dark }}>{service.title}</Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 13 }}>{service.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Health Tips & Resources */}
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: COLORS.dark }}>Health Tips & Resources</Text>
            {[
              { title: 'Stay Healthy This Winter', description: 'Boost your immunity during the cold season' },
              { title: 'Mental Health Matters', description: 'Ways to manage stress and anxiety' },
              { title: 'Nutrition 101', description: 'Eat right for a healthier you' }
            ].map((item, index) => (
              <View 
                key={index}
                style={{ 
                  backgroundColor: COLORS.light, 
                  borderRadius: 16, 
                  marginBottom: 16,
                  shadowColor: COLORS.dark,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: COLORS.gray,
                }}
              >
                <Image
                  source={{ uri: 'https://via.placeholder.com/400x200' }}
                  style={{ height: 160, width: '100%' }}
                />
                <View style={{ padding: 16 }}>
                  <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8, color: COLORS.dark }}>{item.title}</Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 14, marginBottom: 12 }}>
                    {item.description}
                  </Text>
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600', marginRight: 5 }}>Read More</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* Add some padding at the bottom */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}