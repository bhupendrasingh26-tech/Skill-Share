import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { UserProfile } from './components/UserProfile';
import { MOCK_USERS, POST_CATEGORIES, MOCK_SKILL_REQUESTS } from './constants';
import type { Post, User, ChatMessage, SkillRequest, CallState, CallType, Notification } from './types';
import { SkillQuizModal } from './components/SkillQuizModal';
import { AuthPage } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';
import { ChatWindow } from './components/ChatWindow';
import { EditProfileModal } from './components/EditProfileModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CallModal } from './components/CallModal';
import { CallNotification } from './components/CallNotification';
import { TopMatchesModal } from './components/TopMatchesModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { MessagesPage } from './components/MessagesPage';
import { NotificationCenter } from './components/NotificationCenter';
import { FolderIcon } from './components/IconComponents';
import { apiClient } from './services/apiClient';
import { SocketService } from './services/socketService';

type View = 'feed' | 'createPost' | 'profile' | 'dashboard' | 'editProfile' | 'analytics' | 'messages';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('feed');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [quizSkill, setQuizSkill] = useState<string | null>(null);
  const [validatingSkill, setValidatingSkill] = useState<string | null>(null);
  const [interestedPosts, setInterestedPosts] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postForMatching, setPostForMatching] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- Theme State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem('theme') === 'dark') {
      return 'dark';
    }
    // The initial class is set by the script in index.html, this just syncs React state.
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Load data from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Restore user from localStorage if logged in
        const savedUser = localStorage.getItem('currentUser');
        const savedToken = localStorage.getItem('authToken');
        
        if (savedUser && savedToken) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          // Connect and register user with Socket.io
          SocketService.connect();
        } else if (savedUser && !savedToken) {
          // User data exists but no token - clear user data
          console.warn('User data found but no auth token. Clearing user data.');
          localStorage.removeItem('currentUser');
        }

        // Load posts from backend
        const postsData = await apiClient.posts.getAll();
        if (Array.isArray(postsData)) {
          // Convert backend posts to frontend Post type
          const convertedPosts: Post[] = postsData.map((post: any) => ({
            id: post._id || post.id,
            title: post.title,
            description: post.description,
            category: post.category,
            tags: post.tags || [],
            author: {
              id: post.author?._id || post.author?.id || post.author,
              name: post.author?.name || 'Unknown',
              email: post.author?.email || '',
              avatarUrl: post.author?.avatarUrl || '',
              bio: post.author?.bio || '',
              skillsOffered: post.author?.skillsOffered || [],
              skillsNeeded: post.author?.skillsNeeded || [],
              validatedSkills: post.author?.validatedSkills || [],
              rating: post.author?.rating || 5,
            },
            createdAt: post.createdAt,
            budget: post.budget,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
          }));
          setPosts(convertedPosts);
        }

        // Load users from backend
        const usersData = await apiClient.users.getAll();
        if (Array.isArray(usersData)) {
          const convertedUsers: User[] = usersData.map((u: any) => ({
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
            bio: u.bio || '',
            skillsOffered: u.skillsOffered || [],
            skillsNeeded: u.skillsNeeded || [],
            validatedSkills: u.validatedSkills || [],
            rating: u.rating || 5,
            portfolioUrl: u.portfolioUrl,
            socialMedia: u.socialMedia,
            collaborationMethods: u.collaborationMethods,
          }));
          setUsers(convertedUsers);
        }
      } catch (error) {
        console.error('Failed to load data from backend:', error);
        // Fall back to mock data if backend fails
        setUsers(MOCK_USERS);
      }
    };

    loadData();
  }, []);

  const handleToggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };


  // --- Chat State ---
  const [chatSessions, setChatSessions] = useState<Record<string, ChatMessage[]>>({});
  const [conversations, setConversations] = useState<any[]>([]); // Store conversation metadata
  const [activeChats, setActiveChats] = useState<string[]>([]); // Stores receiver IDs
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({}); // Key is receiver ID
  
  // --- Skill Request State ---
  const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
  const [loadingSkillRequests, setLoadingSkillRequests] = useState(false);

  // --- WebRTC Call State ---
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [activeCallPartner, setActiveCallPartner] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // --- Auth Handlers ---
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.auth.login(email, password);
      if (response.success && response.user && response.token) {
        // Convert backend user format to frontend User type
        // Backend returns id as _id or id, handle both
        const userId = response.user._id || response.user.id;
        const user: User = {
          id: userId,
          name: response.user.name,
          email: response.user.email,
          avatarUrl: response.user.avatarUrl,
          bio: response.user.bio || '',
          skillsOffered: response.user.skillsOffered || [],
          skillsNeeded: response.user.skillsNeeded || [],
          validatedSkills: response.user.validatedSkills || [],
          rating: response.user.rating || 5,
          portfolioUrl: response.user.portfolioUrl,
          socialMedia: response.user.socialMedia,
          collaborationMethods: response.user.collaborationMethods,
        };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Connect to Socket.io after login
        SocketService.connect();
        setView('feed');
        return true;
      }
      if (response.error) {
        alert(response.error || 'Login failed. Please check your credentials.');
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
      return false;
    }
  };

  const handleSignup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.auth.register(email, password, name);
      if (response.success && response.user && response.token) {
        // Backend returns id as _id or id, handle both
        const userId = response.user._id || response.user.id;
        const user: User = {
          id: userId,
          name: response.user.name,
          email: response.user.email,
          avatarUrl: response.user.avatarUrl,
          bio: response.user.bio || '',
          skillsOffered: response.user.skillsOffered || [],
          skillsNeeded: response.user.skillsNeeded || [],
          validatedSkills: response.user.validatedSkills || [],
          rating: response.user.rating || 5,
          needsProfileSetup: true,
        };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Connect to Socket.io after signup and register user
        SocketService.connect();
        setView('editProfile');
        return true;
      }
      if (response.error) {
        alert(response.error || 'Registration failed. Please try again.');
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      alert('Registration failed. Please try again.');
      return false;
    }
  };
  
  const handleLogout = () => {
    apiClient.auth.logout();
    setCurrentUser(null);
    SocketService.disconnect();
    setView('feed');
  };

  const ensureAuthenticated = useCallback(() => {
    const token = apiClient.getToken();
    if (!token) {
      alert('Your session has expired. Please log in again.');
      handleLogout();
      return false;
    }
    return true;
  }, [handleLogout]);

  // --- Profile Handlers ---
  const handleStartEditProfile = () => {
      setView('editProfile');
  };

  const handleUpdateProfile = async (updatedData: Partial<User>) => {
      if (!currentUser) return;

      try {
        // Check if token exists before making request
        const token = apiClient.getToken();
        if (!token) {
          alert('You are not authenticated. Please login again.');
          handleLogout();
          return;
        }

        const wasInitialSetup = currentUser.needsProfileSetup;

        // Call backend API to update profile
        const response = await apiClient.users.update(currentUser.id, updatedData);
        
        if (response.error) {
          console.error('Failed to update profile:', response.error);
          // If token is invalid, logout user
          if (response.error.includes('token') || response.error.includes('Unauthorized')) {
            alert('Your session has expired. Please login again.');
            handleLogout();
            return;
          }
          alert('Failed to update profile. Please try again.');
          return;
        }

        // Extract user data from response (backend returns { message, user })
        const backendUser = response.user || response;
        const updatedUser: User = {
          id: backendUser._id || backendUser.id || currentUser.id,
          name: backendUser.name || updatedData.name || currentUser.name,
          email: backendUser.email || currentUser.email,
          avatarUrl: backendUser.avatarUrl || updatedData.avatarUrl || currentUser.avatarUrl,
          bio: backendUser.bio || updatedData.bio || currentUser.bio,
          skillsOffered: backendUser.skillsOffered || updatedData.skillsOffered || currentUser.skillsOffered,
          skillsNeeded: backendUser.skillsNeeded || updatedData.skillsNeeded || currentUser.skillsNeeded,
          validatedSkills: backendUser.validatedSkills || currentUser.validatedSkills || [],
          rating: backendUser.rating || currentUser.rating || 5,
          portfolioUrl: backendUser.portfolioUrl || updatedData.portfolioUrl,
          socialMedia: backendUser.socialMedia || updatedData.socialMedia,
          collaborationMethods: backendUser.collaborationMethods || updatedData.collaborationMethods,
          needsProfileSetup: false,
        };

        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));

        if (wasInitialSetup) {
            setView('feed');
        } else {
            setView('profile');
            setSelectedUser(updatedUser);
        }
      } catch (error) {
        console.error('Failed to update profile:', error);
        alert('Failed to update profile. Please try again.');
      }
  };

  // --- Post and Profile Handlers ---
  const handleSavePost = async (postData: Omit<Post, 'id' | 'author' | 'createdAt'>, postId?: string) => {
    if (!currentUser) return;
    if (!ensureAuthenticated()) return;

    try {
      if (postId) {
        // Update existing post
        const response = await apiClient.posts.update(postId, postData);
        if (response.error) {
          alert(response.error || 'Failed to update post');
          return;
        }
        if (response._id || response.id) {
          const updatedPostId = response._id || response.id;
          const updatedPost: Post = {
            id: updatedPostId,
            title: response.title || postData.title,
            description: response.description || postData.description,
            category: response.category || postData.category,
            tags: response.tags || postData.tags,
            author: {
              id: response.author?._id || response.author?.id || currentUser.id,
              name: response.author?.name || currentUser.name,
              email: response.author?.email || currentUser.email,
              avatarUrl: response.author?.avatarUrl || currentUser.avatarUrl,
              bio: response.author?.bio || currentUser.bio,
              skillsOffered: response.author?.skillsOffered || currentUser.skillsOffered,
              skillsNeeded: response.author?.skillsNeeded || currentUser.skillsNeeded,
              validatedSkills: response.author?.validatedSkills || currentUser.validatedSkills || [],
              rating: response.author?.rating || currentUser.rating,
            },
            createdAt: response.createdAt,
            budget: response.budget || postData.budget,
            mediaUrl: response.mediaUrl || postData.mediaUrl,
            mediaType: response.mediaType || postData.mediaType,
          };
          setPosts(prevPosts =>
            prevPosts.map(p => p.id === updatedPostId ? updatedPost : p)
          );
          setView('dashboard');
        }
      } else {
        // Create new post
        const response = await apiClient.posts.create(postData);
        if (response.error) {
          // Show detailed error message
          console.error('Post creation failed:', response.error);
          alert(`Failed to create post: ${response.error}`);
          return;
        }
        if (response._id || response.id) {
          const newPost: Post = {
            ...postData,
            id: response._id || response.id,
            author: currentUser,
            createdAt: response.createdAt || new Date().toISOString(),
          };
          setPosts(prevPosts => [newPost, ...prevPosts]);
          setPostForMatching(newPost); // Trigger the top matches modal for new posts
          setView('feed');
        }
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post. Please try again.');
    }

    setEditingPost(null);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setView('createPost');
  };

  const handleInitiateDelete = (post: Post) => {
    setPostToDelete(post);
  };

  const handleConfirmDelete = async (postId: string) => {
    try {
      const response = await apiClient.posts.delete(postId);
      if (response.error) {
        alert(response.error || 'Failed to delete post');
        return;
      }
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      setInterestedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
      });
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
    setPostToDelete(null);
  };


  const handleViewProfile = useCallback((user: User) => {
    setSelectedUser(user);
    setView('profile');
  }, []);
  
  const handleToggleInterest = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const isCurrentlyInterested = interestedPosts.has(postId);
      
      if (isCurrentlyInterested) {
        // Remove interest
        await apiClient.postInterests.removeInterest(postId);
        setInterestedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Add interest
        const response = await apiClient.postInterests.markInterest(postId);
        if (response && !response.error) {
          setInterestedPosts(prev => {
            const newSet = new Set(prev);
            newSet.add(postId);
            return newSet;
          });
          
          // Show success message
          console.log('Interest marked! Post owner will be notified.');
        }
      }
    } catch (error) {
      console.error('Failed to toggle interest:', error);
      alert('Failed to mark interest. Please try again.');
    }
  };

  // --- Notification Handlers ---
  const handleMarkNotificationAsSeen = async (notificationId: string) => {
    try {
      // Normalize the ID to handle both _id and id formats
      const normalizedId = notificationId.toString();
      
      await apiClient.notifications.markAsSeen(normalizedId);
      
      // Remove notification from state immediately since seen notifications won't be loaded on reload
      setNotifications(prev => prev.filter(notif => {
        const notifId = notif.id?.toString() || (notif as any)._id?.toString();
        return notifId !== normalizedId;
      }));
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  };

  const handleMarkAllNotificationsAsSeen = async () => {
    try {
      await apiClient.notifications.markAllAsSeen();
      // Clear all notifications from state since seen notifications won't be loaded on reload
      setNotifications([]);
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await apiClient.notifications.delete(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to relevant page based on notification type
    if (notification.type === 'message' && notification.data?.chatId) {
      // Extract user ID from chat ID
      const [id1, id2] = notification.data.chatId.split('_');
      const otherUserId = id1 === currentUser?.id ? id2 : id1;
      const userToChat = users.find(u => u.id === otherUserId);
      if (userToChat) {
        handleStartChat(userToChat);
        setView('messages');
      }
    } else if (notification.type === 'post_interest' && notification.data?.postId) {
      // Navigate to dashboard to view interested users
      setView('dashboard');
    }
  };

  // --- Quiz Handlers ---
  const handleStartValidation = (skill: string) => {
    setQuizSkill(skill);
    setValidatingSkill(skill);
  };

  const handleQuizComplete = (skill: string, passed: boolean) => {
    if (passed && currentUser) {
      const updatedUser = {
        ...currentUser,
        validatedSkills: [...new Set([...(currentUser.validatedSkills || []), skill])],
      };
      
      setCurrentUser(updatedUser);

      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);

      if (selectedUser?.id === currentUser.id) {
          setSelectedUser(updatedUser);
      }
    }
    setQuizSkill(null);
    setValidatingSkill(null);
  };

  // Load skill requests from backend
  const loadSkillRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoadingSkillRequests(true);
      const requests = await apiClient.skillRequests.getIncoming();
      setSkillRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error('Failed to load skill requests:', error);
    } finally {
      setLoadingSkillRequests(false);
    }
  }, [currentUser]);

  // Load skill requests when user logs in
  useEffect(() => {
    if (currentUser) {
      loadSkillRequests();
    }
  }, [currentUser, loadSkillRequests]);
  
  // --- Skill Request Handlers ---
  const handleRequestSkill = async (skill: string, message: string) => {
    if (!currentUser) return;
    try {
      const newRequest = await apiClient.skillRequests.create(skill, message);
      if (newRequest && !newRequest.error) {
        // Optionally reload requests or add to local state
        await loadSkillRequests();
      }
    } catch (error) {
      console.error('Failed to create skill request:', error);
    }
  };
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const updatedRequest = await apiClient.skillRequests.updateStatus(requestId, 'accepted');
      if (updatedRequest && !updatedRequest.error) {
        const request = skillRequests.find(r => r.id === requestId);
        if (request) {
          const requester = users.find(u => u.id === request.requesterId);
          if (requester) {
            handleStartChat(requester);
          }
        }
        // Reload skill requests
        await loadSkillRequests();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const updatedRequest = await apiClient.skillRequests.updateStatus(requestId, 'declined');
      if (updatedRequest && !updatedRequest.error) {
        // Reload skill requests
        await loadSkillRequests();
      }
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  // --- Chat Handlers ---
  const getChatId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  };

  const _sendMessage = (receiverId: string, message: Partial<ChatMessage>) => {
    if (!currentUser) return;
    const chatId = getChatId(currentUser.id, receiverId);
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: receiverId,
      text: '',
      timestamp: new Date().toISOString(),
      seen: false,
      ...message,
    };
    setChatSessions(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));
    return newMessage;
  };

  const handleSendChatMessage = async (receiverId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    // Always save message to database first (like WhatsApp/Instagram)
    try {
      await apiClient.messages.sendMessage(receiverId, text);
    } catch (error) {
      console.error('Failed to save message to database:', error);
      // Still try to send via socket for real-time delivery
    }

    // Send message through Socket.io for real-time delivery
    const chatId = getChatId(currentUser.id, receiverId);
    SocketService.sendMessage(currentUser.id, currentUser.name, text, chatId, receiverId);
    
    // Add message to local state immediately (optimistic update)
    // This will also be received from Socket.io, but we check for duplicates in the receive handler
    _sendMessage(receiverId, { text });
  };
  
  const handleSendSignalMessage = useCallback((receiverId: string, signal: ChatMessage['signal'], text: string = '') => {
    _sendMessage(receiverId, { text, signal });
  }, [currentUser]);


  const handleMarkMessagesAsSeen = useCallback((senderId: string) => {
    if (!currentUser) return;
    const chatId = getChatId(currentUser.id, senderId);

    setChatSessions(prev => {
      const currentSession = prev[chatId];
      if (!currentSession) return prev;
      
      const hasUnseen = currentSession.some(msg => msg.receiverId === currentUser.id && !msg.seen);
      if (!hasUnseen) return prev; // No changes needed
      
      const updatedSession = currentSession.map(msg => 
          msg.receiverId === currentUser.id ? { ...msg, seen: true } : msg
      );
      
      return { ...prev, [chatId]: updatedSession };
    });
  }, [currentUser]);

  // Load chat history for a specific user
  const loadChatHistory = useCallback(async (userId: string, forceReload: boolean = false) => {
    if (!currentUser) return;
    
    try {
      const chatId = getChatId(currentUser.id, userId);
      
      // Check if we already have messages loaded for this chat (unless force reload)
      if (!forceReload && chatSessions[chatId] && chatSessions[chatId].length > 0) {
        // History already loaded, just return
        return;
      }
      
      // Load chat history from database
      const history = await apiClient.messages.getHistory(userId);
      
      if (Array.isArray(history)) {
        // Convert backend messages to frontend ChatMessage format
        const convertedMessages: ChatMessage[] = history.map((msg: any) => ({
          id: msg._id || msg.id || `msg-${Date.now()}-${Math.random()}`,
          senderId: msg.senderId?._id || msg.senderId?.id || msg.senderId,
          receiverId: msg.receiverId?._id || msg.receiverId?.id || msg.receiverId,
          text: msg.text || '',
          timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
          seen: msg.seen || false,
        }));
        
        // Merge with existing messages (if any) and sort by timestamp
        setChatSessions(prev => {
          const existing = prev[chatId] || [];
          const merged = [...existing, ...convertedMessages];
          // Remove duplicates based on id or text + timestamp
          const unique = merged.filter((msg, index, self) => {
            return index === self.findIndex(m => 
              m.id === msg.id || 
              (m.text === msg.text && 
               Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000)
            );
          });
          // Sort by timestamp
          unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          return { ...prev, [chatId]: unique };
        });
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [currentUser, chatSessions]);

  // Load all conversations from database
  const loadAllConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const conversationsData = await apiClient.messages.getConversations();
      
      if (Array.isArray(conversationsData)) {
        // Store conversations metadata
        setConversations(conversationsData);
        
        // Load chat history for each conversation (in parallel for better performance)
        const loadPromises = conversationsData.map(async (conv) => {
          const partnerId = conv._id || conv.user?.[0]?._id || conv.user?.[0]?.id;
          if (partnerId) {
            await loadChatHistory(partnerId);
          }
        });
        
        // Load all conversations in parallel
        await Promise.all(loadPromises);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [currentUser, loadChatHistory]);

  const handleStartChat = useCallback(async (userToChat: User) => {
    if (!currentUser || userToChat.id === currentUser.id) return;
    
    // Always load chat history before opening chat so past conversations are visible
    await loadChatHistory(userToChat.id, true);
    
    if (!activeChats.includes(userToChat.id)) {
      setActiveChats(prev => [userToChat.id, ...prev.slice(0, 2)]); // Max 3 chats
    }
    
    // Join Socket.io room for this chat
    const chatId = getChatId(currentUser.id, userToChat.id);
    SocketService.joinChatRoom(currentUser.id, currentUser.name, chatId);
    
    handleMarkMessagesAsSeen(userToChat.id);
  }, [currentUser, activeChats, handleMarkMessagesAsSeen, loadChatHistory]);

  const handleCloseChat = (userIdToClose: string) => {
    if (!currentUser) return;
    
    // Leave Socket.io room when closing chat
    const chatId = getChatId(currentUser.id, userIdToClose);
    SocketService.leaveChatRoom(chatId, currentUser.name);
    
    setActiveChats(prev => prev.filter(id => id !== userIdToClose));
  };

  // --- WebRTC Call Logic ---

  const cleanupCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallType(null);
    setActiveCallPartner(null);
  }, [localStream]);

  const createPeerConnection = useCallback((partnerId: string) => {
    if (!currentUser) return null;
    const pc = new RTCPeerConnection(STUN_SERVERS);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && currentUser) {
        SocketService.sendICECandidate(currentUser.id, partnerId, event.candidate);
      }
    };
    
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  }, [currentUser]);


  const handleInitiateCall = useCallback(async (receiver: User, type: CallType) => {
      if (callState !== 'idle' || !currentUser) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true,
        });
        setLocalStream(stream);
        setCallType(type);
        setActiveCallPartner(receiver);
        setCallState('initiating');
        // Send call initiation through Socket.io
        SocketService.initiateCall(currentUser.id, receiver.id, type);
      } catch (err) {
        console.error("Failed to get media devices.", err);
        cleanupCall();
      }
  }, [callState, cleanupCall, currentUser]);

  const handleAcceptCall = useCallback(async () => {
    if (!activeCallPartner || !callType || !currentUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      });
      setLocalStream(stream);
      setCallState('in-progress');
      // Send call acceptance through Socket.io
      SocketService.acceptCall(activeCallPartner.id, currentUser.id);
      
      // Create peer connection and add local tracks. Do NOT create an offer here.
      // The caller is responsible for creating the offer after receiving the
      // 'call_accepted' acknowledgment. The callee should wait for the
      // incoming offer and then create an answer.
      const pc = createPeerConnection(activeCallPartner.id);
      if (pc && stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnectionRef.current = pc;
      }
    } catch (err) {
      console.error("Failed to get media devices on accept.", err);
      handleDeclineCall();
    }
  }, [activeCallPartner, callType, createPeerConnection, currentUser]);
  
  const handleDeclineCall = useCallback(() => {
    if (activeCallPartner && currentUser) {
        SocketService.rejectCall(activeCallPartner.id, currentUser.id);
    }
    cleanupCall();
  }, [activeCallPartner, cleanupCall, currentUser]);

  const handleEndCall = useCallback(() => {
    if (activeCallPartner) {
        SocketService.endCall(activeCallPartner.id);
    }
    cleanupCall();
  }, [activeCallPartner, cleanupCall]);

  // Set up Socket.io event listeners for real-time communication
  useEffect(() => {
    if (!currentUser) return;

    const socket = SocketService.connect();

    // Register user with server
    socket.emit('register_user', { userId: currentUser.id, userName: currentUser.name });

    // Listen for incoming chat messages
    const handleReceiveMessage = (message: { senderId: string; senderName: string; text: string; timestamp: string; room: string }) => {
      const chatId = message.room;
      const [id1, id2] = chatId.split('_');
      const senderId = message.senderId;
      const receiverId = senderId === id1 ? id2 : id1;
      
      // Check if message already exists (to prevent duplicates from optimistic updates)
      setChatSessions(prev => {
        const existingMessages = prev[chatId] || [];
        const messageExists = existingMessages.some(
          msg => msg.senderId === senderId && 
                 msg.text === message.text && 
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000
        );
        
        if (messageExists) {
          return prev; // Message already exists, don't add again
        }
        
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          senderId: message.senderId,
          receiverId: receiverId,
          text: message.text,
          timestamp: message.timestamp,
          seen: senderId === currentUser.id, // Messages from self are automatically seen
        };
        
        return {
          ...prev,
          [chatId]: [...existingMessages, newMessage],
        };
      });
    };

    // Listen for incoming calls
    const handleIncomingCall = (data: { from: string; callType: 'audio' | 'video' }) => {
      const partner = users.find(u => u.id === data.from);
      if (!partner) return;
      
      if (callState === 'idle') {
        setActiveCallPartner(partner);
        setCallType(data.callType);
        setCallState('receiving');
      } else {
        // Busy - reject the call
        SocketService.rejectCall(data.from, currentUser.id);
      }
    };

    // Listen for call accepted
    const handleCallAccepted = (data: { from: string }) => {
      if (callState === 'initiating' && activeCallPartner?.id === data.from && localStream) {
        setCallState('in-progress');
        const newPc = createPeerConnection(data.from);
        if (newPc && localStream) {
          localStream.getTracks().forEach(track => newPc.addTrack(track, localStream));
          peerConnectionRef.current = newPc;
          
          // Create and send offer
          newPc.createOffer().then(offer => {
            newPc.setLocalDescription(offer);
            SocketService.sendWebRTCOffer(currentUser.id, data.from, offer);
          }).catch(err => console.error('Error creating offer:', err));
        }
      }
    };

    // Listen for call rejected
    const handleCallRejected = () => {
      if (callState === 'initiating') {
        cleanupCall();
        alert('Call was declined');
      }
    };

    // Listen for call ended
    const handleCallEnded = () => {
      cleanupCall();
    };

    // Listen for WebRTC offer
    const handleReceiveOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!activeCallPartner || data.from !== activeCallPartner.id || callState !== 'in-progress') return;
      
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          SocketService.sendWebRTCAnswer(currentUser.id, data.from, answer);
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      }
    };

    // Listen for WebRTC answer
    const handleReceiveAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    // Listen for ICE candidates
    const handleReceiveICECandidate = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    // Listen for newly created posts in real time
    const handlePostCreated = (post: any) => {
      try {
        const newPost: Post = {
          id: (post._id || post.id) as string,
          title: post.title,
          description: post.description,
          category: post.category,
          tags: post.tags || [],
          author: {
            id: post.author?._id || post.author?.id || post.author,
            name: post.author?.name || 'Unknown',
            email: post.author?.email || '',
            avatarUrl: post.author?.avatarUrl || '',
            bio: post.author?.bio || '',
            skillsOffered: post.author?.skillsOffered || [],
            skillsNeeded: post.author?.skillsNeeded || [],
            validatedSkills: post.author?.validatedSkills || [],
            rating: post.author?.rating || 5,
          },
          createdAt: post.createdAt || new Date().toISOString(),
          budget: post.budget,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
        };

        // Avoid duplicates if this client already has the post (e.g., creator)
        setPosts(prev => {
          if (prev.some(p => p.id === newPost.id)) {
            return prev;
          }
          return [newPost, ...prev];
        });
      } catch (err) {
        console.error('Failed to handle post_created event:', err);
      }
    };

    // Ensure socket is connected and register user for targeted events
    if (currentUser) {
      SocketService.connect();
      SocketService.registerUser(currentUser.id);
      SocketService.onPostCreated(handlePostCreated);
    } else {
      SocketService.onPostCreated(handlePostCreated);
    }

    // Load notifications from backend
    const loadNotifications = async () => {
      try {
        const notifs = await apiClient.notifications.getAll();
        if (Array.isArray(notifs)) {
          // Ensure all notifications have proper id field and format
          const formattedNotifs = notifs.map((notif: any) => ({
            ...notif,
            id: notif._id?.toString() || notif.id,
            senderId: notif.senderId?._id?.toString() || notif.senderId?.toString() || notif.senderId,
            recipientId: notif.recipientId?._id?.toString() || notif.recipientId?.toString() || notif.recipientId,
          }));
          setNotifications(formattedNotifs);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    loadNotifications();

    // Handle incoming notification
    const handleNewNotification = (data: any) => {
      const notificationData = data.notification || data;
      const notificationId = notificationData._id?.toString() || notificationData.id || `notif-${Date.now()}`;
      
      // Check if notification already exists to prevent duplicates
      setNotifications(prev => {
        const exists = prev.some(n => n.id === notificationId);
        if (exists) return prev; // Don't add duplicate
        
        const newNotification: Notification = {
          id: notificationId,
          recipientId: notificationData.recipientId,
          senderId: notificationData.senderId?._id?.toString() || notificationData.senderId?.toString() || notificationData.senderId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          seen: false,
          sender: notificationData.sender,
          createdAt: notificationData.createdAt || new Date().toISOString(),
        };
        return [newNotification, ...prev];
      });
    };

    socket.on('new_notification', handleNewNotification);

    // Register event listeners
    SocketService.onReceiveMessage(handleReceiveMessage);
    SocketService.onIncomingCall(handleIncomingCall);
    SocketService.onCallAccepted(handleCallAccepted);
    SocketService.onCallRejected(handleCallRejected);
    SocketService.onCallEnded(handleCallEnded);
    SocketService.onReceiveOffer(handleReceiveOffer);
    SocketService.onReceiveAnswer(handleReceiveAnswer);
    SocketService.onReceiveICECandidate(handleReceiveICECandidate);

    // Cleanup on unmount
    return () => {
      socket.off('new_notification', handleNewNotification);
      SocketService.offPostCreated(handlePostCreated);
      SocketService.offReceiveMessage(handleReceiveMessage);
      SocketService.offIncomingCall(handleIncomingCall);
      SocketService.offCallAccepted(handleCallAccepted);
      SocketService.offCallRejected(handleCallRejected);
      SocketService.offCallEnded(handleCallEnded);
      SocketService.offReceiveOffer(handleReceiveOffer);
      SocketService.offReceiveAnswer(handleReceiveAnswer);
      SocketService.offReceiveICECandidate(handleReceiveICECandidate);
    };
  }, [currentUser, users, callState, activeCallPartner, localStream, createPeerConnection, cleanupCall]);

  // Effect for call notification timeout
  useEffect(() => {
    let timeoutId: number | null = null;
    if (callState === 'receiving') {
      timeoutId = window.setTimeout(() => {
        handleDeclineCall();
      }, 30000); // 30-second timeout
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [callState, handleDeclineCall]);

  // Load all conversations when navigating to messages page
  useEffect(() => {
    if (view === 'messages' && currentUser) {
      loadAllConversations();
    }
  }, [view, currentUser, loadAllConversations]);

  // --- Memoized Values ---
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const searchTermLower = searchTerm.toLowerCase();
      const inCategory = activeCategory === 'All' || post.category === activeCategory;
      const inSearch =
        post.title.toLowerCase().includes(searchTermLower) ||
        post.description.toLowerCase().includes(searchTermLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTermLower)) ||
        post.author.name.toLowerCase().includes(searchTermLower);
      return inCategory && inSearch;
    });
  }, [posts, searchTerm, activeCategory]);

  const renderContent = () => {
    switch (view) {
      case 'profile':
        return selectedUser && (
          <UserProfile
            user={selectedUser}
            onBack={() => setView('feed')}
            isCurrentUserProfile={currentUser?.id === selectedUser.id}
            onValidateSkill={handleStartValidation}
            validatingSkill={validatingSkill}
            onEditProfile={handleStartEditProfile}
          />
        );
       case 'dashboard':
        return currentUser && (
          <DashboardPage
            user={currentUser}
            users={users}
            userPosts={posts.filter(p => p.author.id === currentUser.id)}
            interestedPosts={posts.filter(p => interestedPosts.has(p.id))}
            onBackToFeed={() => setView('feed')}
            onViewProfile={handleViewProfile}
            onToggleInterest={handleToggleInterest}
            onEditPost={handleEditPost}
            onDeletePost={handleInitiateDelete}
            onStartChat={handleStartChat}
            allSkills={[...new Set(users.flatMap(u => u.skillsOffered))]}
            incomingSkillRequests={skillRequests.filter(r => {
                const postAuthor = users.find(u => u.validatedSkills?.includes(r.skill) || u.skillsOffered?.includes(r.skill));
                return postAuthor?.id === currentUser.id && r.status === 'pending';
            })}
            onRequestSkill={handleRequestSkill}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
          />
        );
      case 'analytics':
        return currentUser && (
          <AnalyticsDashboard
            user={currentUser}
            users={users}
            posts={posts}
            skillRequests={skillRequests}
            onBack={() => setView('dashboard')}
          />
        );
      case 'messages':
        return currentUser && (
          <MessagesPage
            currentUser={currentUser}
            users={users}
            chatSessions={chatSessions}
            conversations={conversations}
            activeChats={activeChats}
            typingStatus={typingStatus}
            onStartChat={handleStartChat}
            onCloseChat={handleCloseChat}
            onSendMessage={handleSendChatMessage}
            onMarkMessagesAsSeen={handleMarkMessagesAsSeen}
            onInitiateCall={handleInitiateCall}
            onViewProfile={handleViewProfile}
          />
        );
      case 'feed':
      default:
        return (
          <>
            <div className="mb-8 space-y-6">
              <input
                type="text"
                placeholder="Search by skill, name, or keyword..."
                className="w-full px-5 py-3 border border-zinc-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
               <div className="flex flex-wrap items-center gap-2">
                {['All', ...POST_CATEGORIES].map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                      activeCategory === category
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700">
                <FolderIcon className="w-16 h-16 mx-auto text-zinc-400 dark:text-zinc-500" />
                <h2 className="mt-4 text-2xl font-bold text-zinc-800 dark:text-zinc-200">The feed is empty.</h2>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">Be the first to share a skill or ask for help!</p>
                <button
                  onClick={() => setView('createPost')}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Create a Post
                </button>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onViewProfile={handleViewProfile}
                    isInterested={interestedPosts.has(post.id)}
                    onToggleInterest={handleToggleInterest}
                    currentUserId={currentUser?.id || null}
                    onStartChat={handleStartChat}
                    onEdit={handleEditPost}
                    onDelete={handleInitiateDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">No posts match your search.</h2>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">Try adjusting your search term or category filters.</p>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div
      className="min-h-screen text-zinc-900 dark:text-zinc-200 bg-gradient-to-br from-zinc-50 via-slate-50 to-indigo-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-slate-900"
    >
      {!currentUser ? (
        // Auth layout
        <main className="min-h-screen flex items-center justify-center px-4 py-8">
          <AuthPage onLogin={handleLogin} onSignup={handleSignup} />
        </main>
      ) : (
        <>
          <Header
            user={currentUser}
            notifications={notifications}
            chatSessions={chatSessions}
            onShareClick={() => setView('createPost')}
            onProfileClick={() => handleViewProfile(currentUser)}
            onLogoClick={() => setView('feed')}
            onDashboardClick={() => setView('dashboard')}
            onAnalyticsClick={() => setView('analytics')}
            onMessagesClick={() => setView('messages')}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onMarkNotificationAsSeen={handleMarkNotificationAsSeen}
            onMarkAllNotificationsAsSeen={handleMarkAllNotificationsAsSeen}
            onDeleteNotification={handleDeleteNotification}
            onNotificationClick={handleNotificationClick}
          />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] gap-6 lg:gap-10">
              <section className="space-y-6">{renderContent()}</section>
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                  <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-lg shadow-indigo-100/40 dark:shadow-black/40 p-5">
                    <h2 className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-3">
                      Pro tip
                    </h2>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      Craft clear titles and add 3–5 tags so the right people can discover your skill posts faster.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-sky-500/10 dark:from-indigo-500/15 dark:via-violet-500/15 dark:to-sky-500/15 backdrop-blur-md shadow-lg shadow-indigo-200/40 dark:shadow-black/50 p-5">
                    <h2 className="text-sm font-semibold tracking-wide text-indigo-700 dark:text-indigo-300 uppercase mb-2">
                      Daily momentum
                    </h2>
                    <p className="text-sm text-indigo-900 dark:text-indigo-100 mb-3">
                      Share one new skill or help one person today to keep your learning flywheel spinning.
                    </p>
                    <button
                      onClick={() => setView('createPost')}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      Create a post
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </>
      )}
      
      {view === 'createPost' && (
        <CreatePostModal
          onClose={() => { setEditingPost(null); setView('feed'); }}
          onSubmit={handleSavePost}
          postToEdit={editingPost}
        />
      )}
      
      {quizSkill && (
          <SkillQuizModal 
            skill={quizSkill}
            onClose={() => { setQuizSkill(null); setValidatingSkill(null); }}
            onComplete={handleQuizComplete}
          />
      )}

      {view === 'editProfile' && currentUser && (
        <EditProfileModal 
            user={currentUser}
            onClose={() => {
                if (currentUser.needsProfileSetup) {
                    setView('feed');
                } else {
                    setView('profile');
                }
            }}
            onSave={handleUpdateProfile}
        />
      )}

      {postForMatching && (
        <TopMatchesModal
          post={postForMatching}
          users={users}
          onClose={() => setPostForMatching(null)}
          onViewProfile={handleViewProfile}
          onStartChat={handleStartChat}
        />
       )}

      {postToDelete && (
        <ConfirmDeleteModal
            postTitle={postToDelete.title}
            onCancel={() => setPostToDelete(null)}
            onConfirm={() => handleConfirmDelete(postToDelete.id)}
        />
      )}

      {callState === 'receiving' && activeCallPartner && (
        <CallNotification
          caller={activeCallPartner}
          callType={callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {(callState === 'initiating' || callState === 'in-progress') && activeCallPartner && (
        <CallModal
            callState={callState}
            callType={callType}
            localStream={localStream}
            remoteStream={remoteStream}
            partner={activeCallPartner}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
            onEnd={handleEndCall}
        />
      )}

      {/* Only show floating chat windows when not on messages page */}
      {view !== 'messages' && currentUser && (
        <div className="fixed bottom-3 right-3 sm:right-6 flex gap-4 items-end pointer-events-none">
          {activeChats.map(userId => {
            const receiver = users.find(u => u.id === userId);
            if (!receiver) return null;
            const chatId = getChatId(currentUser.id, userId);
            return (
              <ChatWindow
                key={userId}
                currentUser={currentUser}
                receiver={receiver}
                messages={chatSessions[chatId] || []}
                onSendMessage={handleSendChatMessage}
                onClose={() => handleCloseChat(userId)}
                isTyping={!!typingStatus[userId]}
                onFocus={() => handleMarkMessagesAsSeen(userId)}
                onInitiateCall={handleInitiateCall}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default App;