import { Router } from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all notifications for current user (only unread by default)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only fetch unread notifications - seen notifications won't appear after reload
    const notifications = await Notification.find({ 
      recipientId: req.user.id,
      seen: false // Only get unread notifications
    })
      .populate('senderId', 'name avatarUrl email')
      .sort({ createdAt: -1 })
      .limit(50);

    // Format notifications with sender info
    const formattedNotifications = notifications.map(notif => {
      const notificationObj = notif.toObject();
      return {
        ...notificationObj,
        id: notificationObj._id?.toString() || notificationObj.id, // Ensure id field exists
        sender: notificationObj.senderId ? {
          id: notificationObj.senderId._id || notificationObj.senderId.id,
          name: notificationObj.senderId.name,
          avatarUrl: notificationObj.senderId.avatarUrl,
          email: notificationObj.senderId.email,
        } : null,
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET unread notifications count
router.get('/unread/count', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await Notification.countDocuments({
      recipientId: req.user.id,
      seen: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as seen
router.put('/:id/seen', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check if user is the recipient
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    notification.seen = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as seen
router.put('/all/seen', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Notification.updateMany(
      { recipientId: req.user.id, seen: false },
      { seen: true }
    );

    res.json({ message: 'All notifications marked as seen' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check if user is the recipient
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
