import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminManagement.module.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [authAdmin, setAuthAdmin] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [canManageAdmins, setCanManageAdmins] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && canManageAdmins) {
      fetchAdmins();
    }
  }, [isAuthenticated, canManageAdmins]);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError('Failed to fetch admins. Please check your permissions.');
    }
  };

  const authenticateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', authAdmin);
      
      const { token, user } = response.data;
      if (token) {
        setToken(token);
        setIsAuthenticated(true);
        setCanManageAdmins(user.canManageAdmins);
        if (!user.canManageAdmins) {
          setError('You do not have permission to manage admins.');
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Error authenticating admin:', error);
      setError(`Authentication failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !canManageAdmins) {
      setError('You do not have permission to add an admin.');
      return;
    }
    try {
      await axios.post('http://localhost:3001/api/admin', newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins();
      setNewAdmin({ username: '', password: '' });
      setError('');
    } catch (error) {
      console.error('Error adding admin:', error);
      setError(`Failed to add admin: ${error.response?.data?.error || error.message}`);
    }
  };

  const deleteAdmin = async (id) => {
    if (!isAuthenticated || !canManageAdmins) {
      setError('You do not have permission to delete an admin.');
      return;
    }
    try {
      await axios.delete(`http://localhost:3001/api/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins();
      setError('');
    } catch (error) {
      console.error('Error deleting admin:', error);
      setError(`Failed to delete admin: ${error.response?.data?.error || error.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Admin Authentication</h2>
        <form onSubmit={authenticateAdmin} className={styles.form}>
          <input
            className={styles.input}
            type="text"
            placeholder="Username"
            value={authAdmin.username}
            onChange={(e) => setAuthAdmin({...authAdmin, username: e.target.value})}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={authAdmin.password}
            onChange={(e) => setAuthAdmin({...authAdmin, password: e.target.value})}
            required
          />
          <button type="submit" className={styles.button}>Authenticate</button>
        </form>
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
    );
  }

  if (!canManageAdmins) {
    return (
      <div className={styles.container}>
        <div className={styles.permissionMessage}>
          <h2>You do not have permission to manage admins.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Admin Management</h2>
      <form onSubmit={addAdmin} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="Username"
          value={newAdmin.username}
          onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={newAdmin.password}
          onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
          required
        />
        <button type="submit" className={styles.button}>Add Admin</button>
      </form>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className={styles.tableHeaderCell}>Username</th>
            <th className={styles.tableHeaderCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id} className={styles.tableRow}>
              <td className={styles.tableCell}>{admin.username}</td>
              <td className={styles.tableCell}>
                <button 
                  onClick={() => deleteAdmin(admin.id)} 
                  className={styles.actionButton}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminManagement;