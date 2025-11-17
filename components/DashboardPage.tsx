import React, { useState } from 'react';
import { PostCard } from './PostCard';
import type { Post, User, SkillRequest } from '../types';
import { ArrowLeftIcon, MegaphoneIcon } from './IconComponents';
import { SkillRequestCard } from './SkillRequestCard';
import { SkillDropdown } from './SkillDropdown';

interface DashboardPageProps {
  user: User;
  users: User[];
  userPosts: Post[];
  interestedPosts: Post[];
  onBackToFeed: () => void;
  onViewProfile: (user: User) => void;
  onToggleInterest: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (post: Post) => void;
  onStartChat: (user: User) => void;
  allSkills: string[];
  incomingSkillRequests: SkillRequest[];
  onRequestSkill: (skill: string, message: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
}

type DashboardTab = 'requests' | 'myPosts' | 'interested';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  users,
  userPosts,
  interestedPosts,
  onBackToFeed,
  onViewProfile,
  onToggleInterest,
  onEditPost,
  onDeletePost,
  onStartChat,
  allSkills,
  incomingSkillRequests,
  onRequestSkill,
  onAcceptRequest,
  onDeclineRequest,
}) => {
  const [skillToRequest, setSkillToRequest] = useState(allSkills[0] || '');
  const [requestMessage, setRequestMessage] = useState('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('requests');

  const handleRequestSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!skillToRequest) return;
      onRequestSkill(skillToRequest, requestMessage);
      setRequestMessage('');
  };

  const findUser = (userId: string) => users.find(u => u.id === userId);

  const tabs: { id: DashboardTab; label: string; count: number }[] = [
    { id: 'requests', label: 'Incoming Requests', count: incomingSkillRequests.length },
    { id: 'myPosts', label: 'My Posts', count: userPosts.length },
    { id: 'interested', label: 'Interested Posts', count: interestedPosts.length },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <button onClick={onBackToFeed} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium mb-6">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 bg-white/90 dark:bg-zinc-900/80 p-6 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/40 lg:sticky top-24 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
           <div className="flex flex-col items-center text-center">
             <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full ring-4 ring-indigo-500/80 p-1 object-cover shadow-md"/>
             <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-4">{user.name}</h1>
             <p className="mt-1 text-zinc-600 dark:text-zinc-300 text-sm line-clamp-3">{user.bio}</p>
             <button
                onClick={() => onViewProfile(user)}
                className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
              >
                View Full Profile
              </button>
           </div>
           <div className="mt-6 border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">My Posts</span>
                <span className="font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-0.5 rounded-full text-sm">{userPosts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Interested Posts</span>
                <span className="font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-0.5 rounded-full text-sm">{interestedPosts.length}</span>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/90 dark:bg-zinc-900/80 p-6 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/40 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
                <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><MegaphoneIcon className="w-6 h-6 text-indigo-500" /> Request a Skill</h2>
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="skill-request" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Skill you need help with:</label>
                        <SkillDropdown
                            skills={allSkills}
                            value={skillToRequest}
                            onChange={setSkillToRequest}
                            placeholder="Select a skill..."
                        />
                    </div>
                    <div>
                        <label htmlFor="request-message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Message (optional):</label>
                        <textarea
                            id="request-message"
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400 dark:focus:ring-indigo-400 transition-all resize-none"
                            placeholder="Briefly describe what you need help with..."
                        ></textarea>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{requestMessage.length}/1000</p>
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={!skillToRequest || requestMessage.length < 5} className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors">Send Request</button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white/90 dark:bg-zinc-900/80 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/40 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
              <div className="border-b border-zinc-200 dark:border-zinc-700">
                  <nav className="flex flex-wrap -mb-px px-6" aria-label="Tabs">
                      {tabs.map(tab => (
                          <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`
                                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                  ${activeTab === tab.id 
                                      ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                                      : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-600'
                                  }
                                  mr-8
                              `}
                          >
                            <div className="flex items-center gap-2">
                              {tab.label}
                              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
                                  {tab.count}
                              </span>
                            </div>
                          </button>
                      ))}
                  </nav>
              </div>
              <div className="p-6">
                {activeTab === 'requests' && (
                  <div>
                    {incomingSkillRequests.length > 0 ? (
                        <div className="space-y-4">
                            {incomingSkillRequests.map(req => {
                                const requester = findUser(req.requesterId);
                                if (!requester) return null;
                                return (
                                    <SkillRequestCard 
                                        key={req.id}
                                        request={{...req, requester}}
                                        onAccept={onAcceptRequest}
                                        onDecline={onDeclineRequest}
                                        onViewProfile={onViewProfile}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-zinc-500 dark:text-zinc-400">You have no new skill requests.</p>
                        </div>
                    )}
                  </div>
                )}
                {activeTab === 'myPosts' && (
                  <div>
                    {userPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-6">
                        {userPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onViewProfile={onViewProfile}
                                isInterested={interestedPosts.some(p => p.id === post.id)}
                                onToggleInterest={onToggleInterest}
                                currentUserId={user.id}
                                onEdit={onEditPost}
                                onDelete={onDeletePost}
                                onStartChat={onStartChat}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-zinc-500 dark:text-zinc-400">You haven't created any posts yet.</p>
                        </div>
                    )}
                  </div>
                )}
                {activeTab === 'interested' && (
                  <div>
                    {interestedPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-6">
                        {interestedPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onViewProfile={onViewProfile}
                                isInterested={true}
                                onToggleInterest={onToggleInterest}
                                currentUserId={user.id}
                                onStartChat={onStartChat}
                            />
                        ))}
                        </div>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-zinc-500 dark:text-zinc-400">You haven't shown interest in any posts yet.</p>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};