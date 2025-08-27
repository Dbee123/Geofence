import axios from 'axios';
import { BASE_URL } from '../config/api';

export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login/`, {
      username,
      password,
    });
    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user: response.data.user,
    };
  } catch (error) {
    console.log('Raw login error:', error);
    if (error.response) {
      // Server responded with a status outside 2xx
      console.log('Error data:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      // No response received
      console.log('No response:', error.request);
      throw { error: 'No response from server' };
    } else {
      console.log('Error:', error.message);
      throw { error: 'Unknown error occurred' };
    }
  }
};


export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register/`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const logoutUser = async () => {
  // Since we're using JWT, logout is handled client-side by removing the token
  return Promise.resolve();
};