# 🧪 TESTING GUIDE: Profile, Settings & Analytics APIs

**Complete testing procedures for all 6 new endpoints**

---

## 🔑 GETTING A VALID CLERK JWT TOKEN

### **Step 1: Open Browser DevTools**
- Go to http://localhost:5173/profile
- Press F12 → Console tab

### **Step 2: Get Your Token**
In the browser console, run:
```javascript
// Get current Clerk user and token
const user = await __clerk.getUser();
const token = await user.getIdToken();
console.log("Your User ID:", user.id);
console.log("Your Token:", token);
```

**Copy the token output - you'll use it for all API requests**

### **Alternative: Use Test Token (Dev Mode)**
For testing without Clerk:
```bash
Authorization: Bearer test-token
Query param: ?userId=your_user_id
```

---

## 📝 TESTING PROFILE ENDPOINTS

### **1. GET /api/profile/:userId - Fetch Profile**

#### **Using cURL:**
```bash
curl -X GET http://localhost:5000/api/profile/69bc31e63a4255d05bd72e16 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json"
```

#### **Using Postman:**
1. Method: `GET`
2. URL: `http://localhost:5000/api/profile/69bc31e63a4255d05bd72e16`
3. Headers:
   - Key: `Authorization`
   - Value: `Bearer YOUR_CLERK_TOKEN`
4. Send

#### **Expected Response (200 OK):**
```json
{
  "_id": "69bc31e63a4255d05bd72e16",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "bio": "Software developer",
  "avatarUrl": "https://...",
  "isLive": false,
  "createdAt": "2026-04-05T10:30:00Z",
  "notifications": {
    "emailNotifications": true,
    "pushNotifications": false
  }
}
```

---

### **2. PUT /api/profile/:userId - Update Profile**

#### **Using cURL:**
```bash
curl -X PUT http://localhost:5000/api/profile/69bc31e63a4255d05bd72e16 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "bio": "Updated bio here",
    "username": "janesmith",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

#### **Using Postman:**
1. Method: `PUT`
2. URL: `http://localhost:5000/api/profile/69bc31e63a4255d05bd72e16`
3. Headers:
   - `Authorization: Bearer YOUR_CLERK_TOKEN`
4. Body (JSON):
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Updated bio here",
  "username": "janesmith",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```
5. Send

#### **Expected Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "69bc31e63a4255d05bd72e16",
    "firstName": "Jane",
    "lastName": "Smith",
    "bio": "Updated bio here",
    "username": "janesmith",
    "avatarUrl": "https://example.com/avatar.jpg",
    "email": "jane@example.com"
  }
}
```

#### **Frontend Test:**
1. Go to http://localhost:5173/profile
2. Click "Edit Profile"
3. Change First Name to "Jane"
4. Change Last Name to "Smith"
5. Click "Save Changes"
6. Should see ✅ "Profile updated successfully"
7. Refresh page - changes should persist

---

## ⚙️ TESTING SETTINGS ENDPOINTS

### **3. GET /api/settings/:userId - Fetch Settings**

#### **Using cURL:**
```bash
curl -X GET http://localhost:5000/api/settings/69bc31e63a4255d05bd72e16 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### **Expected Response (200 OK):**
```json
{
  "emailNotifications": true,
  "pushNotifications": false,
  "marketingEmails": false,
  "twoFactorEnabled": false
}
```

---

### **4. PUT /api/settings/:userId - Update Settings**

#### **Using cURL:**
```bash
curl -X PUT http://localhost:5000/api/settings/69bc31e63a4255d05bd72e16 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "pushNotifications": true,
    "marketingEmails": false,
    "twoFactorEnabled": false
  }'
```

#### **Using Postman:**
1. Method: `PUT`
2. URL: `http://localhost:5000/api/settings/69bc31e63a4255d05bd72e16`
3. Headers: `Authorization: Bearer YOUR_CLERK_TOKEN`
4. Body (JSON):
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "marketingEmails": false,
  "twoFactorEnabled": false
}
```

#### **Expected Response (200 OK):**
```json
{
  "message": "Settings updated successfully",
  "emailNotifications": true,
  "pushNotifications": true,
  "marketingEmails": false,
  "twoFactorEnabled": false
}
```

#### **Frontend Test:**
1. Go to http://localhost:5173/settings
2. Click on "Notifications" tab
3. Toggle "Email Notifications" on/off
4. Toggle settings should update immediately
5. Refresh page - settings should persist

---

## 📊 TESTING ANALYTICS ENDPOINTS

### **5. GET /api/analytics/:userId - Fetch Analytics**

#### **Using cURL (Last 7 Days):**
```bash
curl -X GET "http://localhost:5000/api/analytics/69bc31e63a4255d05bd72e16?range=7days" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### **Using cURL (Last 30 Days):**
```bash
curl -X GET "http://localhost:5000/api/analytics/69bc31e63a4255d05bd72e16?range=30days" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### **Using cURL (Last 90 Days):**
```bash
curl -X GET "http://localhost:5000/api/analytics/69bc31e63a4255d05bd72e16?range=90days" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### **Using Postman:**
1. Method: `GET`
2. URL: `http://localhost:5000/api/analytics/69bc31e63a4255d05bd72e16`
3. Params:
   - Key: `range`
   - Value: `7days` (or `30days` or `90days`)
4. Headers: `Authorization: Bearer YOUR_CLERK_TOKEN`
5. Send

