import React, { useState, useMemo } from 'react';
import type { User, ChatMessage } from '../types';
import { ChatWindow } from './ChatWindow';
import { PhoneIcon, VideoCameraIcon, MagnifyingGlassIcon, PlusIcon } from './IconComponents';

interface MessagesPageProps {
  currentUser: User;
  users: User[];
  chatSessions: Record<string, ChatMessage[]>;
  conversations?: any[]; // Conversation metadata from API
  activeChats: string[];
  typingStatus: Record<string, boolean>;
  onStartChat: (user: User) => void;
  onCloseChat: (userId: string) => void;
  onSendMessage: (receiverId: string, text: string) => void;
  onMarkMessagesAsSeen: (senderId: string) => void;
  onInitiateCall: (receiver: User, type: 'audio' | 'video') => void;
  onViewProfile: (user: User) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  users,
  chatSessions,
  conversations = [],
  activeChats,
  typingStatus,
  onStartChat,
  onCloseChat,
  onSendMessage,
  onMarkMessagesAsSeen,
  onInitiateCall,
  onViewProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getChatId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  };

  // Get all users with chat history (from chatSessions or conversations API)
  const chatPartners = useMemo(() => {
    const partnerIds = new Set<string>();
    
    // Add partners from chatSessions (messages already loaded)
    Object.keys(chatSessions).forEach(chatId => {
      const [id1, id2] = chatId.split('_');
      if (id1 === currentUser.id) partnerIds.add(id2);
      if (id2 === currentUser.id) partnerIds.add(id1);
    });
    
    // Add partners from conversations API (even if messages not loaded yet)
    conversations.forEach(conv => {
      const partnerId = conv._id || conv.user?.[0]?._id || conv.user?.[0]?.id;
      if (partnerId) {
        partnerIds.add(partnerId.toString());
      }
    });
    
    return users.filter(u => u.id !== currentUser.id && partnerIds.has(u.id));
  }, [chatSessions, conversations, users, currentUser.id]);


  // Filter chat partners by search term
  const filteredChatPartners = useMemo(() => {
    return chatPartners.filter(u =>
      searchTerm === '' ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatPartners, searchTerm]);

  // Get unread count for a user (from conversation metadata or chatSessions)
  const getUnreadCount = (userId: string) => {
    // First check conversation metadata from API
    const conversation = conversations.find(conv => {
      const partnerId = conv._id || conv.user?.[0]?._id || conv.user?.[0]?.id;
      return partnerId && partnerId.toString() === userId;
    });
    
    if (conversation && conversation.unreadCount !== undefined) {
      return conversation.unreadCount;
    }
    
    // Fallback to counting from chatSessions
    const chatId = getChatId(currentUser.id, userId);
    const messages = chatSessions[chatId] || [];
    return messages.filter(msg => msg.receiverId === currentUser.id && !msg.seen).length;
  };

  // Get last message for a user (from conversation metadata or chatSessions)
  const getLastMessage = (userId: string) => {
    // First check conversation metadata from API
    const conversation = conversations.find(conv => {
      const partnerId = conv._id || conv.user?.[0]?._id || conv.user?.[0]?.id;
      return partnerId && partnerId.toString() === userId;
    });
    
    // Try to get last message from chatSessions
    const chatId = getChatId(currentUser.id, userId);
    const messages = chatSessions[chatId] || [];
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      return {
        text: lastMessage.text || (lastMessage.signal ? 'Call signal' : ''),
        timestamp: lastMessage.timestamp,
        isFromMe: lastMessage.senderId === currentUser.id,
      };
    }
    
    // If no messages in chatSessions but conversation exists, use conversation metadata
    if (conversation && conversation.lastMessageTime) {
      return {
        text: conversation.lastMessageText || '',
        timestamp: conversation.lastMessageTime,
        isFromMe: conversation.lastMessageIsFromMe || false,
      };
    }
    
    return null;
  };

  // Sort chat partners by last message time
  const sortedChatPartners = useMemo(() => {
    return [...filteredChatPartners].sort((a, b) => {
      const msgA = getLastMessage(a.id);
      const msgB = getLastMessage(b.id);
      if (!msgA && !msgB) return 0;
      if (!msgA) return 1;
      if (!msgB) return -1;
      return new Date(msgB.timestamp).getTime() - new Date(msgA.timestamp).getTime();
    });
  }, [filteredChatPartners, currentUser.id, chatSessions]);

  const handleChatClick = (user: User) => {
    onStartChat(user);
    onMarkMessagesAsSeen(user.id);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
          Messages & Calls
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Stay in sync with collaborators, students, and mentors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Chat List */}
        <div className="lg:col-span-1 bg-white/95 dark:bg-zinc-900/85 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col h-[calc(100vh-12rem)] backdrop-blur">
          {/* Search Bar */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {sortedChatPartners.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {sortedChatPartners.map(user => {
                  const unreadCount = getUnreadCount(user.id);
                  const lastMessage = getLastMessage(user.id);
                  const isActive = activeChats.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleChatClick(user)}
                      className={`p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors ${
                        isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {user.name}
                            </h3>
                            {lastMessage && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {new Date(lastMessage.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          {lastMessage ? (
                            <p className={`text-sm truncate ${
                              unreadCount > 0
                                ? 'text-zinc-800 dark:text-zinc-200 font-medium'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {lastMessage.isFromMe && 'You: '}
                              {lastMessage.text || 'Media'}
                            </p>
                          ) : (
                            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                              No messages yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">No chats yet</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Your conversations will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Active Chat Windows */}
        <div className="lg:col-span-2">
          {activeChats.length > 0 ? (
            <div className="space-y-4">
              {activeChats.map(userId => {
                const receiver = users.find(u => u.id === userId);
                if (!receiver) return null;
                const chatId = getChatId(currentUser.id, userId);
                return (
                  <div key={userId} className="bg-white/95 dark:bg-zinc-900/85 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
                    <ChatWindow
                      currentUser={currentUser}
                      receiver={receiver}
                      messages={chatSessions[chatId] || []}
                      onSendMessage={onSendMessage}
                      onClose={() => onCloseChat(userId)}
                      isTyping={!!typingStatus[userId]}
                      onFocus={() => onMarkMessagesAsSeen(userId)}
                      onInitiateCall={onInitiateCall}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/95 dark:bg-zinc-900/85 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 h-[calc(100vh-12rem)] flex items-center justify-center backdrop-blur">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <PlusIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                  Select a conversation
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Choose a chat from the list or start a new conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};








