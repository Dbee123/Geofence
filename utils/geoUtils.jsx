export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
};

export const isWithinGeofence = (userLat, userLon, geofence, buffer = 10) => {
  if (!geofence) return false;
  const distance = calculateDistance(
    userLat,
    userLon,
    geofence.latitude,
    geofence.longitude
  );
  return distance <= (geofence.radius + buffer);
};

export const findNearestGeofence = (userLat, userLon, geofences) => {
  if (!geofences?.length) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  for (const geofence of geofences) {
    const distance = calculateDistance(
      userLat,
      userLon,
      geofence.latitude,
      geofence.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = geofence;
    }
  }
  
  return { geofence: nearest, distance: minDistance };
};