#### **Expected Response (200 OK):**
```json
{
  "totalStreams": 5,
  "totalViewers": 250,
  "totalMessages": 1230,
  "avgDuration": 45,
  "streamsGrowth": 20,
  "viewersGrowth": 15,
  "messagesGrowth": 8,
  "durationGrowth": 5,
  "viewersData": [
    { "date": "Apr 1", "viewers": 45 },
    { "date": "Apr 2", "viewers": 52 },
    { "date": "Apr 3", "viewers": 38 },
    { "date": "Apr 4", "viewers": 61 },
    { "date": "Apr 5", "viewers": 54 }
  ],
  "streamActivityData": [
    { "date": "Apr 1", "streams": 1, "duration": 60 },
    { "date": "Apr 2", "streams": 1, "duration": 45 }
  ],
  "messagesData": [
    { "date": "Apr 1", "messages": 245 },
    { "date": "Apr 2", "messages": 312 }
  ],
  "topStreams": [
    {
      "title": "Gaming Session #5",
      "viewers": 120,
      "duration": 60,
      "date": "2026-04-05T15:30:00Z"
    },
    {
      "title": "Music Night",
      "viewers": 85,
      "duration": 45,
      "date": "2026-04-04T20:00:00Z"
    }
  ]
}
```

#### **Frontend Test:**
1. Go to http://localhost:5173/analytics
2. You should see 4 KPI cards:
   - Total Streams
   - Total Viewers
   - Total Messages
   - Avg Stream Duration
3. You should see 3 charts:
   - Viewers Over Time (area chart)
   - Stream Activity (bar chart)
   - Chat Activity (line chart)
4. Click "30 Days" button to refresh with different data
5. Click "90 Days" to see longer timeline

---

## ❌ ERROR TESTING

### **Test Missing Authorization Header:**
```bash
curl -X GET http://localhost:5000/api/profile/69bc31e63a4255d05bd72e16
```

**Expected Response (401):**
```json
{
  "error": "Missing or invalid authorization header",
  "code": "NO_AUTH_HEADER"
}
```

### **Test Invalid Token:**
```bash
curl -X GET http://localhost:5000/api/profile/69bc31e63a4255d05bd72e16 \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401):**
```json
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN",
  "details": "..."
}
```

### **Test User Not Found:**
```bash
curl -X GET http://localhost:5000/api/profile/nonexistent_user_id \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

**Expected Response (404):**
```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

## 🎯 COMPLETE TESTING FLOW

### **Step 1: Profile Page Test**
```
✅ Navigate to /profile
✅ Verify user data loads from Clerk
✅ Click Edit Profile
✅ Change First Name
✅ Click Save Changes
✅ See success message
✅ Refresh page - verify changes persist
```

### **Step 2: Settings Page Test**
```
✅ Navigate to /settings
✅ Click "Account" tab - verify info displays
✅ Click "Security" tab - verify 2FA section
✅ Click "Notifications" tab
✅ Toggle Email Notifications - verify immediate update
✅ Refresh page - verify toggle state persists
✅ Click "Privacy" tab - verify data/delete options
```

### **Step 3: Analytics Page Test**
```
✅ Navigate to /analytics
✅ Verify 4 KPI cards display with data
✅ Verify growth percentages show
✅ Verify 3 charts render correctly
✅ Verify "Top Streams" list shows
✅ Click "30 Days" button - verify data refreshes
✅ Click "90 Days" button - verify longer timeline
✅ Open DevTools Network tab - verify API calls complete
```

### **Step 4: API Testing (Postman)**
```
✅ GET /api/profile/:userId - verify 200 response
✅ PUT /api/profile/:userId - change name, verify 200
✅ GET /api/settings/:userId - verify current settings
✅ PUT /api/settings/:userId - toggle setting, verify 200
✅ GET /api/analytics/:userId?range=7days - verify KPIs
✅ GET /api/analytics/:userId?range=30days - verify data
✅ Test invalid token - verify 401 response
✅ Test missing token - verify 401 response
```

---

## 📊 PERFORMANCE METRICS

| Endpoint | Typical Response Time | Max Acceptable |
|----------|----------------------|-----------------|
| GET /profile | 50-100ms | 200ms |
| PUT /profile | 100-150ms | 300ms |
| GET /settings | 40-80ms | 150ms |
| PUT /settings | 80-120ms | 250ms |
| GET /analytics (7d) | 100-200ms | 500ms |
| GET /analytics (30d) | 150-300ms | 800ms |
| GET /analytics (90d) | 200-400ms | 1000ms |

---

## 🔍 TROUBLESHOOTING CHECKLIST

- [ ] Backend server running on port 5000?
- [ ] Frontend server running on port 5173?
- [ ] Clerk properly configured?
- [ ] MongoDB connected and has test data?
- [ ] Recharts installed? (`npm list recharts`)
- [ ] No console errors in browser DevTools?
- [ ] No console errors in terminal?
- [ ] Token being passed in Authorization header?
- [ ] Token format correct? (`Bearer {token}`)
- [ ] User ID matching across requests?

---

## 📞 QUICK REFERENCE

| Action | Command |
|--------|---------|
| Get token | Browser console: `const token = await __clerk.getUser().then(u => u.getIdToken())` |
| Test profile | `curl http://localhost:5000/api/profile/USER_ID -H "Authorization: Bearer TOKEN"` |
| Test settings | `curl http://localhost:5000/api/settings/USER_ID -H "Authorization: Bearer TOKEN"` |
| Test analytics | `curl "http://localhost:5000/api/analytics/USER_ID?range=7days" -H "Authorization: Bearer TOKEN"` |
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd @latest && npm run dev` |
| Install Recharts | `npm install recharts` |

---

**All tests should pass with 200 OK responses and expected data!** ✅
