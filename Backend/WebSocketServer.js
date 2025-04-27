// Create a new file: websocketServer.js
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Active rooms with their participants
const rooms = {};

function setupWebSocketServer(server) {
  // Create a WebSocket server without a specific path
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection attempt');
    
    // Parse URL to get room code from path
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/');
    const roomCode = pathSegments[pathSegments.length - 1];
    
    console.log(`WebSocket connection attempt for room: ${roomCode}`);
    
    // Store client info
    ws.id = uuidv4();
    ws.roomCode = null;
    ws.role = null;
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message type: ${data.type} from client ${ws.id}`);
        
        switch(data.type) {
          case 'join':
            handleJoin(ws, data);
            break;
          case 'offer':
            handleOffer(ws, data);
            break;
          case 'answer':
            handleAnswer(ws, data);
            break;
          case 'ice-candidate':
            handleIceCandidate(ws, data);
            break;
          default:
            console.log(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log(`WebSocket connection closed for client ${ws.id}`);
      if (ws.roomCode && rooms[ws.roomCode]) {
        // Remove client from room
        const room = rooms[ws.roomCode];
        if (room.doctor && room.doctor.id === ws.id) {
          room.doctor = null;
        } else if (room.patient && room.patient.id === ws.id) {
          room.patient = null;
        }
        
        // Notify remaining participants
        if (room.doctor) {
          room.doctor.send(JSON.stringify({
            type: 'user-left',
            role: 'patient'
          }));
        }
        if (room.patient) {
          room.patient.send(JSON.stringify({
            type: 'user-left',
            role: 'doctor'
          }));
        }
        
        // Remove empty rooms
        if (!room.doctor && !room.patient) {
          delete rooms[ws.roomCode];
          console.log(`Room ${ws.roomCode} removed (empty)`);
        }
        
        console.log(`User ${ws.id} (${ws.role}) left room ${ws.roomCode}`);
      }
    });
  });
  
  // Handle client joining a room
  function handleJoin(ws, data) {
    const { roomCode, role } = data;
    
    // Validate room code
    if (!roomCode) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid room code'
      }));
      return;
    }
    
    // Validate role
    if (role !== 'doctor' && role !== 'patient') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid role. Must be either "doctor" or "patient"'
      }));
      return;
    }
    
    // Create room if it doesn't exist
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        doctor: null,
        patient: null,
        created: new Date()
      };
      console.log(`Room ${roomCode} created`);
    }
    
    const room = rooms[roomCode];
    
    // Check if role is already taken
    if ((role === 'doctor' && room.doctor) || (role === 'patient' && room.patient)) {
      ws.send(JSON.stringify({
        type: 'room-full',
        message: `The ${role} has already joined this room`
      }));
      return;
    }
    
    // Add client to room
    ws.roomCode = roomCode;
    ws.role = role;
    
    if (role === 'doctor') {
      room.doctor = ws;
    } else {
      room.patient = ws;
    }
    
    console.log(`${role} joined room ${roomCode}`);
    
    // Notify client of successful join
    ws.send(JSON.stringify({
      type: 'joined',
      roomCode,
      role
    }));
    
    // Notify other participant
    const otherParticipant = role === 'doctor' ? room.patient : room.doctor;
    if (otherParticipant) {
      otherParticipant.send(JSON.stringify({
        type: 'user-joined',
        role
      }));
      
      ws.send(JSON.stringify({
        type: 'user-joined',
        role: role === 'doctor' ? 'patient' : 'doctor'
      }));
    }
  }
  
  // Handle WebRTC offer
  function handleOffer(ws, data) {
    const { roomCode, role, sdp } = data;
    
    if (!rooms[roomCode]) {
      ws.send(JSON.stringify({
        type: 'room-not-found'
      }));
      return;
    }
    
    const room = rooms[roomCode];
    const recipient = role === 'doctor' ? room.patient : room.doctor;
    
    if (recipient && recipient.readyState === WebSocket.OPEN) {
      recipient.send(JSON.stringify({
        type: 'offer',
        sdp,
        role
      }));
    }
  }
  
  // Handle WebRTC answer
  function handleAnswer(ws, data) {
    const { roomCode, role, sdp } = data;
    
    if (!rooms[roomCode]) return;
    
    const room = rooms[roomCode];
    const recipient = role === 'doctor' ? room.patient : room.doctor;
    
    if (recipient && recipient.readyState === WebSocket.OPEN) {
      recipient.send(JSON.stringify({
        type: 'answer',
        sdp,
        role
      }));
    }
  }
  
  // Handle ICE candidate
  function handleIceCandidate(ws, data) {
    const { roomCode, role, candidate } = data;
    
    if (!rooms[roomCode]) return;
    
    const room = rooms[roomCode];
    const recipient = role === 'doctor' ? room.patient : room.doctor;
    
    if (recipient && recipient.readyState === WebSocket.OPEN) {
      recipient.send(JSON.stringify({
        type: 'ice-candidate',
        candidate,
        role
      }));
    }
  }
  
  // Cleanup old rooms periodically (every 12 hours)
  setInterval(() => {
    const now = new Date();
    Object.keys(rooms).forEach(roomCode => {
      const room = rooms[roomCode];
      // Remove rooms older than 24 hours
      if ((now - room.created) > 24 * 60 * 60 * 1000) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} removed (expired)`);
      }
    });
  }, 12 * 60 * 60 * 1000);

  console.log('WebSocket server for video calls is running');
  return wss;
}

module.exports = setupWebSocketServer;