const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
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
    console.log('TestKit transporter verification error:', error);
  } else {
    console.log('Server is ready to take test kit order messages');
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
const initiateSTKPush = async (phoneNumber, amount, orderNumber) => {
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
    CallBackURL: `${process.env.CALLBACK_URL}/api/testkits/mpesa-callback/${orderNumber}`,
    AccountReference: 'TestKitOrder',
    TransactionDesc: 'Medical Test Kit Order Payment'
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
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const businessShortCode = '174379';
  const passkey = process.env.MPESA_PASS_KEY;
  const password = Buffer.from(businessShortCode + passkey + timestamp).toString('base64');
  
  const accessToken = await getAccessToken();
  if (!accessToken) return { success: false, error: 'Failed to get access token' };

  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
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

    return { success: true, data: response.data };
  } catch (error) {
    console.error('STK Status Query Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Send confirmation email
const sendOrderConfirmationEmail = async (orderData) => {
  const { email, orderNumber, shippingAddress, phone, selectedKits, paymentMethod, totalAmount } = orderData;
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: `Your Medical Test Kit Order #${orderNumber} Confirmation`,
    html: `
      <h1>Your Test Kit Order is Confirmed!</h1>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Shipping Address:</strong> ${shippingAddress}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <h2>Order Details:</h2>
      <ul>
        ${selectedKits.map(kit => `<li>${kit.name} - Quantity: ${kit.quantity} - Price: $${Number(kit.price).toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Total Amount:</strong> $${Number(totalAmount).toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p><strong>Payment Status:</strong> ${paymentMethod === 'Mpesa' ? 'Pending' : 'Completed'}</p>
      <p>Thank you for your order! Your test kit(s) will be shipped within 24 hours.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Test kit order email sent successfully:', info.response);
    return { success: true };
  } catch (emailError) {
    console.error('Error sending test kit order email:', emailError);
    return { success: false, error: emailError.message };
  }
};

module.exports = (connection, io) => {
  // Convert connection to use promises
  const promiseConnection = connection.promise();

  // Get all test kits
  router.get('/testkits', async (req, res) => {
    try {
      const [results] = await promiseConnection.query('SELECT * FROM test_kits');
      res.json(results);
    } catch (error) {
      console.error('Error fetching test kits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new order
  router.post('/orders', async (req, res) => {
    const { selectedKits, shippingInfo, paymentMethod, paymentDetails, orderNumber } = req.body;
    
    try {
      // Calculate total amount
      const totalAmount = selectedKits.reduce((sum, kit) => sum + kit.price * kit.quantity, 0);
      
      // Insert the order with pending status if payment method is Mpesa
      const orderStatus = paymentMethod === 'Mpesa' ? 'pending' : 'completed';
      
      const orderQuery = `
        INSERT INTO orders (
          order_number, shipping_address, phone, email, payment_method, 
          payment_details, status, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const orderItemQuery = 'INSERT INTO order_items (order_id, test_kit_id, quantity, price) VALUES ?';
      
      // Begin transaction
      await promiseConnection.beginTransaction();

      try {
        // Insert order
        const [orderResult] = await promiseConnection.query(
          orderQuery, 
          [
            orderNumber, 
            shippingInfo.address, 
            shippingInfo.phone, 
            shippingInfo.email, 
            paymentMethod, 
            JSON.stringify(paymentDetails), 
            orderStatus,
            totalAmount
          ]
        );

        const orderId = orderResult.insertId;
        const orderItems = selectedKits.map(kit => [
          orderId, 
          kit.id, 
          kit.quantity, 
          kit.price
        ]);

        // Insert order items
        await promiseConnection.query(orderItemQuery, [orderItems]);

        // If payment method is Mpesa, initiate STK push
        let stkResponse = null;
        let checkoutRequestID = null;
        
        if (paymentMethod === 'Mpesa') {
          stkResponse = await initiateSTKPush(
            paymentDetails.mpesaNumber,
            totalAmount,
            orderNumber
          );
          
          if (!stkResponse.success) {
            throw new Error(`M-Pesa STK push failed: ${JSON.stringify(stkResponse.error)}`);
          }
          
          checkoutRequestID = stkResponse.checkoutRequestID;
          
          // Update order with checkout request ID
          await promiseConnection.query(
            'UPDATE orders SET checkout_request_id = ?, merchant_request_id = ? WHERE id = ?',
            [stkResponse.checkoutRequestID, stkResponse.merchantRequestID, orderId]
          );
        }

        // Commit the transaction
        await promiseConnection.commit();
        
        // Send confirmation email
        const orderData = {
          email: shippingInfo.email,
          orderNumber,
          shippingAddress: shippingInfo.address,
          phone: shippingInfo.phone,
          selectedKits,
          paymentMethod,
          totalAmount
        };
        
        await sendOrderConfirmationEmail(orderData);
        
        // Notify all connected clients
        io.emit('newOrder', { 
          orderId, 
          orderNumber, 
          paymentMethod, 
          status: orderStatus 
        });
        
        res.json({ 
          success: true,
          orderId,
          orderNumber,
          status: orderStatus,
          checkoutRequestID: stkResponse?.checkoutRequestID,
          merchantRequestID: stkResponse?.merchantRequestID,
          message: 'Order placed successfully'
        });
      } catch (error) {
        // If anything fails, roll back the transaction
        await promiseConnection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, error: 'Internal server error: ' + error.message });
    }
  });

  // M-Pesa callback endpoint
  router.post('/mpesa-callback/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    const callbackData = req.body;
    
    console.log('M-Pesa Callback for order:', orderNumber);
    console.log('Callback Data:', JSON.stringify(callbackData, null, 2));
    
    try {
      // Find the order by order number
      const [orderResults] = await promiseConnection.query(
        'SELECT * FROM orders WHERE order_number = ?',
        [orderNumber]
      );
      
      if (orderResults.length === 0) {
        console.error('Order not found:', orderNumber);
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      
      const order = orderResults[0];
      
      // Check if it's a successful transaction
      if (callbackData.Body.stkCallback.ResultCode === 0) {
        // Payment successful
        await promiseConnection.query(
          'UPDATE orders SET status = ?, transaction_id = ?, payment_details = ? WHERE id = ?',
          [
            'completed', 
            callbackData.Body.stkCallback.CallbackMetadata?.Item?.[1]?.Value || 'N/A',
            JSON.stringify(callbackData), 
            order.id
          ]
        );
        
        // Notify all connected clients
        io.emit('orderUpdated', { 
          orderId: order.id,
          orderNumber,
          status: 'completed'
        });
        
        res.status(200).json({ success: true });
      } else {
        // Payment failed
        await promiseConnection.query(
          'UPDATE orders SET status = ?, payment_details = ? WHERE id = ?',
          ['failed', JSON.stringify(callbackData), order.id]
        );
        
        // Notify all connected clients
        io.emit('orderUpdated', { 
          orderId: order.id,
          orderNumber,
          status: 'failed'
        });
        
        res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Check payment status endpoint
  router.get('/orders/payment-status/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    
    try {
      const [orderResults] = await promiseConnection.query(
        'SELECT id, status, checkout_request_id, merchant_request_id FROM orders WHERE order_number = ?',
        [orderNumber]
      );
      
      if (orderResults.length === 0) {
        console.error('Order not found:', orderNumber);
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      
      const order = orderResults[0];
      
      // If payment is still pending and we have a checkout request ID, check status with M-Pesa
      if (order.status === 'pending' && order.checkout_request_id) {
        const statusCheck = await checkSTKStatus(order.checkout_request_id);
        
        if (statusCheck.success && statusCheck.data.ResultCode === 0) {
          // Payment completed successfully according to status check
          await promiseConnection.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['completed', order.id]
          );
          
          // Notify all connected clients
          io.emit('orderUpdated', { 
            orderId: order.id,
            orderNumber,
            status: 'completed'
          });
          
          return res.json({
            success: true,
            paymentStatus: 'completed',
            message: 'Payment completed successfully'
          });
        } else {
          // Return current payment status
          return res.json({
            success: true,
            paymentStatus: order.status,
            checkoutRequestID: order.checkout_request_id,
            merchantRequestID: order.merchant_request_id
          });
        }
      } else {
        // Return current payment status
        return res.json({
          success: true,
          paymentStatus: order.status,
          checkoutRequestID: order.checkout_request_id,
          merchantRequestID: order.merchant_request_id
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });


  // Get all orders
  router.get('/orders', (req, res) => {
    const query = `
      SELECT o.id, o.order_number, o.shipping_address, o.phone, o.email, o.payment_method, o.created_at, o.status,
             GROUP_CONCAT(CONCAT(tk.name, ' (', oi.quantity, ')') SEPARATOR ', ') AS test_kits
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN test_kits tk ON oi.test_kit_id = tk.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ error: 'An error occurred while fetching orders' });
      }
      res.json(results);
    });
  });

  // Get all orders for a user (by email)
  router.get('/user-orders/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
      const query = `
        SELECT o.id, o.order_number, o.shipping_address, o.phone, o.email, 
               o.payment_method, o.status, o.created_at, o.total_amount
        FROM orders o
        WHERE o.email = ?
        ORDER BY o.created_at DESC
      `;
      
      const [results] = await promiseConnection.query(query, [email]);
      res.json({ success: true, orders: results });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Get order details by order number
  router.get('/order-details/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    
    try {
      const orderQuery = `
        SELECT o.id, o.order_number, o.shipping_address, o.phone, o.email, 
               o.payment_method, o.status, o.created_at, o.total_amount
        FROM orders o
        WHERE o.order_number = ?
      `;
      
      const [orderResults] = await promiseConnection.query(orderQuery, [orderNumber]);
      
      if (orderResults.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      
      const order = orderResults[0];
      
      const itemsQuery = `
        SELECT oi.id, oi.test_kit_id, oi.quantity, oi.price,
               tk.name, tk.description
        FROM order_items oi
        JOIN test_kits tk ON oi.test_kit_id = tk.id
        WHERE oi.order_id = ?
      `;
      
      const [itemResults] = await promiseConnection.query(itemsQuery, [order.id]);
      
      res.json({
        success: true,
        order: {
          ...order,
          items: itemResults
        }
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
};


// Verify payment status by transaction code
router.post('/verify-payment', async (req, res) => {
  const { orderNumber, transactionCode } = req.body;
  
  if (!orderNumber || !transactionCode) {
    return res.status(400).json({ 
      success: false, 
      error: 'Order number and transaction code are required' 
    });
  }
  
  try {
    // First check if the transaction code already exists in any order
    const [existingTransaction] = await promiseConnection.query(
      'SELECT id FROM orders WHERE transaction_id = ? AND order_number != ?',
      [transactionCode, orderNumber]
    );
    
    if (existingTransaction.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'This transaction code has already been used' 
      });
    }
    
    // Get the order
    const [orderResults] = await promiseConnection.query(
      'SELECT id, status FROM orders WHERE order_number = ?',
      [orderNumber]
    );
    
    if (orderResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    const order = orderResults[0];
    
    // Update the order with the transaction code and mark as completed
    await promiseConnection.query(
      'UPDATE orders SET status = ?, transaction_id = ?, updated_at = NOW() WHERE id = ?',
      ['completed', transactionCode, order.id]
    );
    
    // Notify connected clients
    io.emit('orderUpdated', { 
      orderId: order.id,
      orderNumber,
      status: 'completed'
    });
    
    return res.json({
      success: true,
      paymentStatus: 'completed',
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});