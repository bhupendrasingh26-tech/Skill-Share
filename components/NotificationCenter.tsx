import React, { useState, useRef, useEffect } from 'react';
import type { Notification } from '../types';
import { BellIcon, CheckIcon, TrashIcon } from './IconComponents';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsSeen: (notificationId: string) => void;
  onMarkAllAsSeen: () => void;
  onDelete: (notificationId: string) => void;
  onNotificationClick: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsSeen,
  onMarkAllAsSeen,
  onDelete,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.seen).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_interest':
        return '👍';
      case 'message':
        return '💬';
      case 'call':
        return '📞';
      case 'skill_request':
        return '🎓';
      default:
        return '📢';
    }
  };

  // Get sender info for message notifications
  const getSenderInfo = (notification: Notification) => {
    if (notification.type === 'message' && notification.sender) {
      return {
        name: notification.sender.name || 'Unknown',
        avatarUrl: notification.sender.avatarUrl || '',
      };
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
        title="Notifications"
      >
        <BellIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-200" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-zinc-800 rounded-lg shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsSeen}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <CheckIcon className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-zinc-500 dark:text-zinc-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => {
                const senderInfo = getSenderInfo(notification);
                const isMessage = notification.type === 'message';
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.seen) {
                        onMarkAsSeen(notification.id);
                      }
                      onNotificationClick(notification);
                    }}
                    className={`p-4 border-b border-zinc-100 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors ${
                      !notification.seen ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {isMessage && senderInfo ? (
                          <div className="relative flex-shrink-0">
                            <img
                              src={senderInfo.avatarUrl}
                              alt={senderInfo.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-800 ring-indigo-500"
                            />
                            <span className="absolute -bottom-1 -right-1 text-lg bg-white dark:bg-zinc-800 rounded-full p-0.5">
                              {getNotificationIcon(notification.type)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            isMessage 
                              ? 'text-zinc-800 dark:text-zinc-200 font-medium' 
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
