import { Router } from 'express';
import SkillVerification from '../models/SkillVerification.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import SkillRequest from '../models/SkillRequest.js';
import Message from '../models/Message.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { analyzeSkillAuthenticity, UserBehaviorMetrics } from '../services/aiService.js';

const router = Router();

// Helper function to check if post content is relevant to a skill
const isPostRelevantToSkill = (post: any, skill: string): boolean => {
  const skillLower = skill.toLowerCase();
  const title = (post.title || '').toLowerCase();
  const description = (post.description || '').toLowerCase();
  const tags = (post.tags || []).map((t: string) => t.toLowerCase());
  const category = (post.category || '').toLowerCase();

  return (
    title.includes(skillLower) ||
    description.includes(skillLower) ||
    tags.some((tag: string) => tag.includes(skillLower)) ||
    category.includes(skillLower)
  );
};

// Helper function to collect user behavior metrics
const collectUserMetrics = async (userId: string, skill: string) => {
  const user = await User.findById(userId);
  if (!user) return null;

  // Get all posts by user
  const allPosts = await Post.find({ author: userId });
  const postsRelevant = allPosts.filter(post => isPostRelevantToSkill(post, skill));

  // Get skill requests where user was the target
  const requestsReceived = await SkillRequest.find({
    targetUserId: userId,
    skill: { $regex: skill, $options: 'i' },
  });
  const requestsAccepted = requestsReceived.filter(r => r.status === 'accepted').length;
  const requestsDeclined = requestsReceived.filter(r => r.status === 'declined').length;

  // Get messages sent by user (approximate helpfulness by message length and frequency)
  const messagesSent = await Message.countDocuments({ senderId: userId });
  // Consider messages > 50 chars as potentially helpful
  const helpfulMessages = await Message.countDocuments({
    senderId: userId,
    text: { $exists: true },
    $expr: { $gt: [{ $strLenCP: '$text' }, 50] },
  });

  // Calculate account age
  const accountAge = user.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Sample post content for AI analysis
  const postsContent = allPosts.slice(0, 10).map(p => `${p.title}: ${p.description?.substring(0, 100)}`);

  return {
    userId: user._id.toString(),
    userName: user.name,
    skill,
    postsCount: allPosts.length,
    postsRelevantToSkill: postsRelevant.length,
    postsContent,
    requestsReceived: requestsReceived.length,
    requestsAccepted,
    requestsDeclined,
    messagesSent,
    helpfulMessagesCount: helpfulMessages,
    timeSinceAccountCreation: accountAge,
  };
};

// POST analyze a user's skill authenticity
router.post('/analyze/:userId/:skill', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, skill } = req.params;

    // Only allow users to analyze themselves or admins (for now, allow self-analysis)
    if (req.user.id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only analyze your own skills' });
    }

    // Collect behavior metrics
    const metrics = await collectUserMetrics(userId, skill);
    if (!metrics) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use AI to analyze
    const analysis = await analyzeSkillAuthenticity(metrics);

    // Calculate behavior score
    let behaviorScore = 50; // Base score

    // Positive indicators
    if (metrics.requestsAccepted > 0) behaviorScore += 20;
    if (metrics.postsRelevantToSkill > 0) behaviorScore += 15;
    if (metrics.helpfulMessagesCount > 5) behaviorScore += 10;
    if (metrics.requestsReceived > 0 && metrics.requestsAccepted / metrics.requestsReceived > 0.5) {
      behaviorScore += 15;
    }

    // Negative indicators
    if (metrics.requestsReceived > 0 && metrics.requestsAccepted === 0) {
      behaviorScore -= 30; // Never helps
      analysis.flags.neverHelped = true;
    }
    if (metrics.postsCount > 0 && metrics.postsRelevantToSkill === 0) {
      behaviorScore -= 25; // Irrelevant content
      analysis.flags.irrelevantContent = true;
    }
    if (metrics.requestsDeclined > metrics.requestsAccepted * 2 && metrics.requestsReceived > 3) {
      behaviorScore -= 20; // Fails requests
      analysis.flags.failedRequests = true;
    }
    if (metrics.postsRelevantToSkill === 0 && metrics.requestsAccepted === 0 && metrics.helpfulMessagesCount === 0) {
      behaviorScore -= 15; // Skill mismatch
      analysis.flags.skillMismatch = true;
    }

    behaviorScore = Math.max(0, Math.min(100, behaviorScore));
    analysis.behaviorScore = behaviorScore;

    // Update or create skill verification record
    const verification = await SkillVerification.findOneAndUpdate(
      { userId, skill: skill.toLowerCase() },
      {
        userId,
        skill: skill.toLowerCase(),
        behaviorScore,
        flags: analysis.flags,
        metrics: {
          postsCount: metrics.postsCount,
          postsRelevantToSkill: metrics.postsRelevantToSkill,
          requestsReceived: metrics.requestsReceived,
          requestsAccepted: metrics.requestsAccepted,
          requestsDeclined: metrics.requestsDeclined,
          messagesSent: metrics.messagesSent,
          helpfulMessagesCount: metrics.helpfulMessagesCount,
        },
        aiAnalysis: {
          lastAnalyzed: new Date(),
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          recommendation: analysis.recommendation,
        },
      },
      { upsert: true, new: true }
    );

    // Update user's flaggedSkills if recommendation is 'flagged'
    if (analysis.recommendation === 'flagged') {
      const user = await User.findById(userId);
      if (user) {
        const flaggedSkills = new Set(user.flaggedSkills || []);
        flaggedSkills.add(skill.toLowerCase());
        user.flaggedSkills = Array.from(flaggedSkills);
        await user.save();
      }
    } else if (analysis.recommendation === 'verified') {
      // Remove from flagged if verified
      const user = await User.findById(userId);
      if (user && user.flaggedSkills) {
        user.flaggedSkills = user.flaggedSkills.filter(s => s !== skill.toLowerCase());
        await user.save();
      }
    }

    res.json({
      verification,
      analysis,
      metrics,
    });
  } catch (error) {
    console.error('Error analyzing skill:', error);
    res.status(500).json({ error: 'Failed to analyze skill authenticity' });
  }
});

// GET skill verification status for a user
router.get('/user/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;

    // Users can only view their own verification status
    if (req.user.id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const verifications = await SkillVerification.find({ userId })
      .sort({ 'aiAnalysis.lastAnalyzed': -1 })
      .limit(50);

    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skill verifications' });
  }
});

// GET verification for a specific skill
router.get('/user/:userId/skill/:skill', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, skill } = req.params;

    if (req.user.id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const verification = await SkillVerification.findOne({
      userId,
      skill: skill.toLowerCase(),
    });

    if (!verification) {
      return res.status(404).json({ error: 'Skill verification not found' });
    }

    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skill verification' });
  }
});

export default router;


