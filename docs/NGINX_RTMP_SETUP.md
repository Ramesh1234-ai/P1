# Nginx RTMP Server Setup Guide

## Overview
This guide covers setting up Nginx with RTMP module for local live streaming development. The RTMP server will:
- Accept streams from OBS/FFmpeg on port 1935
- Convert RTMP to HLS for web playback on port 8080
- Track active streams and provide statistics
---
## Local Development Setup
### Windows Setup
#### Option 1: Using Pre-compiled Nginx with RTMP (EASIEST)
1. **Download Nginx with RTMP pre-compiled:**
   - Go to: https://github.com/illuspas/nginx-rtmp-win32/releases
   - Download latest: `nginx-rtmp-win32-X.X.X.zip`
   - Extract to: `C:\nginx-rtmp` (or your preferred location)

2. **Configure RTMP:**
   ```bash
   cd C:\nginx-rtmp
   # Copy the nginx.rtmp.conf from your project
   copy C:\Users\DELL\Desktop\ZapLav\backend\nginx.rtmp.conf conf\nginx.conf
   ```
3. **Start Nginx:**
   ```bash
   # From C:\nginx-rtmp directory
   nginx.exe
   
   # Or keep it running in background:
   start nginx.exe
   ```
4. **Verify it's running:**
   ```bash
   # Open browser: http://localhost:8080/health
   # Should see: "healthy"
   # Or in terminal:x
   curl http://localhost:8080/health
   ```
5. **Stop Nginx:**
   ```bash
   nginx.exe -s stop
   # Or find nginx.exe in Task Manager and end process
   ```
#### Option 2: Windows Subsystem for Linux (WSL)

If you have WSL installed (Windows 10+):
```bash
# In WSL terminal:
wsl
sudo apt-get update
sudo apt-get install nginx libnginx-mod-rtmp -y
# Copy config
sudo cp /mnt/c/Users/DELL/Desktop/ZapLav/backend/nginx.rtmp.conf /etc/nginx/nginx.conf

# Start Nginx
sudo systemctl start nginx
sudo systemctl status nginx
# View logs
sudo tail -f /var/log/nginx/error.log
```

---

### Mac Setup
#### Using Homebrew (RECOMMENDED)

```bash
# Install Nginx with RTMP module
brew install nginx-full --with-rtmp

# Copy your config file
cp ~/Desktop/ZapLav/backend/nginx.rtmp.conf /usr/local/etc/nginx/nginx.conf

# Start Nginx
brew services start nginx

# Verify
curl http://localhost:8080/health

# Stop
brew services stop nginx

# Restart after config changes
brew services restart nginx
```

#### From Source (More Control)

```bash
# Clone nginx source
cd ~/Downloads
wget http://nginx.org/download/nginx-1.25.3.tar.gz
tar xzf nginx-1.25.3.tar.gz

# Clone RTMP module
git clone https://github.com/arut/nginx-rtmp-module.git

# Compile
cd nginx-1.25.3
./configure \
  --with-http_ssl_module \
  --with-http_v2_module \
  --add-module=../nginx-rtmp-module
make
sudo make install

# Copy config
sudo cp ~/Desktop/ZapLav/backend/nginx.rtmp.conf /usr/local/nginx/conf/nginx.conf

# Start
sudo /usr/local/nginx/sbin/nginx

# Stop
sudo /usr/local/nginx/sbin/nginx -s stop
```

---

### Linux Setup (Ubuntu/Debian)

#### Using PPA (EASIEST)

```bash
# Add PPA with RTMP module pre-built
sudo add-apt-repository ppa:antonov/deb-nginx-rtmp
sudo apt-get update
sudo apt-get install nginx-full -y

# Copy config
sudo cp ~/Desktop/ZapLav/backend/nginx.rtmp.conf /etc/nginx/nginx.conf

# Start
sudo systemctl start nginx
sudo systemctl enable nginx  # Auto-start on boot

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

#### From Source

```bash
# Install dependencies
sudo apt-get install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev -y

# Download
cd ~/Downloads
wget http://nginx.org/download/nginx-1.25.3.tar.gz
tar xzf nginx-1.25.3.tar.gz
git clone https://github.com/arut/nginx-rtmp-module.git

# Compile
cd nginx-1.25.3
./configure \
  --prefix=/etc/nginx \
  --sbin-path=/usr/sbin/nginx \
  --with-http_ssl_module \
  --with-http_v2_module \
  --add-module=../nginx-rtmp-module

make
sudo make install

# Copy config
sudo cp ~/Desktop/ZapLav/backend/nginx.rtmp.conf /etc/nginx/nginx.conf

# Create systemd service file for auto-start
sudo tee /etc/systemd/system/nginx.service > /dev/null <<EOF
[Unit]
Description=NGINX HTTP with RTMP Module
After=network.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/usr/sbin/nginx -s reload
ExecStop=/bin/kill -s QUIT \$MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Docker Setup (RECOMMENDED FOR PRODUCTION)

### Docker Compose Setup

Create `docker-compose-nginx.yml` in your project root:

```yaml
version: '3.8'

services:
  nginx-rtmp:
    image: tiangolo/nginx-rtmp:latest
    container_name: zapslav-nginx-rtmp
    ports:
      - "1935:1935"  # RTMP
      - "8080:80"    # HTTP (HLS/DASH)
    volumes:
      - ./backend/nginx.rtmp.conf:/etc/nginx/nginx.conf:ro
      - rtmp-media:/tmp/hls
      - rtmp-dash:/tmp/dash
    environment:
      - TZ=UTC
    networks:
      - zapslav-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  rtmp-media:
  rtmp-dash:

networks:
  zapslav-network:
    driver: bridge
```

