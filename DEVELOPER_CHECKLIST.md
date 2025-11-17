# Developer Checklist - Backend Setup & Integration

Use this checklist to ensure everything is properly set up and integrated.

---

## 📋 Pre-Setup Checklist

### Requirements
- [ ] Node.js v16+ installed (`node --version`)
- [ ] MongoDB installed or Atlas account created
- [ ] Google Gemini API key obtained
- [ ] Git installed for version control
- [ ] VS Code or preferred editor ready

### Check Node & npm
```bash
node --version  # Should be v16+
npm --version   # Should be v8+
```

---

## 🔧 Backend Setup Checklist

### 1. Project Structure
- [ ] `server/` directory exists at project root
- [ ] `src/` subdirectory created
- [ ] `models/`, `routes/`, `middleware/`, `sockets/`, `services/` folders exist

### 2. Files Created
- [ ] `server/package.json` ✅
- [ ] `server/tsconfig.json` ✅
- [ ] `server/.env.example` ✅
- [ ] `server/src/models/User.ts` ✅
- [ ] `server/src/models/Post.ts` ✅
- [ ] `server/src/middleware/auth.ts` ✅
- [ ] `server/src/routes/auth.ts` ✅
- [ ] `server/src/routes/users.ts` ✅
- [ ] `server/src/routes/posts.ts` ✅
- [ ] `server/src/routes/ai.ts` ✅
- [ ] `server/src/sockets/chatHandler.ts` ✅
- [ ] `server/src/sockets/webrtcHandler.ts` ✅
- [ ] `server/src/services/aiService.ts` ✅
- [ ] `server/src/server.ts` ✅
- [ ] `server/README.md` ✅

### 3. Documentation Files
- [ ] `BACKEND_SETUP_GUIDE.md` ✅
- [ ] `BACKEND_IMPLEMENTATION_SUMMARY.md` ✅
- [ ] `BACKEND_QUICK_REFERENCE.md` ✅
- [ ] `BACKEND_ARCHITECTURE.md` ✅
- [ ] `FRONTEND_INTEGRATION_GUIDE.md` ✅
- [ ] `BACKEND_COMPLETION_SUMMARY.md` ✅

### 4. Install Dependencies
```bash
cd server
npm install
```
- [ ] Dependencies installed successfully
- [ ] `node_modules/` folder created
- [ ] `package-lock.json` generated

### 5. Environment Configuration
```bash
cd server
cp .env.example .env
```
Edit `.env` and set:
- [ ] `MONGODB_URI=mongodb://localhost:27017/skillshare`
  - Or MongoDB Atlas connection string
- [ ] `JWT_SECRET=your-super-secret-key-here` (long random string)
- [ ] `PORT=5000`
- [ ] `NODE_ENV=development`
- [ ] `GEMINI_API_KEY=your-google-gemini-api-key`
- [ ] `FRONTEND_URL=http://localhost:5173`

---

## 🗄️ Database Setup Checklist

### MongoDB Local Setup
```bash
mongod  # Start MongoDB server
```
- [ ] MongoDB running on localhost:27017
- [ ] Can connect from MongoDB Compass if desired

### MongoDB Atlas Setup (Cloud)
- [ ] Created MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- [ ] Created a cluster
- [ ] Generated connection string
- [ ] Added IP to whitelist (or 0.0.0.0)
- [ ] Updated `MONGODB_URI` in `.env`

---

## 🚀 Server Startup Checklist

### Terminal Command
```bash
cd server
npm run dev
```

- [ ] Server starts without errors
- [ ] See output: `🚀 Skill Share Backend Server Running`
- [ ] Port 5000 shown as listening
- [ ] MongoDB connected message displayed
- [ ] Socket.io ready message shown

### Health Check
```bash
curl http://localhost:5000/health
```
- [ ] Returns: `{"status":"OK","timestamp":"..."}`
- [ ] Status code: 200

---

## 🔐 API Testing Checklist

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```
- [ ] Returns 201 Created
- [ ] Response includes `token` and `user` data
- [ ] Token can be stored

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
- [ ] Returns 200 OK
- [ ] Response includes valid JWT token
- [ ] Token matches register response

### Get Posts (No Auth)
```bash
curl http://localhost:5000/api/posts
```
- [ ] Returns 200 OK
- [ ] Returns empty array or existing posts
- [ ] No authentication required

### Create Post (With Auth)
```bash
TOKEN="<your-token-from-login>"
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Learn React",
    "description": "I can teach you React...",
    "category": "Programming",
    "tags": ["React", "JavaScript"]
  }'
