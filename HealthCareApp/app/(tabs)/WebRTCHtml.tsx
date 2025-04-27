export const webrtcHtml = 
'<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' +
'  <style>' +
'    * {' +
'      margin: 0;' +
'      padding: 0;' +
'      box-sizing: border-box;' +
'    }' +
'    body, html {' +
'      width: 100%;' +
'      height: 100%;' +
'      overflow: hidden;' +
'      background-color: #000;' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;' +
'    }' +
'    .container {' +
'      position: relative;' +
'      width: 100%;' +
'      height: 100%;' +
'    }' +
'    #remoteVideo {' +
'      width: 100%;' +
'      height: 100%;' +
'      object-fit: cover;' +
'      background-color: #222;' +
'    }' +
'    #localVideo {' +
'      position: absolute;' +
'      top: 16px;' +
'      right: 16px;' +
'      width: 120px;' +
'      height: 160px;' +
'      object-fit: cover;' +
'      border-radius: 8px;' +
'      border: 2px solid #ff69b4;' +
'      background-color: #333;' +
'    }' +
'    .status {' +
'      position: absolute;' +
'      top: 10px;' +
'      left: 10px;' +
'      color: #ff69b4;' +
'      background-color: rgba(0, 0, 0, 0.5);' +
'      padding: 5px 10px;' +
'      border-radius: 8px;' +
'      font-size: 14px;' +
'    }' +
'    .video-disabled-indicator {' +
'      position: absolute;' +
'      top: 50%;' +
'      left: 50%;' +
'      transform: translate(-50%, -50%);' +
'      color: white;' +
'      background-color: rgba(0, 0, 0, 0.7);' +
'      padding: 10px 20px;' +
'      border-radius: 8px;' +
'      font-size: 14px;' +
'      display: none;' +
'    }' +
'    .hidden {' +
'      display: none;' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="container">' +
'    <video id="remoteVideo" autoplay playsinline></video>' +
'    <video id="localVideo" autoplay playsinline muted></video>' +
'    <div id="status" class="status"></div>' +
'    <div id="videoDisabled" class="video-disabled-indicator">Camera Off</div>' +
'  </div>' +
'' +
'  <script>' +
'    // Elements' +
'    const remoteVideo = document.getElementById("remoteVideo");' +
'    const localVideo = document.getElementById("localVideo");' +
'    const statusElement = document.getElementById("status");' +
'    const videoDisabledIndicator = document.getElementById("videoDisabled");' +
'    ' +
'    // WebRTC variables' +
'    let peerConnection;' +
'    let localStream;' +
'    let remoteStream;' +
'    let socket;' +
'    let roomCode = "";' +
'    let userRole = "";' +
'    let isMuted = false;' +
'    let isVideoEnabled = true;' +
'    ' +
'    // Set status message' +
'    function setStatus(message) {' +
'      statusElement.textContent = message;' +
'      sendToReactNative({' +
'        type: "connection-status",' +
'        status: message' +
'      });' +
'    }' +
'    ' +
'    // Send message to React Native' +
'    function sendToReactNative(data) {' +
'      window.ReactNativeWebView.postMessage(JSON.stringify(data));' +
'    }' +
'    ' +
'    // Setup media stream' +
'    async function setupMediaStream() {' +
'      try {' +
'        const constraints = {' +
'          audio: true,' +
'          video: {' +
'            width: { ideal: 1280 },' +
'            height: { ideal: 720 },' +
'            facingMode: "user"' +
'          }' +
'        };' +
'        ' +
'        const stream = await navigator.mediaDevices.getUserMedia(constraints);' +
'        localStream = stream;' +
'        localVideo.srcObject = stream;' +
'        return true;' +
'      } catch (error) {' +
'        console.error("Error accessing media devices:", error);' +
'        setStatus("Could not access camera or microphone");' +
'        sendToReactNative({' +
'          type: "error",' +
'          message: "Could not access camera or microphone. Please check permissions."' +
'        });' +
'        return false;' +
'      }' +
'    }' +
'    ' +
'    // Initialize WebRTC peer connection' +
'    function initializePeerConnection() {' +
'      const configuration = {' +
'        iceServers: [' +
'          { urls: "stun:stun.l.google.com:19302" },' +
'          { urls: "stun:stun1.l.google.com:19302" },' +
'          { urls: "stun:stun2.l.google.com:19302" }' +
'        ]' +
'      };' +
'      ' +
'      const pc = new RTCPeerConnection(configuration);' +
'      peerConnection = pc;' +
'      ' +
'      // Add local tracks to the connection' +
'      if (localStream) {' +
'        localStream.getTracks().forEach(track => {' +
'          pc.addTrack(track, localStream);' +
'        });' +
'      }' +
'      ' +
'      // Handle incoming stream' +
'      pc.ontrack = (event) => {' +
'        if (event.streams && event.streams[0]) {' +
'          remoteStream = event.streams[0];' +
'          remoteVideo.srcObject = remoteStream;' +
'          ' +
'          // Listen for remote track being disabled' +
'          event.streams[0].getVideoTracks().forEach(track => {' +
'            track.onmute = () => {' +
'              videoDisabledIndicator.style.display = "block";' +
'            };' +
'            track.onunmute = () => {' +
'              videoDisabledIndicator.style.display = "none";' +
'            };' +
'          });' +
'        }' +
'      };' +
'      ' +
'      // ICE candidate handling' +
'      pc.onicecandidate = (event) => {' +
'        if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {' +
'          socket.send(JSON.stringify({' +
'            type: "ice-candidate",' +
'            candidate: event.candidate,' +
'            roomCode,' +
'            role: userRole' +
'          }));' +
'        }' +
'      };' +
'      ' +
'      // Connection state monitoring' +
'      pc.oniceconnectionstatechange = () => {' +
'        setStatus("Connection state: " + pc.iceConnectionState);' +
'        ' +
'        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {' +
'          setStatus("Connected to " + (userRole === "doctor" ? "patient" : "doctor"));' +
'        } else if (pc.iceConnectionState === "disconnected" || ' +
'                   pc.iceConnectionState === "failed" || ' +
'                   pc.iceConnectionState === "closed") {' +
'          setStatus("Call disconnected");' +
'          sendToReactNative({' +
'            type: "call-ended"' +
'          });' +
'        }' +
'      };' +
'      ' +
'      return pc;' +
'    }' +
'    ' +
'    // Connect to signaling server' +
'    function connectToSignalingServer() {' +
'      // Replace with your actual WebSocket URL' +
'      const wsUrl = "ws://192.168.242.185:3001/ws/video";' +
'      ' +
'      const ws = new WebSocket(wsUrl);' +
'      socket = ws;' +
'      ' +
'      ws.onopen = () => {' +
'        setStatus("Connected to signaling server");' +
'        ws.send(JSON.stringify({' +
'          type: "join",' +
'          roomCode,' +
'          role: userRole' +
'        }));' +
'      };' +
'      ' +
'      ws.onmessage = async (message) => {' +
'        try {' +
'          const data = JSON.parse(message.data);' +
'          ' +
'          switch (data.type) {' +
'            case "offer":' +
'              handleOffer(data);' +
'              break;' +
'            case "answer":' +
'              handleAnswer(data);' +
'              break;' +
'            case "ice-candidate":' +
'              handleIceCandidate(data);' +
'              break;' +
'            case "user-joined":' +
'              const counterpartRole = userRole === "doctor" ? "Patient" : "Doctor";' +
'              setStatus(counterpartRole + " joined the room");' +
'              // If we\'re the doctor, we should create and send an offer' +
'              if (userRole === "doctor") {' +
'                createAndSendOffer();' +
'              }' +
'              break;' +
'            case "user-left":' +
'              const leftRole = userRole === "doctor" ? "Patient" : "Doctor";' +
'              setStatus(leftRole + " left the room");' +
'              remoteVideo.srcObject = null;' +
'              break;' +
'            case "room-full":' +
'              setStatus("Room is already full");' +
'              sendToReactNative({' +
'                type: "error",' +
'                message: "Room is already full"' +
'              });' +
'              endCall();' +
'              break;' +
'            case "room-not-found":' +
'              setStatus("Invalid room code");' +
'              sendToReactNative({' +
'                type: "error",' +
'                message: "Invalid room code"' +
'              });' +
'              endCall();' +
'              break;' +
'          }' +
'        } catch (error) {' +
'          console.error("Error parsing message:", error);' +
'        }' +
'      };' +
'      ' +
'      ws.onerror = (error) => {' +
'        console.error("WebSocket error:", error);' +
'        setStatus("Connection error");' +
'        sendToReactNative({' +
'          type: "error",' +
'          message: "Connection error. Please try again."' +
'        });' +
'      };' +
'      ' +
'      ws.onclose = () => {' +
'        setStatus("Disconnected from signaling server");' +
'        sendToReactNative({' +
'          type: "call-ended"' +
'        });' +
'      };' +
'    }' +
'    ' +
'    // Create and send offer (for doctor initiating the call)' +
'    async function createAndSendOffer() {' +
'      try {' +
'        if (!peerConnection) return;' +
'        ' +
'        const offer = await peerConnection.createOffer();' +
'        await peerConnection.setLocalDescription(offer);' +
'        ' +
'        if (socket && socket.readyState === WebSocket.OPEN) {' +
'          socket.send(JSON.stringify({' +
'            type: "offer",' +
'            sdp: peerConnection.localDescription,' +
'            roomCode,' +
'            role: userRole' +
'          }));' +
'        }' +
'      } catch (error) {' +
'        console.error("Error creating offer:", error);' +
'        setStatus("Error establishing connection");' +
'      }' +
'    }' +
'    ' +
'    // Handle WebRTC offer' +
'    async function handleOffer(data) {' +
'      try {' +
'        if (!peerConnection) return;' +
'        ' +
'        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));' +
'        ' +
'        const answer = await peerConnection.createAnswer();' +
'        await peerConnection.setLocalDescription(answer);' +
'        ' +
'        if (socket && socket.readyState === WebSocket.OPEN) {' +
'          socket.send(JSON.stringify({' +
'            type: "answer",' +
'            sdp: peerConnection.localDescription,' +
'            roomCode,' +
'            role: userRole' +
'          }));' +
'        }' +
'      } catch (error) {' +
'        console.error("Error handling offer:", error);' +
'        setStatus("Error establishing connection");' +
'      }' +
'    }' +
'    ' +
'    // Handle WebRTC answer' +
'    async function handleAnswer(data) {' +
'      try {' +
'        if (!peerConnection) return;' +
'        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));' +
'      } catch (error) {' +
'        console.error("Error handling answer:", error);' +
'      }' +
'    }' +
'    ' +
'    // Handle ICE candidate' +
'    async function handleIceCandidate(data) {' +
'      try {' +
'        if (!peerConnection || !data.candidate) return;' +
'        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));' +
'      } catch (error) {' +
'        console.error("Error handling ICE candidate:", error);' +
'      }' +
'    }' +
'    ' +
'    // Start call' +
'    async function startCall(code, role) {' +
'      roomCode = code;' +
'      userRole = role;' +
'      ' +
'      // Setup media stream' +
'      const streamSetup = await setupMediaStream();' +
'      if (!streamSetup) return;' +
'      ' +
'      // Initialize WebRTC' +
'      initializePeerConnection();' +
'      ' +
'      // Connect to signaling server' +
'      connectToSignalingServer();' +
'    }' +
'    ' +
'    // End call' +
'    function endCall() {' +
'      // Close peer connection' +
'      if (peerConnection) {' +
'        peerConnection.close();' +
'        peerConnection = null;' +
'      }' +
'      ' +
'      // Close WebSocket' +
'      if (socket) {' +
'        socket.close();' +
'        socket = null;' +
'      }' +
'      ' +
'      // Stop media tracks' +
'      if (localStream) {' +
'        localStream.getTracks().forEach(track => track.stop());' +
'        localStream = null;' +
'      }' +
'      ' +
'      // Clear video elements' +
'      localVideo.srcObject = null;' +
'      remoteVideo.srcObject = null;' +
'      ' +
'      sendToReactNative({' +
'        type: "call-ended"' +
'      });' +
'    }' +
'    ' +
'    // Toggle mute' +
'    function toggleMute() {' +
'      if (localStream) {' +
'        const audioTracks = localStream.getAudioTracks();' +
'        audioTracks.forEach(track => {' +
'          track.enabled = !track.enabled;' +
'        });' +
'        isMuted = !isMuted;' +
'        setStatus(isMuted ? "Audio muted" : "Audio unmuted");' +
'      }' +
'    }' +
'    ' +
'    // Toggle video' +
'    function toggleVideo() {' +
'      if (localStream) {' +
'        const videoTracks = localStream.getVideoTracks();' +
'        videoTracks.forEach(track => {' +
'          track.enabled = !track.enabled;' +
'        });' +
'        isVideoEnabled = !isVideoEnabled;' +
'        setStatus(isVideoEnabled ? "Video enabled" : "Video disabled");' +
'      }' +
'    }' +
'    ' +
'    // Handle messages from React Native' +
'    window.addEventListener("message", function(event) {' +
'      try {' +
'        const data = JSON.parse(event.data);' +
'        ' +
'        switch (data.type) {' +
'          case "join-room":' +
'            startCall(data.roomCode, data.role);' +
'            break;' +
'          case "end-call":' +
'            endCall();' +
'            break;' +
'          case "toggle-mute":' +
'            toggleMute();' +
'            break;' +
'          case "toggle-video":' +
'            toggleVideo();' +
'            break;' +
'        }' +
'      } catch (error) {' +
'        console.error("Error handling message from React Native:", error);' +
'      }' +
'    });' +
'    ' +
'    // Initial setup' +
'    setStatus("Waiting to join call...");' +
'  </script>' +
'</body>' +
'</html>';