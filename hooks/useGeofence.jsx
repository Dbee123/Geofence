import { useState, useEffect } from 'react';
import { getGeofencesDetails } from '../services/geofence';
import { findNearestGeofence, isWithinGeofence } from '../utils/geoUtils';

export const useGeofence = (userToken, location) => {
  const [geofences, setGeofences] = useState([]);
  const [currentGeofence, setCurrentGeofence] = useState(null);
  const [distanceToGeofence, setDistanceToGeofence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGeofence, setLastGeofence] = useState(null);
  const [justExited, setJustExited] = useState(false);

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      setError(null);
      const fences = await getGeofencesDetails(userToken);
      setGeofences(fences);
      return fences;
    } catch (err) {
      setError(err);
      console.error('Failed to fetch geofences:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchGeofences();
      const interval = setInterval(fetchGeofences, 30000);
      return () => clearInterval(interval);
    }
  }, [userToken]);

  useEffect(() => {
    if (location && geofences.length > 0) {
      const { geofence, distance } = findNearestGeofence(
        location.latitude,
        location.longitude,
        geofences
      );
      
      setDistanceToGeofence(distance);
      
      const wasInGeofence = currentGeofence !== null;
      const isNowInGeofence = isWithinGeofence(
        location.latitude,
        location.longitude,
        geofence
      );

      // console.log(`Geofence status: wasIn=${wasInGeofence}, nowIn=${isNowInGeofence}, justExited=${wasInGeofence && !isNowInGeofence}`);

      
      if (isNowInGeofence) {
        setCurrentGeofence(geofence);
        setLastGeofence(geofence);
        setJustExited(false); // Reset exit flag when back in geofence
      } else {
        if (wasInGeofence) {
          setJustExited(true); // Set flag when exiting
          setLastGeofence(currentGeofence);
        }
        setCurrentGeofence(null);
      }
    }
  }, [location, geofences]);

  return {
    geofences,
    currentGeofence,
    distanceToGeofence,
    lastGeofence,
    justExited,
    loading,
    error,
    refresh: fetchGeofences
  };
};