import { useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Volume2
} from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { ILocalVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

interface VideoPlayerProps {
  track: ILocalVideoTrack | IRemoteVideoTrack | null;
  className?: string;
}

const VideoTrackPlayer = ({ track, className }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !track) return;
    track.play(containerRef.current);
    return () => {
      track.stop();
    };
  }, [track]);

  return <div ref={containerRef} className={`${className} overflow-hidden rounded-2xl bg-zinc-950`} style={{ width: '100%', height: '100%' }} />;
};

export const CallOverlay = () => {
  const {
    callState,
    callType,
    caller,
    receiver,
    isMicMuted,
    isCameraMuted,
    isScreenSharing,
    remoteUsers,
    localVideoTrack,
    screenVideoTrack,
    acceptCall,
    rejectCall,
    cancelCall,
    hangupCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare
  } = useCallStore();

  if (callState === 'idle') return null;

  const partner = callState === 'ringing_incoming' ? caller : receiver;
  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-zinc-950/95 backdrop-blur-xl select-none">
      
      {/* 1. Incoming Call Screen */}
      {callState === 'ringing_incoming' && (
        <div className="flex flex-col items-center max-w-sm w-full p-8 text-center animate-fade-in text-white">
          <div className="relative mb-12">
            {/* Pulsing ripple rings */}
            <div className="absolute inset-0 rounded-full bg-indigo-600/30 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            
            {partner.avatarUrl ? (
              <img
                src={partner.avatarUrl}
                alt={partner.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-650 relative z-10 shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-indigo-650 text-white font-bold flex items-center justify-center text-4xl border-4 border-indigo-500 relative z-10 shadow-2xl">
                {partner.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight">{partner.username}</h2>
          <p className="text-zinc-400 text-sm mb-12 flex items-center justify-center gap-2">
            {callType === 'video' ? (
              <>
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Cuộc gọi video đến...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Cuộc gọi thoại đến...</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-8 justify-center">
            {/* Decline Button */}
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 duration-200 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Accept Button */}
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 duration-200 cursor-pointer animate-pulse"
            >
              {callType === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. Outgoing Call Screen */}
      {callState === 'ringing_outgoing' && (
        <div className="flex flex-col items-center max-w-sm w-full p-8 text-center animate-fade-in text-white">
          <div className="relative mb-12">
            <div className="absolute inset-0 rounded-full bg-zinc-800/40 animate-pulse" />
            {partner.avatarUrl ? (
              <img
                src={partner.avatarUrl}
                alt={partner.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700 relative z-10 shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-4xl border-4 border-zinc-600 relative z-10 shadow-2xl">
                {partner.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight">{partner.username}</h2>
          <p className="text-zinc-400 text-sm mb-12 animate-pulse">Đang đổ chuông...</p>

          <div className="flex items-center justify-center">
            <button
              onClick={cancelCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 duration-200 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Connected Call Screen */}
      {callState === 'connected' && (
        <div className="relative w-full h-full flex flex-col justify-between p-6">
          
          {/* Main Call View */}
          <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
            {callType === 'video' ? (
              <div className="w-full h-full relative">
                {/* Remote Video Track */}
                {remoteUsers.length > 0 && remoteUsers[0].videoTrack ? (
                  <VideoTrackPlayer track={remoteUsers[0].videoTrack} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 bg-zinc-950">
                    {partner.avatarUrl ? (
                      <img
                        src={partner.avatarUrl}
                        alt={partner.username}
                        className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700 shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-3xl shadow-xl">
                        {partner.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-zinc-400 text-sm">{partner.username} đã tắt camera</p>
                  </div>
                )}

                {/* Floating Picture-In-Picture Local Video */}
                <div className="absolute bottom-4 right-4 w-40 h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700 bg-zinc-950 z-20 transition-all hover:scale-105">
                  {!isCameraMuted ? (
                    <VideoTrackPlayer track={isScreenSharing ? screenVideoTrack : localVideoTrack} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400 text-xs">
                      Camera tắt
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Voice Call View: Centered avatars side-by-side or large layout
              <div className="flex flex-col sm:flex-row items-center justify-center gap-16 text-white w-full h-full">
                {/* User avatar with speech pulse if speaking (simplified wave animations) */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-zinc-700/20 animate-pulse" />
                    {partner.avatarUrl ? (
                      <img
                        src={partner.avatarUrl}
                        alt={partner.username}
                        className="w-24 h-24 rounded-full object-cover border-2 border-zinc-600 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-3xl border-2 border-zinc-550 shadow-lg">
                        {partner.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{partner.username}</span>
                  <span className="text-xs text-zinc-400 mt-1">Đã kết nối</span>
                </div>
              </div>
            )}
          </div>

          {/* Control Bar Overlay */}
          <div className="w-full flex justify-center py-4 z-30">
            <div className="flex items-center gap-6 px-8 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-lg shadow-2xl">
              {/* Mic Button */}
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow transition-colors cursor-pointer ${
                  isMicMuted
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle Button (Only for Video Calls) */}
              {callType === 'video' && (
                <>
                  <button
                    onClick={toggleCamera}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow transition-colors cursor-pointer ${
                      isCameraMuted
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {isCameraMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  {/* Screen Share Button */}
                  <button
                    onClick={toggleScreenShare}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow transition-colors cursor-pointer ${
                      isScreenSharing
                        ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* End Call Button */}
              <button
                onClick={hangupCall}
                className="w-12 h-12 rounded-xl bg-red-650 hover:bg-red-550 text-white flex items-center justify-center shadow transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CallOverlay;
