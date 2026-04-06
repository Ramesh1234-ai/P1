# FFmpeg Recording Service Setup Guide

## Overview

This guide covers installing and configuring FFmpeg for the live stream recording service. FFmpeg will:
- Capture RTMP streams from Nginx
- Record to MP4 format (full recordings)
- Encode to HLS (segmented streaming for VOD)
- Handle bitrate/resolution conversion automatically

---

## Installation

### Windows Setup

#### Option 1: Using Chocolatey (EASIEST)

```bash
# Install Chocolatey first (if not already installed)
# From PowerShell (as Administrator):
Set-ExecutionPolicy Bypass -Scope Process -Force; `
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
  iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Then install FFmpeg
choco install ffmpeg -y

# Verify
ffmpeg -version
```

#### Option 2: Direct Download
1. **Download FFmpeg from:** https://ffmpeg.org/download.html
   - Choose Windows builds from: https://www.gyan.dev/ffmpeg/builds/
   - Download: `ffmpeg-git-full.7z` (most recent)
2. **Extract to:** `C:\ffmpeg`
3. **Add to PATH:**
   - Open Environment Variables
   - Add `C:\ffmpeg\bin` to System PATH
   - Restart terminal/CMD
4. **Verify:**
   ```bash
   ffmpeg -version
   ```
#### Option 3: Windows Package Manager
```bash
winget install ffmpeg
ffmpeg -version
```

---

### Mac Setup

#### Using Homebrew (RECOMMENDED)
```bash
# Install FFmpeg with full features
brew install ffmpeg

# Verify
ffmpeg -version

# Optional: Install additional codecs
brew install ffmpeg --with-libvpx --with-libvorbis
```

#### From Source

```bash
# Install dependencies
brew install autoconf automake libtool pkg-config

# Download FFmpeg
cd ~/Downloads
wget https://ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2
tar xjf ffmpeg-snapshot.tar.bz2
cd ffmpeg

# Configure and compile
./configure --enable-gpl --enable-libx264 --enable-libx265 --enable-libfdk-aac
make
sudo make install

# Verify
ffmpeg -version
```

---

### Linux Setup

#### Ubuntu/Debian

```bash
# Update package list
sudo apt-get update

# Option 1: Install from official repos (simpler, older version)
sudo apt-get install ffmpeg -y

# Option 2: Install from PPA (newer version)
sudo add-apt-repository ppa:jonathonf/ffmpeg-4
sudo apt-get update
sudo apt-get install ffmpeg -y

# Verify
ffmpeg -version
```

#### CentOS/RHEL

```bash
# Install from EPEL repository
sudo yum install epel-release -y
sudo yum install ffmpeg -y

# Verify
ffmpeg -version
```

#### From Source (Latest)

```bash
# Install dependencies
sudo apt-get install build-essential autoconf automake \
  libass-dev libfreetype6-dev libsdl2-dev libtheora-dev \
  libtool libva-dev libvdpau-dev libvorbis-dev libvpx-dev \
  libx264-dev libx265-dev pkg-config texinfo wget zlib1g-dev

# Download FFmpeg
cd ~/src
wget https://ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2
tar xjf ffmpeg-snapshot.tar.bz2
cd ffmpeg

# Configure
./configure \
  --prefix=/usr/local \
  --enable-gpl \
  --enable-nonfree \
  --enable-libass \
  --enable-libfreetype \
  --enable-libtheora \
  --enable-libvorbis \
  --enable-libvpx \
  --enable-libx264 \
  --enable-libx265 \
  --enable-libfdk-aac

# Compile and install
make -j$(nproc)
sudo make install

# Update library cache
sudo ldconfig

# Verify
ffmpeg -version
```

---

## Testing FFmpeg

### Basic Test

```bash
# Show version
ffmpeg -version

# List available codecs
ffmpeg -codecs | grep h264
ffmpeg -codecs | grep aac

# Show available pixel formats
ffmpeg -pix_fmts | grep yuv420p
```

### Record from Webcam

```bash
# Windows (GDIgrab)
ffmpeg -f gdigrab -i desktop -c:v libx264 -preset medium output.mp4

# Mac (AVFoundation)
ffmpeg -f avfoundation -i "0:0" -c:v libx264 -preset medium output.mp4

# Linux (X11grab)
ffmpeg -f x11grab -i 0 -c:v libx264 -preset medium output.mp4
```

### Convert MP4 to HLS

```bash
# Convert existing MP4 to HLS segments
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -b:v 2500k \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 10 output.m3u8

