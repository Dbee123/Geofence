import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getLocation = async (highAccuracy = true) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationAccuracy(location.coords.accuracy);
      setErrorMsg(null);
      return location;
    } catch (error) {
      setErrorMsg(error.message);
      throw error;
    }
  };

  // In useLocation.jsx
  const refreshLocation = async () => {
    try {
      setIsRefreshing(true);
      const location = await getLocation();
      return location;
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    errorMsg,
    refreshLocation,
    locationAccuracy,
    isRefreshing,
  };
};

export default useLocation;