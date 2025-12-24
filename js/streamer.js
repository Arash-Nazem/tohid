
    const roomId = "{{ room_id }}";
    const livekitUrl = "{{ livekit_url }}";
    const csrfToken = "{{ csrf_token }}";
    
    let room = null;
    let localVideoTrack = null;
    let localAudioTrack = null;
    let isStreaming = false;
    let videoEnabled = true;
    let audioEnabled = true;
    
    // Initialize camera and microphone preview
    async function initPreview() {
        try {
            showStatus('Initializing camera and microphone...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });
            
            // Display local preview
            const videoElement = document.getElementById('localVideo');
            videoElement.srcObject = stream;
            
            // Store tracks for later use
            localVideoTrack = stream.getVideoTracks()[0];
            localAudioTrack = stream.getAudioTracks()[0];
            
            showStatus('Ready to stream', 'success');
        } catch (error) {
            console.error('Failed to access camera/microphone:', error);
            showStatus('Failed to access camera/microphone. Please check permissions.', 'error');
        }
    }
    
    // Start streaming to LiveKit
    async function startStream() {
        if (isStreaming) {
            await stopStream();
            return;
        }

        try {
            showStatus('Connecting to LiveKit...');
            document.getElementById('startStream').disabled = true;

            // Get host token from Django
            const response = await fetch(`/api/token/host/${roomId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get token');
            }

            const data = await response.json();

            // Connect to LiveKit room
            room = new LivekitClient.Room({
                adaptiveStream: true,
                dynacast: true,
            });

            // Set up event listeners
            room.on(LivekitClient.RoomEvent.Connected, () => {
                console.log('Connected to room');
                showStatus('Connected - Publishing stream...', 'success');
            });

            room.on(LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
                console.log('Viewer joined:', participant.identity);
                updateViewerCount();
            });

            room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
                console.log('Viewer left:', participant.identity);
                updateViewerCount();
            });

            room.on(LivekitClient.RoomEvent.Disconnected, () => {
                console.log('Disconnected from room');
                showStatus('Disconnected from stream', 'error');
                resetStreamUI();
            });

            // Connect to room
            await room.connect(data.url, data.token);

            // Publish camera and microphone
            if (localVideoTrack) {
                await room.localParticipant.publishTrack(localVideoTrack, {
                    name: 'camera',
                    simulcast: true,
                });
            }

            if (localAudioTrack) {
                await room.localParticipant.publishTrack(localAudioTrack, {
                    name: 'microphone',
                });
            }

            isStreaming = true;
            document.getElementById('statusIndicator').style.display = 'flex';
            document.getElementById('startStream').textContent = '⏹️ Stop Streaming';
            document.getElementById('startStream').style.background = '#e74c3c';
            document.getElementById('startStream').disabled = false;

            showStatus('Live streaming!', 'success');

        } catch (error) {
            console.error('Failed to start stream:', error);
            showStatus(`Failed to start stream: ${error.message}`, 'error');
            document.getElementById('startStream').disabled = false;
            resetStreamUI();
        }
    }
    
    // Stop streaming
    async function stopStream() {
        if (room) {
            await room.disconnect();
            room = null;
        }
        
        isStreaming = false;
        resetStreamUI();
        showStatus('Stream stopped', 'info');
    }
    
    // Toggle video
    function toggleVideo() {
        if (!localVideoTrack) return;
        
        videoEnabled = !videoEnabled;
        localVideoTrack.enabled = videoEnabled;
        
        const btn = document.getElementById('toggleVideo');
        if (videoEnabled) {
            btn.textContent = '📹 Camera On';
            btn.className = 'control-btn active';
        } else {
            btn.textContent = '📹 Camera Off';
            btn.className = 'control-btn inactive';
        }
    }
    
    // Toggle audio
    function toggleAudio() {
        if (!localAudioTrack) return;
        
        audioEnabled = !audioEnabled;
        localAudioTrack.enabled = audioEnabled;
        
        const btn = document.getElementById('toggleAudio');
        if (audioEnabled) {
            btn.textContent = '🎤 Mic On';
            btn.className = 'control-btn active';
        } else {
            btn.textContent = '🎤 Mic Off';
            btn.className = 'control-btn inactive';
        }
    }
    
    // Update viewer count
    function updateViewerCount() {
        if (!room) return;
        
        const viewerCount = room.participants.size;
        document.getElementById('viewerCount').textContent = `${viewerCount} watching`;
    }
    
    // Reset UI after stream ends
    function resetStreamUI() {
        document.getElementById('statusIndicator').style.display = 'none';
        document.getElementById('startStream').textContent = '▶️ Start Streaming';
        document.getElementById('startStream').style.background = '#00adb5';
        document.getElementById('startStream').disabled = false;
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        const statusEl = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            statusEl.style.background = '#27ae60';
            statusEl.style.color = 'white';
        } else if (type === 'error') {
            statusEl.style.background = '#e74c3c';
            statusEl.style.color = 'white';
        } else {
            statusEl.style.background = '#1a1a2e';
            statusEl.style.color = '#95a5a6';
        }
    }
    
    // Copy URL to clipboard
    function copyUrl() {
        const urlInput = document.getElementById('watchUrl');
        urlInput.select();
        navigator.clipboard.writeText(urlInput.value).then(() => {
            alert('URL copied to clipboard!');
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', async () => {
        if (room) {
            await room.disconnect();
        }
        if (localVideoTrack) {
            localVideoTrack.stop();
        }
        if (localAudioTrack) {
            localAudioTrack.stop();
        }
    });
    
    // Initialize preview on page load
    initPreview();
