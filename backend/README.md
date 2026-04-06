# ZapLav Backend - Profile & User Management System

A robust Express.js backend for managing user profiles, authentication, settings, and API keys with MongoDB for data persistence.

## Features
✅ **User Authentication**
- Register with email and password
- Login with JWT token generation
- Secure password hashing with bcrypt
✅ **Profile Management**
- Get and update user profile information
- Manage first name, last name, bio, and avatar
- User profile avatar initialization
✅ **Notification Settings**
- Email notifications toggle
- Push notifications toggle
- Marketing emails toggle
- Analytics & data collection toggle
✅ **Privacy & Security**
- Secure password change functionality
- Security information retrieval
- Login activity tracking
- Account security status
✅ **API Key Management**
- Generate multiple API keys
- Name and track API keys
- Delete API keys safely
- Track API key creation and usage
✅ **Real-time Features**
- Socket.IO integration for live streaming
- Real-time viewer count
- Live chat functionality
## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB 9.3.1
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt 6.0.0
- **Real-time**: Socket.IO 4.8.3
- **Environment**: dotenv 17.3.1
- **Development**: nodemon 3.1.14

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/zaplav
JWT_SECRET=your_secret_key_here
```

4. **Start the server**
```bash
# Development with auto-reload
npm run dev

# Production
npm start

# Server runs on http://localhost:5000
```

## Project Structure

```
backend/
├── app.js                 # Express app configuration
├── server.js             # Server entry point
├── package.json          # Dependencies
├── .env.example          # Environment template
│
├── controller/
│   └── user.controller.js        # User/Profile logic
│   └── stream.controller.js       # Stream logic
│
├── models/
│   └── User.models.js            # User schema & validation
│   └── stream.models.js          # Stream schema
│
├── middleware/
│   └── authMiddleware.js         # JWT authentication
│   └── jwt.middleware.js         # JWT utilities
│   └── auth.middleware.js        # Auth helpers
│
├── route/
│   └── user.route.js             # User & profile routes
│   └── stream.route.js           # Stream routes
│
└── utils/
    └── (utility functions)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user

### Profile
- `GET /api/auth/profile/:userId` - Get profile
- `PUT /api/auth/profile/:userId` - Update profile

### Settings
- `PUT /api/auth/settings/:userId` - Update settings & notifications
- `PUT /api/auth/password/:userId` - Change password

### Security
- `GET /api/auth/security/:userId` - Get security info

### API Keys
- `POST /api/auth/apikey/:userId` - Generate API key
- `DELETE /api/auth/apikey/:userId` - Delete API key

### Streams
- `GET /api/streams` - Get all streams
- `GET /api/streams/:streamId` - Get single stream
- `POST /api/streams` - Create stream
- `PUT /api/streams/:streamId` - Update stream
- `POST /api/streams/:streamId/start` - Start stream
- `POST /api/streams/:streamId/end` - End stream
- `DELETE /api/streams/:streamId` - Delete stream

For detailed API documentation, see [BACKEND_API_DOCS.md](../BACKEND_API_DOCS.md)

## User Model Schema

```javascript
{
  email: String (unique, required),
  username: String (required),
  password: String (hashed, required),
  firstName: String,
  lastName: String,
  bio: String,
  avatarUrl: String,
  isLive: Boolean,
  notifications: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    marketingEmails: Boolean,
    dataCollection: Boolean
  },
  settings: {
    theme: String,
    language: String,
    twoFactorEnabled: Boolean
  },
  security: {
    lastLogin: Date,
    loginAttempts: Number,
    lockUntil: Date
  },
  apiKeys: [{
    key: String,
    name: String,
    createdAt: Date,
    lastUsed: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication Flow

1. **Register**: User creates account with email and password
2. **Password Hashing**: Password is hashed using bcrypt (10 salt rounds)
3. **Login**: User logs in with email and password
4. **Token Generation**: JWT token created with user ID and 7-day expiration
5. **Protected Routes**: Token required in Authorization header: `Bearer {token}`

## Security Features

✅ **Password Security**
- Passwords hashed with bcrypt (10 rounds)
- Password change requires current password verification
- Confirmation on password match

✅ **Token Security**
- JWT with 7-day expiration
- Bearer token authentication
- Token validation on protected routes

✅ **API Key Security**
- Cryptographically secure key generation
- No password in request body
- Separate API key management

✅ **Database Security**
- Passwords excluded from profile queries
- Sensitive data hidden by default

## Development

### Debug Logging

Add logging to requests:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Testing Endpoints

Use Postman or cURL:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","email":"user@example.com","password":"pass123"}'
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
# Get Profile (with token)
curl -X GET http://localhost:5000/api/auth/profile/USER_ID \
  -H "Authorization: Bearer JWT_TOKEN"
```

## Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Verify MongoDB is accessible on localhost:27017

### JWT Secret Not Set
- Add JWT_SECRET to .env file
- Restart server with: `npm run dev`

### Port Already in Use
- Change PORT in .env
- Or kill process: `lsof -i :5000`

### CORS Issues
- Update CORS_ORIGIN in .env
- Ensure frontend URL is in allowed origins

## Performance Optimization

### Database
- Create indexes on frequently queried fields
- Use pagination for large datasets
- Cache user profiles when possible
### API Keys
- Implement rate limiting
- Log API key usage
- Rotate keys periodically
### Security
- Implement account lockout after failed attempts
- Add 2FA support for sensitive operations
- Regular security audits

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Email verification
- [ ] Password reset via email
- [ ] User roles and permissions
- [ ] Activity logging system
- [ ] Rate limiting
- [ ] Advanced analytics
## Contributing
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request
## License
MIT License - feel free to use this in your projects
## Support
For issues, questions, or suggestions:
1. Check existing documentation
2. Review API docs
3. Check MongoDB connection
4. Enable debug logging
5. Contact development team
---
**Last Updated**: March 2026
**Version**: 1.0.0
