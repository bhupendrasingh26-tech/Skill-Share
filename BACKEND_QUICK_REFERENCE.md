# Quick Reference - Backend API & Socket.io

## 🚀 Quick Start

```bash
cd server
npm install
# Create .env file with credentials
npm run dev
```

Server runs on: **http://localhost:5000**

---

## 📡 Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Get Token
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123","name":"John"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'
```

---

## 📋 API Endpoints Cheat Sheet

### Posts
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/posts` | ❌ | Get all posts |
| GET | `/api/posts/:id` | ❌ | Get post |
| POST | `/api/posts` | ✅ | Create post |
| PUT | `/api/posts/:id` | ✅ | Update post |
| DELETE | `/api/posts/:id` | ✅ | Delete post |
| GET | `/api/posts/author/:id` | ❌ | Get user posts |

### Users
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/users` | ❌ | All users |
| GET | `/api/users/:id` | ❌ | Get user |
| GET | `/api/users/profile/me` | ✅ | Current user |
| PUT | `/api/users/:id` | ✅ | Update profile |
| GET | `/api/users/skill/:skill` | ❌ | Users by skill |
| GET | `/api/users/search/:query` | ❌ | Search users |

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login |

### AI
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/ai/generate-quiz` | ✅ | Generate quiz |

---

## 💬 Socket.io Events

### Chat
```javascript
// Join room
socket.emit('join_room', { userId, userName, room })

// Send message
socket.emit('send_message', { senderId, senderName, text, room })
socket.on('receive_message', callback)

// Typing
socket.emit('user_typing', { room, userName })
socket.on('user_typing', callback)

// Leave
socket.emit('leave_room', { room, userName })
```

### WebRTC Calls
```javascript
// Join video room
socket.emit('join_video_room', { userId, room })

// Initiate call
socket.emit('initiate_call', { from, to, callType })
socket.on('incoming_call', callback)

// Accept/Reject
socket.emit('accept_call', { to, from })
socket.emit('reject_call', { to, from })

// Send offer
socket.emit('webrtc_offer', { from, to, data: offer })
socket.on('receive_offer', callback)

// Send answer
socket.emit('webrtc_answer', { from, to, data: answer })
socket.on('receive_answer', callback)

// ICE candidates
socket.emit('ice_candidate', { from, to, candidate })
socket.on('receive_ice_candidate', callback)

// End call
socket.emit('end_call', { to })
socket.on('call_ended', callback)
```

---

## 📝 Request Body Examples

### Create Post
```json
{
  "title": "Learn React",
  "description": "I teach React and JavaScript",
  "category": "Programming",
  "tags": ["React", "JavaScript"],
  "budget": 50,
  "mediaUrl": "https://...",
  "mediaType": "image"
}
```

### Update User
```json
{
  "bio": "Full-stack developer",
  "skillsOffered": ["React", "Node.js"],
  "skillsNeeded": ["Python"],
  "portfolioUrl": "https://portfolio.com",
  "socialMedia": {
    "github": "https://github.com/user",
    "linkedin": "https://linkedin.com/in/user"
  },
  "collaborationMethods": ["Chat", "Video Call"]
}
```

### Generate Quiz
```json
{
  "topic": "JavaScript Promises",
  "difficulty": "intermediate"
}
```

---

## 🔄 Common Workflows

### Register & Login User
```javascript
// 1. Register
const registerRes = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name })
});
const { token } = await registerRes.json();

// 2. Store token
localStorage.setItem('token', token);

// 3. Use in requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Create Post
```javascript
const res = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title, description, category, tags })
});
const post = await res.json();
```

### Chat Flow
```javascript
// 1. Connect
const socket = io('http://localhost:5000');

// 2. Join room
socket.emit('join_room', { userId, userName, room: conversationId });

// 3. Listen for messages
socket.on('receive_message', (msg) => {
  addMessageToUI(msg);
});

// 4. Send message
const sendMessage = (text) => {
  socket.emit('send_message', { senderId, senderName, text, room: conversationId });
};
```

### Video Call Flow
```javascript
// 1. Join room
socket.emit('join_video_room', { userId, room });

// 2. Call user
socket.emit('initiate_call', { from: myId, to: userId, callType: 'video' });

// 3. Receiver gets notification
socket.on('incoming_call', (data) => {
  showCallNotification(data);
});

// 4. Accept call
socket.emit('accept_call', { to: callerId, from: myId });

// 5. Create peer connection
const pc = new RTCPeerConnection(config);

// 6. Create offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('webrtc_offer', { from: myId, to: userId, data: offer });

// 7. Receive answer
socket.on('receive_answer', async (data) => {
  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// 8. Send/receive ICE candidates
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice_candidate', { from: myId, to: userId, candidate: event.candidate });
  }
};

socket.on('receive_ice_candidate', (data) => {
  pc.addIceCandidate(new RTCIceCandidate(data.candidate));
});
```

---

## 🛠️ Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/skillshare
JWT_SECRET=change-in-production
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your-api-key
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## 🐛 Debug

```bash
# Check server health
curl http://localhost:5000/health

# View logs
npm run dev  # Shows all logs

# Test socket connection
# Use socket.io-client library or Socket.io admin
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| socket.io | Real-time communication |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| @google/generative-ai | Gemini API |
| cors | CORS handling |
| dotenv | Environment variables |

---

**Print this page for quick reference!** 🚀
