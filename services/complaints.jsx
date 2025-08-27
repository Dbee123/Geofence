import axios from 'axios';
import { BASE_URL } from '../config/api';

const handleApiError = (error) => {
  if (error.response) {
    return error.response.data;
  } else if (error.request) {
    return { error: 'Network Error', message: 'No response from server' };
  }
  return { error: 'Request Error', message: error.message };
};

export const createComplaint = async (token, { subject, message }) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/complaints/`,
      { subject, message },
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

export const getComplaints = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/complaints/`, {
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
    throw { error: 'Network Error', message: 'Failed to fetch complaints' };
  }
};

export const getComplaintDetails = async (token, complaintId) => {
  try {
    const response = await axios.get(`${BASE_URL}/complaints/${complaintId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw { error: 'Network Error', message: 'Failed to fetch complaint details' };
  }
};