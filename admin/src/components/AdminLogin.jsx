import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './AdminLogin.module.css';

const API_BASE_URL = 'http://localhost:3001';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username,
        password,
        userType,
      });

      const { token, userType: responseUserType, username: responseUsername, userId, doctorId } = response.data;

      if (!token || !responseUserType || !responseUsername || !userId) {
        throw new Error('Invalid response structure from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userType', responseUserType);
      localStorage.setItem('username', responseUsername);
      localStorage.setItem('userId', userId);
      
      if (responseUserType === 'doctor') {
        localStorage.setItem('doctorId', doctorId || userId);
      }

      onLogin(responseUserType, userId, doctorId || userId);

      if (responseUserType === 'admin') {
        navigate('/admin');
      } else if (responseUserType === 'doctor') {
        navigate(`/doctor/${doctorId || userId}`);
      } else {
        throw new Error('Unexpected user type');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data.message;

        switch (statusCode) {
          case 400:
            setError('Invalid input. Please check your username and password.');
            break;
          case 401:
            setError('Authentication failed. Please check your credentials.');
            break;
          case 403:
            setError('Access denied. You do not have permission to log in as this user type.');
            break;
          default:
            setError(errorMessage || 'An error occurred during login. Please try again later.');
        }
      } else if (error.request) {
        setError('No response received from the server. Please check your internet connection.');
      } else {
        setError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.cardTitle}>
            {userType === 'admin' ? 'Admin' : 'Doctor'} Login
            <div className={styles.underline}></div>
          </h1>
        </div>
        
        <div className={styles.cardContent}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.alert}>
                <span className={styles.alertDescription}>{error}</span>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="userType" className={styles.label}>
                Login As
              </label>
              <select
                id="userType"
                className={styles.input}
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner}></span>
              ) : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;