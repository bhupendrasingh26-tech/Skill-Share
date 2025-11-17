import { Router } from 'express';
import SkillRequest from '../models/SkillRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SkillVerification from '../models/SkillVerification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all incoming skill requests for current user
router.get('/incoming', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requests = await SkillRequest.find({
      targetUserId: req.user._id,
      status: 'pending',
    })
      .populate('requesterId', 'name avatarUrl bio rating validatedSkills')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incoming requests' });
  }
});

// GET all skill requests sent by current user
router.get('/sent', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requests = await SkillRequest.find({ requesterId: req.user._id })
      .populate('targetUserId', 'name avatarUrl bio rating')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

// GET all pending skill requests for a specific skill
router.get('/skill/:skillName', async (req, res) => {
  try {
    const { skillName } = req.params;

    const requests = await SkillRequest.find({
      skill: { $regex: skillName, $options: 'i' },
      status: 'pending',
    })
      .populate('requesterId', 'name avatarUrl bio rating')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skill requests' });
  }
});

// CREATE a new skill request (protected)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { skill, message, targetUserId } = req.body;

    // Validation
    if (!skill || !message) {
      return res.status(400).json({ error: 'Missing required fields: skill and message are required' });
    }

    if (skill.length < 2 || skill.length > 100) {
      return res.status(400).json({ error: 'Skill must be between 2 and 100 characters' });
    }

    if (message.length < 5 || message.length > 1000) {
      return res.status(400).json({ error: 'Message must be between 5 and 1000 characters' });
    }

    // Check if target user exists (if provided)
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
    }

    // Create the request
    const skillRequest = new SkillRequest({
      requesterId: req.user._id,
      targetUserId: targetUserId || null,
      skill: skill.toLowerCase().trim(),
      message,
      status: 'pending',
    });

    await skillRequest.save();

    // Populate requester info before responding
    await skillRequest.populate('requesterId', 'name avatarUrl bio rating');

    // Create notification for target user if specified
    if (targetUserId) {
      const notification = new Notification({
        recipientId: targetUserId,
        senderId: req.user._id,
        type: 'skill_request',
        title: `Skill Request: ${skill}`,
        message: `${req.user.name} requested help with ${skill}`,
        data: {
          skillRequestId: skillRequest._id,
        },
        seen: false,
      });
      await notification.save();
    }

    res.status(201).json(skillRequest);
  } catch (error) {
    console.error('Error creating skill request:', error);
    res.status(500).json({ error: 'Failed to create skill request' });
  }
});

// UPDATE skill request status (accept or decline)
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' });
    }

    const skillRequest = await SkillRequest.findById(id);
    if (!skillRequest) {
      return res.status(404).json({ error: 'Skill request not found' });
    }

    // Check authorization - user must be the target or the requester
    if (skillRequest.targetUserId?.toString() !== req.user._id.toString() && 
        skillRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to update this request' });
    }

    skillRequest.status = status;
    await skillRequest.save();

    // Update skill verification metrics when request is accepted/declined
    if (skillRequest.targetUserId && skillRequest.targetUserId.toString() === req.user._id.toString()) {
      const targetUser = await User.findById(skillRequest.targetUserId);
      if (targetUser) {
        // Check if user has this skill in their skillsOffered
        const skillLower = skillRequest.skill.toLowerCase();
        const hasSkill = targetUser.skillsOffered.some(s => s.toLowerCase() === skillLower);
        
        if (hasSkill) {
          // Update or create skill verification record
          await SkillVerification.findOneAndUpdate(
            { userId: skillRequest.targetUserId, skill: skillLower },
            {
              $inc: {
                'metrics.requestsReceived': 1,
                [`metrics.requests${status === 'accepted' ? 'Accepted' : 'Declined'}`]: 1,
              },
            },
            { upsert: true }
          );
        }
      }
    }

    // Create notification for the requester
    const notificationMessage = status === 'accepted' 
      ? `${req.user.name} accepted your skill request`
      : `${req.user.name} declined your skill request`;

    const notification = new Notification({
      recipientId: skillRequest.requesterId,
      senderId: req.user._id,
      type: 'skill_request',
      title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: notificationMessage,
      data: {
        skillRequestId: skillRequest._id,
      },
      seen: false,
    });
    await notification.save();

    await skillRequest.populate('requesterId', 'name avatarUrl bio rating');

    res.json(skillRequest);
  } catch (error) {
    console.error('Error updating skill request:', error);
    res.status(500).json({ error: 'Failed to update skill request' });
  }
});

// DELETE a skill request
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const skillRequest = await SkillRequest.findById(id);
    if (!skillRequest) {
      return res.status(404).json({ error: 'Skill request not found' });
    }

    // Only the requester can delete
    if (skillRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own requests' });
    }

    await SkillRequest.findByIdAndDelete(id);

    res.json({ message: 'Skill request deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill request:', error);
    res.status(500).json({ error: 'Failed to delete skill request' });
  }
});

export default router;
