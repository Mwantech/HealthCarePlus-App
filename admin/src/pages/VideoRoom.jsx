import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './VideoRoom.module.css';

const BASE_URL='http://localhost:3001'; // Replace with your actual base URL

const DoctorVideoRoom = ({ doctorId, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [patientOnline, setPatientOnline] = useState(false);
  
  // WebRTC references
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webSocketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // Get the room code from URL parameters
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Fetch appointment details for the room
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/video/appointments/room/${roomCode}`);
        
        if (response.data.success) {
          setAppointmentInfo({
            patientName: response.data.appointment.user_name || 'Patient',
            patientEmail: response.data.appointment.user_email,
            date: response.data.appointment.appointment_date,
            time: response.data.appointment.appointment_time,
            issues: JSON.parse(response.data.appointment.issues || '[]')
          });
          
          // Initialize WebRTC after fetching appointment details
          initializeWebRTC();
        } else {
          setError('Invalid room code or appointment not found');
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointmentDetails();
    
    // Cleanup function
    return () => {
      endCall(false); // Don't navigate on cleanup
    };
  }, [roomCode]);
  
  const initializeWebRTC = async () => {
    try {
      // Request access to media devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      
      // Set the local video element's srcObject to the local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Connect to signaling server
      connectToSignalingServer();
      
      setConnectionStatus('Waiting for patient to join...');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Could not access camera or microphone. Please check permissions.');
    }
  };
  
  const connectToSignalingServer = () => {
    // Replace with your actual WebSocket URL
    const wsUrl = `${BASE_URL.replace('http', 'ws')}/ws/video/${roomCode}`;
    
    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws;
    
    ws.onopen = () => {
      console.log('Connected to signaling server');
      ws.send(JSON.stringify({
        type: 'join',
        roomCode,
        role: 'doctor'
      }));
    };
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'joined':
          console.log('Successfully joined room as doctor');
          break;
          
        case 'user-joined':
          console.log('Patient joined the call');
          setConnectionStatus('Patient joined. Establishing connection...');
          setPatientOnline(true);
          // Create and initialize peer connection
          initializePeerConnection();
          // Create offer
          createAndSendOffer();
          break;
          
        case 'user-left':
          console.log('Patient left the call');
          setConnectionStatus('Patient disconnected');
          setPatientOnline(false);
          // Close peer connection
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          // Clear remote video
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          break;
          
        case 'offer':
          console.log('Received offer from patient');
          // This shouldn't happen for doctor, but handle it anyway
          handleOffer(data);
          break;
          
        case 'answer':
          console.log('Received answer from patient');
          handleAnswer(data);
          break;
          
        case 'ice-candidate':
          console.log('Received ICE candidate from patient');
          handleIceCandidate(data);
          break;
          
        case 'error':
          console.error('Error from signaling server:', data.message);
          setError(data.message);
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error with signaling server');
    };
    
    ws.onclose = () => {
      console.log('Disconnected from signaling server');
      setConnectionStatus('Disconnected');
    };
  };
  
  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;
    
    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    
    // Handle incoming stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };
    
    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomCode,
          role: 'doctor'
        }));
      }
    };
    
    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('Connected to patient');
      } else if (pc.iceConnectionState === 'disconnected' || 
                 pc.iceConnectionState === 'failed' || 
                 pc.iceConnectionState === 'closed') {
        setConnectionStatus('Connection lost');
      }
    };
  };
  
  const createAndSendOffer = async () => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) return;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      webSocketRef.current.send(JSON.stringify({
        type: 'offer',
        sdp: pc.localDescription,
        roomCode,
        role: 'doctor'
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
      setError('Failed to establish connection with patient');
    }
  };
  
  const handleOffer = async (data) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'answer',
          sdp: pc.localDescription,
          roomCode,
          role: 'doctor'
        }));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Error establishing connection');
    }
  };
  
  const handleAnswer = async (data) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };
  
  const handleIceCandidate = async (data) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc || !data.candidate) return;
      
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };
  
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  const endCall = (shouldNavigate = true) => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Close WebSocket
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    
    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Navigate back to doctor's page
    if (shouldNavigate) {
      const effectiveDoctorId = doctorId || localStorage.getItem('doctorId');
      if (effectiveDoctorId) {
        navigate(`/doctor/${effectiveDoctorId}`);
      } else {
        navigate('/doctor');
      }
    }
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner animation="border" variant="primary" />
        <span className={styles.loadingText}>Loading appointment details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => {
            const effectiveDoctorId = doctorId || localStorage.getItem('doctorId');
            navigate(`/doctor/${effectiveDoctorId}`);
          }}>
            Return to Appointments
          </Button>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className={`container-fluid ${styles.container}`}>
      <div className="row">
        <div className="col-md-9">
          <div className={styles.videoContainer}>
            {/* Main video (Patient) */}
            <div className={styles.mainVideo}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className={styles.remoteVideo}
              />
              
              {!patientOnline && (
                <div className={styles.waitingOverlay}>
                  <div className={styles.waitingText}>
                    <h3>Waiting for patient to join</h3>
                    <p className="mb-0">Room Code: <strong className={styles.roomCode}>{roomCode}</strong></p>
                    <p className={styles.roomCodeHint}>Share this code with your patient if needed</p>
                  </div>
                </div>
              )}
              
              <div className={styles.statusBadge}>
                <Badge bg={patientOnline ? "success" : "secondary"} className={styles.statusBadgeInner}>
                  {connectionStatus}
                </Badge>
              </div>
              
              {/* Self view (Doctor) */}
              <div className={styles.selfViewContainer}>
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className={styles.selfVideo}
                />
                {!isVideoEnabled && (
                  <div className={styles.videoOffOverlay}>
                    Camera Off
                  </div>
                )}
              </div>
            </div>
            
            {/* Call controls */}
            <div className={styles.controlsContainer}>
              <div className={styles.controlsPanel}>
                <Button 
                  variant={isMuted ? "light" : "primary"} 
                  className={styles.controlButton}
                  onClick={toggleMute}
                >
                  {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                </Button>
                
                <Button 
                  variant={isVideoEnabled ? "primary" : "light"} 
                  className={styles.controlButton}
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
                </Button>
                
                <Button 
                  variant="danger" 
                  className={styles.controlButton}
                  onClick={() => endCall(true)}
                >
                  <FaPhoneSlash size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Patient information sidebar */}
        <div className="col-md-3">
          <Card className={styles.patientCard}>
            <Card.Header as="h5" className={styles.patientCardHeader}>
              Patient Information
            </Card.Header>
            <Card.Body>
              {appointmentInfo && (
                <>
                  <h4>{appointmentInfo.patientName}</h4>
                  <p className="text-muted">{appointmentInfo.patientEmail}</p>
                  
                  <hr />
                  
                  <h6>Appointment Details</h6>
                  <p>
                    <strong>Date:</strong> {appointmentInfo.date}<br />
                    <strong>Time:</strong> {appointmentInfo.time}
                  </p>
                  
                  <hr />
                  
                  {appointmentInfo.issues && appointmentInfo.issues.length > 0 && (
                    <>
                      <h6>Patient's Reported Issues:</h6>
                      <ul className={styles.patientIssuesList}>
                        {appointmentInfo.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  <hr />
                  
                  <div className={styles.buttonGrid}>
                    <Button 
                      variant="outline-primary"
                      onClick={() => window.open(`/doctor/patient-history/${appointmentInfo.patientEmail}`, '_blank')}
                    >
                      View Patient History
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
          
          <Card className={styles.notesCard}>
            <Card.Header as="h5" className={styles.sessionNotesHeader}>
              Session Notes
            </Card.Header>
            <Card.Body>
              <textarea 
                className={`form-control ${styles.notesTextarea}`}
                rows="8" 
                placeholder="Take notes during the consultation..."
              />
              <div className={styles.buttonGrid}>
                <Button variant="success">Save Notes</Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorVideoRoom;