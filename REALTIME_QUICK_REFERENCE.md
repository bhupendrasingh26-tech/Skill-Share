# Real-Time Messaging & Notifications - Quick Reference Guide

## 🚀 What's New

### For End Users
1. **💌 Mark Posts as Interested** - Click heart on any post, owner gets notified instantly
2. **💬 Real-Time Messaging** - Send messages, they appear instantly with full chat history
3. **🔔 Notification Center** - See all activities in one place with badge counter
4. **📞 Call Notifications** - Get notified when someone calls you
5. **✅ Message Status** - See when messages are read/sent

---

## 📱 User Features

### Feature 1: Post Interest Notifications
**What happens:**
- You see a post you're interested in
- Click the heart icon (mark as interested)
- Post owner gets a notification: "[Your Name] is interested in your post about [Topic]"
- Post owner can click notification to see all interested users

**Visual:**
```
User's Feed                          Post Owner's Notifications
┌─────────────────┐                 ┌──────────────────────┐
│   Great Post    │ ──heart click──> │ 🔔 1 unread          │
│   [heart icon]  │                 │ 👤 John is interested│
└─────────────────┘                 │    in your post      │
                                    └──────────────────────┘
```

### Feature 2: Real-Time Messaging
**What happens:**
- Start chat with any user
- Messages appear instantly (like Instagram DM)
- When they reply, you get notified if you're not in the chat
- Full message history always available
- Messages marked as "read" when you open them

**Experience:**
```
Chat Window
┌────────────────────────────────┐
│ John (online)                  │
├────────────────────────────────┤
│ You: Hi! Are you free?       ✓ │ (read)
│ John: Yes! Let's meet       ✓✓ │ (read)
│ You: Great, see you soon!    ✓ │ (delivered)
│ (John is typing...)             │
└────────────────────────────────┘
│ Type a message...               │
└────────────────────────────────┘
```

### Feature 3: Notification Center
**What you see:**
- Bell icon 🔔 in header with red badge showing unread count
- Click bell to see dropdown with all notifications
- Each notification shows:
  - Icon (depending on type)
  - Title and message
  - Time
  - Delete button

**Notification Types:**
- 👍 **Post Interest** - Someone marked interest in your post
- 💬 **Message** - Someone sent you a message
- 📞 **Call** - Someone called you
- 🎓 **Skill Request** - Someone requested your skill

### Feature 4: Chat History
**What you get:**
- Access all past messages with any user
- Search through message history
- Messages persist even after logout
- See conversation timestamps

---

## 💻 For Developers

### API Endpoints Reference

#### Notifications API (`/api/notifications`)

```bash
# Get all notifications
GET /api/notifications
Authorization: Bearer {token}
Response: [{ id, recipientId, senderId, type, title, message, seen, createdAt, sender }]

# Get unread count
GET /api/notifications/unread/count
Authorization: Bearer {token}
Response: { unreadCount: 5 }

# Mark one as seen
PUT /api/notifications/:id/seen
Authorization: Bearer {token}
Response: { notification object }

# Mark all as seen
PUT /api/notifications/all/seen
Authorization: Bearer {token}
Response: { message: "All notifications marked as seen" }

# Delete notification
DELETE /api/notifications/:id
Authorization: Bearer {token}
Response: { message: "Notification deleted" }
```

#### Messages API (`/api/messages`)

```bash
# Get all conversations
GET /api/messages
Authorization: Bearer {token}
Response: [{ _id: userId, lastMessageTime, unreadCount, user }]

# Send message
POST /api/messages
Authorization: Bearer {token}
Body: { receiverId: "userId", text: "message" }
Response: { id, senderId, receiverId, text, seen, createdAt }

# Get chat history with user
GET /api/messages/history/:userId
Authorization: Bearer {token}
Response: [{ id, senderId, receiverId, text, seen, timestamp }]

# Mark message as seen
PUT /api/messages/:id/seen
Authorization: Bearer {token}
Response: { message object }

# Mark all from user as seen
PUT /api/messages/seen/:senderId
Authorization: Bearer {token}
Response: { message: "Messages marked as seen" }
```

#### Post Interests API (`/api/post-interests`)

