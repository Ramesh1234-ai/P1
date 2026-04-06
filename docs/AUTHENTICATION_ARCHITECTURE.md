# 🔐 Secure Authentication Architecture for LiveStream App
**Senior Backend Architect Design** | **April 5, 2026**

---

## 📋 EXECUTIVE SUMMARY

### **Recommended Final Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (FRONTEND)                        │
│              React + Clerk Auth Provider                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
    ┌───────▼────────┐   ┌───────▼────────┐
    │  REST API      │   │  WebSocket     │
    │  (HTTP)        │   │  (WS)          │
    └────────┬────────┘   └────────┬───────┘
             │                     │
    ┌────────▼─────────────────────▼────────┐
    │  Backend (Node.js/Express)             │
    │  ┌──────────────────────────────────┐ │
    │  │ Layer 1: Clerk Verification      │ │
    │  │ - Verify Clerk JWT               │ │
    │  │ - Extract user identity          │ │
    │  └──────────────────────────────────┘ │
    │  ┌──────────────────────────────────┐ │
    │  │ Layer 2: Custom JWT (Optional)   │ │
    │  │ - Streaming sessions             │ │
    │  │ - WebSocket auth                 │ │
    │  │ - API tokens                     │ │
    │  └──────────────────────────────────┘ │
    │  ┌──────────────────────────────────┐ │
    │  │ Layer 3: Routes & Logic          │ │
    │  │ - Protected endpoints            │ │
    │  │ - Business logic                 │ │
    │  └──────────────────────────────────┘ │
    └────────┬─────────────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ MongoDB + Redis               │
    │ - User sessions (Redis)       │
    │ - User data & streams (Mongo) │
    └───────────────────────────────┘
```

---

## 🆚 CLERK vs CUSTOM JWT: DECISION MATRIX

### **When to Use Clerk JWT**
| Use Case | Priority | Why |
|----------|----------|-----|
| **User Registration/Login** | 🔴 **PRIMARY** | Industry-standard OAuth provider |
| **Web UI Authentication** | 🔴 **PRIMARY** | Pre-built secure UI, SSRF protection |
| **Multi-device sessions** | 🔴 **PRIMARY** | Manages tokens across devices |
| **Email verification** | 🟠 **IMPORTANT** | Built-in email confirmation |
| **Rate limiting** | 🟠 **IMPORTANT** | Clerk provides DoS protection |

### **When to Use Custom JWT**
| Use Case | Priority | Why |
|----------|----------|-----|
| **WebSocket auth** | 🔴 **CRITICAL** | Clerk JWT not ideal for persistent connections |
| **Streaming sessions** | 🔴 **CRITICAL** | Need short-lived tokens for broadcast |
| **RTMP authentication** | 🟠 **IMPORTANT** | RTMP protocol needs custom auth |
| **API tokens** | 🟠 **IMPORTANT** | Programmatic access (bots, third-party) |
| **Offline tokens** | 🟠 **IMPORTANT** | Some mobile clients need refresh tokens |

---

## 🏗️ FINAL RECOMMENDED ARCHITECTURE

### **3-Tier Authentication System**

```
TIER 1: Clerk JWT (Primary)
├─ Validates user identity
├─ Manages OAuth providers
├─ Handles email verification
└─ Issues standard JWT tokens

TIER 2: Custom JWT (Secondary)
├─ Streaming session tokens (short-lived: 5-15 min)
├─ WebSocket upgrade tokens (5 min expiry)
├─ RTMP broadcast keys (stream-specific)
└─ Refresh tokens (90 days)

TIER 3: Session Storage (Redis)
├─ Active streaming sessions
├─ User logout blacklist
├─ Rate limiting counters
└─ Real-time connection metadata
```

### **Token Types & Lifetimes**

```javascript
// Clerk JWT (from Clerk)
{
  iss: "https://clerk.example.com",
  exp: 3600 + now,           // 1 hour (Clerk default)
  iat: now,
  azp: "CLIENT_ID",
  sub: "user_123",
  email: "user@example.com",
  email_verified: true
}