# Check generated files
ls output*.ts output.m3u8
```

### Live Stream to MP4 (Local Test)

```bash
# If you have OBS streaming to rtmp://localhost:1935/live/test-key:

# Capture for 5 seconds
ffmpeg -rtmp_live live -i rtmp://localhost:1935/live/test-key \
  -c:v libx264 -preset ultrafast -b:v 2500k \
  -c:a aac -b:a 128k \
  -t 5 \
  test-recording.mp4

# Check output
ffprobe test-recording.mp4
```

---

## FFmpeg Command Reference

### Key Encoders

| Encoder | Use Case | Speed | Quality |
|---------|----------|-------|---------|
| `libx264` | H.264 MP4 | Medium | Excellent |
| `libx265` | H.265 (HEVC) MP4 | Slow | Superior |
| `libvpx` | VP8/VP9 WebM | Slow | Good |
| `mpeg2` | Legacy/Broadcast | Fast | Good |

### Preset Levels (x264)

| Preset | Speed | Filesize | When to Use |
|--------|-------|----------|-------------|
| ultrafast | Fastest | Largest | Live streaming |
| superfast | Very fast | Large | Real-time encoding |
| veryfast | Fast | Medium | Broadcasting |
| faster | Medium | Small | Balanced |
| medium | Slow | Small | Default |
| slow | Very slow | Tiny | VOD/Archive |

### Audio Codecs

| Codec | Bitrate | Use Case |
|-------|---------|----------|
| aac | 96-320k | MP4, DASH, HLS |
| libopus | 64-128k | WebM, Opus |
| libvorbis | 64-320k | OGG, WebM |

### Useful Options

```bash
# Video bitrate (2500k = 2500 kilobits/second)
-b:v 2500k

# Audio bitrate
-b:a 128k

# Video resolution
-vf "scale=1280:720"

# Codec
-c:v libx264
-c:a aac

# Preset
-preset ultrafast

# Max bitrate (for live streams)
-maxrate 3000k

# Buffer size
-bufsize 6000k

# Framerate
-r 30

# Key frame interval (for HLS)
-g 30

# Transport stream format
-f mpegts

# Keep aspect ratio on scaling
-vf "scale=1280:-1"
```

---

## Integration with Node.js Backend

### How Recording Service Works

1. **Stream Created:** User clicks "Go Live" in golive.jsx
   - Backend creates stream with unique `streamKey`
   - Returns `rtmpUrl: rtmp://localhost:1935/live/{streamKey}`

2. **Stream Started:** OBS/FFmpeg connects to RTMP URL
   - Socket.IO `stream-started` event emitted
   - Backend calls `startRecording(streamId, rtmpUrl)`
   - FFmpeg spawns process connecting to RTMP input

3. **FFmpeg Processing:**
   - Reads RTMP stream from Nginx
   - Encodes to H.264 @ 2500kbps (MP4 output)
   - Simultaneously encodes to HLS segments (10s each)
   - Both written to `/recordings/` and `/hls/` directories

4. **Stream Ended:** OBS/FFmpeg disconnects or user ends stream
   - Socket.IO `stream-ended` event emitted
   - Backend calls `stopRecording(streamId)`
   - FFmpeg process gracefully terminates
   - Duration calculated and saved to database
   - VOD files now available for playback

### File Structure After Recording

```
/recordings/
  ├── 2024-01-15T10-30-45-123_stream-id-uuid.mp4
  └── 2024-01-15T10-31-20-456_another-stream-uuid.mp4

/hls/
  ├── stream-id-uuid/
  │   ├── playlist.m3u8
  │   ├── segment-0.ts
  │   ├── segment-1.ts
  │   └── segment-2.ts
  └── another-stream-uuid/
      ├── playlist.m3u8
      └── ...
```

---

## Performance Tuning

### For Live Streaming (Low Latency)

```javascript
// In ffmpeg-recorder.js RECORDING_CONFIG:
{
  videoPreset: "ultrafast",    // Faster encoding
  videoBitrate: "2500k",       // Standard for streaming
  videoBuffer: "5000k",        // Allow some buffer
  hlsTime: 5,                  // Shorter segments
  hlsListSize: 10,             // Keep recent segments
}
```

### For High-Quality Archive

```javascript
{
  videoPreset: "slow",         // Better compression
  videoBitrate: "5000k",       // Higher quality
  videoBuffer: "10000k",       // Larger buffer
  hlsTime: 10,                 // Standard segments
}
```

### For Low Bandwidth Streams

```javascript
{
  videoCodec: "libx265",       // Better compression
  videoBitrate: "1500k",       // Lower bitrate
  audioCodec: "libopus",       // Better audio compression
  audioBitrate: "64k",         // Lower audio bitrate
}
```

