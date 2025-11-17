# Backend Setup Guide - Skill Share P2P Platform

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Google Gemini API Key

### Step 1: Install Dependencies

```bash
cd server
npm install
```

### Step 2: Configure Environment Variables

Create `.env` file in server directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/skillshare
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillshare?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=change-this-to-a-secure-random-string-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### Step 3: Start MongoDB

**Using Local MongoDB:**
```bash
mongod
```

**Using MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string
- Use connection string in MONGODB_URI

### Step 4: Run Development Server

```bash
npm run dev
```

Expected output:
```
========================================
🚀 Skill Share Backend Server Running
📍 Port: 5000
🌐 Frontend URL: http://localhost:5173
🔌 Socket.IO Ready for connections
========================================
```

## API Endpoints Reference

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Posts

#### Get All Posts (with filtering)
```
GET /api/posts?category=Programming&tag=ReactJS&search=tutorial

Response: [
  {
    "_id": "...",
    "title": "Learn React Hooks",
    "description": "Complete guide to React Hooks",
    "category": "Programming",
    "tags": ["ReactJS", "JavaScript"],
    "author": { ... },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Post (JWT Required)
```
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Learn Web Development",
  "description": "I can teach you HTML, CSS, JavaScript...",
  "category": "Programming",
  "tags": ["Web", "JavaScript", "HTML"],
  "budget": 50,
  "mediaUrl": "https://...",
  "mediaType": "image"
}

Response: {
  "_id": "...",
  "title": "Learn Web Development",
  "author": { ... },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Update Post (JWT Required, Author Only)
```
PUT /api/posts/:postId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description...",
  "budget": 100
}
```

#### Delete Post (JWT Required, Author Only)
```
DELETE /api/posts/:postId
Authorization: Bearer <token>
```

### Users

#### Get Current User Profile
```
GET /api/users/profile/me
Authorization: Bearer <token>

Response: {
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Full-stack developer",
  "skillsOffered": ["React", "Node.js"],
  "skillsNeeded": ["Python", "Machine Learning"],
  "validatedSkills": ["JavaScript"],
  "rating": 4.8
}
```

#### Update User Profile
```
PUT /api/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "skillsOffered": ["React", "Node.js", "TypeScript"],
  "skillsNeeded": ["Python"],
  "portfolioUrl": "https://portfolio.com",
  "socialMedia": {
    "github": "https://github.com/user",
    "linkedin": "https://linkedin.com/in/user"
  },
  "collaborationMethods": ["Chat", "Video Call"]
}
```

#### Search Users
```
GET /api/users/search/react

Response: [
  {
    "_id": "...",
    "name": "React Expert",
    "bio": "Specializing in React development",
    "skillsOffered": ["React", "JavaScript"],
    "rating": 4.9
  }
]
```

### AI Endpoint

#### Generate Quiz
```
POST /api/ai/generate-quiz
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "JavaScript ES6",
  "difficulty": "intermediate"
}

Response: {
  "success": true,
  "quiz": {
    "topic": "JavaScript ES6",
    "questions": [
      {
        "question": "What is the purpose of async/await?",
        "options": [
          "To handle asynchronous operations",
          "To create loops",
          "To define variables",
          "To import modules"
        ],
        "correctAnswerIndex": 0
      },
      ...
    ]
  }
}
```

## Socket.io Events

### Chat Implementation

**Client Side (Frontend):**
```javascript
// Connect to Socket.io
const socket = io('http://localhost:5000');

// Join a chat room
socket.emit('join_room', {
  userId: currentUser.id,
  userName: currentUser.name,
  room: 'room123'
});

// Listen for messages
socket.on('receive_message', (message) => {
  console.log(`${message.senderName}: ${message.text}`);
});

// Send message
socket.emit('send_message', {
  senderId: currentUser.id,
  senderName: currentUser.name,
  text: 'Hello!',
  room: 'room123'
});

// Leave room
socket.emit('leave_room', {
  room: 'room123',
  userName: currentUser.name
});
```

### WebRTC Implementation

**Initiating a Call (Caller):**
```javascript
// Join video room
socket.emit('join_video_room', {
  userId: currentUser.id,
  room: 'call-room-123'
});

// Initiate call
socket.emit('initiate_call', {
  from: currentUser.id,
  to: targetUserId,
  callType: 'video'
});

// Listen for acceptance
socket.on('call_accepted', async (data) => {
  // Create WebRTC peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  // Send offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  socket.emit('webrtc_offer', {
    from: currentUser.id,
    to: targetUserId,
    data: offer
  });
});
```

**Receiving a Call (Receiver):**
```javascript
// Listen for incoming call
socket.on('incoming_call', async (data) => {
  console.log(`Call from ${data.from} (${data.callType})`);
  
  // Show call notification to user
  // User clicks accept
  socket.emit('accept_call', {
    to: data.from,
    from: currentUser.id
  });
});

// Handle incoming offer
socket.on('receive_offer', async (data) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  socket.emit('webrtc_answer', {
    from: currentUser.id,
    to: data.from,
    data: answer
  });
});

// Handle ICE candidates
socket.on('receive_ice_candidate', (data) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice_candidate', {
      from: currentUser.id,
      to: targetUserId,
      candidate: event.candidate
    });
  }
};
```

## Testing API Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get posts (with token)
curl -X GET http://localhost:5000/api/posts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Using Postman

1. Import the collection (create from API endpoints above)
2. Set `token` variable in environment
3. Use {{token}} in Authorization header for protected routes

## Troubleshooting

### "MongoDB connection failed"
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For MongoDB Atlas, ensure IP is whitelisted

### "Cannot find module 'express'"
- Run `npm install` again
- Check that you're in the `server` directory

### "Invalid token" errors
- Token may have expired (refresh login)
- Ensure `JWT_SECRET` matches between frontend and backend
- Check token format in header: `Authorization: Bearer <token>`

### "CORS error when calling from frontend"
- Verify `FRONTEND_URL` in `.env` matches your frontend origin
- Ensure credentials are set to true in Socket.io and fetch

### "Gemini API errors"
- Verify `GEMINI_API_KEY` is valid
- Check API is enabled in Google Cloud Console
- Review Gemini API documentation

## Production Deployment

### Prepare for Production

1. **Update environment variables:**
   ```env
   NODE_ENV=production
   JWT_SECRET=generate-a-long-random-string-here
   MONGODB_URI=your-mongodb-atlas-uri
   GEMINI_API_KEY=your-api-key
   FRONTEND_URL=your-production-domain
   PORT=5000
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

3. **Start production server:**
   ```bash
   npm start
   ```

### Deployment Platforms

**Heroku:**
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret GEMINI_API_KEY=your-key
git push heroku main
```

**Railway:**
- Connect GitHub repo
- Add environment variables
- Deploy

**DigitalOcean/AWS:**
- Set up Node.js server
- Install MongoDB or use Atlas
- Clone repository and install dependencies
- Use PM2 for process management

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [WebRTC Guide](https://webrtc.org/getting-started)

---

**Created:** January 2024
**Backend Version:** 1.0.0