// Custom JWT - Streaming Session (SHORT-LIVED)
{
  type: "STREAMING",
  streamId: "stream_456",
  userId: "user_123",
  permissions: ["broadcast"],
  exp: now + 15*60,           // 15 minutes
  iat: now,
  jti: "jwt_uuid_token"
}

// Custom JWT - WebSocket Auth (SHORT-LIVED)
{
  type: "WEBSOCKET",
  userId: "user_123",
  socketId: "socket_789",
  exp: now + 5*60,            // 5 minutes
  iat: now,
  jti: "jwt_uuid_token"
}

// Custom JWT - Refresh Token (LONG-LIVED)
{
  type: "REFRESH",
  userId: "user_123",
  exp: now + 90*24*3600,      // 90 days
  iat: now,
  jti: "jwt_uuid_token",
  tokenFamily: "token_family_123"  // Prevent replay attacks
}
```

---

## 🔒 SECURITY BEST PRACTICES

### **1. Token Management**
```
✅ DO:
  - Store Clerk JWT in secure HttpOnly cookie (frontend handles this)
  - Store custom JWT in memory + HttpOnly cookie
  - Validate jti (token ID) to prevent replay attacks
  - Rotate refresh token family on each use
  - Implement token blacklist for logout

❌ DON'T:
  - Store tokens in localStorage (XSS vulnerability)
  - Expose stream keys in API responses
  - Reuse same token for different purposes
  - Ignore token expiration
  - Log full tokens in console/logging
```

### **2. Preventing Token Misuse**
```javascript
// Bind tokens to specific resources
{
  streamId: "stream_123",      // Only valid for this stream
  userId: "user_123",          // Only valid for this user
  ipAddress: "192.168.1.1",    // Optional: bind to IP
  userAgent: "Mozilla...",     // Optional: bind to browser
  jti: "unique_uuid"           // Prevent replay/duplication
}
```

### **3. OAuth User Safety**
```javascript
// When user signs in via Google/GitHub:
1. Clerk provides verified email & identity
2. Check if user exists by email in MongoDB
3. If new user: Create record with:
   {
     clerkId: "user_123",           // Link to Clerk
     email: verified_email,         // Already verified
     firstName: from_oauth_provider,
     authProvider: "google",       // Track provider
     emailVerified: true,          // Pre-verified
     password: null                // No password for OAuth users
   }
4. Never let OAuth users use password reset flows
5. Enforce email-based authentication for OAuth users
```

---

## 💻 BACKEND IMPLEMENTATION

### **1. Verify Clerk JWT Middleware**

```javascript
// middleware/clerk.middleware.js
import { verifyToken } from '@clerk/backend';

export const verifyClerkJWT = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Missing session token',
        code: 'NO_SESSION'
      });
    }

    // Verify against Clerk
    const decoded = await verifyToken(sessionToken, {
      apiKey: process.env.CLERK_API_KEY,
    });

    // Extract user identity
    req.user = {
      clerkId: decoded.sub,
      email: decoded.email,
      emailVerified: decoded.email_verified,
      firstName: decoded.first_name,
      lastName: decoded.last_name,
      image: decoded.image_url,
      role: 'user' // Add custom roles if needed
    };

    next();
  } catch (error) {
    console.error('❌ Clerk JWT verification failed:', error.message);
    return res.status(401).json({ 
      error: 'Invalid session',
      code: 'INVALID_SESSION',
      details: error.message
    });
  }
};
```

### **2. Extract User Identity Securely**

```javascript
// middleware/getUserIdentity.js
import User from '../models/User.models.js';

export const syncClerkUser = async (req, res, next) => {
  try {
    const { clerkId, email } = req.user;
    
    // Find or create MongoDB user record
    let dbUser = await User.findOne({ clerkId });
    
    if (!dbUser) {
      // Check if user exists by email (migration case)
      dbUser = await User.findOne({ email });
      
      if (dbUser) {
        // Link existing user to Clerk account
        dbUser.clerkId = clerkId;
        dbUser.emailVerified = true;
        await dbUser.save();
      } else {
        // Create new user
        dbUser = await User.create({
          clerkId,
          email,
          firstName: req.user.firstName || '',
          lastName: req.user.lastName || '',
          avatarUrl: req.user.image || '',
          emailVerified: true,
          // No password for Clerk users
        });
      }
    }
    
    // Attach MongoDB user ID to request
    req.user.userId = dbUser._id.toString();
    req.user.dbUser = dbUser;
    
    next();
  } catch (error) {
    console.error('❌ User sync failed:', error.message);
    return res.status(500).json({ 
      error: 'Failed to sync user',
      code: 'USER_SYNC_FAILED'
    });
  }
};
```

### **3. Custom JWT Utilities**

```javascript
// utils/jwt.utils.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const CUSTOM_JWT_SECRET = process.env.CUSTOM_JWT_SECRET;
const TOKEN_JWTID_PREFIX = 'jti_';

