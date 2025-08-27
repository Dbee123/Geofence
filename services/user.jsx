import axios from 'axios';
import { BASE_URL } from '../config/api';
// services/user.js
import apiClient from './apiClient';

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/auth/users/');
    const { total, users } = response.data;
    return { total, users };
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register/`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Update an existing user
export const updateUser = async (token, userId, userData) => {
  try {
    const response = await axios.patch(`${BASE_URL}/auth/users/${userId}/`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Update failed' };
  }
};

export const deleteUser = async (token, userId) => {
  try {
    await axios.delete(`${BASE_URL}/auth/users/${userId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw error.response.data;
  }
};