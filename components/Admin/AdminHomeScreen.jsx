import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getUsers } from '../../services/user';
import { getGeofences } from '../../services/geofence';


const AdminHomeScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGeofences, setTotalGeofences] = useState(0);
    const { userToken } = useContext(AuthContext);
  


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = userToken

        const [userData, geofenceData] = await Promise.all([
          getUsers(token),
          getGeofences(token)
        ]);

        setTotalUsers(userData.total || 0);
        setTotalGeofences(geofenceData.total || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);



  const handleUserUpdated = (updatedUser) => {
    const updatedList = users.some(u => u.id === updatedUser.id)
      ? users.map(u => u.id === updatedUser.id ? updatedUser : u)
      : [...users, updatedUser];
    setUsers(updatedList);
    setFilteredUsers(updatedList.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())));
  };


  const DashboardCard = ({ icon, title, onPress, color }) => (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, {userInfo?.username || 'Admin'}</Text>
          </View>
          
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}> {totalGeofences} </Text>
            <Text style={styles.statLabel}>Active Geofences</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <DashboardCard
            icon={<FontAwesome5 name="map-marked-alt" size={20} color="#4e73df" />}
            title="Manage Geofences"
            onPress={() => navigation.navigate('GeofenceManagement')}
            color="#4e73df"
          />
          <DashboardCard
            icon={<FontAwesome5 name="users-cog" size={20} color="#1cc88a" />}
            title="Manage Users"
            onPress={() => navigation.navigate('UserManagement')}
            color="#1cc88a"
          />
          <DashboardCard
            icon={<FontAwesome5 name="chart-line" size={20} color="#f6c23e" />}
            title="View Attendance History"
            onPress={() => navigation.navigate('AdminAttendanceHistory')}
            color="#f6c23e"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}
            onPress={() => navigation.navigate('AddUser', {
          onUserUpdated: handleUserUpdated
        })}

            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#36b9cc20' }]}>
                <FontAwesome5 name="user-plus" size={18} color="#36b9cc" />
              </View>
              <Text style={styles.quickActionText}>Add User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}
              onPress={() => navigation.navigate('AddGeofence')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#e74a3b20' }]}>
                <FontAwesome5 name="map-marker-alt" size={18} color="#e74a3b" />
              </View>
              <Text style={styles.quickActionText}>Add Geofence</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 18,
    textAlign:'center',
    color: '#6c757d',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5a5c69',
  },
  logoutButton: {
    padding: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4e73df',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#858796',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b7b9cc',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5a5c69',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5a5c69',
    textAlign: 'center',
  },
});

export default AdminHomeScreen;