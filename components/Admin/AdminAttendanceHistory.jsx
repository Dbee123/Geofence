import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAdminAttendanceHistory } from '../../services/attendance';

const AdminAttendanceHistory = () => {
  const { userToken } = useContext(AuthContext);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    user: '',
    geofence: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminAttendanceHistory(userToken); // Use token from context
      setAttendances(data);
    } catch (err) {
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    fetchAttendance();
  };

  const resetFilters = () => {
    setFilters({
      user: '',
      geofence: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  // Memoized filtering function
  const filteredAttendances = React.useMemo(() => {
    return attendances.filter(att => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        att.user_details?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.geofence_details?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Additional filters
      const matchesUser = filters.user === '' || 
        att.user_details?.username?.toLowerCase().includes(filters.user.toLowerCase());
      
      const matchesGeofence = filters.geofence === '' || 
        att.geofence_details?.name?.toLowerCase().includes(filters.geofence.toLowerCase());
      
      const matchesType = filters.type === '' || 
        att.type === filters.type;
      
      const matchesDate = () => {
        if (!filters.dateFrom && !filters.dateTo) return true;
        
        const attDate = new Date(att.timestamp);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && attDate < fromDate) return false;
        if (toDate && attDate > toDate) return false;
        return true;
      };
      
      return matchesSearch && matchesUser && matchesGeofence && matchesType && matchesDate();
    });
  }, [attendances, searchTerm, filters]);


  const renderItem = ({ item }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <View style={[
          styles.typeBadge,
          item.type === 'clock-in' ? styles.clockInBadge : styles.clockOutBadge
        ]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color="#555" />
          <Text style={styles.infoText}>
            {item.user_details?.username || 'Unknown User'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color="#555" />
          <Text style={styles.infoText}>
            {item.geofence_details?.name || 'Unknown Location'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={16} color="#555" />
          <Text style={styles.infoText}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="gps-fixed" size={16} color="#555" />
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

  return (
    <LinearGradient colors={['#f5f7fa', '#e4e8f0']} style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Attendance Records</Text> */}
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users or locations..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="filter-list" size={24} color="#4e8cff" />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAttendance} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredAttendances}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchAttendance();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No attendance records found</Text>
            {searchTerm !== '' && (
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Records</Text>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>User</Text>
              <TextInput
                style={styles.filterInput}
                value={filters.user}
                onChangeText={text => handleFilterChange('user', text)}
                placeholder="Username"
              />
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.filterInput}
                value={filters.geofence}
                onChangeText={text => handleFilterChange('geofence', text)}
                placeholder="Location name"
              />
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    filters.type === 'clock-in' && styles.typeOptionActive
                  ]}
                  onPress={() => handleFilterChange('type', 'clock-in')}
                >
                  <Text>Clock In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    filters.type === 'clock-out' && styles.typeOptionActive
                  ]}
                  onPress={() => handleFilterChange('type', 'clock-out')}
                >
                  <Text>Clock Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateRangeContainer}>
                <TextInput
                  style={styles.dateInput}
                  value={filters.dateFrom}
                  onChangeText={text => handleFilterChange('dateFrom', text)}
                  placeholder="From (YYYY-MM-DD)"
                />
                <TextInput
                  style={styles.dateInput}
                  value={filters.dateTo}
                  onChangeText={text => handleFilterChange('dateTo', text)}
                  placeholder="To (YYYY-MM-DD)"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={resetFilters}
              >
                <Text>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={applyFilters}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    padding: 15,
    paddingTop: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  filterButton: {
    padding: 8,
  },
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateText: {
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
  },
  cardBody: {
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoText: {
    marginLeft: 5,
    color: '#555',
  },
  listContainer: {
    paddingBottom: 20,
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
  emptySubtext: {
    color: '#ccc',
    marginTop: 5,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffebee',
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#4e8cff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterGroup: {
    marginBottom: 15,
  },
  filterLabel: {
    marginBottom: 5,
    fontWeight: '500',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeOption: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeOptionActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4e8cff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#4e8cff',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 10,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdminAttendanceHistory;