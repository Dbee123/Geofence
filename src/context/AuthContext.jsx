// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, logoutUser } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const { access, refresh, user: loggedInUser } = response.data;

    // Store tokens and user in localStorage
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    localStorage.setItem('user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const logout = async () => {
    try {
      await logoutUser(); // optional, backend side effect
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.clear();
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('access');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
