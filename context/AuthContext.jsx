import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, logoutUser } from '../services/auth';
import { setLogoutFunction } from '../services/apiClient';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await loginUser(username, password);
      setUserToken(response.access);
      setUserInfo(response.user);
      await AsyncStorage.setItem('userToken', response.access);
      await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
      // Remove the navigation.replace() calls here
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await registerUser(userData);
      return response;
    } catch (error) {
      console.log('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUserToken(null);
      setUserInfo(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userInfo');
      
      if (token && user) {
        setUserToken(token);
        setUserInfo(JSON.parse(user));
      }
    } catch (error) {
      console.log('isLoggedIn error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  // Set the logout function in the apiClient interceptor
  useEffect(() => {
    setLogoutFunction(logout);
  }, []);


  return (
    <AuthContext.Provider value={{ 
      login, 
      register, 
      logout, 
      isLoading, 
      userToken, 
      userInfo 
    }}>
      {children}
    </AuthContext.Provider>
  );
};