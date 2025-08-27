import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { logoutUser } from './auth';

let logoutFn = null;

export const setLogoutFunction = (fn) => {
  logoutFn = fn;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (logoutFn) {
        logoutFn(); // force logout when 401 is detected
      }

      return Promise.reject({ message: 'Session expired. Please log in again.' });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
