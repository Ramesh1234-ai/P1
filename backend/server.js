import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupStreamSockets } from "./sockets.js";
import { initializeRecordingDirs } from "./utils/ffmpeg-recorder.js";
const PORT = process.env.PORT || 5000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
// Initialize recording directories on startup
await initializeRecordingDirs();
// Setup Socket.IO event handlers for streaming
setupStreamSockets(io);
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 Waiting for RTMP streams at rtmp://localhost:1935/live/`);
  console.log(`🎥 Recording directories initialized`);
  console.log("JWT_SECRET:", process.env.JWT_SECRET);
});