/**
 * Generate custom JWT for streaming sessions
 */
export const generateStreamingToken = (userId, streamId, expiresIn = '15m') => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();
  
  const token = jwt.sign(
    {
      type: 'STREAMING',
      userId,
      streamId,
      permissions: ['broadcast', 'publish'],
    },
    CUSTOM_JWT_SECRET,
    { 
      expiresIn,
      jwtid: jti,
      algorithm: 'HS256'
    }
  );
  
  return { token, jti };
};

/**
 * Generate WebSocket upgrade token
 */
export const generateWebSocketToken = (userId, expiresIn = '5m') => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();
  
  const token = jwt.sign(
    {
      type: 'WEBSOCKET',
      userId,
    },
    CUSTOM_JWT_SECRET,
    { 
      expiresIn,
      jwtid: jti,
    }
  );
  
  return { token, jti };
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId, tokenFamily = null) => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();
  const family = tokenFamily || crypto.randomBytes(16).toString('hex');
  
  const token = jwt.sign(
    {
      type: 'REFRESH',
      userId,
      tokenFamily: family,
    },
    CUSTOM_JWT_SECRET,
    { 
      expiresIn: '90d',
      jwtid: jti,
    }
  );
  
  return { token, jti, tokenFamily: family };
};

/**
 * Verify custom JWT token
 */
