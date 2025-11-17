import { io, Socket } from 'socket.io-client';

// Detect backend URL based on environment
const getBackendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000'; // Server-side default
  }

  const host = window.location.hostname;

  // If running on localhost, use port 5000 for backend
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // For production, assume backend is on same host
  return `http://${host}:5000`;
};

const SOCKET_URL = getBackendUrl();

export class SocketService {
  private static socket: Socket | null = null;

  static connect() {
    if (!SocketService.socket) {
      SocketService.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      SocketService.socket.on('connect', () => {
        console.log('✓ Socket.io connected to backend');
      });

      SocketService.socket.on('disconnect', () => {
        console.log('✗ Socket.io disconnected');
      });

      SocketService.socket.on('error', (error: any) => {
        console.error('Socket.io error:', error);
      });
    }
    return SocketService.socket;
  }

  static disconnect() {
    if (SocketService.socket) {
      SocketService.socket.disconnect();
      SocketService.socket = null;
    }
  }

  // CHAT METHODS
  static joinChatRoom(userId: string, userName: string, room: string) {
    SocketService.connect().emit('join_room', { userId, userName, room });
  }

  static sendMessage(senderId: string, senderName: string, text: string, room: string, receiverId: string) {
    SocketService.connect().emit('send_message', { senderId, senderName, text, room, receiverId });
  }

  static onReceiveMessage(callback: (message: any) => void) {
    SocketService.connect().on('receive_message', callback);
  }

  static leaveChatRoom(room: string, userName: string) {
    SocketService.connect().emit('leave_room', { room, userName });
  }

  static onUserTyping(callback: (data: any) => void) {
    SocketService.connect().on('user_typing', callback);
  }

  static onUserLeft(callback: (data: any) => void) {
    SocketService.connect().on('user_left', callback);
  }

  static onUserJoined(callback: (data: any) => void) {
    SocketService.connect().on('user_joined', callback);
  }

  // POST FEED EVENTS
  static onPostCreated(callback: (post: any) => void) {
    SocketService.connect().on('post_created', callback);
  }

  // WebRTC METHODS
  static joinVideoRoom(userId: string, room: string) {
    SocketService.connect().emit('join_video_room', { userId, room });
  }

  static initiateCall(from: string, to: string, callType: 'audio' | 'video') {
    SocketService.connect().emit('initiate_call', { from, to, callType });
  }

  static onIncomingCall(callback: (data: any) => void) {
    SocketService.connect().on('incoming_call', callback);
  }

  static acceptCall(to: string, from: string) {
    SocketService.connect().emit('accept_call', { to, from });
  }

  static onCallAccepted(callback: (data: any) => void) {
    SocketService.connect().on('call_accepted', callback);
  }

  static rejectCall(to: string, from: string) {
    SocketService.connect().emit('reject_call', { to, from });
  }

  static onCallRejected(callback: (data: any) => void) {
    SocketService.connect().on('call_rejected', callback);
  }

  static sendWebRTCOffer(from: string, to: string, offer: any) {
    SocketService.connect().emit('webrtc_offer', { from, to, data: offer });
  }

  static onReceiveOffer(callback: (data: any) => void) {
    SocketService.connect().on('receive_offer', callback);
  }

  static sendWebRTCAnswer(from: string, to: string, answer: any) {
    SocketService.connect().emit('webrtc_answer', { from, to, data: answer });
  }

  static onReceiveAnswer(callback: (data: any) => void) {
    SocketService.connect().on('receive_answer', callback);
  }

  static sendICECandidate(from: string, to: string, candidate: any) {
    SocketService.connect().emit('ice_candidate', { from, to, candidate });
  }

  static onReceiveICECandidate(callback: (data: any) => void) {
    SocketService.connect().on('receive_ice_candidate', callback);
  }

  static endCall(to: string) {
    SocketService.connect().emit('end_call', { to });
  }

  static onCallEnded(callback: (data: any) => void) {
    SocketService.connect().on('call_ended', callback);
  }

  static leaveVideoRoom(room: string, userId: string) {
    SocketService.connect().emit('leave_video_room', { room, userId });
  }

  // Remove event listener (cleanup)
  static offReceiveMessage(callback?: (message: any) => void) {
    SocketService.connect().off('receive_message', callback);
  }

  static offPostCreated(callback?: (post: any) => void) {
    SocketService.connect().off('post_created', callback);
  }

  static offIncomingCall(callback?: (data: any) => void) {
    SocketService.connect().off('incoming_call', callback);
  }

  static offCallAccepted(callback?: (data: any) => void) {
    SocketService.connect().off('call_accepted', callback);
  }

  static offCallRejected(callback?: (data: any) => void) {
    SocketService.connect().off('call_rejected', callback);
  }

  static offCallEnded(callback?: (data: any) => void) {
    SocketService.connect().off('call_ended', callback);
  }

  static offReceiveOffer(callback?: (data: any) => void) {
    SocketService.connect().off('receive_offer', callback);
  }

  static offReceiveAnswer(callback?: (data: any) => void) {
    SocketService.connect().off('receive_answer', callback);
  }

  static offReceiveICECandidate(callback?: (data: any) => void) {
    SocketService.connect().off('receive_ice_candidate', callback);
  }

  // Register this client with the server to map userId -> socket
  static registerUser(userId: string) {
    SocketService.connect().emit('register_user', { userId });
  }
}
