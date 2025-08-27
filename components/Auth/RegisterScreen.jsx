import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Picker } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee',
  });
  const { register, isLoading } = useContext(AuthContext);

  const handleRegister = async () => {
    try {
      await register(formData);
      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: 'You can now login with your credentials',
      });
      navigation.navigate('Login');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.error || 'Please check your inputs',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => setFormData({ ...formData, username: text })}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={formData.first_name}
        onChangeText={(text) => setFormData({ ...formData, first_name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={formData.last_name}
        onChangeText={(text) => setFormData({ ...formData, last_name: text })}
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Role:</Text>
        <Picker
          selectedValue={formData.role}
          style={styles.picker}
          onValueChange={(itemValue) => setFormData({ ...formData, role: itemValue })}
        >
          <Picker.Item label="Employee" value="employee" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Button title="Register" onPress={handleRegister} />
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerLabel: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 40,
  },
});

export default RegisterScreen;