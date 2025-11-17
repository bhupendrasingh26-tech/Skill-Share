# Backend Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│              (Vite - http://localhost:5173)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
    ┌──────────────────────┐      ┌──────────────────────┐
    │   REST API Calls     │      │   Socket.io Events   │
    │  (HTTP with JWT)     │      │   (WebSocket)        │
    └──────────────────────┘      └──────────────────────┘
              ↓                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                            │
│                  (http://localhost:5000)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                            │  │
│  │  ├─ CORS Middleware                                      │  │
│  │  ├─ JSON Parser                                          │  │
│  │  ├─ JWT Authentication Middleware                       │  │
│  │  └─ Error Handling                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Route Handlers                              │  │
│  │  ├─ /api/auth/register & login (Auth Routes)            │  │
│  │  ├─ /api/users/* (User Routes)                          │  │
│  │  ├─ /api/posts/* (Post Routes - CRUD)                  │  │
│  │  └─ /api/ai/generate-quiz (AI Routes)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Socket.io Server                            │  │
│  │  ├─ Chat Handler (join_room, send_message, etc)         │  │
│  │  └─ WebRTC Handler (offer, answer, ice-candidate)       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
    ┌──────────────────────┐      ┌──────────────────────┐
    │    MongoDB Atlas     │      │  Google Gemini API   │
    │  (Database Layer)    │      │  (AI Service)        │
    └──────────────────────┘      └──────────────────────┘
```

---

## Data Flow Diagrams

### Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Register/Login
       ↓
┌──────────────────────┐
│  POST /api/auth/*    │
└──────┬───────────────┘
       │
       │ 2. Hash password (bcrypt)
       ↓
┌──────────────────────┐
│  MongoDB - User      │
└──────┬───────────────┘
       │
       │ 3. Generate JWT
       ↓
┌──────────────────────┐
│  JWT Token           │
└──────┬───────────────┘
       │
       │ 4. Return token + user
       ↓
┌──────────────────────┐
│  Frontend Storage    │
│  (localStorage)      │
└──────────────────────┘
```

### Post Creation Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. POST /api/posts
       │    + Bearer Token
       ↓
┌──────────────────────┐
│  Auth Middleware     │
│  (Verify JWT)        │
└──────┬───────────────┘
       │
       │ 2. Extract user ID
       ↓
┌──────────────────────┐
│  Post Controller     │
│  (Validate data)     │
└──────┬───────────────┘
       │
       │ 3. Create Post
       │    (with author ID)
       ↓
┌──────────────────────┐
│  MongoDB - Posts     │
└──────┬───────────────┘
       │
       │ 4. Populate author
       ↓
┌──────────────────────┐
│  Return full post    │
│  with author details │
└──────────────────────┘
```

### Chat Flow with Socket.io

```
┌──────────────┐                        ┌──────────────┐
│   User A     │                        │   User B     │
└──────┬───────┘                        └──────┬───────┘
       │                                       │
       │ 1. join_room                          │
       │ (room: "conv-123")                    │
       ↓                                       ↓
┌────────────────────────────────────────────────────┐
│         Socket.io Server                          │
│    (Event: join_room)                             │
└──────┬─────────────────────────────────────────────┘
       │
       │ 2. Broadcast user_joined
       │    to other users in room
       ↓
       ├──────────────────────────────────┬──────────────────────┐
       │                                  │                      │
       │ 3. send_message                  │ 3. send_message      │
       │    (text: "Hi!")                 │    (text: "Hello!")  │
       ↓                                  ↓                      │
   (Text sent)                       (Text sent)              │
       │                                  │                      │
       │ 4. emit to room                  │ 4. emit to room      │
       │    receive_message               │    receive_message   │
       ↓                                  ↓                      │
┌──────────────┐                    ┌──────────────┐            │
│ Display msg  │◄──────────────────►│ Display msg  │            │
│ in chat      │                    │ in chat      │            │
└──────────────┘                    └──────────────┘            │
```

### WebRTC Signaling Flow

```
┌──────────────┐                        ┌──────────────┐
│   Caller     │                        │  Receiver    │
└──────┬───────┘                        └──────┬───────┘
       │                                       │
       │ 1. initiate_call                      │
       │    (callType: "video")                │
       │                                       │
       ├──────────────────────────────────────►│
       │                                       │
       │◄──────────────────────────────────────┤
       │     2. incoming_call                  │
       │                                       │
       │                                  User accepts
       │                                       │
       │◄──────────────────────────────────────┤
       │     3. call_accepted                  │
       │                                       │
       │ 4. Create RTCPeerConnection           │
       │    Generate offer                     │
       │                                       │
       │    webrtc_offer (SDP)                 │
       ├──────────────────────────────────────►│
       │                                       │
       │                                  Create RTCPeerConnection
       │                                  Generate answer
       │                                       │
       │◄──────────────────────────────────────┤
       │     webrtc_answer (SDP)               │
       │                                       │
       │ 5. Exchange ICE Candidates            │
       │    (Network path discovery)           │
       │                                       │
       │    ice_candidate◄──►ice_candidate     │
       │                                       │
       ├──────────────────────────────────────►│
       │     WebRTC Peer Connection            │
       │     (Audio/Video Stream)              │
       │◄──────────────────────────────────────┤
       │                                       │
       │     Call Active                       │
       │                                       │
       │ 6. end_call                           │
       ├──────────────────────────────────────►│
       │                                       │
```

### AI Quiz Generation Flow

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       │ 1. POST /api/ai/generate-quiz
       │    + Bearer Token
       │    + { topic, difficulty }
       ↓
┌──────────────────────┐
│  Auth Middleware     │
│  (Verify JWT)        │
└──────┬───────────────┘
       │
       │ 2. Validate request
       │    Ensure API key exists
       ↓
┌──────────────────────┐
│  aiService.ts        │
│  generateQuiz()      │
└──────┬───────────────┘
       │
       │ 3. Call Google Gemini API
       ├─────────────────────────┐
       │                         │
       │                  ┌──────────────┐
       │                  │ Gemini API   │
       │                  │ (Cloud)      │
       │                  └──────────────┘
       │                         │
       │ 4. Parse response       │
       │    Extract JSON         │
       ↓
┌──────────────────────┐
│  Quiz Object         │
│  {                   │
│    topic: string     │
│    questions: [{...}]│
│  }                   │
└──────┬───────────────┘
       │
       │ 5. Return to frontend
       ↓
┌──────────────────────┐
│  Display Quiz        │
│  in UI               │
└──────────────────────┘
```

---

## Database Schema Relationships

```
┌──────────────────────┐
│       User           │
├──────────────────────┤
│ _id (ObjectId)       │
│ email (unique)       │
│ password (hashed)    │
│ name                 │
│ bio                  │
│ avatarUrl            │
│ skillsOffered[]      │
│ skillsNeeded[]       │
│ validatedSkills[]    │
│ rating               │
│ portfolioUrl         │
│ socialMedia          │
│ collaborationMethods │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
         ▲
         │ (one-to-many)
         │
┌──────────────────────┐
│       Post           │
├──────────────────────┤
│ _id (ObjectId)       │
│ title                │
│ description          │
│ category (enum)      │
│ tags[]               │
│ author (ref: User)   │◄─────┐
│ budget               │      │
│ mediaUrl             │      │
│ mediaType            │      │
│ createdAt            │      │
│ updatedAt            │      │
└──────────────────────┘      │
                              │
                    One user can have
                    many posts
```

---

## File Structure with Dependencies

```
server/
│
├── package.json
│   └── Dependencies:
│       ├── express (routing)
│       ├── mongoose (database)
│       ├── socket.io (real-time)
│       ├── jsonwebtoken (auth)
│       ├── bcryptjs (security)
│       └── @google/generative-ai (AI)
│
├── src/
│   │
│   ├── models/
│   │   ├── User.ts ─────────┐
│   │   │                    │
│   │   └── Post.ts ─────────┼─► References User
│   │                        │
│   ├── middleware/
│   │   └── auth.ts ◄────────┘
│   │      (uses User model for JWT)
│   │
│   ├── routes/
│   │   ├── auth.ts ────► Uses User model + auth middleware
│   │   ├── users.ts ───► Uses User model + auth middleware
│   │   ├── posts.ts ───► Uses Post model + auth middleware
│   │   └── ai.ts ───────► Uses aiService + auth middleware
│   │
│   ├── sockets/
│   │   ├── chatHandler.ts ───► Socket.io event handlers
│   │   └── webrtcHandler.ts ──► Socket.io event handlers
│   │
│   ├── services/
│   │   └── aiService.ts ──────► Uses Google Gemini API
│   │
│   └── server.ts
│       └── Imports & integrates:
│           ├── All route files
│           ├── Both socket handlers
│           ├── MongoDB connection
│           └── Express + Socket.io setup
│
└── .env
    └── Configuration for all services
```

---

## Request/Response Flow

### Authenticated Request Example

```
Frontend                    Express Server              MongoDB

POST /api/posts
+ Authorization: Bearer {token}
+ Content-Type: application/json
+ Body: { title, description, ... }
         ↓
    ├─ CORS Middleware ✓
    │  (Check origin)
    │        ↓
    ├─ JSON Parser ✓
    │  (Parse body)
    │        ↓
    ├─ Auth Middleware
    │  (Verify JWT token)
    │  (Extract user ID)
    │        ↓
    ├─ Route Handler
    │  (Validate data)
    │  (Create Post object
    │   with user ID as author)
    │        ↓
    ├─ Database Operation
    │  (Save Post)          ──────────► Save Post
    │                                      ↓
    │                          Return saved Post
    │  ◄─────────────────────────────
    │        ↓
    ├─ Populate Author
    │  (Fetch User details
    │   from author ID)      ──────────► Find User by ID
    │                                      ↓
    │                          Return User data
    │  ◄─────────────────────────────
    │        ↓
    ├─ Response
    │  (Post with full author details)
    │        ↓
    Response: 201 Created
    + Body: { _id, title, author: {...}, ... }
```

---

## Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────────┐
│                    Clients (Browser)                     │
│              Multiple users connecting                   │
└──────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  HTTPS/SSL          │
                    │  Load Balancer      │
                    └─────────────────────┘
                              ↓
        ┌─────────────────────┴──────────────────────┐
        ↓                                            ↓
┌───────────────────────┐              ┌───────────────────────┐
│  Express Server #1    │              │  Express Server #2    │
│  (Port 5000)          │              │  (Port 5000)          │
│  ├─ Routes            │              │ ├─ Routes             │
│  ├─ Socket.io         │              │ ├─ Socket.io          │
│  └─ Auth              │              │ └─ Auth               │
└───────────────────────┘              └───────────────────────┘
        │                                        │
        │                                        │
        └────────────────┬─────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │  MongoDB Cluster (Atlas)       │
        │  ├─ Users Collection           │
        │  ├─ Posts Collection           │
        │  └─ Backups                    │
        └────────────────────────────────┘
```

---

## Security Flow

```
Request arrives
    ↓
CORS Check
├─ Origin in whitelist? ✓
    ↓
Parse JSON
├─ Valid JSON? ✓
    ↓
Auth Check (if protected route)
├─ Authorization header present? ✓
├─ Bearer token format? ✓
├─ JWT signature valid? ✓
├─ Token not expired? ✓
    ↓
Ownership Check (if modifying)
├─ User ID matches author? ✓
    ↓
Business Logic
├─ Data validation ✓
├─ Constraints check ✓
    ↓
Database Operation
├─ Execute query ✓
    ↓
Return Response
├─ 200/201/etc ✓
```

---

**This architecture ensures:**
- ✅ Scalability (can add more servers)
- ✅ Security (JWT, CORS, ownership checks)
- ✅ Real-time communication (Socket.io)
- ✅ Peer-to-peer calls (WebRTC signaling)
- ✅ AI integration (Gemini API)
- ✅ Persistent storage (MongoDB)
