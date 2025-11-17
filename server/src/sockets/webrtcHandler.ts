import { Server, Socket } from 'socket.io';

interface RTCSignal {
  from: string;
  to: string;
  type: 'offer' | 'answer';
  data: any;
}

interface ICECandidate {
  from: string;
  to: string;
  candidate: any;
}

// Map to store userId -> socketId
const userSocketMap = new Map<string, string>();

export const initializeWebRTCHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('WebRTC Client connected:', socket.id);

    // Register user when they connect
    socket.on('register_user', (data: { userId: string }) => {
      const { userId } = data;
      userSocketMap.set(userId, socket.id);
      socket.join(`user_${userId}`); // Join a room with their userId
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Join a video call room
    socket.on('join_video_room', (data: { userId: string; room: string }) => {
      const { userId, room } = data;
      socket.join(room);
      console.log(`${userId} joined video room: ${room}`);

      // Notify others in the room that a user joined
      socket.to(room).emit('user_joined_video', {
        userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle WebRTC offer
    socket.on('webrtc_offer', (data: RTCSignal) => {
      const { from, to, data: offerData } = data;

      // Relay offer to specific user (using userId room)
      io.to(`user_${to}`).emit('receive_offer', {
        from,
        offer: offerData,
      });

      console.log(`Offer relayed from ${from} to ${to}`);
    });

    // Handle WebRTC answer
    socket.on('webrtc_answer', (data: RTCSignal) => {
      const { from, to, data: answerData } = data;

      // Relay answer to specific user (using userId room)
      io.to(`user_${to}`).emit('receive_answer', {
        from,
        answer: answerData,
      });

      console.log(`Answer relayed from ${from} to ${to}`);
    });

    // Handle ICE candidates
    socket.on('ice_candidate', (data: ICECandidate) => {
      const { from, to, candidate } = data;

      // Relay ICE candidate to specific user (using userId room)
      io.to(`user_${to}`).emit('receive_ice_candidate', {
        from,
        candidate,
      });

      console.log(`ICE candidate relayed from ${from} to ${to}`);
    });

    // Handle call initiation
    socket.on('initiate_call', (data: { from: string; to: string; callType: 'audio' | 'video' }) => {
      const { from, to, callType } = data;

      // Notify the target user about incoming call (using userId room)
      io.to(`user_${to}`).emit('incoming_call', {
        from,
        callType,
        timestamp: new Date().toISOString(),
      });

      console.log(`Call from ${from} to ${to} (${callType})`);
    });

    // Handle call acceptance
    socket.on('accept_call', (data: { to: string; from: string }) => {
      const { to, from } = data;

      // Notify the caller (using userId room)
      io.to(`user_${to}`).emit('call_accepted', {
        from,
      });

      console.log(`Call accepted: ${from} <-> ${to}`);
    });

    // Handle call rejection
    socket.on('reject_call', (data: { to: string; from: string }) => {
      const { to, from } = data;

      // Notify the caller (using userId room)
      io.to(`user_${to}`).emit('call_rejected', {
        from,
        reason: 'User declined the call',
      });

      console.log(`Call rejected: ${from} -> ${to}`);
    });

    // Handle call end
    socket.on('end_call', (data: { to: string }) => {
      const { to } = data;

      // Notify the other user (using userId room)
      io.to(`user_${to}`).emit('call_ended', {
        timestamp: new Date().toISOString(),
      });

      console.log(`Call ended`);
    });

    // Leave video room
    socket.on('leave_video_room', (data: { room: string; userId: string }) => {
      const { room, userId } = data;
      socket.leave(room);

      // Notify others in the room
      socket.to(room).emit('user_left_video', {
        userId,
        message: `${userId} left the video room`,
      });

      console.log(`${userId} left video room: ${room}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Remove user from map
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log('WebRTC Client disconnected:', socket.id);
    });
  });
};
