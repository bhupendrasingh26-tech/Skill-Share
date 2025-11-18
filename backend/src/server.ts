import express, { Express } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import postInterestRoutes from './routes/postInterests.js';
import skillRequestRoutes from './routes/skillRequests.js';
import skillVerificationRoutes from './routes/skillVerification.js';

// Import socket handlers
import { initializeChatHandler } from './sockets/chatHandler.js';
import { initializeWebRTCHandler } from './sockets/webrtcHandler.js';

const app: Express = express();
const httpServer = createServer(app);

// Allow multiple frontend URLs for development
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// Socket.IO initialization
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true, // Allow all origins in development
    credentials: true,
  },
});

// Make Socket.IO instance available to routes via Express
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/post-interests', postInterestRoutes);
app.use('/api/skill-requests', skillRequestRoutes);
app.use('/api/skill-verification', skillVerificationRoutes);

// Socket.IO handlers
initializeChatHandler(io);
initializeWebRTCHandler(io);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillshare';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Skill Share Backend Server Running`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🔌 Socket.IO Ready for connections`);
    console.log(`========================================\n`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