Run with:
```bash
docker-compose -f docker-compose-nginx.yml up -d

# Check logs
docker-compose -f docker-compose-nginx.yml logs -f nginx-rtmp

# Stop
docker-compose -f docker-compose-nginx.yml down
```

---

## Testing the Setup

### 1. Check Nginx Health
```bash
curl http://localhost:8080/health
# Expected: "healthy"
```

### 2. Check RTMP Statistics
```bash
# Open in browser: http://localhost:8080/stat
# Shows XML with active streams
```

### 3. Stream from OBS

**OBS Settings:**
- **Stream Service:** Custom
- **Server:** rtmp://localhost:1935/live
- **Stream Key:** test-stream-key-uuid-here
- **Output:** 1920x1080 @ 2500kbps

**Start Streaming:**
1. Click "Start Streaming" in OBS
2. Check Nginx stats: http://localhost:8080/stat
3. Watch HLS: http://localhost:8080/hls/test-stream-key-uuid-here.m3u8

### 4. Stream from FFmpeg (CLI)

```bash
# Capture desktop and stream to Nginx
ffmpeg -f gdigrab -i desktop -f lavfi -i anullsrc=r=44100:cl=mono \
  -c:v libx264 -preset ultrafast -b:v 2500k -maxrate 2500k -bufsize 5000k \
  -c:a aac -b:a 128k \
  -rtmp_live live -f flv rtmp://localhost:1935/live/test-stream

# Alt: Stream from file
ffmpeg -re -i input.mp4 -c:v libx264 -preset ultrafast -b:v 2500k \
  -c:a aac -b:a 128k \
  -f flv rtmp://localhost:1935/live/test-stream
```

### 5. Watch HLS Stream

```bash
# Using FFplay
ffplay http://localhost:8080/hls/test-stream.m3u8

# Or paste in VLC Media Player:
# Media → Open Network Stream → 
# http://localhost:8080/hls/test-stream.m3u8
```

---

## Common Issues & Fixes

### "Address already in use" Error

```bash
# Port 1935 is in use by another process
# Find what's using it:

# Windows
netstat -ano | findstr :1935

# Mac/Linux
lsof -i :1935
sudo kill -9 <PID>
```

### HLS File Not Generating

```bash
# Ensure /tmp/hls directory exists with proper permissions

# Linux/Mac
sudo mkdir -p /tmp/hls
sudo chmod 777 /tmp/hls

# WSL
mkdir -p /tmp/hls
chmod 777 /tmp/hls
```

### RTMP Not Accepting Streams

```bash
# Check Nginx error log
# Windows: C:\nginx-rtmp\logs\error.log
# Mac: /usr/local/var/log/nginx/error.log
# Linux: /var/log/nginx/error.log

tail -f /var/log/nginx/error.log

# Verify Nginx is running
# Windows: Check Task Manager
# Mac/Linux: ps aux | grep nginx
```

### Permission Denied in WSL

```bash
# Run with sudo
sudo nginx -s reload
```

---

## Configuration Reference

### Key RTMP Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `listen` | 1935 | RTMP port (standard) |
| `chunk_size` | 4096 | Buffer size for streaming |
| `max_message` | 12M | Max message size |
| `hls_fragment` | 10s | HLS segment duration |
| `hls_playlist_length` | 60s | Keep last 60s of segments |
| `allow/deny publish` | IPs | Control who can stream |

### Production Considerations

1. **Security:**
   - Restrict publish to trusted IPs only
   - Use firewall to block direct access
   - Consider nginx-rtmp with SSL/TLS

2. **Performance:**
   - Tune `worker_processes` to CPU count
   - Increase `worker_connections` for many viewers
   - Use SSD for HLS temp storage

3. **Monitoring:**
   - Watch `/var/log/nginx/error.log`
   - Monitor CPU/Memory usage
   - Use Nginx stats XML endpoint

4. **Storage:**
   - Cleanup old HLS segments (auto with `hls_cleanup on`)
   - Archive recordings to S3 after stream ends
   - Monitor disk space for recordings

---

## Integration with Node.js Backend

Your Node.js server (port 5000) will:

1. **Create Stream:** Generate unique key → return `rtmpUrl = rtmp://localhost:1935/live/{key}`
2. **Accept RTMP:** OBS/FFmpeg streams to that URL
3. **Monitor via Socket.IO:** Track viewer count, metrics, health in real-time
4. **Record Content:** FFmpeg watches HLS → saves to MP4/preserves HLS for VOD

---

## Next Steps

1. ✅ **Install Nginx with RTMP** (this guide)
2. 🔲 **Configure FFmpeg Recording** (ffmpeg-recorder.js)
3. 🔲 **Build Metrics Dashboard** (frontend component)
4. 🔲 **Implement VOD Playback** (video player)

---

## Support Commands

```bash
# Check Nginx version
nginx -v

# Test configuration
nginx -t

# Reload config without stopping streams
nginx -s reload

# Stop gracefully
nginx -s stop

# Restart
nginx -s stop && nginx

# View live log
tail -f /var/log/nginx/error.log

# Check processes
ps aux | grep nginx
```

---

**Status:** ✅ Setup Guide Complete  
**Next Phase:** FFmpeg Recording Integration  
**Timeline:** Ready for Phase 2 implementation
