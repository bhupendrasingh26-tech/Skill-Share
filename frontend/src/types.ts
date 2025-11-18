
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl: string;
  bio: string;
  skillsOffered: string[];
  skillsNeeded: string[];
  rating: number;
  validatedSkills?: string[];
  needsProfileSetup?: boolean;
  portfolioUrl?: string;
  socialMedia?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  collaborationMethods?: ('Chat' | 'Video Call' | 'In-person')[];
}

export interface Post {
  id: string;
  author: User;
  title: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  budget?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  seen: boolean;
  signal?: {
    type: 'call-initiate' | 'call-accept' | 'call-decline' | 'call-end' | 'webrtc-offer' | 'webrtc-answer' | 'webrtc-candidate';
    payload?: any;
  };
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: 'post_interest' | 'message' | 'call' | 'skill_request';
  title: string;
  message: string;
  data?: {
    postId?: string;
    chatId?: string;
    callType?: 'audio' | 'video';
    skillRequestId?: string;
  };
  seen: boolean;
  createdAt: string;
  sender?: User;
}

export interface SkillRequest {
  id: string;
  requesterId: string;
  skill: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export type CallState = 'idle' | 'initiating' | 'receiving' | 'in-progress';
export type CallType = 'audio' | 'video';