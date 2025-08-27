import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { createGeofence, updateGeofence } from '../../services/geofence';
import Toast from 'react-native-toast-message';
import MapView, { Marker, Circle } from 'react-native-maps';
import useLocation from '../../hooks/useLocation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GeofenceForm = ({ route, navigation }) => {
  const { userToken } = useContext(AuthContext);
  const { location } = useLocation();
  const isEdit = route.params?.geofence;

  const [formData, setFormData] = useState({
    name: isEdit ? route.params.geofence.name : '',
    latitude: isEdit ? String(route.params.geofence.latitude) : String(location?.latitude || ''),
    longitude: isEdit ? String(route.params.geofence.longitude) : String(location?.longitude || ''),
    radius: isEdit ? String(route.params.geofence.radius) : '100',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const dataToSubmit = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseFloat(formData.radius),
      };

      if (
        isNaN(dataToSubmit.latitude) ||
        isNaN(dataToSubmit.longitude) ||
        isNaN(dataToSubmit.radius)
      ) {
        Toast.show({ type: 'error', text1: 'Invalid input', text2: 'Please enter valid numbers' });
        setIsLoading(false);
        return;
      }

      if (isEdit) {
        await updateGeofence(userToken, route.params.geofence.id, dataToSubmit);
        Toast.show({ type: 'success', text1: 'Geofence updated successfully!' });
      } else {
        await createGeofence(userToken, dataToSubmit);
        Toast.show({ type: 'success', text1: 'Geofence created successfully!' });
      }

      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>{isEdit ? 'Edit Geofence' : 'Create New Geofence'}</Text>

          <Text style={styles.label}>Geofence Name</Text>
          <TextInput
            placeholder="Enter geofence name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
          />

          <View style={styles.coordinateContainer}>
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                placeholder="0.000000"
                placeholderTextColor="#999"
                value={formData.latitude}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                placeholder="0.000000"
                placeholderTextColor="#999"
                value={formData.longitude}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.label}>Radius (meters)</Text>
          <TextInput
            placeholder="100"
            placeholderTextColor="#999"
            value={formData.radius}
            onChangeText={(text) => setFormData({ ...formData, radius: text })}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Map Preview</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={{
                latitude: parseFloat(formData.latitude) || 0,
                longitude: parseFloat(formData.longitude) || 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e) =>
                setFormData({
                  ...formData,
                  latitude: String(e.nativeEvent.coordinate.latitude),
                  longitude: String(e.nativeEvent.coordinate.longitude),
                })
              }
            >
              <Marker
                coordinate={{
                  latitude: parseFloat(formData.latitude) || 0,
                  longitude: parseFloat(formData.longitude) || 0,
                }}
                pinColor="#4e73df"
              />
              <Circle
                center={{
                  latitude: parseFloat(formData.latitude) || 0,
                  longitude: parseFloat(formData.longitude) || 0,
                }}
                radius={parseFloat(formData.radius) || 100}
                fillColor="rgba(78, 115, 223, 0.2)"
                strokeColor="rgba(78, 115, 223, 0.8)"
                strokeWidth={2}
              />
            </MapView>
            <Text style={styles.mapHint}>Tap on map to change location</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#4e73df" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
              <LinearGradient
                colors={['#4e73df', '#224abe']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitButtonText}>
                  {isEdit ? 'UPDATE GEOFENCE' : 'CREATE GEOFENCE'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coordinateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    width: '48%',
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  map: {
    flex: 1,
  },
  mapHint: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradient: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loader: {
    marginVertical: 20,
  },
});

export default GeofenceForm;
