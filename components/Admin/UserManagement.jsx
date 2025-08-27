import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getUsers, deleteUser } from '../../services/user';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserManagement = ({ navigation }) => {
  const { userToken, userInfo } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

    
  const [totalUsers, setTotalUsers] = useState(0); // <- new

  const fetchUsers = async () => {
    try {
      const data = await getUsers(userToken);
      setUsers(data.users);
      setFilteredUsers(data.users);
      setTotalUsers(data.total); // <- set total count
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch users',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userToken]);

  const handleUserUpdated = (updatedUser) => {
    const updatedList = users.some(u => u.id === updatedUser.id)
      ? users.map(u => u.id === updatedUser.id ? updatedUser : u)
      : [...users, updatedUser];
    setUsers(updatedList);
    setFilteredUsers(updatedList.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())));
  };

  const handleDelete = (userId) => {
    if (userId === userInfo.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'You cannot delete your own account',
      });
      return;
    }

    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userToken, userId);
              const updated = users.filter(u => u.id !== userId);
              setUsers(updated);
              setFilteredUsers(updated.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())));
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'User removed successfully',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not delete user',
              });
            }
          }
        }
      ]
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = users.filter(u =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}><Icon name="account" size={18} /> {item.username}</Text>
        <Text style={[styles.badge, getRoleStyle(item.role)]}>
          {item.role.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.email}><Icon name="email" size={16} /> {item.email || 'No email'}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => navigation.navigate('EditUser', {
            user: item,
            // onUserUpdated: handleUserUpdated,
          })}
        >
          <Icon name="account-edit" size={18} color="#fff" />
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item.id)}
        >
          <Icon name="delete" size={18} color="#fff" />
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by username or email"
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor="#999"
      />

      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchUsers();
          }} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddUser')}
      >
        <Icon name="account-plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const getRoleStyle = (role) => {
  switch (role) {
    case 'admin': return { backgroundColor: '#42a5f5' };
    case 'lecturer': return { backgroundColor: '#42a5f5' };
    case 'employee': return { backgroundColor: '#42a5f5' };
    default: return { backgroundColor: '#9e9e9e' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f4f8',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
  },
  email: {
    color: '#555',
    fontSize: 14,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 5,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  editBtn: {
    backgroundColor: '#9e9e9e',
  },
  deleteBtn: {
    backgroundColor: '#e53935',
  },
  btnText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3f51b5',
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
});

export default UserManagement;
