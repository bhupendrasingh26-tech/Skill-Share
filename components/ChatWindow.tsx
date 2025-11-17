import React, { useState, useEffect, useRef } from 'react';
import type { User, ChatMessage } from '../types';
import { PaperAirplaneIcon, ChevronDownIcon, CloseIcon, PhoneIcon, VideoCameraIcon } from './IconComponents';

interface ChatWindowProps {
  currentUser: User;
  receiver: User;
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, text: string) => void;
  onClose: () => void;
  isTyping: boolean;
  onFocus: () => void;
  onInitiateCall: (receiver: User, type: 'audio' | 'video') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  receiver,
  messages,
  onSendMessage,
  onClose,
  isTyping,
  onFocus,
  onInitiateCall,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  useEffect(() => {
    onFocus();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(receiver.id, newMessage);
      setNewMessage('');
    }
  };

  const lastSentMessage = [...messages].reverse().find(msg => msg.senderId === currentUser.id);

  return (
    <div className={`w-80 bg-white dark:bg-zinc-800 rounded-t-lg shadow-2xl flex flex-col transition-all duration-300 pointer-events-auto border border-b-0 border-zinc-200 dark:border-zinc-700 ${isMinimized ? 'h-14' : 'h-[28rem]'}`}>
      <header
        className="flex items-center justify-between p-3 bg-indigo-600 text-white rounded-t-lg cursor-pointer flex-shrink-0"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <img src={receiver.avatarUrl} alt={receiver.name} className="w-8 h-8 rounded-full" />
          <span className="font-semibold">{receiver.name}</span>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={(e) => { e.stopPropagation(); onInitiateCall(receiver, 'audio'); }} className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-500 rounded-full" title="Audio Call">
              <PhoneIcon className="w-5 h-5" />
           </button>
            <button onClick={(e) => { e.stopPropagation(); onInitiateCall(receiver, 'video'); }} className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-500 rounded-full" title="Video Call">
              <VideoCameraIcon className="w-5 h-5" />
           </button>
           <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-500 rounded-full">
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1.5 hover:bg-indigo-700 dark:hover:bg-indigo-500 rounded-full">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {!isMinimized && (
        <>
          <div className="flex-grow p-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-900" onMouseEnter={onFocus}>
            {messages.filter(msg => !msg.signal).map((msg) => (
              <div key={msg.id} className={`flex mb-3 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 rounded-bl-lg'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
                <div className="flex mb-3 justify-start items-center gap-2">
                    <img src={receiver.avatarUrl} alt="typing" className="w-6 h-6 rounded-full"/>
                    <div className="rounded-2xl px-4 py-2 bg-zinc-200 dark:bg-zinc-700">
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-pulse delay-0"></span>
                            <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                            <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
             {lastSentMessage?.seen && !isTyping && (
                <div className="text-right text-xs text-zinc-400 dark:text-zinc-500 pr-2 h-4">Seen</div>
            )}
          </div>
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onFocus={onFocus}
                placeholder="Type a message..."
                className="flex-grow px-3 py-2 text-sm border border-zinc-300 rounded-full focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
                autoFocus
              />
              <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 flex-shrink-0" disabled={!newMessage.trim()}>
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};