```bash
# Get all posts user is interested in
GET /api/post-interests
Authorization: Bearer {token}
Response: [{ userId, postId, createdAt, post }]

# Check interest in post
GET /api/post-interests/check/:postId
Authorization: Bearer {token}
Response: { isInterested: true/false }

# Mark interest
POST /api/post-interests/:postId
Authorization: Bearer {token}
Body: {}
Response: { interest, notification }

# Remove interest
DELETE /api/post-interests/:postId
Authorization: Bearer {token}
Response: { message: "Interest removed" }

# Get interested users (owner only)
GET /api/post-interests/post/:postId
Authorization: Bearer {token}
Response: [{ userId, postId, user { name, avatarUrl, bio, rating } }]
```

### Socket.IO Events

#### Emit (Client to Server)
```javascript
// Register user
socket.emit('register_user', { userId, userName });

// Join chat room
socket.emit('join_room', { userId, userName, room });

// Send message
socket.emit('send_message', { 
  senderId, 
  senderName, 
  text, 
  room,
  receiverId 
});

// Typing indicators
socket.emit('user_typing', { room, userName });
socket.emit('user_stop_typing', { room });

// Leave room
socket.emit('leave_room', { room, userName });
```

#### Listen (Server to Client)
```javascript
// Notifications
socket.on('new_notification', (notification) => {
  // notification: { id, type, title, message, data }
});

// User status
socket.on('user_online', ({ userId, userName }) => {});
socket.on('user_offline', ({ userId, userName }) => {});

// Messages
socket.on('receive_message', (message) => {
  // message: { senderId, senderName, text, timestamp, room }
});

socket.on('user_joined', ({ userId, userName, message, timestamp }) => {});
socket.on('user_left', ({ message, timestamp }) => {});
socket.on('user_typing', ({ userName }) => {});
socket.on('user_stop_typing', () => {});

// Call events (existing)
socket.on('incoming_call', (data) => {});
socket.on('call_accepted', (data) => {});
socket.on('call_rejected', (data) => {});
socket.on('call_ended', (data) => {});
```

### Frontend Hook Examples

```typescript
// Load notifications
const [notifications, setNotifications] = useState<Notification[]>([]);

useEffect(() => {
  loadNotifications();
}, []);

const loadNotifications = async () => {
  const notifs = await apiClient.notifications.getAll();
  setNotifications(notifs);
};

// Mark notification as seen
const handleMarkAsSeen = async (notificationId: string) => {
  await apiClient.notifications.markAsSeen(notificationId);
  // Update UI
};

// Send message
const handleSendMessage = async (receiverId: string, text: string) => {
  const message = await apiClient.messages.sendMessage(receiverId, text);
  // Also emit via socket for real-time delivery
  socket.emit('send_message', { ...message });
};

// Mark interest
const handleMarkInterest = async (postId: string) => {
  const response = await apiClient.postInterests.markInterest(postId);
  // Show success notification
};
```

### Database Queries

```javascript
// Get all notifications for user
db.notifications.find({ recipientId: ObjectId("userId") })
  .sort({ createdAt: -1 })
  .limit(50);

// Get unread notifications
db.notifications.countDocuments({ 
  recipientId: ObjectId("userId"), 
  seen: false 
});

// Get chat history between users
db.messages.find({
  $or: [
    { senderId: ObjectId("user1"), receiverId: ObjectId("user2") },
    { senderId: ObjectId("user2"), receiverId: ObjectId("user1") }
  ]
}).sort({ createdAt: 1 });

// Get interested users for post
db.postinterests.find({ postId: ObjectId("postId") })
  .populate('userId');

// Get unread messages from user
db.messages.find({
  senderId: ObjectId("user1"),
  receiverId: ObjectId("user2"),
  seen: false
});
```

---

## 🔧 Implementation Details

### Real-Time Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Socket.IO Server                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Connection Registry (Active Users)              │   │
│  │  userId → socketId                               │   │
│  └──────────────────────────────────────────────────┘   │
│                         ▲                                │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Message Broadcaster                             │   │
│  │  - Saves to DB                                   │   │
│  │  - Broadcasts to room                            │   │
│  │  - Notifies if offline                           │   │
│  └──────────────────────────────────────────────────┘   │
│                         ▲                                │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Notification Service                            │   │
│  │  - Creates notification                          │   │
│  │  - Emits to specific user                        │   │
│  │  - Updates badge count                           │   │
│  └──────────────────────────────────────────────────┘   │
│                         ▲                                │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐     ┌───▼─────┐
    │ Browser │     │ Browser │     │ Browser │
    │  User1  │     │  User2  │     │  User3  │
    └─────────┘     └─────────┘     └─────────┘
