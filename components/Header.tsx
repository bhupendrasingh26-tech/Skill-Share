import React, { useState, useRef, useEffect } from 'react';
import type { User, Notification, ChatMessage } from '../types';
import { ExchangeIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, MoonIcon, SunIcon, ChartBarIcon, MessageIcon, ChatBubbleLeftEllipsisIcon } from './IconComponents';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  user: User;
  notifications: Notification[];
  chatSessions?: Record<string, ChatMessage[]>;
  onShareClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  onDashboardClick: () => void;
  onAnalyticsClick: () => void;
  onMessagesClick: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onMarkNotificationAsSeen: (notificationId: string) => void;
  onMarkAllNotificationsAsSeen: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onNotificationClick: (notification: Notification) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  notifications,
  chatSessions = {},
  onShareClick, 
  onProfileClick, 
  onLogoClick, 
  onDashboardClick, 
  onAnalyticsClick, 
  onMessagesClick, 
  onLogout, 
  theme, 
  onToggleTheme,
  onMarkNotificationAsSeen,
  onMarkAllNotificationsAsSeen,
  onDeleteNotification,
  onNotificationClick,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Calculate unread message count
  const unreadMessageCount = Object.values(chatSessions).reduce((total, messages) => {
    return total + messages.filter(msg => msg.receiverId === user.id && !msg.seen).length;
  }, 0);


  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onLogoClick}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-purple-500 opacity-70 blur-md group-hover:opacity-100 transition-opacity" />
              <div className="relative inline-flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-950 text-white shadow-md shadow-indigo-500/40">
                <ExchangeIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400 uppercase">
                Skillshare
              </span>
              <span className="text-[0.78rem] font-medium text-zinc-400 dark:text-zinc-500">
                Peer-to-peer learning studio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleTheme}
              className="hidden sm:inline-flex p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
            </button>
            <button
              onClick={onMessagesClick}
              className="relative p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-200 group"
              title="Messages"
            >
              <div className="relative">
                <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full min-w-[1.25rem] h-5 shadow-lg ring-2 ring-white dark:ring-zinc-800">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </div>
            </button>
            <NotificationCenter
              notifications={notifications}
              onMarkAsSeen={onMarkNotificationAsSeen}
              onMarkAllAsSeen={onMarkAllNotificationsAsSeen}
              onDelete={onDeleteNotification}
              onNotificationClick={onNotificationClick}
            />
            <button
              onClick={onShareClick}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-400/40 hover:from-indigo-500 hover:via-violet-500 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all text-sm"
            >
              Share a Skill / Need
            </button>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(prev => !prev)} className="flex items-center gap-3">
                <span className="hidden md:inline text-sm font-medium text-zinc-700 dark:text-zinc-200">{user.name}</span>
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-indigo-500/0 hover:ring-indigo-500/70 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 transition-all shadow-sm"
                />
              </button>
              {dropdownOpen && (
                 <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); onDashboardClick(); setDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                           <UserCircleIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                           Dashboard
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMessagesClick(); setDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                           <MessageIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                           Messages & Calls
                        </a>
                         <a href="#" onClick={(e) => { e.preventDefault(); onAnalyticsClick(); setDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                           <ChartBarIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                           Analytics
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onProfileClick(); setDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                            <Cog6ToothIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                            View Profile
                        </a>
                    </div>
                    <div className="py-1 border-t border-zinc-200 dark:border-zinc-700">
                         <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            Logout
                        </a>
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};