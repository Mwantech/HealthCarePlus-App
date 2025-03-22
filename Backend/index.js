const express = require('express');
const app = express();
app.use(express.json()); // To parse JSON payload

// Define callback route
app.post('/callback', (req, res) => {
  console.log('Received Callback from M-Pesa:', req.body);
  res.sendStatus(200); // Acknowledge receipt
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
