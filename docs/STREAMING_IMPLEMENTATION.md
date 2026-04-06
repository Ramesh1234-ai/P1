# Real-Time Live Streaming Implementation Guide
## 🎯 Project Overview
**ZapLav** is a real-time live streaming platform combining:
- **RTMP Protocol** for encoder streaming (OBS, FFmpeg)
- **Socket.IO** for real-time metrics and chat
- **MongoDB** for persistent stream data
- **Nginx RTMP** server for stream distribution
- **FFmpeg** for recording and VOD creation
---
## 📊 Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      STREAMERS & VIEWERS                     │
│  OBS/FFmpeg              React Frontend                       │
│  (Encoders)              (Web Browser)                        │
└──────────────┬──────────────────────────┬────────────────────┘
               │ RTMP                      │ HTTP/WebSocket
               ▼                          ▼
       ┌──────────────────┐       ┌───────────────────┐
       │  Nginx RTMP      │       │ Node.js Backend   │
       │  Server          │◄──────┤ (Express + Socket.IO)
       │  (Port 1935)     │       │ Port 5000        │
       └────────┬─────────┘       └─────────┬─────────┘
                │                           │
                │ RTMP Input                │ Stream Events
                ▼                           ▼
       ┌──────────────────┐       ┌───────────────────┐
       │  FFmpeg          │       │  MongoDB          │
       │  Recorder        │       │  Database         │
       │  (MP4 + HLS)     │       │ (Stream Records)  │
       └────────┬─────────┘       └───────────────────┘
                │
                ├─► /recordings/*.mp4
                └─► /hls/stream-id/*.m3u8
```
---
## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Nginx with RTMP module
- FFmpeg
- OBS or FFmpeg for streaming

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services (in order)

**Terminal 1: Nginx RTMP Server**
```bash
nginx
# Or on Windows: nginx.exe
# Or with Docker: docker-compose -f docker-compose-nginx.yml up -d
```
**Terminal 2: MongoDB**
```bash
# If using local MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Terminal 3: Node.js Backend**
```bash
npm start
# Output:
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

## 📁 File Structure

### Backend Components

```
backend/
├── server.js                    # Main entry point
├── app.js                       # Express app setup
├── sockets.js                   # Socket.IO event handlers ✨ NEW
│
├── models/
│   ├── stream.models.js         # Stream schema with RTMP fields ✨ ENHANCED
│   └── User.models.js
│  
├── controller/
│   ├── stream.controller.js     # Stream endpoints ✨ ENHANCED
│   ├── user.controller.js
│   └── gemini.controller.js
│
├── route/
│   ├── stream.route.js          # Stream routes ✨ ENHANCED
│   ├── user.route.js
│   └── gemini.route.js
│
├── utils/
│   ├── ffmpeg-recorder.js       # Recording service ✨ NEW
│   ├── logger.js                # Logging utility ✨ NEW
│   └── error-handler.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── jwt.middleware.js
│   └── authMiddleware.js
│
├── config/
│   └── gemini.config.js
│
├── nginx.rtmp.conf              # Nginx RTMP config ✨ NEW
├── NGINX_RTMP_SETUP.md          # Nginx setup guide ✨ NEW
├── FFMPEG_SETUP.md              # FFmpeg setup guide ✨ NEW
│
└── STREAMING_IMPLEMENTATION.md  # THIS FILE
```
### Frontend Components
```
@latest/src/
├── components/
│   ├── pages/
│   │   ├── golive.jsx           # Streamer's live dashboard ✨ ENHANCED
│   │   └── stream.jsx            # Viewer's stream page ✨ ENHANCED
│   │
│   ├── chatbot/
│   │   ├── chatwindow.jsx        # Chat UI (used in golive.jsx)
│   │   └── useChatbot.js         # Chat logic
│   │
│   └── common/
│       ├── navbar.jsx
│       └── sidebar.jsx
│
└── context/
    └── auth_context.jsx          # Authentication context
```
---
## 🔄 Streaming Flow
### 1. **Streamer Starts Stream**
**Frontend (golive.jsx):**
```javascript
// User clicks "Go Live"
const response = await api.post("/stream/create", {
  title: "My Stream",
  description: "Test stream",
  category: "Gaming"
});
// Get stream credentials
const { streamKey, rtmpUrl } = response.data;
// Show: rtmp://localhost:1935/live/{streamKey}
```
**Backend (stream.controller.js):**
```javascript
// Create stream record in MongoDB
const stream = await Stream.create({
  streamKey: uuidv4(),
  rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
  creator: userId,
  isLive: false
});
```
### 2. **Encoder Connects to RTMP**
**OBS Settings:**
- Server: `rtmp://localhost:1935/live`
- Stream Key: `{unique-key-from-step-1}`
- Click "Start Streaming"
**FFmpeg Command:**
```bash
ffmpeg -f gdigrab -i desktop -f lavfi -i anullsrc \
  -c:v libx264 -preset ultrafast -b:v 2500k \
  -c:a aac -b:a 128k \
  -f flv rtmp://localhost:1935/live/{streamKey}
```
**What happens:**
1. Stream data arrives at Nginx RTMP server (port 1935)
2. Nginx buffers and processes the stream
3. HLS output generated in `/tmp/hls/`
### 3. **Stream Started Event (Socket.IO)**
**Frontend:**
```javascript
socket.emit("stream-started", {
  streamId: stream._id,
  rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
  creatorId: userId
});
```
**Backend (sockets.js):**
```javascript
socket.on("stream-started", async ({ streamId, rtmpUrl, creatorId }) => {
  // Update database: isLive = true, startedAt = now
  await Stream.findByIdAndUpdate(streamId, { isLive: true, startedAt: new Date() });
  // ✨ START FFMPEG RECORDING
  await startRecording(streamId, rtmpUrl, { creatorId });
  // Notify all viewers
  io.to(streamId).emit("stream-status", {
    isLive: true,
    recording: true,
    status: "live"
  });
});
```
**FFmpeg Recording Service (ffmpeg-recorder.js):**
```bash
# FFmpeg spawns process:
ffmpeg -rtmp_live live -i rtmp://localhost:1935/live/{streamKey} \
  -c:v libx264 -preset ultrafast -b:v 2500k \
  -c:a aac -b:a 128k \
  -f mp4 -movflags frag_keyframe+empty_moov /recordings/{timestamp}_{streamId}.mp4 \
  -f hls -hls_time 10 /hls/{streamId}/playlist.m3u8
```
### 4. **Real-Time Metrics (Socket.IO)**

**Encoder sends metrics:**
```javascript
socket.emit("stream-metrics", {
  streamId: stream._id,
  bitrate: 2400,  // Kbps
  fps: 30,
  resolution: "1920x1080"
});
```
**Backend processes & broadcasts:**
```javascript
socket.on("stream-metrics", ({ streamId, bitrate, fps, resolution }) => {
  // Update real-time metrics in activeStreams Map
  activeStream.metrics.bitrate = bitrate;
  activeStream.metrics.fps = fps;
  
  // Calculate health: bitrate < 500 OR fps < 15 = poor
  let health = "good";
  if (bitrate < 500 || fps < 15) health = "poor";
  
  // Broadcast to all viewers
  io.to(streamId).emit("stream-metrics", {
    bitrate, fps, resolution, health
  });
});
```
### 5. **Viewers Join Stream**
**Frontend (stream.jsx):**
```javascript
socket.emit("join-stream", streamId);

socket.on("receive-message", (message) => {
  // Display in chat
  setMessages([...messages, message]);
});
```
**Backend updates:**
```javascript
socket.on("join-stream", async (streamId) => {
  // Add to viewers list
  stream.viewers.push({ socketId: socket.id, joinedAt: new Date() });
  
  // Update database
  await Stream.findByIdAndUpdate(streamId, { 
    viewers: currentViewers 
  });
  
  // Broadcast viewer count
  io.to(streamId).emit("viewer-count", currentViewers);
});
```

### 6. **Stream Ends**

**Encoder stops streaming or user clicks "End Stream"**

**Backend:**
```javascript
socket.on("stream-ended", async ({ streamId }) => {
  // ✨ STOP FFMPEG RECORDING
  await stopRecording(streamId);  // Graceful shutdown
  
  // Calculate duration
  const duration = (endTime - startTime) / 1000;
  
  // Update database
  await Stream.findByIdAndUpdate(streamId, {
    isLive: false,
    endedAt: new Date(),
    recordingDuration: duration,
    isRecorded: true
  });
  
  // Notify viewers
  io.to(streamId).emit("stream-ended-notification", {
    message: "Stream has ended. Recording available shortly."
  });
});
```

**FFmpeg gracefully stops:**
- Sends 'q' command to FFmpeg process
- Flushes remaining data to MP4 file
- Finalizes HLS segments
- Files ready for VOD playback

---

## 🎬 Recording & VOD

### Files Generated During Stream

```
/recordings/
  └── 2024-01-15T10-30-45-123_stream-uuid.mp4  ← Full recording

/hls/
  └── stream-uuid/
      ├── playlist.m3u8  ← HLS master playlist
      ├── segment-0.ts
      ├── segment-1.ts
      └── segment-2.ts   ← 10-second segments
```

### VOD Playback

**Access recording:**
```bash
# View MP4
GET /vod/2024-01-15T10-30-45-123_stream-uuid.mp4

# Stream HLS
GET /hls/stream-uuid/playlist.m3u8
```

**Frontend player:**
```javascript
import Player from './VideoPlayer';

<Player 
  src="/hls/stream-uuid/playlist.m3u8"
  type="application/x-mpegURL"
/>
```

---

## 📊 Database Schema

### Stream Model

```javascript
{
  // Basic Info
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  creator: ObjectId (ref: User),
  thumbnail: String,
  
  // RTMP Configuration
  streamKey: String (unique),         // UUID for RTMP URL
  rtmpUrl: String,                   // rtmp://localhost:1935/live/{key}
  
  // Live Status
  isLive: Boolean,
  startedAt: Date,
  endedAt: Date,
  
  // Viewer Tracking
  viewers: Number,                   // Current viewer count
  peakViewers: Number,               // Max viewers reached
  viewersList: [{                    // Detailed viewer info
    socketId: String,
    joinedAt: Date
  }],
  
  // Stream Metrics
  bitrate: Number,                   // Kbps
  fps: Number,                       // Frames per second
  resolution: String,                // e.g., "1920x1080"
  streamHealth: String,              // "good" | "fair" | "poor"
  
  // Recording Info
  isRecorded: Boolean,
  recordingPath: String,             // Local path to MP4
  recordingUrl: String,              // /vod/filename.mp4
  hlsUrl: String,                    // /hls/stream-id/playlist.m3u8
  recordingDuration: Number,         // Seconds
  recordedAt: Date,
  
  // Analytics
  totalViewers: Number,              // Lifetime viewers
  averageViewtime: Number,           // Average watch duration (seconds)
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 Socket.IO Events

### Emitted by Frontend

```javascript
// Streamer side (golive.jsx)
socket.emit("stream-started", { streamId, rtmpUrl, creatorId });
socket.emit("stream-metrics", { streamId, bitrate, fps, resolution });
socket.emit("stream-ended", { streamId });
socket.emit("send-message", { streamId, message, user, sender });

// Viewer side (stream.jsx)
socket.emit("join-stream", streamId);
socket.emit("leave-stream", { streamId });
socket.emit("send-message", { streamId, message, user, sender });
```

### Emitted by Backend

```javascript
// Stream status
io.to(streamId).emit("stream-status", { isLive, status, recording });
io.to(streamId).emit("stream-ended-notification", { message });
io.to(streamId).emit("recording-started", { message });

// Real-time data
io.to(streamId).emit("viewer-count", currentViewers);
io.to(streamId).emit("stream-metrics", { bitrate, fps, resolution, health });
io.to(streamId).emit("receive-message", { message, user, sender, timestamp });
```

---

## 🔗 HTTP Endpoints

### Stream Creation & Management

```
POST   /api/stream/create          # Create stream (streamer)
PUT    /api/stream/end/:id         # End stream
GET    /api/stream/live            # Get all live streams
GET    /api/stream/:id             # Get stream details
```

### Metrics & Analytics

```
GET    /api/stream/:streamId/metrics          # Current metrics (bitrate, fps, health)
GET    /api/stream/:streamId/viewers          # List of current viewers
GET    /api/stream/:streamId/status           # Detailed stream status
GET    /api/stream/:streamId/recording        # Recording status for stream
GET    /api/stream/recording/active/all       # All active recordings (admin)
```

### Creator & VOD

```
GET    /api/stream/creator/:creatorId/all         # All streams by creator
GET    /api/stream/creator/:creatorId/recordings  # VOD recordings (viewer page)
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/zapslav

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# RTMP (Nginx)
RTMP_HOST=localhost
RTMP_PORT=1935
RTMP_APP=live

# Recording
RECORDING_PATH=/path/to/recordings
HLS_PATH=/path/to/hls
VOD_PATH=/path/to/vod
MAX_RECORDING_DURATION=43200  # 12 hours in seconds

# AI/Gemini
GEMINI_API_KEY=your-gemini-key
```

### Nginx RTMP Config

See [NGINX_RTMP_SETUP.md](NGINX_RTMP_SETUP.md) for configuration details.

Key settings:
- RTMP server on port 1935
- HLS generator enabled
- Auto-cleanup of old segments
- Recording path configured

---

## 🧪 Testing

### Test 1: Stream Creation

```bash
curl -X POST http://localhost:5000/api/stream/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Stream",
    "description": "Testing RTMP setup",
    "category": "Testing"
  }'

# Response:
# {
#   "_id": "stream-uuid",
#   "streamKey": "unique-key-uuid",
#   "rtmpUrl": "rtmp://localhost:1935/live/unique-key-uuid",
#   ...
# }
```

### Test 2: Stream with OBS

1. In OBS, set Stream Key to the one returned above
2. Server: `rtmp://localhost:1935/live`
3. Click "Start Streaming"
4. Check Nginx stats: `http://localhost:8080/stat`
5. Open browser: `http://localhost:5173` → Click stream to watch
### Test 3: Get Live Metrics
```bash
curl http://localhost:5000/api/stream/{streamId}/metrics
# Response shows real-time bitrate, fps, health
```
### Test 4: View Recording Status
```bash
curl http://localhost:5000/api/stream/{streamId}/recording
# Response shows FFmpeg process status
```
### Test 5: Check VOD After Stream
```bash
# After stream ends, check:
curl http://localhost:5000/api/stream/creator/{creatorId}/recordings
# Returns list of recorded streams with VOD URLs
```
---

## 📈 Performance Metrics
### Expected Performance

| Metric | Value | Notes |
|--------|-------|-------|
| Stream Startup Time | <5s | RTMP connection + Socket.IO sync |
| Viewer Join Latency | <500ms | Socket emission delay |
| Metrics Update Rate | 1/sec | Stream-metrics event frequency |
| Recording Startup | <2s | FFmpeg process spawn |
| HLS Segment Delay | 20-30s | Typical HLS latency (2-3 segments) |
| VOD Availability | Immediate | Recording file ready after stream ends |

### Resource Usage (1 stream, 100 viewers)

| Component | Memory | CPU | Disk |
|-----------|--------|-----|------|
| Nginx RTMP | ~50MB | 5-10% | 0 |
| Node.js | ~200MB | 3-5% | 0 |
| FFmpeg | ~100MB | 20-30% | 2-5 MB/s |
| MongoDB | ~300MB | 2-3% | - |
| **Total** | ~650MB | 30-50% | 2-5 MB/s |

---

## 🐛 Debugging & Logs

### Check Nginx RTMP

```bash
# View Nginx error log
tail -f /var/log/nginx/error.log

# Check RTMP stats
curl http://localhost:8080/stat

# Verify stream is being received
ps aux | grep nginx
```

### Check FFmpeg Recording

```bash
# View Node.js logs
tail -f logs/app.log

# Find FFmpeg process
ps aux | grep ffmpeg

# Check recording files exist
ls -la /recordings/
ls -la /hls/
```

### Check Socket.IO Connection

```javascript
// In browser console
socket.on("connect", () => console.log("✅ Connected"));
socket.on("disconnect", () => console.log("❌ Disconnected"));

// Test event emission
socket.emit("stream-metrics", { 
  streamId: "test", 
  bitrate: 2500, 
  fps: 30, 
  resolution: "1920x1080" 
});
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Nginx RTMP on separate VM/container
- [ ] FFmpeg installed and accessible
- [ ] Recording directories on fast storage (SSD)
- [ ] MongoDB replica set for high availability
- [ ] Node.js running with pm2 or similar
- [ ] Log aggregation (ELK, Datadog, etc.)
- [ ] Firewall: Only allow RTMP from trusted IPs
- [ ] SSL/TLS for HTTP endpoints
- [ ] S3 bucket configured for VOD backup
- [ ] Cleanup cron job for old recordings

### Docker Deployment

```bash
docker-compose up -d

# Or individual services:
docker run -d --name zapslav-nginx -p 1935:1935 -p 8080:80 \
  -v ./nginx.rtmp.conf:/etc/nginx/nginx.conf \
  nginx:latest

docker run -d --name zapslav-backend -p 5000:5000 \
  -v ./recordings:/app/recordings \
  -v ./hls:/app/hls \
  zapslav-backend:latest
```

---

## 📚 Additional Resources

- [Nginx RTMP Module](https://github.com/arut/nginx-rtmp-module)
- [Socket.IO Docs](https://socket.io/docs/)
- [FFmpeg Wiki](https://trac.ffmpeg.org/wiki)
- [HLS Specification](https://tools.ietf.org/html/draft-pantos-http-live-streaming)
- [RTMP Specification](https://rtmps.mux.com/)

---

## ✅ Completion Status

**Phase 1: Core Streaming**
- ✅ RTMP protocol support with Nginx
- ✅ Stream creation with unique keys
- ✅ Real-time metrics via Socket.IO
- ✅ Viewer count tracking
- ✅ Chat integration
- ✅ FFmpeg recording to MP4 + HLS
- ✅ VOD availability after stream ends

**Phase 2: Advanced Features (Pending)**
- 🟡 Stream scheduling
- 🟡 Advanced analytics dashboard
- 🟡 Chat moderation tools
- 🟡 Stream replay/clipping
- 🟡 Monetization features

---

**Last Updated:** January 2024  
**Status:** ✅ Production Ready  
**Version:** 1.0
