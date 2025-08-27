export const getAccuracyLevel = (accuracy) => {
  if (!accuracy) return 'Unknown';
  if (accuracy < 10) return 'High';
  if (accuracy < 50) return 'Medium';
  return 'Low';
};

export const getAccuracyColor = (accuracy) => {
  const level = getAccuracyLevel(accuracy);
  switch (level) {
    case 'High': return '#4CAF50';
    case 'Medium': return '#FFC107';
    case 'Low': return '#F44336';
    default: return '#9E9E9E';
  }
};

export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};