import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getGeofences, deleteGeofence } from '../../services/geofence';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@react-navigation/native';

const GeofenceManagement = ({ navigation }) => {
  const { colors } = useTheme();
  const { userToken } = useContext(AuthContext);
  const [geofences, setGeofences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const data = await getGeofences(userToken);
        setGeofences(data.geofences);
        animateList();
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch geofences',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeofences();
  }, [userToken]);

  const animateList = () => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Geofence',
      'Are you sure you want to delete this geofence?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeofence(userToken, id);
              setGeofences(geofences.filter(g => g.id !== id));
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Geofence deleted successfully',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete geofence',
              });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View 
        style={[
          styles.item, 
          { 
            backgroundColor: colors.card,
            transform: [{ translateY }],
            opacity,
            shadowColor: colors.text,
            elevation: 3,
          }
        ]}
      >
        <View style={styles.itemHeader}>
          <Icon name="location-on" size={24} color={colors.primary} />
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="my-location" size={16} color={colors.text} style={styles.icon} />
          <Text style={[styles.location, { color: colors.text }]}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="radio-button-checked" size={16} color={colors.text} style={styles.icon} />
          <Text style={[styles.radius, { color: colors.text }]}>
            Radius: {item.radius} meters
          </Text>
        </View>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('EditGeofence', { geofence: item })}
          >
            <Icon name="edit" size={18} color="#fff" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#ff4444' }]}
            onPress={() => handleDelete(item.id)}
          >
            <Icon name="delete" size={18} color="#fff" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* <Text style={[styles.title, { color: colors.text }]}>Manage Geofences</Text> */}
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddGeofence')}
      >
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Geofence</Text>
      </TouchableOpacity>

      <FlatList
        data={geofences}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="location-off" size={50} color={colors.text} />
            <Text style={[styles.empty, { color: colors.text }]}>No geofences found</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  location: {
    fontSize: 14,
  },
  radius: {
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: '48%',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  empty: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GeofenceManagement;