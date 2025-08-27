import axios from 'axios';
import { BASE_URL } from '../config/api';
import apiClient from './apiClient';

export const getGeofences = async () => {
  try {
    const response = await apiClient.get('/geofences/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch geofences' };
  }
};

export const getGeofencesDetails = async (token) => {
  try {
    const response = await apiClient.get('/geofences/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.geofences; // Return just the geofences array
  } catch (error) {
    console.error('Error fetching geofences:', error);
    throw error.response?.data || { error: 'Failed to fetch geofences' };
  }
};


export const createGeofence = async (token, geofenceData) => {
  try {
    const response = await axios.post(`${BASE_URL}/geofences/`, geofenceData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateGeofence = async (token, id, geofenceData) => {
  try {
    const response = await axios.put(`${BASE_URL}/geofences/${id}/`, geofenceData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteGeofence = async (token, id) => {
  try {
    await axios.delete(`${BASE_URL}/geofences/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw error.response.data;
  }
};