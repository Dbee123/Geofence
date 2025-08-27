// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './Routes';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>

  </React.StrictMode>
);
