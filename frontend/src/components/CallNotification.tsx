

import React from 'react';
import type { User, CallType } from '../types';
// FIX: Added missing PhoneIcon and VideoCameraIcon to imports.
import { PhoneIcon, VideoCameraIcon, CheckIcon, XMarkIcon } from './IconComponents';

interface CallNotificationProps {
  caller: User;
  callType: CallType | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const CallNotification: React.FC<CallNotificationProps> = ({ caller, callType, onAccept, onDecline }) => {
  return (
    <div className="fixed top-6 right-6 z-[101] w-full max-w-sm animate-fade-in-right">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 ring-1 ring-black ring-opacity-5">
        <div className="flex items-start gap-4">
          <div className="relative">
             <img src={caller.avatarUrl} alt={caller.name} className="w-12 h-12 rounded-full" />
             <span className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-white dark:border-slate-800">
                {callType === 'video' ? <VideoCameraIcon className="w-4 h-4 text-white" /> : <PhoneIcon className="w-4 h-4 text-white" />}
             </span>
          </div>
          <div className="flex-grow">
            <p className="font-bold text-slate-800 dark:text-slate-100">{caller.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Incoming {callType} call...</p>
            <div className="mt-4 flex items-center justify-end gap-3">
                <button
                    onClick={onDecline}
                    className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                    title="Decline"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={onAccept}
                    className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"
                    title="Accept"
                >
                    <CheckIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};