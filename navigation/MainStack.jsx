import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../components/Employee/HomeScreen';
import AttendanceHistory from '../components/Employee/AttendanceHistory';
import AdminHomeScreen from '../components/Admin/AdminHomeScreen';
import GeofenceManagement from '../components/Admin/GeofenceManagement';
import UserManagement from '../components/Admin/UserManagement';
import GeofenceForm from '../components/Admin/AddEditGeofence';
import UserForm from '../components/Admin/AddEditUser';
import AdminAttendanceHistory from '../components/Admin/AdminAttendanceHistory';
import Complaints from '../components/Employee/Complaints';

const Stack = createStackNavigator();

// Create a separate component for the logout button
const LogoutButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ marginRight: 15 }}>
    <Ionicons name="log-out-outline" size={24} color="#4e73df" />
  </TouchableOpacity>
);

const MainStack = ({ role = 'employee', logout = () => {} }) => {  // Add default values
  // Validate role to prevent errors
  const validatedRole = role === 'admin' ? 'admin' : 'employee';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 2,
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 2 },
          height: 90,
        },
        headerTintColor: '#4e73df',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 20,
        },
      }}
    >
      {role === 'admin' ? (
        <>
          <Stack.Screen 
            name="AdminHome" 
            component={AdminHomeScreen} 
            options={{ 
              title: 'Dashboard',
              headerLeft: null,
              headerRight: () => <LogoutButton onPress={logout} />
            }} 
          />
          <Stack.Screen 
            name="GeofenceManagement" 
            component={GeofenceManagement} 
            options={({ navigation }) => ({
              title: 'Manage Geofences',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="UserManagement" 
            component={UserManagement} 
            options={({ navigation }) => ({
              title: 'Manage Users',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="AddGeofence" 
            component={GeofenceForm} 
            options={({ navigation }) => ({
              title: 'Add Geofence',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="EditGeofence" 
            component={GeofenceForm} 
            options={({ navigation }) => ({
              title: 'Edit Geofence',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="AddUser" 
            component={UserForm} 
            options={({ navigation }) => ({
              title: 'Add User',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="EditUser" 
            component={UserForm} 
            options={({ navigation }) => ({
              title: 'Edit User',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="AdminAttendanceHistory" 
            component={AdminAttendanceHistory} 
            options={({ navigation }) => ({
              title: 'Attendance History',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ 
              title: 'Dashboard',
              headerLeft: null,
              headerRight: () => <LogoutButton onPress={logout} />
            }} 
          />
          <Stack.Screen 
            name="AttendanceHistory" 
            component={AttendanceHistory} 
            options={({ navigation }) => ({
              title: 'Attendance History',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
          <Stack.Screen 
            name="Complaints" 
            component={Complaints} 
            options={({ navigation }) => ({
              title: 'Complaints',
              headerRight: () => <LogoutButton onPress={logout} />
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainStack;