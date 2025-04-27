import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './DoctorsPanel.module.css';

const DoctorsPanelPage = ({ doctorId: propDoctorId, onLogout }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: urlDoctorId } = useParams();
  const navigate = useNavigate();

  const effectiveDoctorId = propDoctorId || urlDoctorId || localStorage.getItem('doctorId');

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!effectiveDoctorId) {
        setError('No doctor ID available. Please log in again.');
        setLoading(false);
        navigate('/admin-login');
        return;
      }

      const url = `http://localhost:3001/api/doctor/${effectiveDoctorId}/appointments`;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAppointments(response.data);
        setLoading(false);
      } catch (err) {
        console.error('DoctorsPanelPage: Fetch error:', err);
        setError('Failed to fetch appointments. Please try again later.');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [effectiveDoctorId, navigate]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const navigateToVideoRoom = (roomCode) => {
    if (roomCode) {
      console.log(`Navigating to video room: /doctor/video/${roomCode}`);
      // Use React Router navigation instead of full page redirect
      navigate(`/doctor/video/${roomCode}`);
    } else {
      alert("No room code available for this appointment.");
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/admin-login');
  };

  if (loading) return (
    <div className={styles.panelContainer}>
      <div className={styles.loading}>Loading appointments...</div>
    </div>
  );

  if (error) return (
    <div className={styles.panelContainer}>
      <div className={styles.error}>{error}</div>
    </div>
  );

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Doctor's Dashboard</h1>
        <div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      <h2 className={styles.subtitle}>Your Appointments</h2>
      
      {appointments.length === 0 ? (
        <div className={styles.noAppointments}>
          No appointments scheduled. Check back later!
        </div>
      ) : (
        <table className={styles.appointmentsTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Email</th>
              <th>Room Code</th>
              <th>Issues</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment, index) => (
              <tr key={index}>
                <td>{formatDate(appointment.date)}</td>
                <td>{appointment.time}</td>
                <td>{appointment.patientName}</td>
                <td>{appointment.userEmail}</td>
                <td>
                  <span className={styles.statusBadge}>
                    {appointment.roomCode || 'Not assigned'}
                  </span>
                </td>
                <td>{appointment.issues || 'Not specified'}</td>
                <td>
                  {appointment.roomCode && (
                    <button 
                      className={styles.videoButton}
                      onClick={() => navigateToVideoRoom(appointment.roomCode)}
                    >
                      Join Video Call
                    </button>
                  )}
                  {!appointment.roomCode && (
                    <button 
                      className={`${styles.videoButton} ${styles.disabled}`}
                      disabled
                    >
                      No Room Available
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DoctorsPanelPage;