---

## Troubleshooting

### FFmpeg Not Found

```bash
# Check if FFmpeg is in PATH
which ffmpeg
# or on Windows:
where ffmpeg

# Add to PATH if missing
export PATH=$PATH:/usr/local/bin
# or on Windows, set in System Environment Variables
```

### Permission Denied Recording to Directory

```bash
# Ensure write permissions on recording directories
chmod 755 /path/to/recordings
chmod 755 /path/to/hls

# Or set proper ownership
chown -R appuser:appuser /path/to/recordings

# On Windows, check folder properties → Security → Full Control
```

### "Too many open files" Error

```bash
# Increase file descriptor limit (Linux)
ulimit -n 4096

# Or set permanently in /etc/security/limits.conf:
* soft nofile 4096
* hard nofile 65536

# Check current limit
ulimit -n
```

### Slow Recording / High CPU

```bash
# Check preset (use ultrafast for live)
ffmpeg -preset ultrafast ...

# Reduce bitrate
ffmpeg -b:v 1500k ...

# Lower resolution
ffmpeg -vf "scale=640:360" ...

# Monitor CPU usage
top -p $(pgrep ffmpeg)
```

### HLS Segments Not Generating

```bash
# Ensure directory exists and is writable
mkdir -p /path/to/hls/segments
chmod 777 /path/to/hls/segments

# Check FFmpeg output for errors
ffmpeg -rtmp_live live -i rtmp://... -f hls output.m3u8 2>&1 | grep -i error
```

### Recording File Size Too Large

```bash
# Reduce bitrate
-b:v 1500k              # Instead of 2500k
-b:a 96k                # Instead of 128k

# Or use compression
-preset slow            # Better compression (slower)

# Or use H.265 codec
-c:v libx265            # Better compression than H.264
-preset medium
```

---

## Cleanup and Maintenance

### Remove Old Recordings

```bash
# Manual cleanup of recordings older than 7 days
find /path/to/recordings -name "*.mp4" -mtime +7 -delete

# Or use backend utility:
// In Node.js
const { cleanupOldRecordings } = require("./utils/ffmpeg-recorder");
await cleanupOldRecordings(7); // Delete recordings > 7 days old
```

### Monitor Disk Usage

```bash
# Check recording directory size
du -sh /path/to/recordings
du -sh /path/to/hls

# Find largest files
du -sh /path/to/recordings/* | sort -hr | head -10
```

### Archive Old Recordings

```bash
# Compress recordings older than 30 days
find /path/to/recordings -name "*.mp4" -mtime +30 -exec gzip {} \;

# Or upload to AWS S3 then delete
aws s3 cp /path/to/recordings/old.mp4 s3://my-bucket/archive/
rm /path/to/recordings/old.mp4
```

---

## Production Deployment

### Systemd Service (Linux)

```ini
[Unit]
Description=ZapLav Streaming Backend
After=network.target mongodb.service nginx.service

[Service]
Type=simple
User=zapslav
WorkingDirectory=/opt/zapslav
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create recording directories
RUN mkdir -p recordings hls vod

EXPOSE 5000

CMD ["node", "server.js"]
```

### AWS EC2 Setup

```bash
# Launch EC2 instance (t3.medium or larger for streaming)
# Ubuntu 22.04 LTS AMI

# Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm ffmpeg git

# Clone repository
cd /opt
sudo git clone <your-repo> zapslav
cd zapslav
npm install

# Start backend
npm start
```

---

## Status Monitoring

### Check Recording Process

```bash
# View active FFmpeg processes
ps aux | grep ffmpeg

# Monitor in real-time
top -p $(pgrep -f ffmpeg)

# View system logs
tail -f /var/log/syslog | grep ffmpeg
```

### Backend Logs

```bash
# View application logs
tail -f logs/app.log

# Filter for recording events
grep -i "recording\|ffmpeg" logs/app.log
```

---

## Summary

✅ **Setup Complete** when:
1. ✅ FFmpeg installed and accessible via CLI
2. ✅ Nginx RTMP server running on port 1935
3. ✅ Recording directories created with proper permissions
4. ✅ Backend service integrated with ffmpeg-recorder.js
5. ✅ VOD files storing in /recordings and /hls directories

**Next Steps:**
1. Test with OBS streaming to RTMP
2. Verify MP4 and HLS outputs generated
3. Deploy frontend metrics dashboard
4. Implement VOD playback component

**Timeline:** Phase 1 FFmpeg integration complete  
**Status:** ✅ Production Ready
