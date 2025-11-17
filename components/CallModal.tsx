

import React, { useEffect, useRef, useState } from 'react';
import type { User, CallState, CallType } from '../types';
// FIX: Added missing icon components to imports.
import { PhoneIcon, VideoCameraIcon, PhoneXMarkIcon, MicrophoneIcon, MicrophoneSlashIcon, VideoCameraSlashIcon } from './IconComponents';

interface CallModalProps {
  callState: CallState;
  callType: CallType | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  partner: User;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}

const CallControlButton: React.FC<{ onClick: () => void, color: string, children: React.ReactNode, title: string }> = ({ onClick, color, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${color}`}
    >
        {children}
    </button>
);


export const CallModal: React.FC<CallModalProps> = ({ callState, callType, localStream, remoteStream, partner, onAccept, onDecline, onEnd }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  const toggleMute = () => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        });
    }
  };
  
  const toggleVideo = () => {
    if (localStream && callType === 'video') {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsVideoOff(!track.enabled);
        });
    }
  };
  
  const renderContent = () => {
    if (callState === 'receiving' || callState === 'initiating') {
      const isReceiving = callState === 'receiving';
      const text = isReceiving ? `Incoming ${callType} call...` : `Calling ${partner.name}...`;

      return (
        <div className="flex flex-col items-center justify-center h-full text-white text-center">
            <img src={partner.avatarUrl} alt={partner.name} className="w-40 h-40 rounded-full ring-8 ring-white/20 mb-6"/>
            <h2 className="text-4xl font-bold">{partner.name}</h2>
            <p className="mt-2 text-lg opacity-80">{text}</p>
            <div className="absolute bottom-20 flex items-center gap-8">
                {isReceiving && (
                    <div className="flex flex-col items-center">
                        <CallControlButton onClick={onAccept} color="bg-green-500 hover:bg-green-600" title="Accept Call">
                            <PhoneIcon className="w-8 h-8 text-white"/>
                        </CallControlButton>
                        <span className="mt-2">Accept</span>
                    </div>
                )}
                 <div className="flex flex-col items-center">
                    <CallControlButton onClick={isReceiving ? onDecline : onEnd} color="bg-red-500 hover:bg-red-600" title={isReceiving ? 'Decline Call' : 'Cancel Call'}>
                       <PhoneXMarkIcon className="w-8 h-8 text-white"/>
                    </CallControlButton>
                    <span className="mt-2">{isReceiving ? 'Decline' : 'Cancel'}</span>
                </div>
            </div>
        </div>
      );
    }
    
    if (callState === 'in-progress') {
        return (
            <div className="relative w-full h-full bg-black">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-1/4 max-w-xs rounded-lg shadow-lg border-2 border-white" />

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 p-4 rounded-full backdrop-blur-sm">
                    <CallControlButton onClick={toggleMute} color={isMuted ? 'bg-white/30 hover:bg-white/40' : 'bg-white/20 hover:bg-white/30'} title={isMuted ? "Unmute" : "Mute"}>
                       {isMuted ? <MicrophoneSlashIcon className="w-7 h-7 text-white"/> : <MicrophoneIcon className="w-7 h-7 text-white"/>}
                    </CallControlButton>

                    {callType === 'video' && (
                        <CallControlButton onClick={toggleVideo} color={isVideoOff ? 'bg-white/30 hover:bg-white/40' : 'bg-white/20 hover:bg-white/30'} title={isVideoOff ? "Turn Video On" : "Turn Video Off"}>
                           {isVideoOff ? <VideoCameraSlashIcon className="w-7 h-7 text-white"/> : <VideoCameraIcon className="w-7 h-7 text-white"/>}
                        </CallControlButton>
                    )}

                    <CallControlButton onClick={onEnd} color="bg-red-500 hover:bg-red-600" title="End Call">
                        <PhoneXMarkIcon className="w-8 h-8 text-white"/>
                    </CallControlButton>
                </div>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-90 z-[100] flex items-center justify-center">
      {renderContent()}
    </div>
  );
};