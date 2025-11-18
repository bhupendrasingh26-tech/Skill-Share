import { Server, Socket } from 'socket.io';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  room: string;
}

// Store active user connections
const activeUsers: Map<string, string> = new Map(); // userId -> socketId

export const initializeChatHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Register user connection
    socket.on('register_user', async (data: { userId: string; userName: string }) => {
      const { userId, userName } = data;
      activeUsers.set(userId, socket.id);
      socket.data.userId = userId;
      socket.data.userName = userName;
      console.log(`${userName} (${userId}) registered - Socket: ${socket.id}`);
      
      // Deliver any unread messages when user comes online
      try {
        const unreadMessages = await Message.find({
          receiverId: userId,
          seen: false,
        })
          .populate('senderId', 'name avatarUrl email')
          .sort({ createdAt: 1 })
          .limit(100); // Limit to recent 100 unread messages

        // Group messages by sender and deliver
        const messagesBySender = new Map();
        for (const msg of unreadMessages) {
          // Handle both populated and non-populated senderId
          const senderId = (msg.senderId._id || msg.senderId.id || msg.senderId).toString();
          const senderName = msg.senderId.name || 'Unknown';
          const chatId = [userId, senderId].sort().join('_');
          
          if (!messagesBySender.has(senderId)) {
            messagesBySender.set(senderId, []);
          }
          
          messagesBySender.get(senderId).push({
            senderId,
            senderName,
            text: msg.text,
            timestamp: msg.createdAt.toISOString(),
            room: chatId,
          });
        }

        // Deliver messages grouped by sender
        for (const [senderId, messages] of messagesBySender) {
          for (const chatMessage of messages) {
            socket.emit('receive_message', chatMessage);
          }
        }

        // Mark delivered messages as seen (optional - you might want to mark as seen only when user opens chat)
        // await Message.updateMany(
        //   { receiverId: userId, seen: false },
        //   { seen: true }
        // );
      } catch (error) {
        console.error('Failed to deliver unread messages on login:', error);
      }
      
      // Broadcast user online status
      io.emit('user_online', { userId, userName });
    });

    // Join a chat room
    socket.on('join_room', async (data: { userId: string; userName: string; room: string }) => {
      const { userId, userName, room } = data;

      // Leave previous room if any
      const previousRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      previousRooms.forEach((r) => socket.leave(r));

      // Join new room
      socket.join(room);
      console.log(`${userName} (${userId}) joined room: ${room}`);

      // Deliver any unread messages from database when user joins room
      try {
        // Extract the other user's ID from the room (room format: userId1_userId2)
        const [id1, id2] = room.split('_');
        const otherUserId = id1 === userId ? id2 : id1;

        // Get unread messages from database
        const unreadMessages = await Message.find({
          $or: [
            { senderId: otherUserId, receiverId: userId, seen: false },
          ],
        })
          .populate('senderId', 'name avatarUrl email')
          .sort({ createdAt: 1 })
          .limit(50); // Limit to recent 50 messages

        // Deliver unread messages to the user
        for (const msg of unreadMessages) {
          // Handle both populated and non-populated senderId
          const senderId = (msg.senderId._id || msg.senderId.id || msg.senderId).toString();
          const senderName = msg.senderId.name || 'Unknown';
          
          const chatMessage: ChatMessage = {
            senderId,
            senderName,
            text: msg.text,
            timestamp: msg.createdAt.toISOString(),
            room,
          };
          socket.emit('receive_message', chatMessage);
        }

        // Mark messages as seen
        if (unreadMessages.length > 0) {
          await Message.updateMany(
            { senderId: otherUserId, receiverId: userId, seen: false },
            { seen: true }
          );
        }
      } catch (error) {
        console.error('Failed to deliver unread messages:', error);
      }

      // Notify others in the room
      socket.to(room).emit('user_joined', {
        userId,
        userName,
        message: `${userName} joined the chat`,
        timestamp: new Date().toISOString(),
      });
    });

    // Send message to room
    socket.on('send_message', async (data: { senderId: string; senderName: string; text: string; room: string; receiverId: string }) => {
      const { senderId, senderName, text, room, receiverId } = data;

      if (!text.trim()) return;

      const chatMessage: ChatMessage = {
        senderId,
        senderName,
        text,
        timestamp: new Date().toISOString(),
        room,
      };

      // Always save message to database first (like WhatsApp/Instagram)
      let savedMessage;
      try {
        const message = new Message({
          senderId,
          receiverId,
          text: text.trim(),
          seen: false,
        });
        savedMessage = await message.save();
      } catch (error) {
        console.error('Failed to save message:', error);
        // Don't proceed if message wasn't saved
        return;
      }

      // Check if receiver is online
      const receiverSocketId = activeUsers.get(receiverId);
      const isReceiverInRoom = receiverSocketId && io.sockets.adapter.rooms.get(room)?.has(receiverSocketId);

      // Send message directly to receiver if they're online (regardless of room)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', chatMessage);
      }

      // Also broadcast to room for sender's own confirmation and others in room
      io.to(room).emit('receive_message', chatMessage);

      // Send notification if receiver is offline or not actively viewing the chat
      try {
        if (!receiverSocketId || !isReceiverInRoom) {
          // Receiver is offline or not actively in chat, send notification
          const sender = await User.findById(senderId, 'name avatarUrl email');
          const notification = new Notification({
            recipientId: receiverId,
            senderId,
            type: 'message',
            title: `New message from ${senderName}`,
            message: text.substring(0, 100),
            data: { chatId: room },
          });
          await notification.save();
          
          // Populate sender info for the notification
          await notification.populate('senderId', 'name avatarUrl email');
          
          // Send notification to receiver if online, otherwise it will be delivered when they come online
          if (receiverSocketId) {
            const notificationObj = notification.toObject();
            io.to(receiverSocketId).emit('new_notification', { 
              recipientId: receiverId, 
              notification: {
                ...notificationObj,
                id: notificationObj._id?.toString() || notificationObj.id, // Ensure id field exists
                sender: sender ? {
                  id: sender._id.toString(),
                  name: sender.name,
                  avatarUrl: sender.avatarUrl,
                  email: sender.email,
                } : null,
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to create notification:', error);
      }

      console.log(`Message saved and delivered from ${senderName} to ${receiverId} in room ${room}: ${text}`);
    });

    // Typing indicator
    socket.on('user_typing', (data: { room: string; userName: string }) => {
      const { room, userName } = data;
      socket.to(room).emit('user_typing', { userName });
    });

    socket.on('user_stop_typing', (data: { room: string }) => {
      const { room } = data;
      socket.to(room).emit('user_stop_typing', {});
    });

    // Leave room
    socket.on('leave_room', (data: { room: string; userName: string }) => {
      const { room, userName } = data;
      socket.leave(room);
      socket.to(room).emit('user_left', {
        message: `${userName} left the chat`,
        timestamp: new Date().toISOString(),
      });
      console.log(`${userName} left room: ${room}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      const userName = socket.data.userName;
      
      if (userId) {
        activeUsers.delete(userId);
        console.log('User disconnected:', socket.id, `(${userName})`);
        io.emit('user_offline', { userId, userName });
      }
    });
  });
};
