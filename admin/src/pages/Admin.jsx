import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import styles from './Admin.module.css';
import tableStyles from './AdminTable.module.css';
import AdminManagement from './AdminManagement';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [healthIssues, setHealthIssues] = useState([]);
  const [testKits, setTestKits] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: '', contact: '', availability: '', price: '', password: '' });
  const [newHealthIssue, setNewHealthIssue] = useState({ name: '', description: '', symptoms: '' });
  const [newTestKit, setNewTestKit] = useState({ name: '', description: '', price: 0 });
  const [errorMessages, setErrorMessages] = useState({});
  
  // API base URL - to make it easier to update in the future
  const API_BASE_URL = 'http://localhost:3001/api';

  useEffect(() => {
    // Create socket connection
    let socket;
    try {
      socket = io('http://localhost:3001');
      
      socket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setErrorMessages(prev => ({ ...prev, socket: 'Failed to connect to socket server' }));
      });
      
      socket.on('newOrder', (order) => {
        setNotifications(prev => [...prev, `New order received: ${order.orderNumber}`]);
        fetchOrders();
      });

      socket.on('orderUpdated', ({ id, status }) => {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === id ? { ...order, status } : order
          )
        );
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
      setErrorMessages(prev => ({ ...prev, socket: 'Failed to initialize socket connection' }));
    }

    // Fetch data for all tabs to have them ready
    fetchOrders();
    fetchDoctors();
    fetchHealthIssues();
    fetchTestKits();

    // Cleanup socket connection on component unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Safe fetch function to handle API calls with error handling
  const safeFetch = async (endpoint, stateSetter, errorKey) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      stateSetter(response.data);
      // Clear any previous error for this endpoint
      setErrorMessages(prev => ({ ...prev, [errorKey]: null }));
    } catch (error) {
      console.error(`Error fetching ${errorKey}:`, error);
      setErrorMessages(prev => ({ 
        ...prev, 
        [errorKey]: `Failed to load ${errorKey}. ${error.response?.status === 404 ? 'Endpoint not found.' : 'Server error.'}`
      }));
      // Set empty data to prevent UI errors
      stateSetter(errorKey === 'telemedicinePricing' ? { base_fee: 0, additional_fee: 0 } : []);
    }
  };

  const fetchOrders = async () => {
    await safeFetch('/orders', setOrders, 'orders');
  };

  const fetchDoctors = async () => {
    await safeFetch('/doctors', setDoctors, 'doctors');
  };

  const fetchHealthIssues = async () => {
    await safeFetch('/health-issues', setHealthIssues, 'healthIssues');
  };

  

  const fetchTestKits = async () => {
    await safeFetch('/testkits', setTestKits, 'testKits');
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${id}/status`, { status });
      // The order will be updated via the socket connection
      setErrorMessages(prev => ({ ...prev, orderStatus: null }));
    } catch (error) {
      console.error('Error updating order status:', error);
      setErrorMessages(prev => ({ ...prev, orderStatus: 'Failed to update order status' }));
    }
  };

  const addDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/doctors`, newDoctor);
      fetchDoctors();
      setNewDoctor({ name: '', specialization: '', contact: '', availability: '', price: '', password: '' });
      setErrorMessages(prev => ({ ...prev, doctorAdd: null }));
    } catch (error) {
      console.error('Error adding doctor:', error);
      setErrorMessages(prev => ({ ...prev, doctorAdd: 'Failed to add doctor' }));
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/doctors/${id}`);
      fetchDoctors();
      setErrorMessages(prev => ({ ...prev, doctorDelete: null }));
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setErrorMessages(prev => ({ ...prev, doctorDelete: 'Failed to delete doctor' }));
    }
  };

  const addHealthIssue = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/health-issues`, newHealthIssue);
      fetchHealthIssues();
      setNewHealthIssue({ name: '', description: '', symptoms: '' });
      setErrorMessages(prev => ({ ...prev, healthIssueAdd: null }));
    } catch (error) {
      console.error('Error adding health issue:', error);
      setErrorMessages(prev => ({ ...prev, healthIssueAdd: 'Failed to add health issue' }));
    }
  };

  const deleteHealthIssue = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/health-issues/${id}`);
      fetchHealthIssues();
      setErrorMessages(prev => ({ ...prev, healthIssueDelete: null }));
    } catch (error) {
      console.error('Error deleting health issue:', error);
      setErrorMessages(prev => ({ ...prev, healthIssueDelete: 'Failed to delete health issue' }));
    }
  };


  const addTestKit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/testkits`, newTestKit);
      fetchTestKits();
      setNewTestKit({ name: '', description: '', price: 0 });
      setErrorMessages(prev => ({ ...prev, testKitAdd: null }));
    } catch (error) {
      console.error('Error adding test kit:', error);
      setErrorMessages(prev => ({ ...prev, testKitAdd: 'Failed to add test kit' }));
    }
  };

  const deleteTestKit = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/testkits/${id}`);
      fetchTestKits();
      setErrorMessages(prev => ({ ...prev, testKitDelete: null }));
    } catch (error) {
      console.error('Error deleting test kit:', error);
      setErrorMessages(prev => ({ ...prev, testKitDelete: 'Failed to delete test kit' }));
    }
  };

  // Error banner component
  const ErrorBanner = ({ error }) => {
    if (!error) return null;
    return <div className={styles.errorBanner}>{error}</div>;
  };

  const renderOrdersManagement = () => (
    <div className={styles.adminCard}>
      <h2 className={styles.adminHeader}>Orders Management</h2>
      <ErrorBanner error={errorMessages.orders || errorMessages.orderStatus} />
      {orders.length === 0 && !errorMessages.orders ? (
        <p className={styles.noData}>No orders found.</p>
      ) : (
        <table className={tableStyles.adminTable}>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Test Kits</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.email}</td>
                <td>{order.test_kits}</td>
                <td>{order.status}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className={tableStyles.statusSelect}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderDoctorManagement = () => (
    <div className={styles.adminCard}>
      <h2 className={styles.adminHeader}>Doctor Management</h2>
      <ErrorBanner error={errorMessages.doctors || errorMessages.doctorAdd || errorMessages.doctorDelete} />
      <form onSubmit={addDoctor} className={styles.adminForm}>
        <input
          type="text"
          placeholder="Name"
          value={newDoctor.name}
          onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="text"
          placeholder="Specialization"
          value={newDoctor.specialization}
          onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="text"
          placeholder="Contact"
          value={newDoctor.contact}
          onChange={(e) => setNewDoctor({...newDoctor, contact: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="text"
          placeholder="Availability"
          value={newDoctor.availability}
          onChange={(e) => setNewDoctor({...newDoctor, availability: e.target.value})}
          className={styles.formInput}
          required
        />
        <input 
          type="text" 
          placeholder="Price" 
          value={newDoctor.price} 
          onChange={(e) => setNewDoctor({...newDoctor, price: e.target.value})}
          className={styles.formInput}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={newDoctor.password} 
          onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
          className={styles.formInput}
          required
        />
        <button type="submit" className={styles.formButton}>Add Doctor</button>
      </form>
      {doctors.length === 0 && !errorMessages.doctors ? (
        <p className={styles.noData}>No doctors found.</p>
      ) : (
        <table className={tableStyles.adminTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Contact</th>
              <th>Availability</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialization}</td>
                <td>{doctor.contact}</td>
                <td>{doctor.availability}</td>
                <td>{doctor.price}</td>
                <td>
                  <button 
                    onClick={() => deleteDoctor(doctor.id)}
                    className={tableStyles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderHealthIssueManagement = () => (
    <div className={styles.adminCard}>
      <h2 className={styles.adminHeader}>Health Issue Management</h2>
      <ErrorBanner error={errorMessages.healthIssues || errorMessages.healthIssueAdd || errorMessages.healthIssueDelete} />
      <form onSubmit={addHealthIssue} className={styles.adminForm}>
        <input
          type="text"
          placeholder="Name"
          value={newHealthIssue.name}
          onChange={(e) => setNewHealthIssue({...newHealthIssue, name: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={newHealthIssue.description}
          onChange={(e) => setNewHealthIssue({...newHealthIssue, description: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="text"
          placeholder="Symptoms"
          value={newHealthIssue.symptoms}
          onChange={(e) => setNewHealthIssue({...newHealthIssue, symptoms: e.target.value})}
          className={styles.formInput}
          required
        />
        <button type="submit" className={styles.formButton}>Add Health Issue</button>
      </form>
      {healthIssues.length === 0 && !errorMessages.healthIssues ? (
        <p className={styles.noData}>No health issues found.</p>
      ) : (
        <table className={tableStyles.adminTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Symptoms</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {healthIssues.map((issue) => (
              <tr key={issue.id}>
                <td>{issue.name}</td>
                <td>{issue.description}</td>
                <td>{issue.symptoms}</td>
                <td>
                  <button 
                    onClick={() => deleteHealthIssue(issue.id)}
                    className={tableStyles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

 
  const renderTestKitManagement = () => (
    <div className={styles.adminCard}>
      <h2 className={styles.adminHeader}>Test Kit Management</h2>
      <ErrorBanner error={errorMessages.testKits || errorMessages.testKitAdd || errorMessages.testKitDelete} />
      <form onSubmit={addTestKit} className={styles.adminForm}>
        <input
          type="text"
          placeholder="Name"
          value={newTestKit.name}
          onChange={(e) => setNewTestKit({...newTestKit, name: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={newTestKit.description}
          onChange={(e) => setNewTestKit({...newTestKit, description: e.target.value})}
          className={styles.formInput}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={newTestKit.price}
          onChange={(e) => setNewTestKit({...newTestKit, price: parseFloat(e.target.value)})}
          className={styles.formInput}
          min="0"
          step="0.01"
          required
        />
        <button type="submit" className={styles.formButton}>Add Test Kit</button>
      </form>
      {testKits.length === 0 && !errorMessages.testKits ? (
        <p className={styles.noData}>No test kits found.</p>
      ) : (
        <table className={tableStyles.adminTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testKits.map((kit) => (
              <tr key={kit.id}>
                <td>{kit.name}</td>
                <td>{kit.description || 'N/A'}</td>
                <td>${Number(kit.price).toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => deleteTestKit(kit.id)}
                    className={tableStyles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
  
  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return renderOrdersManagement();
      case "doctors":
        return renderDoctorManagement();
      case "healthIssues":
        return renderHealthIssueManagement();
      case "testKits":
        return renderTestKitManagement();
      case "admins":
        return <AdminManagement />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminTitle}>Admin Dashboard</h1>
      {errorMessages.socket && <div className={styles.socketError}>{errorMessages.socket}</div>}
      <div className={styles.notifications}>
        {notifications.map((notification, index) => (
          <div key={index} className={styles.notification}>{notification}</div>
        ))}
      </div>
      <div className={styles.tabs}>
        <button className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`} onClick={() => setActiveTab("orders")}>Orders</button>
        <button className={`${styles.tabButton} ${activeTab === 'doctors' ? styles.activeTab : ''}`} onClick={() => setActiveTab("doctors")}>Doctors</button>
        <button className={`${styles.tabButton} ${activeTab === 'healthIssues' ? styles.activeTab : ''}`} onClick={() => setActiveTab("healthIssues")}>Health Issues</button>
        <button className={`${styles.tabButton} ${activeTab === 'testKits' ? styles.activeTab : ''}`} onClick={() => setActiveTab("testKits")}>Test Kits</button>
        <button className={`${styles.tabButton} ${activeTab === 'admins' ? styles.activeTab : ''}`} onClick={() => setActiveTab("admins")}>Admins</button>
      </div>
      {renderContent()}
    </div>
  );
};

export default AdminPage;