```

### State Management in Frontend

```typescript
// App.tsx
const [notifications, setNotifications] = useState<Notification[]>([]);
const [chatSessions, setChatSessions] = useState<Record<string, ChatMessage[]>>({});
const [activeChats, setActiveChats] = useState<string[]>([]);

// Socket listener registration
useEffect(() => {
  socket.on('new_notification', handleNewNotification);
  socket.on('receive_message', handleReceiveMessage);
  
  return () => {
    socket.off('new_notification', handleNewNotification);
    socket.off('receive_message', handleReceiveMessage);
  };
}, []);
```

---

## 🧪 Testing the Features

### Manual Test Checklist

- [ ] Create 2 test accounts
- [ ] User A marks post by User B as interested
- [ ] User B receives notification immediately
- [ ] Click notification shows interested user details
- [ ] User A sends message to User B
- [ ] Message appears in real-time
- [ ] Message marks as read when opened
- [ ] Close chat, message still there when reopening
- [ ] Notification count increases/decreases
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Offline user gets notification when coming online
- [ ] Dark mode works with notifications
- [ ] Works on mobile screen size

### API Test Examples

```bash
# Test notification retrieval
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications

# Test sending message
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"userId","text":"Hello"}' \
  http://localhost:5000/api/messages

# Test marking interest
curl -X POST \
  -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/post-interests/postId
```

---

## 📊 Performance Notes

- Notifications loaded on app startup
- Real-time updates via Socket.IO (no polling)
- Database indexes on frequently searched fields
- Messages limited to prevent memory issues
- Chat rooms use Socket.IO rooms for efficient broadcasting

---

## 🐛 Troubleshooting

### Notifications not appearing
1. Check Socket.IO connection in browser console
2. Verify user is registered with server
3. Check database has notifications collection
4. Clear browser cache and reload

### Messages not sending
1. Verify both users are authenticated
2. Check Socket.IO room is joined
3. Confirm API endpoint is working (test with curl)
4. Check browser console for errors

### Real-time not working
1. Ensure Socket.IO is connected
2. Check server logs for connection errors
3. Verify CORS is configured correctly
4. Check firewall isn't blocking websockets

---

## 🚀 Deployment Notes

1. **Environment Variables** set in `.env`
2. **MongoDB** must be running and accessible
3. **Socket.IO** requires proper CORS configuration
4. **Authentication** tokens must be valid
5. **Database** indexes are created automatically

---

## 📚 Additional Resources

- Socket.IO Documentation: https://socket.io/docs/
- MongoDB Indexing: https://docs.mongodb.com/manual/indexes/
- REST API Best Practices: https://restfulapi.net/
- Real-Time Web Technologies: https://en.wikipedia.org/wiki/Real-time_web

---

## 📝 Code Examples

### Mark Post as Interested (Frontend)
```typescript
const handleToggleInterest = async (postId: string) => {
  try {
    const response = await apiClient.postInterests.markInterest(postId);
    setInterestedPosts(prev => new Set([...prev, postId]));
    console.log('Post owner will be notified!');
  } catch (error) {
    console.error('Failed to mark interest', error);
  }
};
```

### Send Message (Frontend)
```typescript
const handleSendMessage = (receiverId: string, text: string) => {
  if (!text.trim()) return;
  
  // Send via API
  apiClient.messages.sendMessage(receiverId, text);
  
  // Send via Socket for real-time
  socket.emit('send_message', {
    senderId: currentUser.id,
    senderName: currentUser.name,
    text,
    room: getChatId(currentUser.id, receiverId),
    receiverId
  });
};
```

### Listen for Notifications (Frontend)
```typescript
useEffect(() => {
  const socket = SocketService.connect();
  
  socket.on('new_notification', (notification) => {
    setNotifications(prev => [notification, ...prev]);
    // Show visual indicator
    playNotificationSound();
  });
  
  return () => socket.off('new_notification');
}, []);
```

---

## ✅ Completion Status

✓ Backend models created
✓ API endpoints implemented
✓ Socket.IO handlers enhanced
✓ Frontend components created
✓ State management updated
✓ Type definitions added
✓ API client methods added
✓ Real-time event listeners setup
✓ Database indexes created
✓ Error handling implemented
✓ Documentation completed

---

**Last Updated:** November 16, 2025
**Status:** ✅ Complete and Ready for Testing
