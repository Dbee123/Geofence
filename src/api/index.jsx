import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';

const authRequest = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

authRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authRequest.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        const response = await axios.post(`${BASE_URL}auth/token/refresh/`, {
          refresh,
        });
        localStorage.setItem('access', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return authRequest(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const loginUser = (credentials) => axios.post(`${BASE_URL}auth/login/`, credentials);
export const registerUser = (data) => axios.post(`${BASE_URL}auth/register/`, data);
export const logoutUser = () => authRequest.post('logout/', { refresh: localStorage.getItem('refresh') });
export const fetchCurrentUser = () => authRequest.get(`auth/users/me/`);

// User Management
export const getUsers = () => authRequest.get(`auth/users/`);
export const getUserDetails = (id) => authRequest.get(`auth/users/${id}/`);
export const createUser = (data) => authRequest.post(`auth/users/`, data);
export const updateUser = (id, data) => authRequest.put(`auth/users/${id}/`, data);
export const deleteUser = (id) => authRequest.delete(`auth/users/${id}/`);

// api.js

export const getUserActivity = (userId) => authRequest.get(`auth/users/${userId}/activity/`);


// Geofence Management
export const getGeofences = () => authRequest.get(`geofences/`);
export const getGeofenceDetails = (id) => authRequest.get(`geofences/${id}/`);
export const createGeofence = (data) => authRequest.post(`geofences/`, data);
export const updateGeofence = (id, data) => authRequest.put(`geofences/${id}/`, data);
export const deleteGeofence = (id) => authRequest.delete(`geofences/${id}/`);

// Attendance
export const getAttendances = (params = {}) => authRequest.get(`attendance/`, { params });
export const clockInOut = (action, data) => authRequest.post(`attendance/${action}/`, data);

// Complaints
export const getComplaints = () => authRequest.get(`complaints/`);
export const getComplaintDetails = (id) => authRequest.get(`complaints/${id}/`);
export const createComplaint = (data) => authRequest.post(`complaints/`, data);
export const updateComplaint = (id, data) => authRequest.put(`complaints/${id}/`, data);

// Reports & Stats
export const getAttendanceReport = (params = {}) => authRequest.get(`reports/attendance/`, { params });
export const getSystemStats = () => authRequest.get(`stats/`);
export const getLoginLogs = (params = {}) => authRequest.get(`login-logs/`, { params });

export default authRequest;