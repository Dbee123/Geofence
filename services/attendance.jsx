// services/attendance.js
import axios from 'axios';
import { BASE_URL } from '../config/api';

const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data;
  } else if (error.request) {
    // Request made but no response
    return { error: 'Network Error', message: 'No response from server' };
  }
  // Something else happened
  return { error: 'Request Error', message: error.message };
};

export const clockIn = async (token, locationData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/attendance/clock-in/`,
      {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        geofence_id: locationData.geofence_id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const clockOut = async (token, locationData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/attendance/clock-out/`,
      {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        geofence_id: locationData.geofence_id // This can be null
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAttendanceHistory = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/attendance/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000
    });
    return response.data || [];
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw { error: 'Network Error', message: 'Failed to fetch history' };
  }
};

export const getAdminAttendanceHistory = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/attendance/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000
    });
    return response.data || [];
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw { error: 'Network Error', message: 'Failed to fetch admin attendance' };
  }
};


export const getCurrentAttendanceStatus = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/current/attendance/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000
    });
    return response.data; // Should return { isClockedIn: true/false, lastAction: 'clock-in'/'clock-out' }
  } catch (error) {
    throw handleApiError(error);
  }
};