export const verifyCustomJWT = (token, expectedType = null) => {
  try {
    const decoded = jwt.verify(token, CUSTOM_JWT_SECRET);
    
    if (expectedType && decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType}, got ${decoded.type}`);
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Revoke token (add to blacklist)
 */
export const revokeToken = async (jti, redis) => {
  const ttl = 24 * 60 * 60; // 24 hours
  await redis.setex(`token:blacklist:${jti}`, ttl, 'revoked');
};

/**
 * Check if token is revoked
 */
export const isTokenRevoked = async (jti, redis) => {
  const revoked = await redis.get(`token:blacklist:${jti}`);
  return !!revoked;
};
```

### **4. WebSocket Authentication**

```javascript
// sockets.js - WebSocket connection handling
import { verifyCustomJWT } from './utils/jwt.utils.js';

export const setupStreamSockets = (io, redis) => {
  // Middleware to verify WebSocket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('WebSocket authentication failed: No token'));
      }
      
      const decoded = verifyCustomJWT(token, 'WEBSOCKET');
      
      socket.userId = decoded.userId;
      socket.tokenJti = decoded.jti;
      
      next();
    } catch (error) {
      console.error('❌ WebSocket auth failed:', error.message);
      next(new Error(`WebSocket authentication failed: ${error.message}`));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} connected via WebSocket`);
    
    // Join stream room with authentication check
    socket.on('join-stream', async (streamId) => {
      try {
        // Verify user can watch this stream (add permission checks here)
        socket.join(`stream:${streamId}`);
        
        // Store session in Redis
        await redis.setex(
          `websocket:${socket.id}`,
          3600,
          JSON.stringify({
            userId: socket.userId,
            streamId,
            connectedAt: new Date()
          })
        );
        
        console.log(`👤 User joined stream ${streamId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', async () => {
      await redis.del(`websocket:${socket.id}`);
      console.log(`❌ User ${socket.userId} disconnected`);
    });
  });
};
```

### **5. Protected Routes**

```javascript
// routes/stream.route.js
import express from 'express';
import { verifyClerkJWT } from '../middleware/clerk.middleware.js';
import { syncClerkUser } from '../middleware/getUserIdentity.js';

const router = express.Router();

// Protect route with Clerk JWT
router.post(
  '/create',
  verifyClerkJWT,      // Step 1: Verify Clerk token
  syncClerkUser,       // Step 2: Find/create MongoDB user
  createStream         // Step 3: Business logic
);

// Streaming broadcast endpoint (requires streaming token)
router.get(
  '/:streamId/broadcast-key',
  verifyClerkJWT,
  syncClerkUser,
  async (req, res) => {
    try {
      const { streamId } = req.params;
      const { userId } = req.user;
      
      // Check if user owns this stream
      const stream = await Stream.findById(streamId);
      if (!stream || stream.creator.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Generate short-lived streaming token
      const { token: streamToken } = generateStreamingToken(userId, streamId, '30m');
      
      return res.json({
        streamKey: stream.streamKey,
        rtmpUrl: `rtmp://localhost:1935/live/${stream.streamKey}`,
        broadcastToken: streamToken,
        expiresIn: 1800 // 30 minutes
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
```

---

## 🔄 MIGRATION STRATEGY

### **Phase 1: Dual Authentication (Week 1)**
```javascript
// Run both Clerk + Custom JWT simultaneously

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Step 1: Check if user has password (old system)
  const user = await User.findOne({ email });
  
  if (user?.password) {
    // OLD SYSTEM: Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Generate custom JWT (backward compatible)
    const { token } = generateCustomJWT(user._id);
    
    // Mark user for migration
    user.migrationStatus = 'pending-clerk';
    await user.save();
    
    return res.json({ 
      token,
      message: 'Login successful. Please sign up with Clerk on next visit.'
    });
  }
  
  // NEW SYSTEM: User should use Clerk
  return res.status(401).json({ 
    error: 'Please sign in with Clerk',
    code: 'USE_CLERK'
  });
});
```

### **Phase 2: Migrating Existing Users**
```javascript
// Create endpoint to link Clerk account to existing user

router.post('/migrate/link-clerk', verifyClerkJWT, syncClerkUser, async (req, res) => {
  try {
    const { email } = req.user;
    
    // Find old user by email
    const oldUser = await User.findOne({ email, clerkId: null });
    
    if (!oldUser) {
      return res.json({ 
        status: 'already_migrated',
        message: 'This account is already using Clerk'
      });
    }
    
    // Link Clerk account to existing user
    oldUser.clerkId = req.user.clerkId;
    oldUser.emailVerified = true;
    oldUser.password = null;  // Remove password
    oldUser.migrationStatus = 'migrated';
    await oldUser.save();
    
    return res.json({
      status: 'migrated',
      message: 'Account successfully linked to Clerk'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **Phase 3: Disable Old Authentication (Week 2)**
```javascript
// Update login endpoint to reject old authentication method

router.post('/login', async (req, res) => {
  return res.status(410).json({
    error: 'Password-based login is deprecated',
    message: 'Please use Clerk authentication',
    code: 'CLERK_REQUIRED'
  });
});
```

### **Phase 4: Audit & Cleanup (Week 3)**
```javascript
// Find users still using old system

const unmigrated = await User.find({
  clerkId: null,
  password: { $exists: true, $ne: null }
});

// Send migration reminder emails
// Set deadline for full migration
// Archive old user data
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### **Backend Setup**
- [ ] Install `@clerk/clerk-sdk-node` and `jsonwebtoken`
- [ ] Set up `.env` with `CLERK_API_KEY` and `CUSTOM_JWT_SECRET`
- [ ] Create Clerk middleware
- [ ] Implement user sync logic
- [ ] Add custom JWT utilities
- [ ] Update stream routes with auth
- [ ] Implement WebSocket authentication
- [ ] Add token revocation to Redis
- [ ] Create migration endpoints

### **Frontend Setup**
- [ ] Install `@clerk/clerk-react`
- [ ] Wrap app with `<ClerkProvider>`
- [ ] Add `<SignIn>` and `<SignUp>` components
- [ ] Implement `useUser()` hook in protected pages
- [ ] Create custom JWT request interceptor
- [ ] Handle Clerk session in fetch calls
- [ ] Store custom JWT in secure storage
- [ ] Implement logout (clear both tokens)

### **Database Updates**
- [ ] Add `clerkId` field to User model
- [ ] Add `emailVerified` field to User model
- [ ] Create migration tool
- [ ] Backup existing user data
- [ ] Add indexes on `clerkId` and `email`

### **Testing**
- [ ] Test Clerk OAuth flow end-to-end
- [ ] Test custom JWT generation/validation
- [ ] Test WebSocket authentication
- [ ] Test old user migration
- [ ] Test token expiration & refresh
- [ ] Test logout/token revocation
- [ ] Load test concurrent sessions
- [ ] Security test: Token replay attacks

---

## 🚨 COMMON PITFALLS TO AVOID

### **1. Mixing Authentication Methods**
❌ **WRONG:**
```javascript
// Accepting both Clerk JWT and old JWT on same endpoint
if (clerkToken) {
  // verify Clerk
} else if (oldToken) {
  // verify old token
}
```

✅ **RIGHT:**
```javascript
// Explicit endpoint migrations
router.post('/api/v2/routes', verifyClerkJWT);  // New endpoints
router.post('/api/v1/routes', verifyOldJWT);   // Legacy endpoints
```

### **2. Exposing Stream Keys**
❌ **WRONG:**
```javascript
res.json({ streamKey: stream.streamKey }); // Public response
```

✅ **RIGHT:**
```javascript
// Only send key to authenticated broadcaster
if (req.user.userId !== stream.creator) {
  throw new Error('Unauthorized');
}
res.json({ streamKey: stream.streamKey });
```

### **3. Not Handling Token Expiration**
❌ **WRONG:**
```javascript
const token = jwt.sign(data, secret); // No expiration
```

✅ **RIGHT:**
```javascript
const token = jwt.sign(data, secret, { expiresIn: '15m' });
```

### **4. Storing Tokens in localStorage**
❌ **WRONG:**
```javascript
localStorage.setItem('token', jwt);  // XSS vulnerable
```

✅ **RIGHT:**
```javascript
// Let Clerk manage cookies (automatic)
// Store custom JWT in HttpOnly cookie (backend sets)
// Keep in memory during session
```

---

## 📊 TOKEN LIFECYCLE DIAGRAM

```
User Login (Clerk)
      ↓
┌─────────────────────────────────────┐
│ Clerk Issues JWT (1 hour expiry)    │
│ Stored in HttpOnly cookie           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Frontend: useAuth() hook            │
│ Automatically refreshes on expiry   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Request to Backend with Clerk JWT   │
│ Authorization: Bearer <clerk_jwt>   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Backend: verifyClerkJWT middleware  │
│ Validates with Clerk API            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Extract user identity & sync DB     │
│ Attach req.user from MongoDB        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ IF streaming: Generate custom JWT   │
│ Short-lived (5-15 min)              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ Pass to RTMP server / WebSocket     │
│ Used for resource-specific auth     │
└─────────────────────────────────────┘
```

---

## 🔗 INTEGRATION POINTS

| Component | Authentication | Token Type | Duration |
|-----------|------------------|-----------|----------|
| **REST API** | Clerk JWT | Bearer token | 1 hour |
| **WebSocket** | Custom JWT | Bearer token | 5 min |
| **RTMP Broadcast** | Custom JWT | Query param | Stream duration |
| **VOD/Recording** | Clerk JWT | Bearer token | 1 hour |
| **Refresh Auth** | Custom JWT | HttpOnly cookie | 90 days |

---

## ✅ PRODUCTION CHECKLIST

- [ ] Enable HTTPS/TLS (required for Clerk)
- [ ] Set secure cookies: `Secure`, `HttpOnly`, `SameSite=Strict`
- [ ] Implement CORS properly (whitelist allowed origins)
- [ ] Add rate limiting on auth endpoints
- [ ] Monitor auth failures for attack patterns
- [ ] Implement brute force detection
- [ ] Add 2FA support (if needed)
- [ ] Regularly rotate JWT secrets
- [ ] Monitor token expiration logs
- [ ] Test OAuth provider failover
- [ ] Setup automated security audits

---

## 📚 REFERENCES

- [Clerk Documentation](https://clerk.com/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
