# Setup & Testing Guide - Real-Time Features

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB running locally or remote connection
- npm or yarn

### Step 1: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already done)
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/skillshare
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
EOF

# Start server
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
🚀 Skill Share Backend Server Running
📍 Port: 5000
🌐 Frontend URL: http://localhost:5173
🔌 Socket.IO Ready for connections
```

### Step 2: Frontend Setup

```bash
# Navigate to root directory
cd ..

# Install dependencies (if not already done)
npm install

# Start frontend
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:5173/
```

### Step 3: Test the Connection

1. Open browser to http://localhost:5173
2. Check browser console for "✓ Socket.io connected to backend"
3. Login with a test account

---

## 🧪 Feature Testing Guide

### Test 1: Post Interest Notification

**Setup:** 2 browser windows/tabs

**Step 1: Create Post (Window 1)**
- Login as User A
- Click "Share a Skill / Need"
- Create a post (e.g., "Learn React")
- Click Create

**Step 2: Mark Interest (Window 2)**
- Login as User B (different account)
- Find User A's post
- Click the heart icon
- Confirm: "Interest marked! Post owner will be notified."

**Step 3: Verify Notification (Window 1)**
- Notice bell icon now has red badge with count
- Click bell icon
- Should see: "👍 User B is interested in your post 'Learn React'"
- Click notification
- Should navigate to dashboard showing interested users

**Success Criteria:**
- ✅ Notification appears in real-time
- ✅ Notification count increases
- ✅ Clicking notification shows correct content
- ✅ Mark as read works

---

### Test 2: Real-Time Messaging

**Setup:** 2 browser windows/tabs

**Step 1: Start Chat (Window 1)**
- Login as User A
- Find a user's profile or post
- Click message button
- Click their name to open chat

**Step 2: Send Message (Window 1)**
- Type message: "Hello! Are you available?"
- Press Enter
- Message should appear immediately

**Step 3: Receive Message (Window 2)**
- Login as User B
- Should see notification: "💬 New message from User A"
- Or navigate to Messages page
- Should see User A in conversations
- Click to open chat
- Should see full history including User A's message

**Step 4: Reply (Window 2)**
- Type response: "Yes, let's connect!"
- Send message
- Message appears in Window 2 immediately

**Step 5: Verify (Window 1)**
- See User B's reply in real-time
- Both messages marked as read

**Success Criteria:**
- ✅ Messages send instantly
- ✅ Chat window shows full history
- ✅ Messages from other user appear in real-time
- ✅ Notification for new message appears
- ✅ Read status updates (checkmarks)
- ✅ Chat persists after refresh

---

### Test 3: Notification Center

**Setup:** 1 browser window

**Step 1: Generate Notifications**
- Mark 3 different posts as interested
- Send 2 messages
- Each action should create a notification

**Step 2: Check Bell Icon**
- Should show badge with count "5" (or total)
- Badge color should be red
- Click bell icon

**Step 3: Test Notification Dropdown**
- Should show all notifications
- Each has icon (👍 for interest, 💬 for message)
- Each shows title, message, and time
- Click "Mark all as read" button
- All notifications should lose highlight
- Unread badge should disappear

**Step 4: Delete Notification**
- Hover over notification
- Click delete (trash) icon
- Notification should disappear from list
- Count should decrease

**Step 5: Click Notification**
- Send yourself a test message via another account
- See notification in bell
- Click notification
- Should navigate to Messages page
- Chat should be open with message visible

**Success Criteria:**
- ✅ Badge shows correct count
- ✅ Notifications display correctly
- ✅ Mark as read works
- ✅ Delete works
- ✅ Click navigates correctly
- ✅ All styling responsive

---

### Test 4: Chat History Persistence

**Setup:** 1 browser window

**Step 1: Send Multiple Messages**
- Open chat with User B
- Send 5 messages over time
- Each message appears

**Step 2: Close Chat**
- Click X to close chat window

**Step 3: Reopen Chat**
- Find User B again
- Open chat with them
- All 5 messages should still be there

**Step 4: Refresh Page**
- While in chat, press F5 (refresh)
- Page reloads
- Navigate back to chat
- All messages still there

**Step 5: New Session**
- Logout
- Login again
- Navigate to Messages
- Should see conversation history with User B
- Click to open chat
- All messages are still there

**Success Criteria:**
- ✅ Messages persist in chat
- ✅ Refresh doesn't clear messages
- ✅ New session retains message history
- ✅ Messages ordered chronologically

---

### Test 5: Online/Offline Status

**Setup:** 2 browser windows

**Step 1: Check Online Status (Window 1)**
- Open chat with User B
- User B should show "(online)" in header
- Look in users list
- User B should have green online indicator

**Step 2: Go Offline (Window 2)**
- Close User B's browser tab/window
- Wait 5 seconds

**Step 3: Verify Offline (Window 1)**
- Window 1 should show User B as "(offline)"
- Online indicator should turn gray
- Send a message
- Message should still work but won't show "delivered" state

**Step 4: Come Back Online (Window 2)**
- Reopen browser to application
- Login as User B

**Step 5: Verify Online (Window 1)**
- Should show User B as "(online)"
- Green indicator should reappear
- Message from Step 3 should now show as delivered

**Success Criteria:**
- ✅ Online status updates in real-time
- ✅ Visual indicators change
- ✅ Messages work regardless of status
- ✅ Status syncs across windows

---

### Test 6: Notification Sound & Browser Behavior

**Setup:** 1 browser window

**Step 1: Mute Browser**
- In browser settings, mute tab or system sound
- Or set browser to "Allow" notifications

**Step 2: Send Yourself a Message**
- From another account, send you a message
- Should see:
  - Bell icon badge increases
  - Notification appears in dropdown
  - Browser tab shows notification (optional)

**Step 3: Check in Background**
- Send message while this browser is in background
- Bell icon should still update
- Notification should appear
- Sound should play (if enabled)

**Success Criteria:**
- ✅ Notifications visible even if page not focused
- ✅ Badge count updates
- ✅ Notification visible when returning to tab
- ✅ No crashes with background notifications

---

## 🔧 API Testing

### Using Postman or cURL

**Test 1: Get Notifications**
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
[
  {
    "_id": "123...",
    "recipientId": "user2_id",
    "senderId": "user1_id",
    "type": "post_interest",
    "title": "John is interested in your post",
    "message": "John marked interest in \"Learn React\"",
    "data": { "postId": "post_id" },
    "seen": false,
    "createdAt": "2025-11-16T10:30:00Z"
  }
]
```

