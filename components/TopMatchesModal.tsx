
import React, { useState, useEffect } from 'react';
import type { Post, User } from '../types';
import { findTopMatches } from '../services/geminiService';
import { CloseIcon, SparklesIcon, UserGroupIcon, MessageIcon } from './IconComponents';

interface TopMatchesModalProps {
  post: Post;
  users: User[];
  onClose: () => void;
  onViewProfile: (user: User) => void;
  onStartChat: (user: User) => void;
}

const UserMatchCard: React.FC<{ user: User; onViewProfile: () => void; onStartChat: () => void }> = ({ user, onViewProfile, onStartChat }) => (
    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-grow">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">{user.name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{user.bio}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button 
                onClick={onViewProfile}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
            >
                View Profile
            </button>
            <button 
                onClick={onStartChat}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-1.5"
            >
                <MessageIcon className="w-4 h-4" />
                Message
            </button>
        </div>
    </div>
);


export const TopMatchesModal: React.FC<TopMatchesModalProps> = ({ post, users, onClose, onViewProfile, onStartChat }) => {
    const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                setError(null);
                const matchedIds = await findTopMatches(post, users);
                if (matchedIds) {
                    const foundUsers = users.filter(user => matchedIds.includes(user.id));
                    setMatchedUsers(foundUsers);
                } else {
                    setMatchedUsers([]);
                }
            } catch (e) {
                setError((e as Error).message || "An unexpected error occurred while finding matches.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [post, users]);

    const handleViewProfileClick = (user: User) => {
        onClose(); // Close this modal first
        onViewProfile(user);
    };

    const handleStartChatClick = (user: User) => {
        onClose(); // Close this modal first
        onStartChat(user);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center p-12">
                    <SparklesIcon className="w-12 h-12 text-indigo-500 mx-auto animate-pulse mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Finding Top Matches...</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Our AI is analyzing your post to connect you with the right people.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-12">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Oops! Something went wrong.</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{error}</p>
                </div>
            );
        }

        if (matchedUsers.length > 0) {
            return (
                <div className="space-y-4">
                    {matchedUsers.map(user => (
                        <UserMatchCard 
                            key={user.id} 
                            user={user} 
                            onViewProfile={() => handleViewProfileClick(user)}
                            onStartChat={() => handleStartChatClick(user)}
                        />
                    ))}
                </div>
            );
        }

        return (
             <div className="text-center p-12">
                <UserGroupIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No specific matches found.</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Your post is live! Community members will see it on the main feed.</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Post Published!</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">While you wait for responses, here are some top matches found by AI.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    {renderContent()}
                </div>
                 <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                    <div className="flex justify-end">
                        <button 
                            onClick={onClose} 
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                        >
                           Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
