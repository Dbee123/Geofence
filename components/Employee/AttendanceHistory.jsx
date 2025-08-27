import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getAttendanceHistory } from '../../services/attendance';
import { LinearGradient } from 'expo-linear-gradient';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AttendanceHistory = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getAttendanceHistory(userToken);
      if (!Array.isArray(history)) {
        throw new Error('Invalid data received');
      }
      
      const sortedHistory = [...history].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setAttendances(sortedHistory);
    } catch (err) {
      setError(err.message || 'Failed to load history');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceHistory();
  };

  const renderItem = ({ item }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {formatDate(item.timestamp)}
        </Text>
        <View style={[
          styles.typeBadge,
          item.type === 'clock-in' ? styles.clockInBadge : styles.clockOutBadge
        ]}>
          <Text style={styles.typeText}>
            {item.type === 'clock-in' ? 'Clock In' : 'Clock Out'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={18} color="#666" />
          <Text style={styles.infoText}>
            {item.geofence_details?.name || 'Unknown Location'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={18} color="#666" />
          <Text style={styles.infoText}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="gps-fixed" size={18} color="#666" />
          <Text style={styles.infoText}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4e8cff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAttendanceHistory}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4e8f0']}
      style={styles.container}
    >
      <FlatList
        data={attendances}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
       
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4e8cff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginLeft: 5,
  },
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clockInBadge: {
    backgroundColor: '#e8f5e9',
  },
  clockOutBadge: {
    backgroundColor: '#ffebee',
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 5,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    color: '#999',
    fontSize: 16,
  },
});

export default AttendanceHistory;