**Test 2: Send Message**
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "user2_id",
    "text": "Hello! How are you?"
  }'
```

Expected response:
```json
{
  "_id": "456...",
  "senderId": "user1_id",
  "receiverId": "user2_id",
  "text": "Hello! How are you?",
  "seen": false,
  "createdAt": "2025-11-16T10:35:00Z"
}
```

**Test 3: Get Chat History**
```bash
curl -X GET http://localhost:5000/api/messages/history/user2_id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response: Array of messages between you and user2

**Test 4: Mark Interest**
```bash
curl -X POST http://localhost:5000/api/post-interests/post_id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "interest": { "userId": "...", "postId": "..." },
  "notification": { "recipientId": "...", "type": "post_interest", ... }
}
```

---

## 📊 Database Verification

### Check MongoDB Collections

```bash
# Connect to MongoDB
mongosh

# Switch to database
use skillshare

# Check collections
show collections

# View sample notifications
db.notifications.find().pretty()

# View sample messages
db.messages.find().pretty()

# View sample interests
db.postinterests.find().pretty()

# Check indexes
db.notifications.getIndexes()
db.messages.getIndexes()
db.postinterests.getIndexes()
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging

**Frontend Console:**
```javascript
// In App.tsx or main.ts
localStorage.setItem('DEBUG', 'skillshare:*');
```

**Server Console:**
Set environment variable:
```bash
DEBUG=skillshare:* npm run dev
```

### Check Socket.IO Connection

**In Browser Console:**
```javascript
// Check if socket is connected
console.log(SocketService.connect().connected);

