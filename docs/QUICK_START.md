# 🚀 Quick Start Guide - Live Streaming Setup
## 5-Minute Setup
### Step 1: Install Dependencies
```bash
# Install Nginx with RTMP
# Windows: Download from https://github.com/illuspas/nginx-rtmp-win32/releases
# Mac: brew install nginx-full --with-rtmp
# Linux: sudo apt-get install nginx libnginx-mod-rtmp

# Install FFmpeg
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg
# Verify installations
nginx -v
ffmpeg -version
```
### Step 2: Start Services
**Terminal 1: Nginx RTMP**
```bash
# Copy config first
cp backend/nginx.rtmp.conf /path/to/nginx/conf/nginx.conf
# Start Nginx
nginx
# Verify
curl http://localhost:8080/health
# Expected: "healthy"
```
**Terminal 2: MongoDB**
```bash
mongod
# Or: docker run -d -p 27017:27017 mongo:latest
```
**Terminal 3: Node.js Backend**
```bash
cd backend
npm start
# Expected output:
# 🚀 Server running at http://localhost:5000
# 📡 Waiting for RTMP streams at rtmp://localhost:1935/live/
# 🎥 Recording directories initialized
```
**Terminal 4: React Frontend** (in @latest folder)
```bash
npm run dev
# Opens http://localhost:5173
```
---
## Test Your Setup (5 Steps)
### 1. Create Stream
```bash
# Get your auth token from login, then:
curl -X POST http://localhost:5000/api/stream/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Test Stream",
    "description": "Testing setup",
    "category": "Gaming"
  }'
# Save the streamKey and rtmpUrl from response
```
### 2. Start Streaming with OBS
1. Open OBS
2. Settings → Stream → Select "Custom..."
3. Server: `rtmp://localhost:1935/live`
4. Stream Key: `{paste the streamKey from step 1}`
5. Click "Start Streaming"
6. Check logs for "🎥 Recording started"
### 3. Watch Stream
1. Open http://localhost:5173
2. Click the live stream
3. Should see video playing
4. Should see viewer count increasing
5. Should see real-time chat
### 4. Check Recording Status
```bash
curl http://localhost:5000/api/stream/{streamId}/recording
```
### 5. Stop Stream & Check VOD
1. Stop OBS streaming
2. Wait 2-3 seconds for FFmpeg to finalize
3. Check: `/hls/{streamId}/playlist.m3u8` should be accessible
4. Can play VOD from viewer page
---
## File Locations
### Critical Directories
```
/recordings/          # MP4 recordings (full files)
/hls/                 # HLS segments (for streaming)
/vod/                 # VOD playlist links
/logs/                # Backend logs
```
### Configuration Files
```
backend/nginx.rtmp.conf              # Nginx RTMP config
backend/sockets.js                   # Socket.IO events
backend/utils/ffmpeg-recorder.js     # Recording service
backend/models/stream.models.js      # Database schema
```
---
## Common Commands

### Check Services Running
```bash
ps aux | grep nginx
ps aux | grep node
ps aux | grep ffmpeg
ps aux | grep mongod
```

### View Logs
```bash
# Nginx errors
tail -f /var/log/nginx/error.log

# Node.js backend
tail -f logs/app.log

# FFmpeg recordings
ps aux | grep ffmpeg

# Check recording files
ls -lh /recordings/
```

### Stop Services
```bash
nginx -s stop              # Stop Nginx
npm stop                   # Stop Node.js
pkill -f ffmpeg            # Stop FFmpeg
mongod --shutdown          # Stop MongoDB
```

### Restart Everything
```bash
nginx -s stop && sleep 1 && nginx
# Node.js: Ctrl+C and npm start again
pkill -f ffmpeg
mongod
```
---

## Troubleshooting

### "Address already in use" on port 1935
```bash
# Find what's using port 1935
netstat -ano | findstr :1935  # Windows
lsof -i :1935                 # Mac/Linux

# Kill the process
kill -9 <PID>
```

### FFmpeg not recording
```bash
# Check:
1. /recordings directory exists: mkdir -p /recordings
2. /hls directory exists: mkdir -p /hls
3. FFmpeg installed: ffmpeg -version
4. Check logs: tail -f logs/app.log
```

### "No HLS file found"
```bash
# Ensure /tmp/hls exists
mkdir -p /tmp/hls
chmod 777 /tmp/hls

# Or check nginx.conf hls_path setting
```

### Stream not showing in live list
```bash
# Check:
1. Stream created successfully
2. RTMP stream connected to Nginx
3. Check: curl http://localhost:8080/stat
4. Backend logs: tail -f logs/app.log
```

### Viewer count not updating
```bash
# Check Socket.IO connection:
# In browser console: socket.emit("stream-metrics", {...})
# Check: http://localhost:5000/api/stream/{id}/metrics
```
---

## Performance Tips

