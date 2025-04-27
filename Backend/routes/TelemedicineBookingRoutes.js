const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// Configure nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Telemedicine transporter verification error:', error);
  } else {
    console.log('Server is ready to take telemedicine messages');
  }
});

// Function to get M-Pesa access token
const getAccessToken = async () => {
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa token:', error.response?.data || error.message);
    return null;
  }
};

// STK Push Function
// STK Push Function
const initiateSTKPush = async (phoneNumber, amount, appointmentId) => {
  const accessToken = await getAccessToken();
  if (!accessToken) return { success: false, error: 'Failed to get access token' };

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const businessShortCode = '174379';
  const passkey = process.env.MPESA_PASS_KEY;
  const password = Buffer.from(businessShortCode + passkey + timestamp).toString('base64');
  
  // Format phone number (ensure it starts with 254)
  const formattedPhone = phoneNumber.startsWith('254') 
    ? phoneNumber 
    : phoneNumber.startsWith('0') 
      ? '254' + phoneNumber.slice(1) 
      : phoneNumber;

  // Ensure amount is a valid integer - M-Pesa requires amount to be an integer
  const parsedAmount = parseInt(amount, 10);
  
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { 
      success: false, 
      error: 'Invalid amount value. Amount must be a positive number.'
    };
  }

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: parsedAmount, // Using the parsed integer value
    PartyA: formattedPhone,
    PartyB: businessShortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.CALLBACK_URL,
    AccountReference: 'TelemedicineApp',
    TransactionDesc: 'Telemedicine Appointment Payment'
  };

  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
      merchantRequestID: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Check STK Push Status