```
- [ ] Returns 201 Created
- [ ] Post includes user ID as author
- [ ] Post data populated with timestamps

### Test Protected Route Without Token
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "Test",
    "category": "Programming"
  }'
```
- [ ] Returns 401 Unauthorized
- [ ] Error message: "No token provided"

---

## 📡 Socket.io Testing Checklist

### Using Socket.io Test Tool or Frontend

**Chat Test:**
- [ ] Can join a room
- [ ] Can send message and receive echo
- [ ] Typing indicator works
- [ ] Leave room notification received

**WebRTC Test:**
- [ ] Can join video room
- [ ] Can initiate call
- [ ] Call received on other user
- [ ] Can accept call
- [ ] Can exchange offers and answers
- [ ] ICE candidates relay correctly
- [ ] Can end call

---

## 🤖 AI Endpoint Testing Checklist

### Test Gemini API Integration
```bash
TOKEN="<your-token>"
curl -X POST http://localhost:5000/api/ai/generate-quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "topic": "JavaScript Promises",
    "difficulty": "intermediate"
  }'
```
- [ ] Returns 200 OK
- [ ] Response includes quiz object
- [ ] Quiz has topic and questions array
- [ ] Each question has options and correctAnswerIndex
- [ ] 5 questions generated

### Check API Key
- [ ] `GEMINI_API_KEY` set in `.env`
- [ ] API key is valid and not expired
- [ ] API is enabled in Google Cloud Console

---

## 📱 Frontend Integration Checklist

### Copy Service Files
- [ ] Copy `apiClient` code to frontend (`src/services/apiClient.ts`)
- [ ] Copy `SocketService` code to frontend (`src/services/socketService.ts`)

### Update App.tsx
- [ ] Import `apiClient` from services
- [ ] Import `SocketService` from services
- [ ] Update login to use `apiClient.auth.login()`
- [ ] Update register to use `apiClient.auth.register()`
- [ ] Store JWT token from response in localStorage
- [ ] Pass token in Authorization header for protected routes

### Replace Mock Data
- [ ] Replace `MOCK_USERS` with API call: `apiClient.users.getAll()`
- [ ] Replace `MOCK_POSTS` with API call: `apiClient.posts.getAll()`
- [ ] Use real user ID from login response instead of hardcoded value

### Update Components
- [ ] `LoginComponent` - uses `apiClient.auth.login()`
- [ ] `CreatePostModal` - uses `apiClient.posts.create()`
- [ ] `PostCard` - uses real author data from API
- [ ] `UserProfile` - uses `apiClient.users.getById()`
- [ ] `ChatWindow` - uses `SocketService` for messaging
- [ ] `CallModal` - uses `SocketService` for WebRTC

### Test Frontend Connection
```bash
# In frontend terminal
npm run dev
```
- [ ] Frontend loads without errors
- [ ] No CORS errors in console
- [ ] Network tab shows API calls to localhost:5000
- [ ] API responses are received and displayed
- [ ] JWT token included in Authorization headers

---

## 🧪 Integration Testing Checklist

### Authentication Flow
- [ ] User can register new account
- [ ] New user appears in database
- [ ] User can login with credentials
- [ ] JWT token returned and stored
- [ ] Token used in subsequent requests
- [ ] Token expires after 7 days (configurable)
- [ ] Logout clears stored token

### Post Creation Flow
- [ ] Logged-in user can create post
- [ ] Post author automatically set to current user
- [ ] Post appears in feed immediately
- [ ] Edit post only works for author
- [ ] Delete post only works for author
- [ ] Other users can view but not edit/delete

### User Profile Flow
- [ ] Can view other users' profiles
- [ ] Can update own profile
- [ ] Cannot update other users' profiles
- [ ] Changes persist in database
- [ ] Profile image updates
- [ ] Skills lists update

### Chat Flow
- [ ] Can join chat room with another user
- [ ] Can send message
- [ ] Message appears to both users
- [ ] Can leave room
- [ ] Notifications work properly
- [ ] Multiple rooms isolated correctly

### Video Call Flow
- [ ] Can initiate call to user
- [ ] Target user receives incoming call
- [ ] Can accept call
- [ ] Can reject call
- [ ] WebRTC connection established
- [ ] Video streams flow both directions
- [ ] Audio works correctly
- [ ] Can end call
- [ ] Connection cleaned up properly

