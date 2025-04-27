require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws'); // Add this import

const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authroutes');
const adminRoute = require('./routes/adminRoute');
const orderRoutes = require('./routes/orderRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const healthIssueRoutes = require('./routes/healthIssueRoutes');
const testKitRoutes = require('./routes/testKitRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const LoginRoutes = require('./routes/loginRoutes');
const UsersLoginRoutes = require('./routes/UsersLoginRoutes');
const SchedulingRoutes = require('./routes/SchedulingRoutes');
const TelemedicineBookingRoutes = require('./routes/TelemedicineBookingRoutes');
const VideoRoomRoutes = require('./routes/VideoRoomRoutes');

// Import WebSocket server setup function - update the path to where you saved the file
const setupWebSocketServer = require('./WebSocketServer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8081", "http://localhost:5173", "http://192.168.242.185:8081"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const port = process.env.PORT || 3001;

// Configure CORS for both HTTP and WebSocket
app.use(cors({
  origin: ["http://localhost:8081", "http://localhost:5173", "http://192.168.242.185:8081"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Create MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// Use routes
app.use('/api/auth', authRoutes(connection));
app.use('/api/admin', authMiddleware, adminRoute(connection));
app.use('/api', orderRoutes(connection, io));
app.use('/api', doctorRoutes(connection));
app.use('/api', healthIssueRoutes(connection));
app.use('/api', testKitRoutes(connection));
app.use('/api', appointmentRoutes(connection));
app.use('/api', LoginRoutes(connection));
app.use('/api', TelemedicineBookingRoutes(connection));
app.use('/api', UsersLoginRoutes(connection));
app.use('/api/scheduling', SchedulingRoutes(connection));
app.use('/api/video', VideoRoomRoutes(connection));

// Initialize the WebSocket server for video calls
setupWebSocketServer(server);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Debug route - log all incoming requests
app.use((req, res, next) => {
  console.log(`[DEBUG] Received request: ${req.method} ${req.originalUrl}`);
  next();
});

// Add a catch-all route to detect misrouted requests
app.get('*', (req, res) => {
  console.log(`[404] No route found for: ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});