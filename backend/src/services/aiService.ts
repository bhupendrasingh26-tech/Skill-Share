import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface GeneratedQuiz {
  topic: string;
  questions: QuizQuestion[];
}

export const generateQuiz = async (topic: string, difficulty: string = 'intermediate'): Promise<GeneratedQuiz> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a 5-question quiz about "${topic}" at ${difficulty} level. 
    
    Format the response as a JSON object with this structure:
    {
      "topic": "${topic}",
      "questions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0
        }
      ]
    }
    
    Ensure the JSON is valid and properly formatted.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const quiz: GeneratedQuiz = JSON.parse(jsonMatch[0]);
    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz from AI');
  }
};

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content from AI');
  }
};

export interface UserBehaviorMetrics {
  userId: string;
  userName: string;
  skill: string;
  postsCount: number;
  postsRelevantToSkill: number;
  postsContent: string[]; // Sample post titles/descriptions
  requestsReceived: number;
  requestsAccepted: number;
  requestsDeclined: number;
  messagesSent: number;
  helpfulMessagesCount: number;
  timeSinceAccountCreation: number; // days
}

export interface SkillVerificationResult {
  isFake: boolean;
  confidence: number; // 0-100
  reasoning: string;
  flags: {
    neverHelped: boolean;
    irrelevantContent: boolean;
    failedRequests: boolean;
    skillMismatch: boolean;
  };
  recommendation: 'verified' | 'warning' | 'flagged';
  behaviorScore: number; // 0-100
}

export const analyzeSkillAuthenticity = async (
  metrics: UserBehaviorMetrics
): Promise<SkillVerificationResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze if a user's claimed skill "${metrics.skill}" is authentic based on their behavior.

User: ${metrics.userName}
Claimed Skill: ${metrics.skill}
Account Age: ${metrics.timeSinceAccountCreation} days

Behavior Metrics:
- Posts Created: ${metrics.postsCount}
- Posts Relevant to Skill: ${metrics.postsRelevantToSkill}
- Sample Post Content: ${metrics.postsContent.slice(0, 5).join('; ') || 'None'}
- Skill Requests Received: ${metrics.requestsReceived}
- Requests Accepted: ${metrics.requestsAccepted}
- Requests Declined: ${metrics.requestsDeclined}
- Messages Sent: ${metrics.messagesSent}
- Helpful Messages: ${metrics.helpfulMessagesCount}

Analyze and determine:
1. Does the user actually help others with ${metrics.skill}?
2. Are their posts relevant to ${metrics.skill}?
3. Do they accept or decline requests related to ${metrics.skill}?
4. Does their behavior match their claimed skill?

Return a JSON object with this exact structure:
{
  "isFake": true/false,
  "confidence": 0-100,
  "reasoning": "Detailed explanation",
  "flags": {
    "neverHelped": true/false,
    "irrelevantContent": true/false,
    "failedRequests": true/false,
    "skillMismatch": true/false
  },
  "recommendation": "verified" | "warning" | "flagged",
  "behaviorScore": 0-100
}

Be strict: Flag users who claim skills but never help, post irrelevant content, or consistently decline/fail requests.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response');
    }

    const analysis: SkillVerificationResult = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing skill authenticity:', error);
    // Return default safe result if AI fails
    return {
      isFake: false,
      confidence: 0,
      reasoning: 'Analysis unavailable',
      flags: {
        neverHelped: false,
        irrelevantContent: false,
        failedRequests: false,
        skillMismatch: false,
      },
      recommendation: 'verified',
      behaviorScore: 50,
    };
  }
};