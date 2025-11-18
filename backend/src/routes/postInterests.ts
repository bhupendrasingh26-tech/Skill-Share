import { Router } from 'express';
import PostInterest from '../models/PostInterest.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET user's interested posts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const interests = await PostInterest.find({ userId: req.user.id })
      .populate({
        path: 'postId',
        populate: { path: 'author', select: 'name avatarUrl bio rating' },
      })
      .sort({ createdAt: -1 });

    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interests' });
  }
});

// GET interested users for a post (only author can see)
router.get('/post/:postId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { postId } = req.params;

    // Verify post exists and user is the author
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view post interests' });
    }

    const interests = await PostInterest.find({ postId })
      .populate('userId', 'name avatarUrl email bio skillsOffered rating')
      .sort({ createdAt: -1 });

    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post interests' });
  }
});

// CHECK if user is interested in a post
router.get('/check/:postId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const interest = await PostInterest.findOne({
      userId: req.user.id,
      postId: req.params.postId,
    });

    res.json({ isInterested: !!interest });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check interest' });
  }
});

// POST mark interest in a post
router.post('/:postId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { postId } = req.params;

    // Verify post exists
    const post = await Post.findById(postId).populate('author', 'name email _id');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already interested
    const existingInterest = await PostInterest.findOne({
      userId: req.user.id,
      postId,
    });

    if (existingInterest) {
      return res.status(400).json({ error: 'Already marked as interested' });
    }

    // Create interest
    const interest = new PostInterest({
      userId: req.user.id,
      postId,
    });

    await interest.save();

    // Create notification for post author
    const currentUser = await User.findById(req.user.id, 'name avatarUrl email');

    const notification = new Notification({
      recipientId: post.author._id,
      senderId: req.user.id,
      type: 'post_interest',
      title: `${currentUser?.name} is interested in your post`,
      message: `${currentUser?.name} marked interest in "${post.title}"`,
      data: {
        postId: post._id,
      },
    });

    await notification.save();

    res.status(201).json({ interest, notification });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Already marked as interested' });
    }
    res.status(500).json({ error: 'Failed to mark interest' });
  }
});

// DELETE remove interest
router.delete('/:postId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const interest = await PostInterest.findOneAndDelete({
      userId: req.user.id,
      postId: req.params.postId,
    });

    if (!interest) {
      return res.status(404).json({ error: 'Interest not found' });
    }

    res.json({ message: 'Interest removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove interest' });
  }
});

export default router;
