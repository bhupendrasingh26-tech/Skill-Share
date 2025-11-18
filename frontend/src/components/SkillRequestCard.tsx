import React from 'react';
import type { User, SkillRequest } from '../types';
import { CheckIcon, XMarkIcon } from './IconComponents';

interface SkillRequestCardProps {
  request: SkillRequest & { requester: User };
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onViewProfile: (user: User) => void;
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

export const SkillRequestCard: React.FC<SkillRequestCardProps> = ({ request, onAccept, onDecline, onViewProfile }) => {
  const { requester } = request;
  const rating = Math.round(requester.rating * 10) / 10;

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <img 
          src={requester.avatarUrl} 
          alt={requester.name} 
          className="w-14 h-14 rounded-full cursor-pointer ring-2 ring-indigo-200 dark:ring-indigo-800 hover:ring-indigo-400 dark:hover:ring-indigo-600 transition-all"
          onClick={() => onViewProfile(requester)}
        />
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
             <div>
                <p 
                    className="font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    onClick={() => onViewProfile(requester)}
                >
                    {requester.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-yellow-500">★ {rating}</span>
                  {requester.validatedSkills && requester.validatedSkills.length > 0 && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                      {requester.validatedSkills.length} verified
                    </span>
                  )}
                </div>
             </div>
             <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{timeAgo(request.createdAt)}</p>
          </div>
          
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                <span className="text-slate-500 dark:text-slate-400">needs help with </span> 
                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded inline-block">{request.skill}</span>
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 border-l-4 border-indigo-300 dark:border-indigo-600 p-3 rounded-r-lg mb-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{request.message}"</p>
          </div>

          <div className="flex items-center justify-between">
             <button
              onClick={() => onViewProfile(requester)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              View Profile →
            </button>
             <div className="flex items-center gap-2">
              <button
                onClick={() => onDecline(request.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                <XMarkIcon className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={() => onAccept(request.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                <CheckIcon className="w-4 h-4" />
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

