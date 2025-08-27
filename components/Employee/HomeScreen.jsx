import { AppState } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { PROVIDER_DEFAULT } from "react-native-maps";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { AuthContext } from '../../context/AuthContext';
import useLocation from '../../hooks/useLocation';
import { useGeofence } from '../../hooks/useGeofence';
import { clockIn, clockOut, getCurrentAttendanceStatus } from '../../services/attendance';
import { getAccuracyLevel, getAccuracyColor, getTimeOfDay } from '../../utils/locationUtils';

import {isWithinGeofence} from '../../utils/geoUtils';
import { BASE_URL } from '../../config/api';



const { width, height } = Dimensions.get('window');

const CLOCK_IN_GEOFENCE_KEY = '@clock_in_geofence';

const HomeScreen = () => {
  const { userToken, userInfo } = useContext(AuthContext);
  const navigation = useNavigation();

  const { location, errorMsg, refreshLocation, locationAccuracy, isRefreshing: isRefreshingLocation } = useLocation();
  const { 
    geofences, 
    currentGeofence, 
    distanceToGeofence,
    lastGeofence,
    justExited,
    loading: geofenceLoading, 
    refresh: refreshGeofences 
  } = useGeofence(userToken, location);

  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [clockedInTime, setClockedInTime] = useState(null);
  const [clockInGeofence, setClockInGeofence] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  // Refs for tracking operations
  const isFetchingStatus = useRef(false);
  const autoClockOutTimer = useRef(null);
  const locationIntervalRef = useRef(null);
  // Add this to your state variables
const [countdown, setCountdown] = useState(null);

  // Load persisted clock-in geofence on mount
  useEffect(() => {
    const loadPersistedData = async () => {
    try {
      // Try primary storage first
      let geofence = await AsyncStorage.getItem(CLOCK_IN_GEOFENCE_KEY);
      if (geofence) {
        const parsed = JSON.parse(geofence);
        setClockInGeofence(parsed);
        console.log('[Mount] Loaded geofence from primary storage:', parsed.name);
      } else {
        // Fallback to backup storage
        geofence = await AsyncStorage.getItem('@backup_geofence');
        if (geofence) {
          const parsed = JSON.parse(geofence);
          setClockInGeofence(parsed);
          console.log('[Mount] Loaded geofence from backup storage:', parsed.name);
        }
      }
      
      // Load attendance status
      const status = await getCurrentAttendanceStatus(userToken);
      if (status.isClockedIn) {
        setLastAction('clock-in');
        setClockedInTime(new Date(status.lastActionTime));
      }
    } catch (e) {
      console.error('Initial data load error:', e);
    }
  };
  
  if (userToken) loadPersistedData();
  }, []);

  // Toast helper
  const showToast = useCallback((type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: type === 'error' ? 5000 : 4000,
      props: { text2NumberOfLines: 3 }
    });
  }, []);

  // Fetch attendance status
  const fetchStatus = useCallback(async () => {
    if (!userToken || isFetchingStatus.current) return;
    
    isFetchingStatus.current = true;
    try {
      const status = await getCurrentAttendanceStatus(userToken);
      setLastAction(status.isClockedIn ? 'clock-in' : 'clock-out');
      setClockedInTime(status.isClockedIn && status.lastActionTime ? new Date(status.lastActionTime) : null);
      
      if (status.isClockedIn && !clockInGeofence) {
        // If clocked in but missing geofence data, refresh
        await refreshGeofences();
      } else if (!status.isClockedIn) {
        await AsyncStorage.removeItem(CLOCK_IN_GEOFENCE_KEY);
        setClockInGeofence(null);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    } finally {
      isFetchingStatus.current = false;
    }
  }, [userToken, clockInGeofence, refreshGeofences]);

  // Initial status fetch and periodic refresh
  useEffect(() => {
    if (!userToken) return;
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Check status every minute
    return () => clearInterval(interval);
  }, [userToken, fetchStatus]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      if (nextAppState === 'active') {
        fetchStatus(); // Refresh when app comes to foreground
      }
    });
    return () => subscription.remove();
  }, [fetchStatus]);

  // Location refresh when clocked in
  useEffect(() => {
    if (appState !== 'active') {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }
    
    locationIntervalRef.current = setInterval(() => {
      if (lastAction === 'clock-in') {
        refreshLocation();
      }
    }, 20000); // Refresh location every 20 seconds when clocked in
    
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [appState, lastAction, refreshLocation]);

  // Auto clock-out handler with detailed logging
useEffect(() => {
  let intervalId = null;

  const handleAutoClockOut = async () => {
  console.log('[Auto Clock-Out] Starting procedure');
  
  // 1. Attempt geofence recovery with priority:
  //    a. React state
  //    b. Primary AsyncStorage
  //    c. Backup AsyncStorage
  let targetGeofence = clockInGeofence;
  let recoverySource = 'React state';

  if (!targetGeofence) {
    try {
      const stored = await AsyncStorage.getItem(CLOCK_IN_GEOFENCE_KEY);
      if (stored) {
        targetGeofence = JSON.parse(stored);
        recoverySource = 'Primary storage';
        setClockInGeofence(targetGeofence); // Update state
      }
    } catch (e) {
      console.error('Primary storage read failed:', e);
    }
  }

  if (!targetGeofence) {
    try {
      const backup = await AsyncStorage.getItem('@backup_geofence');
      if (backup) {
        targetGeofence = JSON.parse(backup);
        recoverySource = 'Backup storage';
        setClockInGeofence(targetGeofence); // Update state
      }
    } catch (e) {
      console.error('Backup storage read failed:', e);
    }
  }

  // 2. Final validation
  if (!targetGeofence) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      clockInGeofence: clockInGeofence,
      storageContents: {
        primary: await AsyncStorage.getItem(CLOCK_IN_GEOFENCE_KEY),
        backup: await AsyncStorage.getItem('@backup_geofence')
      }
    };
    console.error('CRITICAL: No geofence data available', errorDetails);
    showToast('error', 'Clock-Out Failed', 'Could not verify work location');
    setCountdown(null);
    return;
  }

  console.log(`[Auto Clock-Out] Using geofence ${targetGeofence.name} from ${recoverySource}`);

  // 3. Proceed with clock-out
  try {
    await refreshLocation();
    
    const response = await axios.post(
      `${BASE_URL}/attendance/auto-clockout/`,
      {
        latitude: location?.latitude || targetGeofence.latitude,
        longitude: location?.longitude || targetGeofence.longitude,
        original_geofence_id: targetGeofence.id
      },
      {
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 4. Handle success
    console.log('[Auto Clock-Out] Success:', response.data);
    setLastAction('clock-out');
    setClockedInTime(null);
    await AsyncStorage.multiRemove([CLOCK_IN_GEOFENCE_KEY, '@backup_geofence']);
    setClockInGeofence(null);
    setCountdown(null);
    
    showToast('success', 'Auto Clock-Out', `Recorded from ${targetGeofence.name}`);
    
  } catch (error) {
    console.error('[Auto Clock-Out] Failed:', {
      error: error.response?.data || error.message,
      geofenceUsed: targetGeofence,
      location,
      timestamp: new Date().toISOString()
    });
    
    showToast('error', 'Auto Clock-Out Failed', 'Please clock out manually');
    setCountdown(null);
  }
};

  // Start countdown when conditions are met
  if (justExited && lastAction === 'clock-in' && lastGeofence && countdown === null) {
    console.log(`[Geofence] User exited geofence ${lastGeofence.name}`);
    console.log('[Auto Clock-Out] Starting 20s countdown');
    setCountdown(20);
    
    intervalId = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1;
        console.log(`[Auto Clock-Out] Countdown: ${newCount}s remaining`);
        
        if (newCount <= 0) {
          console.log('[Auto Clock-Out] Countdown complete - triggering clock-out');
          clearInterval(intervalId);
          handleAutoClockOut();
          return null;
        }
        return newCount;
      });
    }, 1000);
  }

  // Cleanup when conditions are no longer met
  if (!justExited && countdown !== null) {
    console.log('[Auto Clock-Out] User returned to geofence - cancelling countdown');
    clearInterval(intervalId);
    setCountdown(null);
  }

  return () => {
    if (intervalId) {
      console.log('[Auto Clock-Out] Cleaning up interval');
      clearInterval(intervalId);
    }
  };
}, [justExited, lastAction, lastGeofence, location, handleClockInOut]);



  const handleClockInOut = useCallback(async (action) => {
  if (!location) return showToast('error', 'Error', 'Location not available');
  
  if (action === 'clock-in' && !currentGeofence) {
    return showToast('error', 'Geofence Error', 'You are not within any geofence');
  }

  setIsLoading(true);
  
  try {
    if (action === 'clock-in') {
      // Create comprehensive geofence record
      const geofenceData = {
        id: currentGeofence.id,
        name: currentGeofence.name,
        latitude: currentGeofence.latitude,
        longitude: currentGeofence.longitude,
        radius: currentGeofence.radius,
        timestamp: Date.now()
      };

      // Store in THREE places for redundancy
      // 1. React state
      setClockInGeofence(geofenceData);
      
      // 2. Primary AsyncStorage
      await AsyncStorage.setItem(
        CLOCK_IN_GEOFENCE_KEY, 
        JSON.stringify(geofenceData)
      );
      
      // 3. Backup AsyncStorage
      await AsyncStorage.setItem(
        '@backup_geofence',
        JSON.stringify({
          ...geofenceData,
          backup: true  // Mark as backup copy
        })
      );

      console.log('[Clock-In] Geofence stored in 3 locations');

      // Proceed with clock-in
      await clockIn(userToken, {
        latitude: location.latitude,
        longitude: location.longitude,
        geofence_id: currentGeofence.id
      });
      
      setLastAction('clock-in');
      setClockedInTime(new Date());
      
    } else {
      // Clock-out logic
      await clockOut(userToken, {
        latitude: location.latitude,
        longitude: location.longitude,
        geofence_id: clockInGeofence?.id || null
      });
      
      // Clear ALL geofence storage
      await AsyncStorage.multiRemove([
        CLOCK_IN_GEOFENCE_KEY,
        '@backup_geofence'
      ]);
      
      setLastAction('clock-out');
      setClockedInTime(null);
      setClockInGeofence(null);
    }
  } catch (error) {
    console.error(`[${action} Error]`, error);
    showToast('error', 'Error', error.message || 'Action failed');
  } finally {
    setIsLoading(false);
  }
}, [location, currentGeofence, userToken]);


  const renderActionButton = useCallback((action) => {
    const isClockIn = action === 'clock-in';
    const shouldShowButton = isClockIn ? lastAction !== 'clock-in' : lastAction === 'clock-in';
    if (!shouldShowButton) return null;

    const isActive = currentGeofence && !isLoading;
    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          isClockIn ? styles.clockInButton : styles.clockOutButton,
          !isActive && styles.disabledButton
        ]}
        onPress={() => handleClockInOut(action)}
        disabled={!isActive}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialIcons name={isClockIn ? 'login' : 'logout'} size={20} color="white" />
            <Text style={styles.buttonText}>{isClockIn ? 'Clock In' : 'Clock Out'}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [lastAction, currentGeofence, isLoading, handleClockInOut]);

  const renderClockedInStatus = useCallback(() => {
    if (lastAction !== 'clock-in') return null;
    let durationText = '';
    if (clockedInTime) {
      const diffMs = Date.now() - clockedInTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      durationText = ` (${diffHours > 0 ? `${diffHours}h ` : ''}${remainingMins}m)`;
    }
    return (
      <View style={styles.clockedInContainer}>
        <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
        <Text style={styles.clockedInText}>Clocked in{durationText}</Text>
      </View>
    );
  }, [lastAction, clockedInTime]);

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{errorMsg || 'Getting location...'}</Text>
        <ActivityIndicator size="large" color="#4e8cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled={false}
        onMapReady={() => setMapReady(true)}
      >
        {mapReady && geofences.map((geofence) => (
          <Circle
            key={geofence.id}
            center={{ latitude: geofence.latitude, longitude: geofence.longitude }}
            radius={geofence.radius}
            strokeColor={currentGeofence?.id === geofence.id ? 'rgba(76, 175, 80, 0.8)' : 'rgba(78, 140, 255, 0.8)'}
            fillColor={currentGeofence?.id === geofence.id ? 'rgba(76, 175, 80, 0.2)' : 'rgba(78, 140, 255, 0.2)'}
            strokeWidth={2}
          />
        ))}
      </MapView>