const checkSTKStatus = async (checkoutRequestID) => {
  const accessToken = await getAccessToken();
  if (!accessToken) return { success: false, error: 'Failed to get access token' };

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const businessShortCode = process.env.MPESA_SHORTCODE || '174379';
  const passkey = process.env.MPESA_PASS_KEY;
  const password = Buffer.from(businessShortCode + passkey + timestamp).toString('base64');
  
  try {
    const response = await axios.post(
      `${process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Status response:', response.data);
    return { 
      success: true, 
      data: response.data,
      // Include explicit interpretation of the result codes
      isPaid: response.data.ResultCode === 0 || response.data.ResultCode === '0',
      isCancelled: response.data.ResultCode === 1032 || response.data.ResultCode === '1032',
      resultDescription: response.data.ResultDesc
    };
  } catch (error) {
    console.error('STK Status Query Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Send confirmation email
const sendConfirmationEmail = async (appointmentData, paymentStatus) => {
  const { email, patientName, doctorName, doctorSpecialization, date, time, roomCode, price } = appointmentData;
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your Telemedicine Appointment Confirmation',
    html: `
      <h1>Your Telemedicine Appointment is Confirmed!</h1>
      <p><strong>Patient Name:</strong> ${patientName}</p>
      <p><strong>Doctor:</strong> ${doctorName} (${doctorSpecialization})</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Room Code:</strong> ${roomCode}</p>
      <p><strong>Price:</strong> Ksh${price}</p>
      <p><strong>Payment Status:</strong> ${paymentStatus ? 'Paid' : 'Pending'}</p>
      <br>
      <p>Please use this room code to join your video call at the scheduled time.</p>
      ${!paymentStatus ? '<p><strong>Note:</strong> Please complete your payment to confirm this appointment.</p>' : ''}
      <p>Thank you for choosing our telemedicine service!</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Telemedicine email sent successfully:', info.response);
    return { success: true };
  } catch (emailError) {
    console.error('Error sending telemedicine email:', emailError);
    return { success: false, error: emailError.message };
  }
};

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

  router.post('/appointments', async (req, res) => {
    const { issues, doctorId, date, time, email, patientName, paymentMethod, paymentDetails } = req.body;
  
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
      const roomCode = Math.random().toString(36).substring(7).toUpperCase();
  
      // Insert the appointment into the database with pending payment status
      const [result] = await connection.promise().query(
        'INSERT INTO appointments (issues, doctor_id, appointment_date, appointment_time, user_email, patient_name, room_code, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [JSON.stringify(issues), doctorId, date, time, email, patientName, roomCode, 'pending', paymentMethod]
      );
  
      const appointmentId = result.insertId;
      
      // Handle different payment methods
      if (paymentMethod === 'mpesa') {
        // Initiate M-Pesa STK Push - pass the phone number and the doctor's price
        const stkResponse = await initiateSTKPush(
          paymentDetails,      // This is the phone number
          doctor.price,        // This is the amount to charge
          appointmentId
        );
        
        if (stkResponse.success) {
          // Store checkout request ID in the database
          await connection.promise().query(
            'UPDATE appointments SET checkout_request_id = ?, merchant_request_id = ? WHERE id = ?',
            [stkResponse.checkoutRequestID, stkResponse.merchantRequestID, appointmentId]
          );
          
          // Only send the initial appointment confirmation without payment confirmation
          const appointmentData = {
            email,
            patientName,
            doctorName: doctor.name,
            doctorSpecialization: doctor.specialization,
            date,
            time,
            roomCode,
            price: doctor.price
          };
          
          await sendConfirmationEmail(appointmentData, false);
          
          res.json({ 
            success: true, 
            roomCode, 
            doctorName: doctor.name, 
            price: doctor.price,
            paymentStatus: 'pending',
            checkoutRequestID: stkResponse.checkoutRequestID,
            appointmentId
          });
        } else {
          res.status(500).json({ 
            success: false, 
            error: 'Failed to initiate M-Pesa payment',
            details: stkResponse.error
          });
        }
      } else if (paymentMethod === 'card' || paymentMethod === 'paypal') {
        // For simplicity, we'll mark card and paypal as successful immediately
        // In a real application, you would integrate with the respective payment gateways
        await connection.promise().query(
          'UPDATE appointments SET payment_status = ? WHERE id = ?',
          ['completed', appointmentId]
        );
        
        const appointmentData = {
          email,
          patientName,
          doctorName: doctor.name,
          doctorSpecialization: doctor.specialization,
          date,
          time,
          roomCode,
          price: doctor.price
        };
        
        await sendConfirmationEmail(appointmentData, true);
        
        res.json({ 
          success: true, 
          roomCode, 
          doctorName: doctor.name, 
          price: doctor.price,
          paymentStatus: 'completed',
          appointmentId
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid payment method'
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // M-Pesa callback endpoint
  router.post('/mpesa-callback/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;
    const callbackData = req.body;
    
    console.log('M-Pesa Callback for appointment:', appointmentId);
    console.log('Callback Data:', JSON.stringify(callbackData, null, 2));
    
    try {
      // Check if we have a valid callback structure
      if (!callbackData.Body || !callbackData.Body.stkCallback) {
        console.error('Invalid callback data structure');
        return res.status(200).json({ success: true }); // Still return 200 to Safaricom
      }
      
      const resultCode = callbackData.Body.stkCallback.ResultCode;
      let transactionId = 'N/A';
      let transactionAmount = 0;
      let phoneNumber = 'N/A';
      let transactionDate = null;
      
      // Extract payment details from callback metadata if available
      if (resultCode === 0 && callbackData.Body.stkCallback.CallbackMetadata && 
          callbackData.Body.stkCallback.CallbackMetadata.Item) {
        
        const items = callbackData.Body.stkCallback.CallbackMetadata.Item;
        
        // Extract details
        const amountItem = items.find(item => item.Name === 'Amount');
        const mpesaReceiptNumberItem = items.find(item => item.Name === 'MpesaReceiptNumber');
        const transactionDateItem = items.find(item => item.Name === 'TransactionDate');
        const phoneNumberItem = items.find(item => item.Name === 'PhoneNumber');
        
        if (amountItem) transactionAmount = amountItem.Value;
        if (mpesaReceiptNumberItem) transactionId = mpesaReceiptNumberItem.Value;
        if (phoneNumberItem) phoneNumber = phoneNumberItem.Value;
        if (transactionDateItem) transactionDate = transactionDateItem.Value;
      }
      
      // Update appointment based on result code
      if (resultCode === 0) {
        // Payment successful
        await connection.promise().query(
          `UPDATE appointments 
           SET payment_status = ?, 
               transaction_id = ?, 
               transaction_amount = ?,
               transaction_phone = ?,
               transaction_date = ?,
               payment_details = ?, 
               payment_description = ?
           WHERE id = ?`,
          [
            'completed', 
            transactionId, 
            transactionAmount,
            phoneNumber,
            transactionDate,
            JSON.stringify(callbackData), 
            callbackData.Body.stkCallback.ResultDesc,
            appointmentId
          ]
        );
        
        // Fetch appointment details to send email
        const [appointmentRows] = await connection.promise().query(
          `SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, d.price 
           FROM appointments a 
           JOIN doctors d ON a.doctor_id = d.id 
           WHERE a.id = ?`,
          [appointmentId]
        );
        
        if (appointmentRows.length > 0) {
          const appointment = appointmentRows[0];
          
          const appointmentData = {
            email: appointment.user_email,
            patientName: appointment.patient_name,
            doctorName: appointment.doctor_name,
            doctorSpecialization: appointment.doctor_specialization,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            roomCode: appointment.room_code,
            price: appointment.price
          };
          
          // Send confirmation email with payment confirmation
          await sendConfirmationEmail(appointmentData, true);
        }
      } else {
        // Payment failed
        await connection.promise().query(
          `UPDATE appointments 
           SET payment_status = ?, 
               payment_details = ?, 
               payment_description = ?
           WHERE id = ?`,
          [
            'failed', 
            JSON.stringify(callbackData), 
            callbackData.Body.stkCallback.ResultDesc,
            appointmentId
          ]
        );
      }
      
      // Always return success response to Safaricom
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      // Always return success response to Safaricom even if we had an error
      res.status(200).json({ success: true });
    }
  });

  // Check payment status endpoint
  router.get('/payment-status/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;
    
    try {
      // Get the appointment with transaction details
      const [rows] = await connection.promise().query(
        `SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, 
                d.price, a.checkout_request_id, a.merchant_request_id, a.payment_status
         FROM appointments a 
         JOIN doctors d ON a.doctor_id = d.id 
         WHERE a.id = ?`,
        [appointmentId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Appointment not found' });
      }
      
      const appointment = rows[0];
      
      // If payment is still pending and we have a checkout request ID, check status with M-Pesa
      if (appointment.payment_status === 'pending' && appointment.checkout_request_id) {
        const statusCheck = await checkSTKStatus(appointment.checkout_request_id);
        
        if (statusCheck.success) {
          // Update based on specific result codes
          if (statusCheck.isPaid) {
            // Payment completed successfully
            await connection.promise().query(
              `UPDATE appointments 
               SET payment_status = ?, 
                   payment_details = ?, 
                   payment_description = ?
               WHERE id = ?`,
              ['completed', JSON.stringify(statusCheck.data), statusCheck.resultDescription, appointmentId]
            );
            
            // Send confirmation email with payment confirmation
            const appointmentData = {
              email: appointment.user_email,
              patientName: appointment.patient_name,
              doctorName: appointment.doctor_name,
              doctorSpecialization: appointment.doctor_specialization,
              date: appointment.appointment_date,
              time: appointment.appointment_time,
              roomCode: appointment.room_code,
              price: appointment.price
            };
            
            await sendConfirmationEmail(appointmentData, true);
            
            return res.json({
              success: true,
              paymentStatus: 'completed',
              message: 'Payment completed successfully',
              description: statusCheck.resultDescription
            });
            
          } else if (statusCheck.isCancelled) {
            // Transaction was canceled by user
            await connection.promise().query(
              `UPDATE appointments 
               SET payment_status = ?, 
                   payment_details = ?, 
                   payment_description = ?
               WHERE id = ?`,
              ['failed', JSON.stringify(statusCheck.data), 'Transaction canceled by user', appointmentId]
            );
            
            return res.json({
              success: true,
              paymentStatus: 'failed',
              message: 'Payment was canceled',
              description: 'Transaction canceled by user'
            });
            
          } else {
            // Other failure or still processing
            // Keep as pending or update based on the result description
            if (statusCheck.data.ResultCode !== undefined) {
              await connection.promise().query(
                `UPDATE appointments 
                 SET payment_description = ?
                 WHERE id = ?`,
                [statusCheck.resultDescription, appointmentId]
              );
            }
            
            return res.json({
              success: true,
              paymentStatus: appointment.payment_status,
              message: statusCheck.resultDescription || 'Payment status unchanged',
              checkoutRequestID: appointment.checkout_request_id,
              merchantRequestID: appointment.merchant_request_id
            });
          }
        }
      }
      
      // Return current payment status if we couldn't check or nothing changed
      res.json({
        success: true,
        paymentStatus: appointment.payment_status,
        checkoutRequestID: appointment.checkout_request_id,
        merchantRequestID: appointment.merchant_request_id,
        description: appointment.payment_description || 'No status description available'
      });
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  

  // Get appointment details by id
  router.get('/appointments/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;
    
    try {
      const [rows] = await connection.promise().query(
        'SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, d.price ' +
        'FROM appointments a ' +
        'JOIN doctors d ON a.doctor_id = d.id ' +
        'WHERE a.id = ?',
        [appointmentId]
      );
      
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

  return router;
};