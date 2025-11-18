import React from 'react';
import type { User } from '../types';
import { StarIcon, ArrowLeftIcon, CheckBadgeIcon, AcademicCapIcon, PencilIcon, LinkIcon, LinkedInIcon, GitHubIcon, TwitterIcon, ChatBubbleLeftEllipsisIcon, VideoCameraIcon, UserGroupIcon } from './IconComponents';

interface UserProfileProps {
  user: User;
  onBack: () => void;
  isCurrentUserProfile: boolean;
  onValidateSkill: (skill: string) => void;
  validatingSkill: string | null;
  onEditProfile: () => void;
}

const SkillChip: React.FC<{ skill: string; isValidated: boolean }> = ({ skill, isValidated }) => (
  <div className={`flex items-center rounded-full text-sm font-medium px-3 py-1 ${isValidated ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'}`}>
    {isValidated ? (
        <CheckBadgeIcon className="w-5 h-5 mr-1.5 text-green-600 dark:text-green-400" />
    ) : (
        <AcademicCapIcon className="w-5 h-5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
    )}
    {skill}
  </div>
);


export const UserProfile: React.FC<UserProfileProps> = ({ user, onBack, isCurrentUserProfile, onValidateSkill, validatingSkill, onEditProfile }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium mb-6">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Feed
      </button>
      
      <div className="bg-white/95 dark:bg-zinc-900/85 rounded-2xl shadow-2xl shadow-indigo-100/40 dark:shadow-black/50 overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
        {/* Banner */}
        <div className="h-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.16),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.16),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.22),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_10%_20%,#6366f1_0,transparent_40%),radial-gradient(circle_at_80%_10%,#ec4899_0,transparent_40%)] dark:opacity-[0.12]" />
          {isCurrentUserProfile && (
            <button
              onClick={onEditProfile}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 transition-colors backdrop-blur-sm shadow-lg shadow-indigo-200/60 dark:shadow-black/60"
              title="Edit Profile"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Content */}
        <div className="px-6 md:px-8 pb-8 -mt-16">
          {/* Profile Picture and Name Section */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-6">
            {/* Profile Picture - Overlapping Banner */}
            <div className="relative z-10">
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-zinc-800 shadow-xl object-cover bg-white dark:bg-zinc-800" 
              />
            </div>
            
            {/* Name and Rating */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {user.name}
                </h1>
                {/* Social Links */}
                <div className="flex items-center gap-4 mt-2">
                  {user.portfolioUrl && (
                    <a 
                      href={user.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Portfolio
                    </a>
                  )}
                  {user.socialMedia?.linkedin && (
                    <a 
                      href={user.socialMedia.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                      <LinkedInIcon className="w-5 h-5" />
                    </a>
                  )}
                  {user.socialMedia?.github && (
                    <a 
                      href={user.socialMedia.github} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                      <GitHubIcon className="w-5 h-5" />
                    </a>
                  )}
                  {user.socialMedia?.twitter && (
                    <a 
                      href={user.socialMedia.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                      <TwitterIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Rating Badge */}
              <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg shadow-md border border-amber-200 dark:border-amber-800">
                <span className="text-2xl font-bold">{user.rating.toFixed(1)}</span>
                <StarIcon className="w-6 h-6 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400"/>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-4 mb-8 text-zinc-600 dark:text-zinc-300 leading-relaxed text-base">
              {user.bio}
            </p>
          )}

          {/* Preferred Collaboration Methods */}
          <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Preferred Collaboration Methods
            </h2>
            <div className="flex flex-wrap gap-3">
              {(user.collaborationMethods && user.collaborationMethods.length > 0) ? (
                user.collaborationMethods.map(method => (
                  <div 
                    key={method} 
                    className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
                  >
                    {method === 'Chat' && <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                    {method === 'Video Call' && <VideoCameraIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                    {method === 'In-person' && <UserGroupIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                    <span>{method}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                  No methods specified.
                </p>
              )}
            </div>
          </div>

          {/* Skills Section - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills Offered */}
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Skills Offered
              </h2>
              <div className="flex flex-wrap gap-3">
                {user.skillsOffered.length > 0 ? (
                  user.skillsOffered.map(skill => {
                    const isValidated = user.validatedSkills?.includes(skill) ?? false;
                    return (
                      <div key={skill} className="flex items-center gap-2">
                        <SkillChip skill={skill} isValidated={isValidated} />
                        {isCurrentUserProfile && !isValidated && (
                          <button
                            onClick={() => onValidateSkill(skill)}
                            disabled={validatingSkill === skill}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400 disabled:cursor-wait dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          >
                            {validatingSkill === skill ? 'Validating...' : 'Validate'}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                    No skills offered yet.
                  </p>
                )}
              </div>
            </div>

            {/* Skills Needed */}
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Skills Needed
              </h2>
              <div className="flex flex-wrap gap-3">
                {user.skillsNeeded.length > 0 ? (
                  user.skillsNeeded.map(skill => (
                    <div 
                      key={skill} 
                      className="bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
                    >
                      {skill}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                    No skills needed at the moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};