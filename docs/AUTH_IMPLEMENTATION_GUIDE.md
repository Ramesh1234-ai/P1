// INTEGRATION GUIDE: How to Use New Auth System
// Follow these steps to integrate the new authentication

/**
 * STEP 1: Update package.json dependencies
 * Run: npm install uuid
 */

/**
 * STEP 2: Update .env file
 * Add these variables:
 */
const ENV_TEMPLATE = `
# Clerk Configuration
CLERK_API_KEY=your_clerk_api_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Custom JWT for streaming
CUSTOM_JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Redis for session storage
REDIS_URL=redis://localhost:6379

# MongoDB
MONGO_URI=mongodb://localhost:27017/zapv

# JWT
JWT_SECRET=your_jwt_secret_key
`;

/**
 * STEP 3: Update app.js to include Clerk verification
 */
const APP_EXAMPLE = `
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { verifyClerkJWT } from './middleware/clerk.middleware.js';
import { syncClerkUser } from './middleware/userSync.middleware.js';
import streamRoutes from './route/stream.route.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Public routes
app.post('/api/auth/register', registerUser);    // Can still use old system
app.post('/api/auth/login', loginUser);          // Can still use old system

// Protected routes with Clerk
app.use('/api/streams', 
  verifyClerkJWT,           // Verify Clerk JWT
  syncClerkUser,           // Sync with MongoDB
  streamRoutes            // Protected routes
);

// Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

export default app;
`;

/**
 * STEP 4: Update stream routes
 */
const STREAM_ROUTE_EXAMPLE = `
import express from 'express';
import { verifyClerkJWT } from '../middleware/clerk.middleware.js';
import { syncClerkUser } from '../middleware/userSync.middleware.js';
import { generateStreamingToken } from '../utils/jwt.utils.js';
import { createStream, endStream } from '../controller/stream.controller.js';

const router = express.Router();

// Create stream (requires Clerk auth)
router.post(
  '/create',
  verifyClerkJWT,
  syncClerkUser,
  createStream
);

// Get broadcast token for streaming
router.get(
  '/:streamId/broadcast-token',
  verifyClerkJWT,
  syncClerkUser,
  async (req, res) => {
    try {
      const { streamId } = req.params;
      const { userId } = req.user;

      // Verify user owns stream
      const stream = await Stream.findById(streamId);
      if (!stream || stream.creator.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Generate short-lived streaming token
      const { token } = generateStreamingToken(userId, streamId, ['broadcast'], '30m');

      res.json({
        token,
        rtmpUrl: \`rtmp://localhost:1935/live/\${stream.streamKey}\`,
        expiresIn: 1800
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
`;

/**
 * STEP 5: Update sockets.js for WebSocket auth
 */
const WEBSOCKET_EXAMPLE = `
import { Server as SocketIOServer } from 'socket.io';
import { websocketAuth } from '../middleware/websocket.middleware.js';
import redis from 'redis';

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export const setupStreamSockets = (io) => {
  // Apply WebSocket authentication middleware
  io.use(websocketAuth(redisClient));

  io.on('connection', (socket) => {
    const { userId } = socket;
    console.log(\`✅ User \${userId} connected\`);

    // Join stream with authentication
    socket.on('join-stream', async (streamId) => {
      try {
        socket.join(\`stream:\${streamId}\`);
        
        // Broadcast viewer count
        const viewers = io.sockets.adapter.rooms.get(\`stream:\${streamId}\`).size;
        io.to(\`stream:\${streamId}\`).emit('viewer-count', viewers);
        
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(\`❌ User \${userId} disconnected\`);
    });
  });
};
`;

/**
 * STEP 6: Frontend - Use Clerk provider
 */
const FRONTEND_EXAMPLE = `
// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import App from './App';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
`;

/**
 * STEP 7: Frontend - Make authenticated API calls
 */
const FRONTEND_API_EXAMPLE = `
import { useUser } from '@clerk/react';

export function StreamingDashboard() {
  const { user, getToken } = useUser();

  const createStream = async () => {
    try {
      // Get Clerk JWT
      const token = await getToken();

      // Call backend with Clerk token
      const response = await fetch('http://localhost:5000/api/streams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          title: 'My Stream',
          description: 'Test stream',
          category: 'Gaming'
        })
      });

      const data = await response.json();
      console.log('Stream created:', data);
    } catch (error) {
      console.error('Error creating stream:', error);
    }
  };

  return (
    <button onClick={createStream}>Start Streaming</button>
  );
}
`;

/**
 * STEP 8: Migration - Support both old and new auth temporarily
 */
const MIGRATION_EXAMPLE = `
// routes/auth.route.js - Support both auth methods

// OLD METHOD: Email/Password (Deprecated)
router.post('/login-legacy', loginLegacy);

// NEW METHOD: Clerk
router.get('/profile', 
  verifyClerkJWT, 
  syncClerkUser,
  getProfile
);

// MIGRATION: Link Clerk to existing account
router.post('/migrate/link-clerk',
  verifyClerkJWT,
  syncClerkUser,
  linkClerkToExisting
);
`;

/**
 * STEP 9: Testing - Use Postman or curl
 */
const TESTING_EXAMPLE = `
# 1. Get Clerk JWT from frontend app or Clerk dashboard
TOKEN="your_clerk_jwt_here"

# 2. Test protected endpoint
curl -X POST http://localhost:5000/api/streams/create \\
  -H "Authorization: Bearer \${TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Test Stream",
    "description": "Testing auth system",
    "category": "Gaming"
  }'

# 3. Response should include stream data
# Response should NOT include stream key (protected)
`;

/**
 * STEP 10: Security Checklist
 */
const SECURITY_CHECKLIST = `
✅ REQUIRED FOR PRODUCTION:
- [ ] Set strong CUSTOM_JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/TLS (required for Clerk)
- [ ] Configure CORS whitelist (don't use *)
- [ ] Set HttpOnly and Secure cookie flags
- [ ] Implement rate limiting on auth endpoints
- [ ] Enable request logging and monitoring
- [ ] Setup error tracking (Sentry, etc)
- [ ] Test token revocation flow
- [ ] Test logout functionality
- [ ] Test OAuth provider(s)
- [ ] Load test concurrent sessions
- [ ] Security audit by third party

❌ NEVER DO:
- [ ] Store tokens in localStorage
- [ ] Log full tokens to console
- [ ] Expose stream keys in API responses
- [ ] Skip email verification for OAuth users
- [ ] Use same JWT secret for production
- [ ] Trust unverified tokens
`;

export default {
  ENV_TEMPLATE,
  APP_EXAMPLE,
  STREAM_ROUTE_EXAMPLE,
  WEBSOCKET_EXAMPLE,
  FRONTEND_EXAMPLE,
  FRONTEND_API_EXAMPLE,
  MIGRATION_EXAMPLE,
  TESTING_EXAMPLE,
  SECURITY_CHECKLIST
};