{countdown !== null && (
  <View style={styles.warningBanner}>
    <MaterialIcons name="warning" size={20} color="#FFA000" />
    <Text style={styles.warningText}>
      Left geofence - Auto clock-out in {countdown}s
    </Text>
    <TouchableOpacity 
      style={styles.cancelButton}
      onPress={() => setCountdown(null)}
    >
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
)}

      <LinearGradient colors={['rgba(255, 255, 255, 0)', 'transparent']} style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Good {getTimeOfDay()}!</Text>
        </View>
        <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton} disabled={isRefreshingLocation}>
          {isRefreshingLocation ? <ActivityIndicator size="small" color="black" /> : <MaterialIcons name="my-location" size={24} color="black" />}
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>Attendance</Text>
        {renderClockedInStatus()}
        <Text style={styles.cardSubtitle}>
          {lastAction === 'clock-in'
            ? `Currently clocked in at ${currentGeofence?.name || 'unknown location'}`
            : 'Ready to clock in'}
        </Text>

        <View style={styles.buttonRow}>
          {renderActionButton('clock-in')}
          {renderActionButton('clock-out')}
        </View>

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AttendanceHistory')}>
            <MaterialIcons name="history" size={20} color="#4e8cff" />
            <Text style={styles.secondaryButtonText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Complaints')}>
            <MaterialIcons name="report-problem" size={20} color="#FF5722" />
            <Text style={styles.secondaryButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Location Accuracy</Text>
            <Text style={[styles.statusValue, { color: getAccuracyColor(locationAccuracy) }]}>
              {getAccuracyLevel(locationAccuracy)}
              {locationAccuracy && ` (${Math.round(locationAccuracy)}m)`}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Geofence Status</Text>
            <Text style={styles.statusValue}>
              {currentGeofence
                ? `${currentGeofence.name} (${Math.round(distanceToGeofence)}m)`
                : `Not in range (${distanceToGeofence ? Math.round(distanceToGeofence) : '?'}m)`}
            </Text>
          </View>
        </View>
      </View>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { fontSize: 16, marginBottom: 20, color: '#555' },
  map: { ...StyleSheet.absoluteFillObject },
  header: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 5, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  userInfo: { flex: 1 },
  greeting: { color: 'blue', fontSize: 16, opacity: 0.8 },
  username: { color: 'black', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  bottomCard: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  clockedInContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  clockedInText: { marginLeft: 5, color: '#4CAF50', fontWeight: '600' },
  cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 12, marginHorizontal: 5 },
  clockInButton: { backgroundColor: '#4CAF50' },
  clockOutButton: { backgroundColor: '#F44336' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  bottomButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  secondaryButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  statusItem: { alignItems: 'center', flex: 1 },
  statusLabel: { fontSize: 12, color: '#888', marginBottom: 3 },
  statusValue: { fontSize: 16, fontWeight: '600' },
  warningBanner: {
    position: 'absolute',
    top: 60, // Adjust this value based on your header height
    left: 20,
    right: 20,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  warningText: {
    marginLeft: 8,
    color: '#FFA000',
    fontWeight: '500',
  },
  
});

export default HomeScreen;