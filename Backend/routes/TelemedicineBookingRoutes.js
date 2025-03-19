const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();

// Configure nodemailer transporter for Gmail - make sure this is OUTSIDE the module.exports
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify transporter configuration immediately when this file is loaded
transporter.verify((error, success) => {
  if (error) {
    console.log('Telemedicine transporter verification error:', error);
  } else {
    console.log('Server is ready to take telemedicine messages');
  }
});

module.exports = (connection) => {
  // Fetch all doctors
  router.get('/doctors', async (req, res) => {
    try {
      const [rows] = await connection.promise().query(
        'SELECT id, name, specialization, contact, availability, price, created_at FROM doctors'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new appointment
  router.post('/appointments', async (req, res) => {
    const { issues, doctorId, date, time, email, patientName } = req.body;

    try {
      // Fetch doctor's information
      const [doctorRows] = await connection.promise().query(
        'SELECT name, specialization, price FROM doctors WHERE id = ?',
        [doctorId]
      );

      if (doctorRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Doctor not found' });
      }

      const doctor = doctorRows[0];

      // Insert the appointment into the database
      const [result] = await connection.promise().query(
        'INSERT INTO appointments (issues, doctor_id, appointment_date, appointment_time, user_email, patient_name) VALUES (?, ?, ?, ?, ?, ?)',
        [JSON.stringify(issues), doctorId, date, time, email, patientName]
      );

      const appointmentId = result.insertId;
      const roomCode = Math.random().toString(36).substring(7).toUpperCase();

      // Update the appointment with the room code
      await connection.promise().query(
        'UPDATE appointments SET room_code = ? WHERE id = ?',
        [roomCode, appointmentId]
      );

      // Add explicit console logs for debugging
      console.log('Telemedicine appointment created successfully, preparing to send email');
      console.log('Attempting to send telemedicine confirmation email to:', email);

      // Send confirmation email
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your Telemedicine Appointment Confirmation',
        html: `
          <h1>Your Telemedicine Appointment is Confirmed!</h1>
          <p><strong>Patient Name:</strong> ${patientName}</p>
          <p><strong>Doctor:</strong> ${doctor.name} (${doctor.specialization})</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Room Code:</strong> ${roomCode}</p>
          <p><strong>Price:</strong> $${doctor.price}</p>
          <br>
          <p>Please use this room code to join your video call at the scheduled time.</p>
          <p>Thank you for choosing our telemedicine service!</p>
        `
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Telemedicine email sent successfully:', info.response);
        res.json({ 
          success: true, 
          roomCode, 
          doctorName: doctor.name, 
          price: doctor.price,
          emailSent: true
        });
      } catch (emailError) {
        console.error('Error sending telemedicine email:', emailError);
        res.json({ 
          success: true, 
          roomCode, 
          doctorName: doctor.name, 
          price: doctor.price,
          emailSent: false,
          emailError: emailError.message
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
};