// Detect backend URL based on environment
const getBackendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000'; // Server-side default
  }

  const host = window.location.hostname;
  const port = window.location.port;

  // If running on localhost, use port 5000 for backend
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // For production, assume backend is on same host
  return `http://${host}:5000`;
};

const API_BASE_URL = `${getBackendUrl()}/api`;

export const apiClient = {
  getToken: () => localStorage.getItem('authToken'),

  getHeaders: (includeAuth = true) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = apiClient.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  },

  // AUTH ENDPOINTS
  auth: {
    register: async (email: string, password: string, name: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: apiClient.getHeaders(false),
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      return data;
    },

    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: apiClient.getHeaders(false),
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      return data;
    },

    requestPasswordReset: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: apiClient.getHeaders(false),
        body: JSON.stringify({ email }),
      });
      return response.json();
    },

    resetPassword: async (email: string, token: string, newPassword: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: apiClient.getHeaders(false),
        body: JSON.stringify({ email, token, newPassword }),
      });
      return response.json();
    },

    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    },
  },

  // USER ENDPOINTS
  users: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    getCurrentUser: async () => {
      const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
        headers: apiClient.getHeaders(true),
      });
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },

    update: async (id: string, data: Record<string, any>) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getBySkill: async (skill: string) => {
      const response = await fetch(`${API_BASE_URL}/users/skill/${skill}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    search: async (query: string) => {
      const response = await fetch(`${API_BASE_URL}/users/search/${query}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },
  },

  // POST ENDPOINTS
  posts: {
    getAll: async (category?: string, tag?: string, search?: string) => {
      let url = `${API_BASE_URL}/posts`;
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (tag) params.append('tag', tag);
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    create: async (data: Record<string, any>) => {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify(data),
      });
      return response.json();
    },

    update: async (id: string, data: Record<string, any>) => {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'DELETE',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getByAuthor: async (authorId: string) => {
      const response = await fetch(`${API_BASE_URL}/posts/author/${authorId}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },
  },

  // AI ENDPOINTS
  ai: {
    generateQuiz: async (topic: string, difficulty = 'intermediate') => {
      const response = await fetch(`${API_BASE_URL}/ai/generate-quiz`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ topic, difficulty }),
      });
      return response.json();
    },
  },

  // POST INTEREST ENDPOINTS
  postInterests: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/post-interests`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    checkInterest: async (postId: string) => {
      const response = await fetch(`${API_BASE_URL}/post-interests/check/${postId}`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    markInterest: async (postId: string) => {
      const response = await fetch(`${API_BASE_URL}/post-interests/${postId}`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({}),
      });
      return response.json();
    },

    removeInterest: async (postId: string) => {
      const response = await fetch(`${API_BASE_URL}/post-interests/${postId}`, {
        method: 'DELETE',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getInterestedUsers: async (postId: string) => {
      const response = await fetch(`${API_BASE_URL}/post-interests/post/${postId}`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },
  },

  // NOTIFICATION ENDPOINTS
  notifications: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getUnreadCount: async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    markAsSeen: async (notificationId: string) => {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/seen`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({}),
      });
      return response.json();
    },

    markAllAsSeen: async () => {
      const response = await fetch(`${API_BASE_URL}/notifications/all/seen`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({}),
      });
      return response.json();
    },

    delete: async (notificationId: string) => {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },
  },

  // MESSAGE ENDPOINTS
  messages: {
    getHistory: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/messages/history/${userId}`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getConversations: async () => {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    sendMessage: async (receiverId: string, text: string) => {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ receiverId, text }),
      });
      return response.json();
    },

    markAsSeen: async (messageId: string) => {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/seen`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({}),
      });
      return response.json();
    },

    markAllAsSeen: async (senderId: string) => {
      const response = await fetch(`${API_BASE_URL}/messages/seen/${senderId}`, {
        method: 'PUT',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({}),
      });
      return response.json();
    },
  },

  // SKILL REQUEST ENDPOINTS
  skillRequests: {
    getIncoming: async () => {
      const response = await fetch(`${API_BASE_URL}/skill-requests/incoming`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getSent: async () => {
      const response = await fetch(`${API_BASE_URL}/skill-requests/sent`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getBySkill: async (skillName: string) => {
      const response = await fetch(`${API_BASE_URL}/skill-requests/skill/${skillName}`, {
        headers: apiClient.getHeaders(false),
      });
      return response.json();
    },

    create: async (skill: string, message: string, targetUserId?: string) => {
      const response = await fetch(`${API_BASE_URL}/skill-requests`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ skill, message, targetUserId }),
      });
      return response.json();
    },

    updateStatus: async (requestId: string, status: 'accepted' | 'declined') => {
      const response = await fetch(`${API_BASE_URL}/skill-requests/${requestId}`, {
        method: 'PATCH',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ status }),
      });
      return response.json();
    },

    delete: async (requestId: string) => {
      const response = await fetch(`${API_BASE_URL}/skill-requests/${requestId}`, {
        method: 'DELETE',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },
  },

  // SKILL VERIFICATION ENDPOINTS
  skillVerification: {
    analyze: async (userId: string, skill: string) => {
      const response = await fetch(`${API_BASE_URL}/skill-verification/analyze/${userId}/${skill}`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getUserVerifications: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/skill-verification/user/${userId}`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },

    getSkillVerification: async (userId: string, skill: string) => {
      const response = await fetch(`${API_BASE_URL}/skill-verification/user/${userId}/skill/${skill}`, {
        headers: apiClient.getHeaders(true),
      });
      return response.json();
    },
  },
};

