import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { generateQuiz } from '../services/aiService.js';

const router = Router();

// POST /api/ai/generate-quiz - Generate a quiz using Gemini AI
router.post('/generate-quiz', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topic, difficulty } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Validate API key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const quiz = await generateQuiz(topic, difficulty || 'intermediate');

    res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      error: 'Failed to generate quiz',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
