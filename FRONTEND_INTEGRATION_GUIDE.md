# Frontend Integration Guide

This guide explains how to integrate the frontend with the backend API and Socket.io services.

## 📦 Setup Steps

### 1. Update Frontend Dependencies

Add Socket.io client to your frontend `package.json`:

```bash
npm install socket.io-client
```

### 2. Create API Client Service

Create `src/services/apiClient.ts`:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = {
  // Helper to get token from localStorage
  getToken: () => localStorage.getItem('authToken'),

  // Helper to add authorization header
  getHeaders: (includeAuth = true) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = apiClient.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  },

  // AUTH ENDPOINTS
  auth: {
    register: async (email: string, password: string, name: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: apiClient.getHeaders(false),
        body: JSON.stringify({ email, password, name }),
      });
      return response.json();
    },

    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: apiClient.getHeaders(false),
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      return data;
    },

    logout: () => {
      localStorage.removeItem('authToken');
    },
  },

  // USER ENDPOINTS
  users: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    getCurrentUser: async () => {
      const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
        headers: apiClient.getHeaders(true),
      });
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },

    update: async (id: string, data: Record<string, any>) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getBySkill: async (skill: string) => {
      const response = await fetch(`${API_BASE_URL}/users/skill/${skill}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    search: async (query: string) => {
      const response = await fetch(`${API_BASE_URL}/users/search/${query}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },
  },

  // POST ENDPOINTS
  posts: {
    getAll: async (category?: string, tag?: string, search?: string) => {
      let url = `${API_BASE_URL}/posts`;
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tag) params.append('tag', tag);
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    create: async (data: Record<string, any>) => {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify(data),
      });
      return response.json();
    },

    update: async (id: string, data: Record<string, any>) => {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'DELETE',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getByAuthor: async (authorId: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/author/${authorId}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },
  },

  // AI ENDPOINTS
  ai: {
    generateQuiz: async (topic: string, difficulty = 'intermediate') => {
      const response = await fetch(`${API_BASE_URL}/ai/generate-quiz`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ topic, difficulty }),
      });
      return response.json();
    },
  },
};
```

### 3. Create Socket.io Service

Create `src/services/socketService.ts`:

```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export class SocketService {
  private static socket: Socket | null = null;

  static connect() {
    if (!SocketService.socket) {
      SocketService.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
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

  static sendMessage(senderId: string, senderName: string, text: string, room: string) {
    SocketService.connect().emit('send_message', { senderId, senderName, text, room });
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
}
```

---

## 🔌 Usage Examples in React Components

### Login Component

```typescript
import { useState } from 'react';
import { apiClient } from '../services/apiClient';

export const LoginComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.auth.login(email, password);
      
      if (response.success) {
        // Token is auto-saved to localStorage by apiClient
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        window.location.href = '/feed'; // Redirect to feed
      } else {
        alert(response.error);
      }
    } catch (error) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
};
```

### Create Post Component

```typescript
import { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { POST_CATEGORIES } from '../constants';

export const CreatePostComponent = ({ onPostCreated }: { onPostCreated: () => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Programming');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.posts.create({
        title,
        description,
        category,
        tags,
      });

      if (response._id) {
        alert('Post created successfully!');
        onPostCreated();
        // Reset form
        setTitle('');
        setDescription('');
        setTags([]);
      }
    } catch (error) {
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Describe what you offer or need"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {POST_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};
```

### Chat Component

```typescript
import { useState, useEffect } from 'react';
import { SocketService } from '../services/socketService';

export const ChatComponent = ({
  currentUser,
  selectedUser,
}: {
  currentUser: any;
  selectedUser: any;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const chatRoomId = [currentUser.id, selectedUser.id].sort().join('-');

  useEffect(() => {
    // Join chat room
    SocketService.joinChatRoom(
      currentUser.id,
      currentUser.name,
      chatRoomId
    );

    // Listen for messages
    SocketService.onReceiveMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      SocketService.leaveChatRoom(chatRoomId, currentUser.name);
    };
  }, [selectedUser]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    SocketService.sendMessage(
      currentUser.id,
      currentUser.name,
      messageText,
      chatRoomId
    );

    setMessageText('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.senderId === currentUser.id ? 'my-message' : 'other-message'}
          >
            <strong>{msg.senderName}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
```

### Video Call Component

```typescript
import { useState, useEffect, useRef } from 'react';
import { SocketService } from '../services/socketService';

export const VideoCallComponent = ({
  currentUser,
  targetUser,
}: {
  currentUser: any;
  targetUser: any;
}) => {
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'active' | 'ended'>('idle');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const STUN_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  useEffect(() => {
    // Join video room
    const roomId = [currentUser.id, targetUser.id].sort().join('-');
    SocketService.joinVideoRoom(currentUser.id, roomId);

    // Listen for incoming calls
    SocketService.onIncomingCall((data) => {
      setCallState('incoming');
      console.log('Incoming call from:', data.from);
    });

    // Listen for call acceptance
    SocketService.onCallAccepted(async (data) => {
      setCallState('active');
      await createPeerConnection();
      await createAndSendOffer();
    });

    // Listen for incoming offers
    SocketService.onReceiveOffer(async (data) => {
      if (!peerConnectionRef.current) {
        await createPeerConnection();
      }
      await peerConnectionRef.current!.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);

      SocketService.sendWebRTCAnswer(currentUser.id, targetUser.id, answer);
    });

    // Listen for incoming answers
    SocketService.onReceiveAnswer(async (data) => {
      await peerConnectionRef.current!.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    // Listen for ICE candidates
    SocketService.onReceiveICECandidate((data) => {
      peerConnectionRef.current!.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    // Listen for call end
    SocketService.onCallEnded(() => {
      setCallState('ended');
      endCall();
    });

    return () => {
      const roomId = [currentUser.id, targetUser.id].sort().join('-');
      SocketService.leaveVideoRoom(roomId, currentUser.id);
    };
  }, []);

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Get local stream
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // Add tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Listen for remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        SocketService.sendICECandidate(
          currentUser.id,
          targetUser.id,
          event.candidate
        );
      }
    };

    peerConnectionRef.current = pc;
  };

  const createAndSendOffer = async () => {
    const offer = await peerConnectionRef.current!.createOffer();
    await peerConnectionRef.current!.setLocalDescription(offer);
    SocketService.sendWebRTCOffer(currentUser.id, targetUser.id, offer);
  };

  const handleInitiateCall = () => {
    SocketService.initiateCall(currentUser.id, targetUser.id, 'video');
  };

  const handleAcceptCall = async () => {
    SocketService.acceptCall(targetUser.id, currentUser.id);
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    SocketService.endCall(targetUser.id);
    setCallState('idle');
  };

  return (
    <div className="video-call-container">
      {callState === 'idle' && (
        <button onClick={handleInitiateCall}>Start Call</button>
      )}

      {callState === 'incoming' && (
        <div className="call-notification">
          <p>{targetUser.name} is calling...</p>
          <button onClick={handleAcceptCall}>Accept</button>
          <button onClick={() => setCallState('idle')}>Decline</button>
        </div>
      )}

      {callState === 'active' && (
        <div className="video-container">
          <video ref={localVideoRef} autoPlay muted />
          <video ref={remoteVideoRef} autoPlay />
          <button onClick={endCall}>End Call</button>
        </div>
      )}

      {callState === 'ended' && (
        <p>Call ended</p>
      )}
    </div>
  );
};
```

### Generate Quiz Component

```typescript
import { useState } from 'react';
import { apiClient } from '../services/apiClient';

export const QuizComponent = ({ topic }: { topic: string }) => {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    try {
      const response = await apiClient.ai.generateQuiz(topic, 'intermediate');
      
      if (response.success) {
        setQuiz(response.quiz);
      }
    } catch (error) {
      alert('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) {
    return (
      <button onClick={handleGenerateQuiz} disabled={loading}>
        {loading ? 'Generating Quiz...' : 'Generate Quiz'}
      </button>
    );
  }

  return (
    <div className="quiz-container">
      <h2>{quiz.topic}</h2>
      {quiz.questions.map((q: any, idx: number) => (
        <div key={idx} className="question">
          <h4>{q.question}</h4>
          {q.options.map((option: string, optIdx: number) => (
            <label key={optIdx}>
              <input type="radio" name={`q${idx}`} />
              {option}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
};
```

---

## 🚨 Important: Update Frontend to Use Real Backend

Update your `App.tsx` or main component to:

1. **Use API client instead of mock data:**
```typescript
// Before (mock data)
const [posts, setPosts] = useState<Post[]>([]);
const [users, setUsers] = useState<User[]>(MOCK_USERS);

// After (real API)
useEffect(() => {
  apiClient.posts.getAll().then(setPosts);
  apiClient.users.getAll().then(setUsers);
}, []);
```

2. **Connect Socket.io on mount:**
```typescript
useEffect(() => {
  if (currentUser) {
    SocketService.connect();
  }
  
  return () => {
    SocketService.disconnect();
  };
}, [currentUser]);
```

3. **Update authentication flow:**
```typescript
// Use apiClient.auth.login() and apiClient.auth.register()
// Store token in localStorage
// Pass token in all protected requests
```

---

## 🔍 Debugging

### Check Backend is Running

```bash
curl http://localhost:5000/health
# Should return: { "status": "OK", "timestamp": "..." }
```

### Check Network Requests

Open DevTools → Network tab
- Look for API calls to `localhost:5000`
- Check Authorization header is present
- Verify response status (200, 201, etc.)

### Check Socket.io Connection

Open DevTools → Console:
```javascript
// Check if connected
io.Socket.connected

// Check events
io.Socket.on('connect', () => console.log('Connected'))
```

---

## 📚 Quick Links

- **API Base URL:** `http://localhost:5000/api`
- **Socket.io URL:** `http://localhost:5000`
- **Backend README:** `./server/README.md`
- **Quick Reference:** `./BACKEND_QUICK_REFERENCE.md`
- **Setup Guide:** `./BACKEND_SETUP_GUIDE.md`

---

**Ready to integrate! Start with updating your App.tsx file.** 🚀
