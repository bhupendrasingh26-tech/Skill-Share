import { Router } from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import SkillVerification from '../models/SkillVerification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all conversations for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all unique conversation partners with last message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: require('mongoose').Types.ObjectId(req.user.id) },
            { receiverId: require('mongoose').Types.ObjectId(req.user.id) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', require('mongoose').Types.ObjectId(req.user.id)] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessageTime: { $max: '$createdAt' },
          lastMessageText: { $first: '$text' },
          lastMessageSenderId: { $first: '$senderId' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', require('mongoose').Types.ObjectId(req.user.id)] },
                    { $eq: ['$seen', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
    ]);

    // Add isFromMe flag for last message
    const conversationsWithFlags = conversations.map(conv => ({
      ...conv,
      lastMessageIsFromMe: conv.lastMessageSenderId?.toString() === req.user.id,
    }));

    res.json(conversationsWithFlags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST send message
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ error: 'receiverId and text are required' });
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = new Message({
      senderId: req.user.id,
      receiverId,
      text: text.trim(),
      seen: false,
    });

    await message.save();
    await message.populate('senderId', 'name avatarUrl email');
    await message.populate('receiverId', 'name avatarUrl email');

    // Track behavior for skill verification - count messages sent
    const sender = await User.findById(req.user.id);
    if (sender && sender.skillsOffered.length > 0) {
      // Check if message might be related to a skill (message length > 50 chars considered potentially helpful)
      const isHelpful = message.text.trim().length > 50;
      
      for (const skill of sender.skillsOffered) {
        await SkillVerification.findOneAndUpdate(
          { userId: req.user.id, skill: skill.toLowerCase() },
          {
            $inc: {
              'metrics.messagesSent': 1,
              ...(isHelpful ? { 'metrics.helpfulMessagesCount': 1 } : {}),
            },
          },
          { upsert: true }
        );
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET chat history between two users
router.get('/history/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;

    // Get all messages between current user and specified user
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id },
      ],
    })
      .populate('senderId', 'name avatarUrl email')
      .populate('receiverId', 'name avatarUrl email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Mark message as seen
router.put('/:id/seen', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the receiver
    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this message' });
    }

    message.seen = true;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Mark all messages from a user as seen
router.put('/seen/:senderId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Message.updateMany(
      { senderId: req.params.senderId, receiverId: req.user.id, seen: false },
      { seen: true }
    );

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update messages' });
  }
});

export default router;
