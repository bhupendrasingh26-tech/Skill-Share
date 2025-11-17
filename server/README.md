# Skill Share Backend

A comprehensive backend server for the Skill Share P2P Platform built with Express.js, MongoDB, Socket.io, and WebRTC.

## Features

✅ **RESTful API** - Express.js with full CRUD operations for Posts
✅ **Authentication** - JWT-based authentication with bcrypt password hashing
✅ **Database** - MongoDB with Mongoose schemas for User and Post
✅ **Real-time Chat** - Socket.io for live messaging in rooms
✅ **WebRTC Signaling** - Socket.io for peer-to-peer video/audio calls
✅ **AI Integration** - Google Gemini API for quiz generation
✅ **CORS Support** - Configured for frontend communication

## Project Structure

```
server/
├── src/
│   ├── models/
│   │   ├── User.ts       # User schema with password hashing
│   │   └── Post.ts       # Post schema with author reference
│   ├── routes/
│   │   ├── auth.ts       # Login & registration endpoints
│   │   ├── users.ts      # User profile & search endpoints
│   │   ├── posts.ts      # CRUD endpoints for posts (JWT protected)
│   │   └── ai.ts         # AI quiz generation endpoint
│   ├── middleware/
│   │   └── auth.ts       # JWT authentication middleware
│   ├── sockets/
│   │   ├── chatHandler.ts     # Real-time chat event handlers
│   │   └── webrtcHandler.ts   # WebRTC signaling handlers
│   ├── services/
│   │   └── aiService.ts  # Gemini API integration
│   └── server.ts         # Main server file
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual values:
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `GEMINI_API_KEY` - Google Gemini API key
   - `FRONTEND_URL` - Frontend application URL

4. **Start MongoDB:**
   Ensure MongoDB is running on `localhost:27017` or update `MONGODB_URI`

5. **Run development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/profile/me` - Get current user (JWT required)
- `PUT /api/users/:id` - Update user profile (JWT required)
- `GET /api/users/skill/:skill` - Get users by skill
- `GET /api/users/search/:query` - Search users

### Posts
- `GET /api/posts` - Get all posts (with filtering)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create post (JWT required)
- `PUT /api/posts/:id` - Update post (JWT required, author only)
- `DELETE /api/posts/:id` - Delete post (JWT required, author only)
- `GET /api/posts/author/:authorId` - Get posts by author

### AI
- `POST /api/ai/generate-quiz` - Generate quiz with Gemini API (JWT required)

## Socket.io Events

### Chat Events
- `join_room` - Join a chat room
- `send_message` - Send message to room
- `receive_message` - Receive message from room
- `user_typing` - Notify typing status
- `user_stop_typing` - Stop typing notification
- `leave_room` - Leave chat room

### WebRTC Events
- `join_video_room` - Join video call room
- `webrtc_offer` - Send WebRTC offer
- `receive_offer` - Receive WebRTC offer
- `webrtc_answer` - Send WebRTC answer
- `receive_answer` - Receive WebRTC answer
- `ice_candidate` - Send ICE candidate
- `receive_ice_candidate` - Receive ICE candidate
- `initiate_call` - Initiate a call
- `accept_call` - Accept incoming call
- `reject_call` - Reject incoming call
- `end_call` - End active call

## Database Schemas

### User Schema
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  name: string (required)
  bio: string
  avatarUrl: string
  skillsOffered: string[]
  skillsNeeded: string[]
  validatedSkills: string[]
  rating: number (0-5)
  portfolioUrl: string
  socialMedia: {
    linkedin?: string
    github?: string
    twitter?: string
  }
  collaborationMethods: ('Chat' | 'Video Call' | 'In-person')[]
  createdAt: Date
  updatedAt: Date
}
```

### Post Schema
```typescript
{
  title: string (required)
  description: string (required)
  category: string (required)
  tags: string[]
  author: ObjectId (references User)
  budget: number
  mediaUrl: string
  mediaType: 'image' | 'video'
  createdAt: Date
  updatedAt: Date
}
```

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/skillshare

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Server
PORT=5000
NODE_ENV=development

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
FRONTEND_URL=http://localhost:5173
```

## Development

- **Type Checking:** `npm run build`
- **Run Tests:** Add test configuration as needed
- **Linting:** Add ESLint configuration as needed

## Building for Production

```bash
npm run build
npm start
```

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

### JWT Token Errors
- Verify `JWT_SECRET` is set in `.env`
- Include `Authorization: Bearer <token>` in request headers

### Socket.io Connection Issues
- Check `FRONTEND_URL` matches your frontend origin
- Verify Socket.io client is connecting to correct server URL

### Gemini API Errors
- Ensure `GEMINI_API_KEY` is valid
- Check API rate limits

## Security Considerations

✅ Passwords are hashed with bcrypt (10 salt rounds)
✅ JWT tokens expire after 7 days
✅ CORS is configured to accept requests only from frontend URL
✅ Authentication middleware protects sensitive routes
✅ API keys are loaded from environment variables

## Future Enhancements

- Add request validation with joi/zod
- Implement rate limiting
- Add comprehensive error logging
- Add unit and integration tests
- Add API documentation with Swagger/OpenAPI
- Implement pagination for list endpoints
- Add file upload handling
- Implement transaction support for complex operations

## License

MIT
