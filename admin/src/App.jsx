import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import AdminPage from './pages/Admin';
import AdminLogin from './components/AdminLogin';
import DoctorsPanelPage from './pages/DoctorsPanelPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState('');
  const [userId, setUserId] = useState('');
  const [doctorId, setDoctorId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    const storedUserType = localStorage.getItem('userType');
    const storedUserId = localStorage.getItem('userId');
    const storedDoctorId = localStorage.getItem('doctorId');

    if (token && tokenExpiration && new Date().getTime() < parseInt(tokenExpiration)) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
      setUserId(storedUserId || '');

      if (storedUserType === 'doctor') {
        setDoctorId(storedDoctorId || storedUserId);
      }
    } else {
      handleLogout();
    }
  }, []);

  const handleLogin = (type, id, token, doctorId = null) => {
    const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
    localStorage.setItem('userType', type);
    localStorage.setItem('userId', id);
    setIsAuthenticated(true);
    setUserType(type);
    setUserId(id);
    if (type === 'doctor' && doctorId) {
      setDoctorId(doctorId);
      localStorage.setItem('doctorId', doctorId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('doctorId');
    setIsAuthenticated(false);
    setUserType('');
    setUserId('');
    setDoctorId('');
  };

  // Component wrapper with proper styling for content
  const renderContent = (Component, props = {}) => (
    <div className="content-container">
      <Component {...props} onLogout={handleLogout} />
    </div>
  );

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Redirect root to login */}
          <Route 
            path="/" 
            element={<Navigate to="/admin-login" />} 
          />
          
          {/* Login route */}
          <Route 
            path="/admin-login" 
            element={renderContent(AdminLogin, { onLogin: handleLogin })} 
          />
          
          {/* Admin route with authentication */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated && userType === 'admin' 
                ? renderContent(AdminPage, { userId, onLogout: handleLogout }) 
                : <Navigate to="/admin-login" />
            } 
          />
          
          {/* Doctor redirect route */}
          <Route 
            path="/doctor" 
            element={
              isAuthenticated && userType === 'doctor' 
                ? <Navigate to={`/doctor/${doctorId}`} replace /> 
                : <Navigate to="/admin-login" />
            } 
          />
          
          {/* Doctor panel route with id parameter */}
          <Route 
            path="/doctor/:id" 
            element={
              isAuthenticated && userType === 'doctor' 
                ? renderContent(DoctorsPanelPage, { doctorId, onLogout: handleLogout }) 
                : <Navigate to="/admin-login" />
            } 
          />
          
          {/* Catch-all redirect to login */}
          <Route 
            path="*" 
            element={<Navigate to="/admin-login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;