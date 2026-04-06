# ZapLav Backend - Quick Start Guide
Get the backend up and running in 5 minutes!
## Prerequisites
- ✅ Node.js installed (v14+)
- ✅ MongoDB running locally or cloud URL
- ✅ npm or yarn
## Step 1: Setup Environment
```bash
cd backend
cp .env.example .env
```
Edit `.env` file:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/zaplav
JWT_SECRET=your_secret_key_here_change_this
```
## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Start Server

```bash
npm run dev
```

You should see:
```
Server running at http://localhost:5000
MongoDB Connected
```

## Step 4: Test the API

### Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned `token` for next steps.

### Get Profile
Replace `USER_ID` and `TOKEN` with actual values:
```bash
curl -X GET http://localhost:5000/api/auth/profile/USER_ID \
  -H "Authorization: Bearer TOKEN"
```
### Update Profile
```bash
curl -X PUT http://localhost:5000/api/auth/profile/USER_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "bio": "I love coding!"
  }'
```
## Frontend Integration

In your React app:
```javascript
import { profileAPI, setAuthToken } from '@/services/api';
// After login
const response = await authAPI.login(email, password);
setAuthToken(response.token);
// Get profile
const profile = await profileAPI.getProfile(userId);
// Update profile
await profileAPI.updateProfile(userId, {
  firstName: 'Jane',
  lastName: 'Doe'
});
// Update password
await profileAPI.updatePassword(userId, oldPassword, newPassword);
```
## Troubleshooting
| Issue | Solution |
|-------|----------|
| `MongoDB Connected Failed` | Start MongoDB: `mongod` |
| `Port 5000 in use` | Change PORT in .env or kill process |
| `JWT errors` | Check JWT_SECRET in .env |
| `CORS errors` | Update CORS_ORIGIN in .env |
| `Module not found` | Run `npm install` |

## API Documentation

Full API docs: See [BACKEND_API_DOCS.md](../BACKEND_API_DOCS.md)

## Features

✅ User Registration & Login
✅ Profile Management
✅ Notification Settings
✅ Password Change
✅ API Key Management
✅ Real-time Streaming
✅ Security & Privacy

## Database Models

- **User**: Complete user profile and settings
- **Stream**: Live streaming management
- **API Keys**: Secure API access

## Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| PORT | 5000 | No |
| MONGO_URI | - | Yes |
| JWT_SECRET | - | Yes |
| NODE_ENV | development | No |
| CORS_ORIGIN | * | No |

## Next Steps

1. ✅ Backend Setup Complete!
2. Configure frontend `.env` with `http://localhost:5000/api`
3. Test endpoints with frontend app
4. Deploy to production

## Support

Need help?
- Check README.md for details
- Review API documentation
- Check error logs
- Verify MongoDB connection

---

Happy coding! 🚀
