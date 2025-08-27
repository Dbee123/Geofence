import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native'; // Optional for animations

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Replace with your logo */}
        <Image 
          source={require('../assets/login-icon.png')} 
          style={styles.logo}
        />
        
        <Text style={styles.title}>Geofence Attendance</Text>
        <Text style={styles.subtitle}>Smart location-based tracking</Text>
        
        {/* Option 1: Standard Activity Indicator */}
        <ActivityIndicator 
          size="large" 
          color="#FFFFFF" 
          style={styles.loader}
        />
        
      </View>
      
      <Text style={styles.footer}>Loading your experience...</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginTop: 40,
  },
  animation: {
    width: 150,
    height: 150,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});

export default SplashScreen;