### For Better Recording Quality
Edit `backend/utils/ffmpeg-recorder.js`:
```javascript
videoCodec: "libx265",      // Better compression (slower)
videoBitrate: "5000k",      // Higher bitrate
videoPreset: "medium",      // Better but slower
```

### For Faster Encoding (Live)
```javascript
videoCodec: "libx264",      // Standard
videoBitrate: "2500k",      // Default
videoPreset: "ultrafast",   // Fastest encoding
```

### For Lower Bitrate (Mobile)
```javascript
videoBitrate: "1500k",      // Reduce
audioBitrate: "64k",        // Reduce audio
videoResolution: "-vf scale=640:360"  // 360p
```

---

## Next Steps

### After Initial Setup:
1. ✅ Test with OBS streaming
2. ✅ Verify MP4 recording created
3. ✅ Check HLS playback works
4. ✅ Test with multiple viewers
5. ✅ Monitor CPU/Memory usage

### For Production:
1. Set up SSL/TLS
2. Configure firewall rules
3. Set up log rotation
4. Configure auto-cleanup of old recordings
5. Set up monitoring (disk space, CPU, etc)
6. Deploy with Docker/Kubernetes
7. Set up CI/CD pipeline
### Add Later (Phase 2):
1. Stream scheduling calendar
2. Analytics dashboard
3. Chat moderation tools
4. Stream clipping feature
5. Multi-bitrate support
---
## Support Resources
Inside `backend/` folder:
- **NGINX_RTMP_SETUP.md** - Detailed Nginx guide
- **FFMPEG_SETUP.md** - Detailed FFmpeg guide  
- **STREAMING_IMPLEMENTATION.md** - Complete technical documentation
- **nginx.rtmp.conf** - Pre-configured Nginx setup
Online:
- Nginx RTMP: https://github.com/arut/nginx-rtmp-module
- FFmpeg: https://ffmpeg.org/
- Socket.IO: https://socket.io
- MongoDB: https://docs.mongodb.com

---

## API Quick Reference

### Stream Creation
```
POST /api/stream/create
Authorization: Bearer TOKEN
Body: {
  "title": "Stream Title",
  "description": "Description",
  "category": "Gaming"
}
Returns: { streamKey, rtmpUrl, _id, ... }
```

### Get Live Streams
```
GET /api/stream/live
Returns: [ { _id, title, creator, viewers, ... } ]
```
### Get Stream Metrics
```
GET /api/stream/{streamId}/metrics
Returns: { bitrate, fps, resolution, health, viewers, ... }
```

### Get Stream Viewers
```
GET /api/stream/{streamId}/viewers
Returns: { viewers: [ { socketId, joinedAt } ], count, isLive }
```

### Get Recording Status
```
GET /api/stream/{streamId}/recording
Returns: { streamId, isRecording, uptime, mp4Path, hlsPath }
```

### Get VOD Recordings
```
GET /api/stream/creator/{creatorId}/recordings
Returns: [ { title, vodUrl, hlsUrl, recordingDuration, ... } ]
```

---

## Socket.IO Events

### Frontend → Backend
```javascript
socket.emit("stream-started", { streamId, rtmpUrl, creatorId });
socket.emit("stream-metrics", { streamId, bitrate, fps, resolution });
socket.emit("stream-ended", { streamId });
socket.emit("join-stream", streamId);
socket.emit("send-message", { streamId, message, user });
```
### Backend → Frontend
```javascript
socket.on("stream-status", { isLive, status, recording });
socket.on("viewer-count", currentViewers);
socket.on("stream-metrics", { bitrate, fps, resolution, health });
socket.on("receive-message", { message, user, timestamp });
socket.on("recording-started", { message });
```

---

## Status Check Commands

### All Services Healthy?
```bash
# Check Nginx
curl http://localhost:8080/health
# Check Backend
curl http://localhost:5000/api/stream/live
# Check MongoDB
mongosh localhost:27017
# Check FFmpeg
ffmpeg -version
# Check Node.js
npm --version
```
---
## Logs to Check on Problems
1. **Nginx RTMP issues:** `/var/log/nginx/error.log`
2. **Backend issues:** `logs/app.log` (in backend folder)
3. **FFmpeg issues:** Check STDOUT in debug mode
4. **Database issues:** MongoDB logs in MongoDB data directory
---
## Final Checklist
- [ ] Nginx RTMP installed and running
- [ ] FFmpeg installed and accessible
- [ ] MongoDB running on default port
- [ ] Node.js backend started with "🎥 Recording initialized" message
- [ ] React frontend accessible at http://localhost:5173
- [ ] Can create stream and get streamKey
- [ ] Can start OBS stream to rtmp://localhost:1935/live
- [ ] Can see stream in live list
- [ ] Can watch with real-time chat
- [ ] MP4 file created in /recordings/
- [ ] HLS playlist accessible
- [ ] VOD playable after stream ends
---
**Ready to stream!** 🎬  
If you hit issues, check NGINX_RTMP_SETUP.md or FFMPEG_SETUP.md for detailed troubleshooting.
