# 🚀 ZapLav Implementation Guide
## Quick Start to Production-Ready MVP
**Last Updated:** March 22, 2026 | **Focus:** MERN Streaming + Payments + Chatbot
---
## 📋 QUICK REFERENCE
### Priority Fixes (This Week)
```
[ ] 3. Fix profile.jsx component (1h) - QUICK WIN
```
### Phase 2 (Week 2-3)
```
[ ] 7. Implement HLS encoder - STREAMING
[ ] 8. Integrate video.js player - STREAMING
```
### Phase 3 (Week 4-5)
```
[ ] 9. Stripe payment integration - MONETIZATION
[ ] 10. Super chat feature - REVENUE
```
---
## 🔐 FIX #2: ADD GOOGLE OAUTH BACKEND (BLOCKING)
### What's Wrong
- Frontend has Google Sign-In button
- Backend has no OAuth token validation
- Google auth doesn't create user account
### Solution (4-6 hours)
#### Step 1: Install dependencies
```bash
npm install @react-oauth/google jsonwebtoken google-auth-library
```

#### Step 2: Create OAuth controller
Create `backend/controller/oauth.controller.js`:
```javascript
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.models.js';
import jwt from 'jsonwebtoken';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        avatarUrl: picture,
        password: 'oauth-user', // Dummy password for OAuth users
      });
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### Step 3: Create OAuth route
Create `backend/route/oauth.route.js`:
```javascript
import express from 'express';
import { googleAuth } from '../controller/oauth.controller.js';

const router = express.Router();

router.post('/auth/google', googleAuth);

export default router;
```

#### Step 4: Register route
Update `backend/server.js`:
```javascript
import oauthRoutes from './route/oauth.route.js';
app.use('/api', oauthRoutes);
```

#### Step 5: Set environment variables
Add to `backend/.env`:
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Get Google Client ID:
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credential (Web app)
5. Copy Client ID

#### Step 6: Update frontend to use new endpoint
Update `@latest/src/components/auth/ClerkPopup.jsx`:
```javascript
const handleGoogleSuccess = async (response) => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential }),
    });
    const data = await res.json();
    localStorage.setItem('token', data.token);
    // Redirect to dashboard
  } catch (error) {
    console.error('Auth failed:', error);
  }
};
```
**Test:** Click Google Sign-In → should create user account → redirect to dashboard
---

## ⚡ FIX #3: FIX PROFILE COMPONENT (QUICK WIN - 5 min)
### Current Code
```jsx
export default function profile(){
  return(
    <>
    <div className="">
      {User.profile}
    </div>
    </>
  );
}
```
### Fixed Code
Create proper profile component at `@latest/src/components/profile/profile.jsx`:
```javascript

```
---
## 🎥 FIX #6: BASIC VIDEO STREAMING SETUP

### Architecture
```
OBS/Broadcaster → RTMP Server → HLS Encoder → CDN → Video.js Player
```

### Option A: Quick Local Setup (2-3 hours)

#### Step 1: Install Nginx with RTMP
```bash
# macOS
brew install nginx-rtmp

# Windows (WSL)
sudo apt-get install nginx
# Add RTMP module separately

# Docker (Recommended)
docker run -d -p 1935:1935 -p 8080:8080 \
  -v $PWD/nginx.conf:/etc/nginx/nginx.conf \
  jasonrivers/nginx-rtmp:latest
```

#### Step 2: Configure Nginx RTMP
Create `nginx.conf`:
```nginx
rtmp {
    server {
        listen 1935;
        application live {
            live on;
            record off;
            exec ffmpeg -i rtmp://localhost:1935/$app/$name \
              -c:v libx264 -c:a aac \
              -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments \
              /tmp/hls/$name.m3u8;
        }
    }
}

http {
    server {
        listen 8080;
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
            add_header Cache-Control "public, max-age=3";
            add_header Access-Control-Allow-Origin "*";
        }
    }
}
```

#### Step 3: Create stream endpoint
Backend endpoint to generate share key:
```javascript
router.post('/api/streams/create', authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  const streamKey = generateUUID();
  const ingestUrl = `rtmp://your-domain.com/live/${streamKey}`;
  
  const stream = new Stream({
    title,
    description,
    streamKey,
    ingestUrl,
    creator: req.user.id,
  });
  await stream.save();
  
  res.json({ streamKey, ingestUrl, playbackUrl: `/hls/${streamKey}.m3u8` });
});
```

#### Step 4: Add video.js player
Frontend player component:
```javascript
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function StreamPlayer({ streamId }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: 'play',
      preload: 'auto',
      sources: [
        {
          src: `http://localhost:8080/hls/${streamId}.m3u8`,
          type: 'application/x-mpegURL',
        },
      ],
    });
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [streamId]);

  return <video ref={videoRef} className="video-js vjs-default-skin w-full h-full" />;
}
```

**Test:** Use OBS → rtmp://localhost/live/[streamKey] → Watch on player

---

## 💳 FIX #9: STRIPE PAYMENT INTEGRATION

### Step 1: Install Stripe
```bash
npm install stripe
```

### Step 2: Create payment controller
`backend/controller/payment.controller.js`:
```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        userId: req.user.id,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      // Update user subscription/credits
      console.log('Payment succeeded:', paymentIntent.id);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook error: ${error.message}`);
  }
};
```

