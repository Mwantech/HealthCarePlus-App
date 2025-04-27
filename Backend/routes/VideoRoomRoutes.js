const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (connection) => {
  console.log('VideoRoomRoutes initialized'); // Log when routes are initialized

  // Fetch appointment details by room code
  router.get('/appointments/room/:roomCode', async (req, res) => {
    const { roomCode } = req.params;
    console.log(`Received request for room code: ${roomCode}`); // Log incoming requests
    
    try {
      const [rows] = await connection.promise().query(
        'SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, d.price ' +
        'FROM appointments a ' +
        'JOIN doctors d ON a.doctor_id = d.id ' +
        'WHERE a.room_code = ?',
        [roomCode]
      );
      
      console.log(`Query results for room ${roomCode}:`, rows.length ? 'Found' : 'Not found'); // Log query results
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Appointment not found' });
      }
      
      res.json({
        success: true,
        appointment: rows[0]
      });
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Get doctor's appointments for today
  router.get('/doctor/appointments/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    try {
      const [rows] = await connection.promise().query(
        'SELECT a.*, u.email as user_email ' +
        'FROM appointments a ' +
        'LEFT JOIN users u ON a.user_email = u.email ' +
        'WHERE a.doctor_id = ? AND a.appointment_date = ?',
        [doctorId, date]
      );
      
      res.json({
        success: true,
        appointments: rows
      });
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Get patient's appointments
  router.get('/patient/appointments/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
      const [rows] = await connection.promise().query(
        'SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization ' +
        'FROM appointments a ' +
        'JOIN doctors d ON a.doctor_id = d.id ' +
        'JOIN users u ON a.user_email = u.email ' +
        'WHERE u.id = ? ' +
        'ORDER BY a.appointment_date DESC, a.appointment_time DESC',
        [userId]
      );
      
      res.json({
        success: true,
        appointments: rows
      });
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
};