import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { BASE_URL } from '../api/api';
import { webrtcHtml } from './WebRTCHtml';
import { useAuth } from '../context/AuthContext'; // Import the auth context

const VideoRoom = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const webViewRef = useRef(null);
  
  // Get user context (optional if you want to use the auth context)
  const { user } = useAuth();
  
  useEffect(() => {
    // Test the API connection on component mount
    const testApiConnection = async () => {
      try {
        console.log(`Testing API connection to: ${BASE_URL}/video/test`);
        const response = await axios.get(`${BASE_URL}/video/test`);
        console.log('API connection test result:', response.data);
      } catch (error) {
        console.error('API connection test failed:', error.message);
      }
    };
    
    testApiConnection();
  }, []);
  
  const handleJoinCall = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a valid room code');
      return;
    }
    
    setError('');
    setIsJoining(true);
    
    try {
      console.log(`Attempting to join room with code: ${roomCode}`);
      console.log(`API URL: ${BASE_URL}/video/appointments/room/${roomCode}`);
      
      // Fetch appointment details for the room
      const response = await axios.get(`${BASE_URL}/video/appointments/room/${roomCode}`);
      console.log('Room API response:', response.data);
      
      if (response.data.success) {
        // Skip user verification for now - we'll allow anyone to join if they have the room code
        // Later we can add proper verification by checking if the email or id matches

        // Check payment status
        // For testing - allowing any payment status to join
        // if (response.data.appointment.payment_status !== 'completed') {
        //   console.log('Payment status check failed:', response.data.appointment.payment_status);
        //   setError("Please complete payment before joining this appointment");
        //   setIsJoining(false);
        //   return;
        // }

        // Temporary bypass for testing - allow any payment status
        console.log('Payment status (bypassed for testing):', response.data.appointment.payment_status);
        
        setAppointmentInfo({
          doctorName: response.data.appointment.doctor_name,
          specialization: response.data.appointment.doctor_specialization,
          date: response.data.appointment.appointment_date,
          time: response.data.appointment.appointment_time,
          issues: JSON.parse(response.data.appointment.issues || '[]')
        });
        
        // Send message to WebView to initiate WebRTC connection
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'join-room',
            roomCode: roomCode,
            role: 'patient'
          }));
        }
        
        setInCall(true);
      } else {
        setError('Invalid room code or appointment not found');
      }
    } catch (error) {
      console.error('Error joining call:', error.response?.data || error.message);
      // More descriptive error message
      setError(`Failed to join call: ${error.response?.status === 404 ? 
        'Room not found. Please check the room code.' : 
        error.message}`);
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleEndCall = () => {
    // Send message to WebView to end call
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'end-call'
      }));
    }
    
    setInCall(false);
    setAppointmentInfo(null);
  };
  
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', data);
      
      switch (data.type) {
        case 'connection-status':
          setConnectionStatus(data.status);
          break;
        case 'error':
          setError(data.message);
          break;
        case 'call-ended':
          setInCall(false);
          setAppointmentInfo(null);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };
  
  const handleToggleMute = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'toggle-mute'
      }));
    }
  };
  
  const handleToggleVideo = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'toggle-video'
      }));
    }
  };

  const renderCallUI = () => {
    return (
      <View style={styles.callContainer}>
        {/* Doctor info */}
        {appointmentInfo && (
          <View style={styles.doctorInfoContainer}>
            <Text style={styles.doctorInfoTitle}>Doctor Information</Text>
            <Text style={styles.doctorInfoName}>{appointmentInfo.doctorName}</Text>
            <Text style={styles.doctorInfoSpecialization}>{appointmentInfo.specialization}</Text>
            <Text style={styles.appointmentDateTime}>
              {appointmentInfo.date} at {appointmentInfo.time}
            </Text>
            
            {appointmentInfo.issues && appointmentInfo.issues.length > 0 && (
              <View>
                <Text style={styles.issuesTitle}>Your Reported Issues:</Text>
                {appointmentInfo.issues.map((issue, index) => (
                  <Text key={index} style={styles.issueItem}>• {issue}</Text>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Connection status */}
        {connectionStatus && (
          <Text style={styles.connectionStatus}>{connectionStatus}</Text>
        )}
        
        {/* WebView for WebRTC */}
        <View style={styles.videoContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: webrtcHtml }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            onMessage={handleWebViewMessage}
          />
        </View>
        
        {/* Call controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleToggleMute}
          >
            <Text style={styles.controlButtonText}>
              Toggle Mute
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleToggleVideo}
          >
            <Text style={styles.controlButtonText}>
              Toggle Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]} 
            onPress={handleEndCall}
          >
            <Text style={styles.endCallButtonText}>End Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Patient Video Consultation</Text>
      
      {!inCall ? (
        <View style={styles.joinContainer}>
          <Text style={styles.instructions}>
            Enter the room code provided in your appointment confirmation email
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter Room Code"
            placeholderTextColor="#999"
            value={roomCode}
            onChangeText={setRoomCode}
          />
          
          <TouchableOpacity 
            style={styles.joinCallButton}
            onPress={handleJoinCall}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinCallButtonText}>Join Call</Text>
            )}
          </TouchableOpacity>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <Text style={styles.helpText}>
            Please ensure you are in a quiet space with good internet connection before joining the call.
          </Text>
        </View>
      ) : (
        renderCallUI()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff69b4',
    textAlign: 'center',
    marginVertical: 16,
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  instructions: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ff69b4',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: '#000',
  },
  joinCallButton: {
    backgroundColor: '#ff69b4',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  joinCallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  callContainer: {
    flex: 1,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  doctorInfoContainer: {
    backgroundColor: '#ffe4f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  doctorInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff69b4',
    marginBottom: 8,
  },
  doctorInfoName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  doctorInfoSpecialization: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDateTime: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  issueItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginBottom: 2,
  },
  connectionStatus: {
    textAlign: 'center',
    color: '#ff69b4',
    fontSize: 14,
    marginBottom: 16,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff69b4',
  },
  controlButtonText: {
    color: '#ff69b4',
    fontWeight: '500',
  },
  endCallButton: {
    backgroundColor: '#ff69b4',
    borderColor: '#ff69b4',
  },
  endCallButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default VideoRoom;