### Step 3: Add payment routes
```javascript
router.post('/api/payments/intent', authMiddleware, createPaymentIntent);
router.post('/api/payments/webhook', handleWebhook);
```

### Step 4: Frontend payment form
```javascript
import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function PaymentForm({ amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Get client secret
    const res = await fetch('/api/payments/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const { clientSecret } = await res.json();

    // Confirm payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      alert(result.error.message);
    } else {
      alert('Payment successful!');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay $' + amount}
      </button>
    </form>
  );
}
```

---

## 🧹 FIX #4: REMOVE FLASK BACKEND (CLEANUP)

### What to do
```bash
# Backup just in case
cp -r app app.backup

# Delete Flask files
rm -rf app/
rm requirements.txt
rm run.py
```

### Why
- Two backends cause confusion
- Data not synced between systems
- Doubles maintenance burden
- Focus on Node.js + MongoDB only

---

## ✅ TESTING CHECKLIST

### Phase 1 (This Week)
- [ ] Google Sign-In creates account
- [ ] Profile page displays & edits
### Phase 2 (Week 2-3)
- [ ] OBS streams to RTMP server
- [ ] Video player shows live stream
- [ ] Viewer count updates in real-time
### Phase 3 (Week 4-5)
- [ ] Payment button opens Stripe modal
- [ ] Payment processes successfully
- [ ] Webhook confirms payment
---
## 🐛 TROUBLESHOOTING
### Chatbot returns 404
```
❌ Verify /api/chat route is registered in server.js
✅ Check OpenAI API key in .env
✅ Ensure authMiddleware is working
```
### Google OAuth fails
```
✅ Check GOOGLE_CLIENT_ID matches frontend
✅ Verify token is being sent from frontend
✅ Check JWT_SECRET is set in .env
```
### Video player shows blank
```
✅ Verify RTMP server is running (check port 1935)
✅ Ensure HLS path is correct
✅ Check CORS headers allow HLS requests
✅ Verify stream is actually live
```
### Payment fails
```
✅ Check STRIPE_SECRET_KEY is valid
✅ Verify amount is in cents (multiply by 100)
✅ Ensure webhook secret is configured
✅ Check SSL certificate for HTTPS
```
---
## 📁 DIRECTORY STRUCTURE TO CREATE

```
backend/
├── controller/
│   ├── chatbot.controller.js      ← NEW
│   ├── oauth.controller.js        ← NEW
│   ├── payment.controller.js      ← NEW
│   ├── user.controller.js
│   └── stream.controller.js
├── route/
│   ├── chatbot.route.js           ← NEW
│   ├── oauth.route.js             ← NEW
│   ├── payment.route.js           ← NEW
│   ├── user.route.js
│   └── stream.route.js
├── models/
│   ├── Payment.models.js          ← NEW
│   ├── ChatMessage.models.js      ← NEW
│   ├── User.models.js
│   └── Stream.models.js
├── .env                           (update with new keys)
└── server.js                      (register new routes)
@latest/src/
├── components/
│   ├── profile/
│   │   └── profile.jsx            ← FIX
│   ├── pages/
│   │   ├── StreamPlayer.jsx       ← ENHANCE
│   │   └── payment/
│   │       └── PaymentForm.jsx    ← NEW
│   └── chatbot/
│       └── useChatbot.js          ← Already done
```
---
## 🚀 DEPLOYMENT CHECKLIST
Before going to production:
- [ ] All tests pass
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Database backed up
- [ ] Stripe keys verified
- [ ] CORS whitelisted properly
- [ ] Input sanitization added
- [ ] Load testing completed
---
## 📊 TIME ESTIMATE
| Task | Duration | Status |
|------|----------|--------|
| Fix chatbot endpoint | 0.5h | ⏳ |
| Add OAuth backend | 1h | ⏳ |
| Fix profile stub | 0.25h | ⏳ |
| Remove Flask backend | 0.5h | ✅ |
| **Week 1 Total** | **2.25h** | |
| Set up RTMP/HLS | 3h | ⏳ |
| Video.js player | 1h | ⏳ |
| **Week 2 Total** | **4h** | |
| Stripe integration | 2h | ⏳ |
| Super chat feature | 1h | ⏳ |
| **Week 3 Total** | **3h** | |
| **Grand Total** | **9.25h** | |
---
## 🎯 NEXT IMMEDIATE STEPS
```
THIS WEEK:
8. Fix profile.jsx component
9. Delete Flask backend files
```
---
## 📞 QUICK REFERENCE COMMANDS
```bash
# Start backend
cd backend
npm install
npm start
# Start frontend
cd @latest
npm install
npm run dev
```
---
**Now go build! Start with the chatbot endpoint today. 🚀**
