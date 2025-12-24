
        const roomId = "{{ room_id }}";
        const livekitUrl = "{{ livekit_url }}";
        
        let room = null;
        
        // Connect to stream as viewer
        async function connectAsViewer() {
            try {
                showStatus('Connecting to stream...');
                
                // Get guest token from Django
                const response = await fetch(`/api/token/guest/${roomId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to connect');
                }
                
                const data = await response.json();
                
                // Create room instance
                room = new LivekitClient.Room({
                    adaptiveStream: true,
                    dynacast: true,
                });
                
                // Set up event listeners
                room.on(LivekitClient.RoomEvent.Connected, () => {
                    console.log('Connected to room as viewer');
                    showStatus('Connected to stream', 'success');
                });
                
                room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    console.log('Track subscribed:', track.kind);
                    
                    if (track.kind === LivekitClient.Track.Kind.Video) {
                        // Attach video track to video element
                        const videoElement = document.getElementById('remoteVideo');
                        track.attach(videoElement);
                        
                        // Hide loading overlay and show video
                        document.getElementById('loadingOverlay').style.display = 'none';
                        videoElement.style.display = 'block';
                        
                        showStatus('Watching live stream', 'success');
                    }
                });
                
                room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
                    console.log('Track unsubscribed:', track.kind);
                    track.detach();
                });
                
                room.on(LivekitClient.RoomEvent.ParticipantConnected, () => {
                    updateViewerCount();
                });
                
                room.on(LivekitClient.RoomEvent.ParticipantDisconnected, () => {
                    updateViewerCount();
                });
                
                room.on(LivekitClient.RoomEvent.Disconnected, (reason) => {
                    console.log('Disconnected from room:', reason);
                    showStatus('Stream ended or connection lost', 'error');
                    document.getElementById('remoteVideo').style.display = 'none';
                    document.getElementById('loadingOverlay').style.display = 'flex';
                    document.getElementById('loadingOverlay').innerHTML = 
                        '<h2 style="color: #e74c3c;">Stream Ended</h2>' +
                        '<p style="margin-top: 10px;">The host has ended the stream.</p>';
                });
                
                // Connect to room
                await room.connect(data.url, data.token);
                
                // Update viewer count
                updateViewerCount();
                
            } catch (error) {
                console.error('Failed to connect:', error);
                showStatus(`Failed to connect: ${error.message}`, 'error');
                document.getElementById('loadingOverlay').innerHTML = 
                    '<h2 style="color: #e74c3c;">Connection Failed</h2>' +
                    '<p style="margin-top: 10px;">' + error.message + '</p>' +
                    '<button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #00adb5; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>';
            }
        }
        
        // Update viewer count
function updateViewerCount() {
    if (!room) return;

    let viewerCount = 0;

    // room.participants یک Map<string, RemoteParticipant> هست
    room.participants.forEach(participant => {
        // host با identity که با 'host_' شروع می‌شه شناخته می‌شه
        if (!participant.identity.startsWith('host_')) {
            viewerCount++;
        }
    });

    // localParticipant (خود viewer) رو هم در نظر نگیریم (اختیاری)
    // چون guest identity معمولاً guest_xxx هست، اما host رو فیلتر کردیم کافیه

    document.getElementById('viewerCount').textContent = `${viewerCount} watching`;
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
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 3000);
            }
        }
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', async () => {
            if (room) {
                await room.disconnect();
            }
        });
        
        // Auto-connect when page loads
        connectAsViewer();