// Listen for socket events
const socket = SocketService.connect();
socket.onAny((event, ...args) => {
  console.log(event, args);
});
```

### Monitor Network Activity

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket) or "XHR" (API calls)
3. Watch messages being sent/received
4. Check Headers for Authorization token

### Check Server Logs

```bash
# Watch server logs
tail -f server/logs/debug.log

# Or check console output
# Should see:
# - Socket connections/disconnections
# - Message broadcasts
# - Notification creations
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Socket.io disconnected"
**Cause:** Server not running or CORS issue
**Solution:**
1. Verify server is running: `npm run dev` in server folder
2. Check CORS URL in server.ts matches frontend URL
3. Check firewall isn't blocking port 5000

### Issue: "Not authorized" on API calls
**Cause:** Missing or invalid auth token
**Solution:**
1. Ensure you're logged in
2. Check localStorage has 'authToken'
3. Try logging out and back in
4. Check token hasn't expired

### Issue: Messages not appearing
**Cause:** Socket.IO room not joined or database error
**Solution:**
1. Open DevTools console
2. Check for error messages
3. Verify Socket.IO is connected
4. Check MongoDB is running
5. Try refreshing page

### Issue: Notifications not real-time
**Cause:** Socket.IO listener not registered
**Solution:**
1. Check browser console for socket errors
2. Verify `new_notification` listener is registered
3. Check server is emitting notification events
4. Try hard refresh (Ctrl+Shift+R)

### Issue: Database errors (E11000, CastError)
**Cause:** Invalid data or duplicate entries
**Solution:**
1. Clear database and start fresh: `db.dropDatabase()`
2. Ensure IDs are valid MongoDB ObjectIds
3. Don't manually edit notifications without validation
4. Use API endpoints instead of direct DB manipulation

---

## 📈 Performance Testing

### Load Testing Chat

```javascript
// Send 100 messages rapidly
for (let i = 0; i < 100; i++) {
  apiClient.messages.sendMessage(recipientId, `Message ${i}`);
}

// Check performance
console.time('load-messages');
const messages = await apiClient.messages.getHistory(userId);
console.timeEnd('load-messages');
```

### Monitor Database

```bash
# Check current operations
db.currentOp()

# Check index usage
db.messages.aggregate([
  { $indexStats: {} }
])
```

---

## ✅ Complete Testing Checklist

**Before Deployment:**
- [ ] All 6 feature tests pass
- [ ] API tests return correct responses
- [ ] Database has all collections with indexes
- [ ] No console errors in browser
- [ ] No console errors on server
- [ ] Socket.IO connects successfully
- [ ] Messages persist after refresh
- [ ] Notifications appear in real-time
- [ ] Dark mode looks correct
- [ ] Mobile responsive
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on mobile browser
- [ ] Token expiration handled
- [ ] Network tab shows clean requests
- [ ] No memory leaks (DevTools → Memory)

---

## 📚 Reference Files

- **Backend**: `/server/src/routes/notifications.ts`, `/messages.ts`, `/postInterests.ts`
- **Frontend**: `/components/NotificationCenter.tsx`, `/App.tsx`
- **Types**: `/types.ts`
- **API Client**: `/services/apiClient.ts`
- **Sockets**: `/services/socketService.ts`, `/server/src/sockets/chatHandler.ts`

---

## 🎯 Next Steps

After successful testing:
1. ✅ Deploy backend to production server
2. ✅ Deploy frontend to hosting
3. ✅ Update production database
4. ✅ Configure CORS for production URLs
5. ✅ Test end-to-end on production
6. ✅ Monitor logs for errors
7. ✅ Optimize based on real usage
8. ✅ Plan additional features (see REALTIME_FEATURES_IMPLEMENTATION.md)

---

**Last Updated:** November 16, 2025  
**Status:** Ready for Testing ✅
