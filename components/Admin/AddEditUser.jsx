import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext';
import { registerUser, updateUser } from '../../services/user';
import Toast from 'react-native-toast-message';

const UserForm = ({ route, navigation }) => {
  const { userToken } = useContext(AuthContext);
  const isEdit = route.params?.user;
  const { onUserUpdated } = route.params || {}; // Callback for updates

  

  const [formData, setFormData] = useState({
    username: isEdit ? route.params.user.username : '',
    email: isEdit ? route.params.user.email : '',
    password: '',
    first_name: isEdit ? route.params.user.first_name : '',
    last_name: isEdit ? route.params.user.last_name : '',
    role: isEdit ? route.params.user.role : 'employee',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isEdit && formData.password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit) {
        // Prepare update data
        const updateData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
        };
        if (formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        const updatedUser = await updateUser(userToken, route.params.user.id, updateData);
        Toast.show({ type: 'success', text1: 'User updated!' });
        
        // Call the callback with updated user data
        if (onUserUpdated) {
          onUserUpdated({
            ...route.params.user,
            ...updateData
          });
        }
      } else {
        const newUser = await registerUser(formData);
        Toast.show({ type: 'success', text1: 'User created!' });
        
        // Call the callback with new user data if needed
        if (onUserUpdated) {
          onUserUpdated(newUser);
        }
      }
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEdit ? 'Edit User' : 'Add User'}</Text>

      <TextInput
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => setFormData({ ...formData, username: text })}
        style={styles.input}
        editable={!isEdit}
      />

      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry
        style={styles.input}
      />

      {!isEdit && (
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="First Name"
        value={formData.first_name}
        onChangeText={(text) => setFormData({ ...formData, first_name: text })}
        style={styles.input}
      />

      <TextInput
        placeholder="Last Name"
        value={formData.last_name}
        onChangeText={(text) => setFormData({ ...formData, last_name: text })}
        style={styles.input}
      />

      <View style={styles.pickerContainer}>
        <Text>Role:</Text>
        <Picker
          selectedValue={formData.role}
          onValueChange={(itemValue) => setFormData({ ...formData, role: itemValue })}
          style={styles.picker}
        >
          <Picker.Item label="Employee" value="employee" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title={isEdit ? 'Update User' : 'Create User'} onPress={handleSubmit} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  picker: { flex: 1, marginLeft: 10 },
});

export default UserForm;
