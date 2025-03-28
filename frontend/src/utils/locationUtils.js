export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Convert to meters
  return distance;
};

export const isWithinRange = (userLocation, targetLocation, maxDistance = 100) => {
  if (!userLocation || !targetLocation) return false;
  
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude
  );
  
  return distance <= maxDistance; // Within maxDistance meters
};
