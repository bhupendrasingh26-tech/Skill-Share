
import type { User, Post, SkillRequest } from './types';

export const POST_CATEGORIES = [
  'Programming',
  'Development',
  'Design',
  'Marketing',
  'Business',
  'Language',
  'Music',
  'Other',
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/alice/200',
    bio: 'Full-stack developer with a passion for creating beautiful and functional web applications. Expert in React and Node.js.',
    skillsOffered: ['React', 'TypeScript', 'Node.js', 'UI/UX Design'],
    skillsNeeded: ['Video Editing', 'Marketing Strategy'],
    rating: 4.8,
    validatedSkills: ['React', 'Node.js'],
    needsProfileSetup: false,
    portfolioUrl: 'https://alice.dev',
    socialMedia: {
      linkedin: 'https://linkedin.com/in/alicej',
      github: 'https://github.com/alicej',
      twitter: 'https://twitter.com/alicejdev',
    },
    collaborationMethods: ['Chat', 'Video Call'],
  },
  {
    id: 'user-2',
    name: 'Bob Williams',
    email: 'bob@example.com',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/bob/200',
    bio: 'Data scientist and Python enthusiast. Love to work on machine learning projects and data visualization.',
    skillsOffered: ['Python', 'Data Analysis', 'Machine Learning'],
    skillsNeeded: ['Frontend Development', 'Public Speaking'],
    rating: 4.9,
    validatedSkills: ['Python'],
    needsProfileSetup: false,
    portfolioUrl: 'https://bob-data.io',
    socialMedia: {
      github: 'https://github.com/bobw',
    },
    collaborationMethods: ['Chat'],
  },
  {
    id: 'user-3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/charlie/200',
    bio: 'Creative video editor and content creator. I help brands tell their stories through compelling visuals.',
    skillsOffered: ['Video Editing', 'Adobe Premiere Pro', 'After Effects'],
    skillsNeeded: ['Python scripting', 'Web Development'],
    rating: 5.0,
    validatedSkills: [],
    needsProfileSetup: false,
    collaborationMethods: ['Chat', 'In-person'],
  },
  {
    id: 'user-4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/diana/200',
    bio: 'Marketing guru with a knack for social media campaigns and brand strategy. Looking to collaborate on exciting new projects.',
    skillsOffered: ['Marketing Strategy', 'Social Media Management', 'Content Creation'],
    skillsNeeded: ['Graphic Design', 'Data Analysis'],
    rating: 4.7,
    validatedSkills: ['Marketing Strategy'],
    needsProfileSetup: false,
    socialMedia: {
        linkedin: 'https://linkedin.com/in/dianaprince',
    },
    collaborationMethods: ['Video Call'],
  }
];

export const MOCK_SKILL_REQUESTS: SkillRequest[] = [
  {
    id: 'req-1',
    requesterId: 'user-3', // Charlie Brown
    skill: 'React', // This should match a validated skill of another user, e.g., Alice (user-1)
    message: 'Hey Alice, I saw you are a validated React expert. I need some help with a component state issue. Could you spare 15 minutes?',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
  }
];