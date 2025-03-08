import React, { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, Pressable, Image, Dimensions, FlatList, Animated } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Onboarding slide data
const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Personalized Health Tracking',
    description: 'Monitor your health journey with custom medication reminders tailored just for you.',
    image: require('@/assets/images/banner1.jpeg')
  },
  {
    id: '2',
    title: 'Seamless Scheduling',
    description: 'Book appointments with women-focused healthcare professionals effortlessly.',
    image: require('@/assets/images/banner2.jpeg')
  },
  {
    id: '3',
    title: 'Comprehensive Support',
    description: 'Access resources, track cycles, and get personalized health insights.',
    image: require('@/assets/images/banner3.jpeg')
  }
];

const OnboardingScreen = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const scrollToNextSlide = () => {
    if (currentSlideIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/signup');
    } catch (error) {
      console.error('Error saving onboarding state', error);
    }
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slideContainer}>
        <Image 
          source={item.image} 
          style={styles.slideImage} 
          resizeMode="cover" 
        />
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {ONBOARDING_SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity: opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFC0CB', '#FFFFFF', '#000000']} // Pink, White, Black
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />

        <View style={styles.controlsContainer}>
          <Pagination />
          
          {currentSlideIndex < ONBOARDING_SLIDES.length - 1 ? (
            <Pressable 
              style={styles.nextButton} 
              onPress={scrollToNextSlide}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable 
              style={styles.getStartedButton} 
              onPress={handleFinishOnboarding}
            >
              <LinearGradient
                colors={['#FF1493', '#FF69B4']} // Pink gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.getStartedGradient}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </Pressable>
          )}

          <Pressable 
            style={styles.skipButton} 
            onPress={handleFinishOnboarding}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Link href="/login" style={styles.loginLink}>
                Log In
              </Link>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC0CB', // Light pink background
  },
  safeArea: {
    flex: 1,
  },
  slideContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slideImage: {
    width: width * 0.9,
    height: width * 0.7,
    borderRadius: 20,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000', // Black
    marginBottom: 16,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 18,
    color: '#4A4A4A', // Dark gray
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  controlsContainer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
    backgroundColor: '#FF1493', // Pink
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#FF1493', // Pink
    borderRadius: 12,
    marginBottom: 16,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  skipButtonText: {
    color: '#4A4A4A', // Dark gray
    fontSize: 16,
  },
  getStartedButton: {
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginContainer: {
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#4A4A4A', // Dark gray
  },
  loginLink: {
    color: '#FF1493', // Pink
    fontWeight: '600',
  },
});

export default OnboardingScreen;