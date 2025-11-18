import React, { useState, useRef, useEffect } from 'react';
import type { Post, User } from '../types';
import { TagIcon, MessageIcon, HeartIcon, PencilIcon, ShareIcon, CheckIcon, FolderIcon, TrashIcon, EllipsisVerticalIcon } from './IconComponents';

interface PostCardProps {
  post: Post;
  onViewProfile: (user: User) => void;
  isInterested: boolean;
  onToggleInterest: (postId: string) => void;
  currentUserId: string | null;
  onStartChat: (user: User) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}


export const PostCard: React.FC<PostCardProps> = ({ post, onViewProfile, isInterested, onToggleInterest, currentUserId, onEdit, onDelete, onStartChat }) => {
  const isOwnPost = post.author.id === currentUserId;
  const [isCopied, setIsCopied] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsRef]);

  const handleShare = () => {
    const postUrl = `${window.location.origin}${window.location.pathname}#post/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Failed to copy post link: ', err);
    });
  };


  return (
    <div className="bg-white/90 dark:bg-zinc-900/80 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/40 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 flex flex-col relative backdrop-blur">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
            onClick={handleShare}
            title="Copy post link"
            className={`p-2 rounded-full transition-colors duration-200 ${isCopied ? 'bg-green-100 dark:bg-green-900/50' : 'bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
        >
            {isCopied ? (
                <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
                <ShareIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
            )}
        </button>
        {isOwnPost && onEdit && onDelete && (
            <div className="relative" ref={optionsRef}>
                <button
                    onClick={() => setOptionsOpen(prev => !prev)}
                    title="Post options"
                    className="p-2 rounded-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                    <EllipsisVerticalIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                </button>
                {optionsOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700 py-1 z-50">
                        <button
                            onClick={() => { onEdit(post); setOptionsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                            <PencilIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                            Edit
                        </button>
                        <button
                            onClick={() => { onDelete(post); setOptionsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <TrashIcon className="w-5 h-5" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
      {post.mediaUrl && (
        <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt={post.title} className="w-full h-56 object-cover" />
          ) : post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="w-full h-56 bg-black" />
          ) : null}
        </div>
      )}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center mb-4">
          <img
            src={post.author.avatarUrl}
            alt={post.author.name}
            className="w-11 h-11 rounded-full mr-3 cursor-pointer ring-2 ring-indigo-500/0 hover:ring-indigo-500/70 transition-all object-cover"
            onClick={() => onViewProfile(post.author)}
          />
          <div className="min-w-0">
            <p 
              className="font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={() => onViewProfile(post.author)}
            >
              {post.author.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        <div className="mb-3">
            <span className="inline-flex items-center bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                <FolderIcon className="w-4 h-4 mr-1.5" />
                {post.category}
            </span>
        </div>

        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
          {post.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-3 flex-grow leading-relaxed">
          {post.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 4).map(tag => (
                <span key={tag} className="flex items-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">
                   <TagIcon className="w-3 h-3 mr-1.5" /> {tag}
                </span>
            ))}
        </div>
      
        {post.budget && (
          <div className="text-right text-lg font-bold text-green-600 dark:text-green-400 mb-4">
            Budget: ${post.budget}
          </div>
        )}
        <div className="flex items-center justify-between gap-4 mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button 
                onClick={() => onToggleInterest(post.id)}
                disabled={isOwnPost}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors
                    ${isInterested 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus-visible:ring-indigo-500 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'}
                    ${isOwnPost && 'bg-zinc-200 text-zinc-500 cursor-not-allowed hover:bg-zinc-200 dark:bg-zinc-600 dark:text-zinc-400'}
                `}
            >
                <HeartIcon className={`w-5 h-5 ${isInterested ? 'fill-white' : ''}`}/>
                {isInterested ? 'Interested' : "I'm Interested"}
            </button>
            <button 
                onClick={() => onStartChat(post.author)}
                disabled={isOwnPost}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500 transition-colors disabled:bg-zinc-400 dark:disabled:bg-zinc-500 disabled:cursor-not-allowed"
                >
                <MessageIcon className="w-5 h-5"/>
                Message
            </button>
        </div>
      </div>
    </div>
  );
};