import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './DoctorsPanel.module.css';

const DoctorsPanelPage = ({ doctorId: propDoctorId }) => {
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DoctorsPanelPage;