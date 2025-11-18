import { Router, Response } from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import PostInterest from '../models/PostInterest.js';
import SkillRequest from '../models/SkillRequest.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all users
router.get('/', async (req, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user by ID
router.get('/:id', async (req, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET current user profile (protected)
router.get('/profile/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// UPDATE user profile (protected)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is updating their own profile (convert both to strings for comparison)
    const userId = req.user.id.toString();
    const paramId = req.params.id.toString();
    if (userId !== paramId) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const { name, bio, avatarUrl, skillsOffered, skillsNeeded, portfolioUrl, socialMedia, collaborationMethods } =
      req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields - handle empty strings and undefined values properly
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio || '';
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl || '';
    if (skillsOffered !== undefined) {
      user.skillsOffered = Array.isArray(skillsOffered) ? skillsOffered : [];
    }
    if (skillsNeeded !== undefined) {
      user.skillsNeeded = Array.isArray(skillsNeeded) ? skillsNeeded : [];
    }
    if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl || '';
    
    // Handle socialMedia object - merge with existing if provided
    if (socialMedia !== undefined) {
      user.socialMedia = {
        ...(user.socialMedia || {}),
        ...(socialMedia || {}),
      };
    }
    
    // Validate and set collaborationMethods
    if (collaborationMethods !== undefined) {
      const validMethods = ['Chat', 'Video Call', 'In-person'];
      if (Array.isArray(collaborationMethods)) {
        // Filter to only include valid methods
        const filtered = collaborationMethods.filter((m: string) => validMethods.includes(m));
        user.collaborationMethods = filtered.length > 0 ? filtered : ['Chat'];
      } else {
        user.collaborationMethods = ['Chat'];
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }),
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${messages}` });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET users by skill
router.get('/skill/:skill', async (req, res: Response) => {
  try {
    const users = await User.find({ skillsOffered: req.params.skill }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Search users
router.get('/search/:query', async (req, res: Response) => {
  try {
    const searchQuery = req.params.query;
    const users = await User.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } },
        { skillsOffered: { $in: [new RegExp(searchQuery, 'i')] } },
      ],
    }).select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// DELETE user account (protected) - Cascading delete all related data
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is deleting their own account
    const userId = req.user.id.toString();
    const paramId = req.params.id.toString();
    if (userId !== paramId) {
      return res.status(403).json({ error: 'Not authorized to delete this account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cascading delete: Delete all related data
    const userIdObj = user._id;

    // 1. Delete all posts by this user
    await Post.deleteMany({ author: userIdObj });
    console.log(`Deleted posts for user ${userId}`);

    // 2. Delete all messages where user is sender or receiver
    await Message.deleteMany({
      $or: [
        { senderId: userIdObj },
        { receiverId: userIdObj },
      ],
    });
    console.log(`Deleted messages for user ${userId}`);

    // 3. Delete all notifications where user is sender or recipient
    await Notification.deleteMany({
      $or: [
        { senderId: userIdObj },
        { recipientId: userIdObj },
      ],
    });
    console.log(`Deleted notifications for user ${userId}`);

    // 4. Delete all post interests by this user
    await PostInterest.deleteMany({ userId: userIdObj });
    console.log(`Deleted post interests for user ${userId}`);

    // 5. Delete all skill requests by this user (as requester)
    await SkillRequest.deleteMany({ requesterId: userIdObj });
    console.log(`Deleted skill requests for user ${userId}`);

    // 6. Finally, delete the user account
    await User.findByIdAndDelete(req.params.id);
    console.log(`Deleted user account ${userId}`);

    res.json({ message: 'User account and all related data deleted successfully' });
  } catch (error: any) {
    console.error('User deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