### Quiz Generation Flow
- [ ] Can trigger quiz generation
- [ ] Gemini API called successfully
- [ ] Quiz with 5 questions returned
- [ ] Questions have 4 options each
- [ ] Correct answer index provided
- [ ] Topic and difficulty considered

---

## 🐛 Debugging Checklist

### Common Issues

#### MongoDB Connection Failed
- [ ] MongoDB is running (`mongod` in terminal)
- [ ] Connection string in `.env` is correct
- [ ] MongoDB username/password correct (if using Auth)
- [ ] IP whitelisted (if using Atlas)
- [ ] Check error message in server logs

#### "Cannot find module 'express'"
- [ ] `npm install` completed successfully
- [ ] `node_modules/` folder exists
- [ ] Dependencies match `package.json`
- [ ] Try: `rm -rf node_modules && npm install`

#### CORS Error
- [ ] `FRONTEND_URL` in `.env` matches frontend origin
- [ ] Example: `http://localhost:5173`
- [ ] CORS middleware enabled in `server.ts`
- [ ] Check browser console for actual error

#### JWT Token Invalid
- [ ] Token not expired
- [ ] `JWT_SECRET` matches between requests
- [ ] Authorization header format correct: `Bearer <token>`
- [ ] Token not modified in localStorage

#### WebRTC Not Connecting
- [ ] STUN server accessible (Google's stun server usually works)
- [ ] ICE candidates being exchanged via Socket.io
- [ ] Both peers in same room
- [ ] Firewall not blocking WebRTC

#### Gemini API Error
- [ ] `GEMINI_API_KEY` set in `.env`
- [ ] API key valid and active
- [ ] API enabled in Google Cloud Console
- [ ] Rate limits not exceeded

---

## 📊 Performance Checklist

### Database
- [ ] Indexes created on `Post.author` and `Post.category`
- [ ] Pagination implemented for large lists (if needed)
- [ ] Query performance acceptable (<100ms)

### Server
- [ ] No memory leaks (check with extended testing)
- [ ] Error handling prevents crashes
- [ ] Graceful shutdown works properly

### Socket.io
- [ ] Connection pooling working
- [ ] No duplicate events emitted
- [ ] Messages delivered reliably
- [ ] Disconnections handled properly

---

## 🚀 Production Readiness Checklist

### Code
- [ ] No console.log statements left in production code
- [ ] Error messages don't expose internal details
- [ ] Secret keys not hardcoded
- [ ] Validation on all inputs

### Security
- [ ] `JWT_SECRET` is strong (32+ characters)
- [ ] CORS restricted to frontend origin
- [ ] HTTPS will be used (frontend requirement)
- [ ] Password hashing verified (bcrypt)
- [ ] SQL injection not possible (using Mongoose)
- [ ] XSS not possible (using JSON responses)

### Configuration
- [ ] `NODE_ENV=production` set
- [ ] Error logging configured
- [ ] Database backups enabled (if using Atlas)
- [ ] Rate limiting added (optional but recommended)

### Deployment
- [ ] `npm run build` succeeds
- [ ] `npm start` runs production build
- [ ] All env variables set on server
- [ ] MongoDB connection string for production
- [ ] FRONTEND_URL updated to production domain

---

## 📋 Final Verification

### All 5 Requirements Met
- [ ] 1. Express.js API with Posts CRUD
  - GET `/api/posts`
  - GET `/api/posts/:id`
  - POST `/api/posts` (JWT)
  - PUT `/api/posts/:id` (JWT)
  - DELETE `/api/posts/:id` (JWT)

- [ ] 2. Database Schemas
  - User schema with all fields
  - Post schema with author reference
  - Indexes for performance

- [ ] 3. Real-time Chat
  - join_room, send_message, leave_room
  - Broadcasting to room members
  - User notifications

- [ ] 4. WebRTC Signaling
  - Offer/Answer exchange
  - ICE candidate relay
  - Call initiation/acceptance

- [ ] 5. AI Endpoint
  - POST `/api/ai/generate-quiz` (JWT)
  - Calls Gemini API
  - Returns quiz with questions

### Documentation Complete
- [ ] Setup guide ready
- [ ] Quick reference available
- [ ] Architecture documented
- [ ] Integration guide provided
- [ ] All files list created

---

## ✅ Sign Off

**Backend Development:**
- [ ] All features implemented
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code ready for review
- [ ] Ready for frontend integration

**Date Completed:** _______________
**Developer Name:** _______________
**Notes:** 
_______________________________________________
_______________________________________________

---

**Use this checklist to ensure nothing is missed!** ✓
