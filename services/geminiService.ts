

import { GoogleGenAI, Type } from "@google/genai";
import type { Post, User, QuizQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A check to ensure the API key is available, though it's assumed to be set.
  console.warn("Gemini API key not found in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface GeneratedPost {
  title: string;
  description: string;
  tags: string[];
}

export const generatePostFromPrompt = async (prompt: string): Promise<GeneratedPost | null> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the user's idea for a post on a skill-sharing platform, generate a complete post draft. The user's idea is: "${prompt}"
      
      Your response should include:
      1. A clear and engaging "title" (max 15 words).
      2. A detailed "description" that elaborates on the user's idea, explains the requirements, and makes it appealing for others to respond (at least 40 words).
      3. An array of 3 to 5 relevant "tags" as strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, engaging title for the post."
            },
            description: {
              type: Type.STRING,
              description: "A detailed description of the post."
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A relevant tag."
              },
              description: "An array of 3 to 5 relevant tags."
            },
          },
          required: ["title", "description", "tags"],
        },
      },
    });
    
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    // Validation
    if (parsedJson && typeof parsedJson.title === 'string' && typeof parsedJson.description === 'string' && Array.isArray(parsedJson.tags)) {
      return parsedJson as GeneratedPost;
    }
    
    return null;
  } catch (error) {
    console.error("Error calling Gemini API for post generation:", error);
    throw new Error("Failed to generate post from AI.");
  }
};

export const suggestTagsForPost = async (title: string, description: string): Promise<string[] | null> => {
    if (!API_KEY) {
      throw new Error("API key is not configured.");
    }
    if (!title.trim() && !description.trim()) {
      return []; // Don't call API if inputs are empty
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following post title and description for a skill-sharing platform, suggest 5 to 7 relevant skills or technologies as tags.
        
        Title: "${title}"
        Description: "${description}"
        
        Return only the most relevant and specific tags.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: {
                type: Type.ARRAY,
                description: "An array of 5 to 7 relevant skill tags.",
                items: {
                  type: Type.STRING,
                },
              },
            },
            required: ["tags"],
          },
        },
      });
  
      const jsonText = response.text.trim();
      const parsedJson = JSON.parse(jsonText);
  
      if (parsedJson && Array.isArray(parsedJson.tags)) {
        return parsedJson.tags.map((tag: any) => String(tag)); // Ensure all items are strings
      }
      
      return null;
    } catch (error) {
      console.error("Error calling Gemini API for tag suggestion:", error);
      // Don't throw an error to the user, just fail silently.
      return null;
    }
  };


export const generateSkillQuiz = async (skill: string): Promise<QuizQuestion[] | null> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a 3-question multiple-choice quiz to test intermediate proficiency in ${skill}. For each question, provide:
      1. A "question" string.
      2. An array of 4 "options" strings.
      3. A "correctAnswerIndex" which is the 0-based index of the correct option.
      
      Ensure the questions are relevant and challenging enough to assess a solid understanding of the topic. The questions should not be trivial.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quiz: {
              type: Type.ARRAY,
              description: "An array of 3 quiz questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "The question text." },
                  options: {
                    type: Type.ARRAY,
                    description: "An array of 4 possible answers.",
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the options array." },
                },
                required: ["question", "options", "correctAnswerIndex"],
              },
            },
          },
          required: ["quiz"],
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson && Array.isArray(parsedJson.quiz)) {
      const isValid = parsedJson.quiz.every((q: any) => 
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswerIndex === 'number' &&
        q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4
      );
      if (isValid) {
        return parsedJson.quiz as QuizQuestion[];
      }
    }
    
    console.warn("Received invalid quiz structure from API:", parsedJson);
    return null;
  } catch (error) {
    console.error("Error generating skill quiz:", error);
    throw new Error(`Failed to generate quiz for ${skill}.`);
  }
};

export const findTopMatches = async (post: Post, users: User[]): Promise<string[] | null> => {
    if (!API_KEY) {
        throw new Error("API key is not configured.");
    }

    // Filter out the post author and create a simplified list of potential helpers
    const potentialHelpers = users
        .filter(u => u.id !== post.author.id)
        .map(u => ({
            id: u.id,
            bio: u.bio,
            skillsOffered: u.skillsOffered,
        }));

    if (potentialHelpers.length === 0) {
        return [];
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `A user has just created a post asking for help on a skill-sharing platform. Find the best 3 to 5 users to help them.

            Here is the user's post:
            - Title: "${post.title}"
            - Description: "${post.description}"
            - Tags: ${post.tags.join(', ')}

            Here is a list of potential helpers with their skills and bios:
            ${JSON.stringify(potentialHelpers, null, 2)}

            Analyze the post content and compare it with the skills and bios of the potential helpers. Identify the user IDs of the most relevant helpers.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchedUserIds: {
                            type: Type.ARRAY,
                            description: "An array of 3 to 5 user IDs that are the best match for the post.",
                            items: {
                                type: Type.STRING,
                            },
                        },
                    },
                    required: ["matchedUserIds"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson && Array.isArray(parsedJson.matchedUserIds)) {
            return parsedJson.matchedUserIds.map((id: any) => String(id));
        }

        return null;
    } catch (error) {
        console.error("Error calling Gemini API for finding matches:", error);
        throw new Error("Failed to find top matches from AI.");
    }
};
