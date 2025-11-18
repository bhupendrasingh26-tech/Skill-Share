
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { CloseIcon, CameraIcon, CheckCircleIcon, MinusCircleIcon, LinkIcon, LinkedInIcon, GitHubIcon, TwitterIcon } from './IconComponents';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => void;
}

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const COLLABORATION_OPTIONS = ['Chat', 'Video Call', 'In-person'] as const;


export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const isInitialSetup = user.needsProfileSetup;
  
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [skillsOffered, setSkillsOffered] = useState(user.skillsOffered.join(', '));
  const [skillsNeeded, setSkillsNeeded] = useState(user.skillsNeeded.join(', '));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatarUrl);

  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || '');
  const [linkedin, setLinkedin] = useState(user.socialMedia?.linkedin || '');
  const [github, setGithub] = useState(user.socialMedia?.github || '');
  const [twitter, setTwitter] = useState(user.socialMedia?.twitter || '');
  const [collaborationMethods, setCollaborationMethods] = useState<Set<User['collaborationMethods'][number]>>(new Set(user.collaborationMethods || []));

  const [errors, setErrors] = useState<Record<string, string | null>>({
      portfolioUrl: null,
      linkedin: null,
      github: null,
      twitter: null,
  });

  const [validation, setValidation] = useState({
    hasName: !!user.name,
    hasBio: user.bio.trim().length >= 10,
    hasSkillsOffered: user.skillsOffered.length > 0,
    hasSkillsNeeded: user.skillsNeeded.length > 0,
    hasCollaborationMethod: (user.collaborationMethods?.length || 0) > 0,
  });

  useEffect(() => {
    // Live validation for profile completion, now applies to all users.
    setValidation({
      hasName: name.trim().length > 0,
      hasBio: bio.trim().length >= 10,
      hasSkillsOffered: skillsOffered.split(',').map(s => s.trim()).filter(Boolean).length > 0,
      hasSkillsNeeded: skillsNeeded.split(',').map(s => s.trim()).filter(Boolean).length > 0,
      hasCollaborationMethod: collaborationMethods.size > 0,
    });
  }, [name, bio, skillsOffered, skillsNeeded, collaborationMethods]);
  
  const isProfileComplete = Object.values(validation).every(Boolean);

  useEffect(() => {
    // Clean up object URL on unmount
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const validateUrl = (url: string, fieldName: string) => {
    if (url.trim() && !URL_REGEX.test(url)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Please enter a valid URL.' }));
    } else {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleCollaborationToggle = (method: User['collaborationMethods'][number]) => {
    setCollaborationMethods(prev => {
        const newSet = new Set(prev);
        if (newSet.has(method)) {
            newSet.delete(method);
        } else {
            newSet.add(method);
        }
        return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileComplete || Object.values(errors).some(err => err !== null)) return; // Don't submit if incomplete or has errors

    const updatedData: Partial<User> = {
      name,
      bio,
      skillsOffered: skillsOffered.split(',').map(s => s.trim()).filter(Boolean),
      skillsNeeded: skillsNeeded.split(',').map(s => s.trim()).filter(Boolean),
      avatarUrl: avatarPreview,
      portfolioUrl,
      socialMedia: { linkedin, github, twitter },
      collaborationMethods: Array.from(collaborationMethods),
    };
    onSave(updatedData);
  };

  const renderChecklist = () => (
    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg mb-6 space-y-2 border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Complete Your Profile</h4>
      <ul className="space-y-2">
        <li className={`flex items-center gap-3 text-sm transition-colors ${validation.hasName ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
          {validation.hasName ? <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" /> : <MinusCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
          <span>Enter your full name</span>
        </li>
        <li className={`flex items-center gap-3 text-sm transition-colors ${validation.hasBio ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
          {validation.hasBio ? <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" /> : <MinusCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
          <span>Write a short bio (min. 10 characters)</span>
        </li>
        <li className={`flex items-center gap-3 text-sm transition-colors ${validation.hasSkillsOffered ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
          {validation.hasSkillsOffered ? <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" /> : <MinusCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
          <span>Add at least one skill you can offer</span>
        </li>
         <li className={`flex items-center gap-3 text-sm transition-colors ${validation.hasSkillsNeeded ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
          {validation.hasSkillsNeeded ? <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" /> : <MinusCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
          <span>Add at least one skill you need help with</span>
        </li>
         <li className={`flex items-center gap-3 text-sm transition-colors ${validation.hasCollaborationMethod ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
          {validation.hasCollaborationMethod ? <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" /> : <MinusCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
          <span>Add at least one collaboration method</span>
        </li>
      </ul>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {isInitialSetup ? 'Set Up Your Profile' : 'Edit Profile'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          {isInitialSetup && renderChecklist()}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img src={avatarPreview} alt="Profile Preview" className="w-32 h-32 rounded-full object-cover ring-4 ring-indigo-200 dark:ring-indigo-700" />
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors">
                <CameraIcon className="w-6 h-6" />
                <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              required
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              placeholder="Tell us a little about yourself..."
            ></textarea>
          </div>

          <div>
            <label htmlFor="skillsOffered" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills You Offer</label>
            <input
              type="text"
              id="skillsOffered"
              value={skillsOffered}
              onChange={(e) => setSkillsOffered(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              placeholder="e.g., React, Python, Design (comma-separated)"
            />
          </div>
          
          <div>
            <label htmlFor="skillsNeeded" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills You Need Help With</label>
            <input
              type="text"
              id="skillsNeeded"
              value={skillsNeeded}
              onChange={(e) => setSkillsNeeded(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              placeholder="e.g., Marketing, Video Editing (comma-separated)"
            />
          </div>

           <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-6">
                <div>
                    <label htmlFor="portfolio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Portfolio/Website URL</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LinkIcon className="w-5 h-5 text-slate-400" />
                        </span>
                        <input
                            type="text"
                            id="portfolio"
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            onBlur={(e) => validateUrl(e.target.value, 'portfolioUrl')}
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="https://your-portfolio.com"
                        />
                    </div>
                    {errors.portfolioUrl && <p className="text-xs text-red-500 mt-1">{errors.portfolioUrl}</p>}
                </div>
                
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Social Media Links</label>
                    <div className="space-y-3">
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <LinkedInIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} onBlur={(e) => validateUrl(e.target.value, 'linkedin')} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="linkedin.com/in/your-profile"/>
                        </div>
                        {errors.linkedin && <p className="text-xs text-red-500 -mt-2 mb-2 pl-1">{errors.linkedin}</p>}
                        
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <GitHubIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} onBlur={(e) => validateUrl(e.target.value, 'github')} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="github.com/your-username"/>
                        </div>
                         {errors.github && <p className="text-xs text-red-500 -mt-2 mb-2 pl-1">{errors.github}</p>}
                        
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <TwitterIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} onBlur={(e) => validateUrl(e.target.value, 'twitter')} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="twitter.com/your-handle"/>
                        </div>
                         {errors.twitter && <p className="text-xs text-red-500 -mt-2 mb-2 pl-1">{errors.twitter}</p>}
                    </div>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preferred Collaboration Methods</label>
                    <div className="flex flex-wrap gap-4">
                        {COLLABORATION_OPTIONS.map(method => (
                            <label key={method} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={collaborationMethods.has(method)}
                                    onChange={() => handleCollaborationToggle(method)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-800 dark:text-slate-200">{method}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

        </form>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
              disabled={!isProfileComplete || Object.values(errors).some(e => e !== null)}
            >
              {isInitialSetup ? 'Complete Profile' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
