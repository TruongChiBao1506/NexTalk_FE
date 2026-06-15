import { useCallStore } from '../../store/callStore';
import { Mic, MicOff, Headphones, PhoneOff, SignalHigh, Monitor, Camera, VideoOff, Bell, BellOff } from 'lucide-react';

export const VoiceConnectedPanel = () => {
  const {
    callState,
    isGroupCall,
    callType,
    callTitle,
    isMicMuted,
    isCameraMuted,
    isSpeakerOn,
    isChannelSoundEnabled,
    toggleMic,
    toggleCamera,
    toggleSpeaker,
    toggleChannelSound,
    hangupCall,
    isViewingVoiceGrid,
    setIsViewingVoiceGrid,
    isScreenSharing,
    toggleScreenShare,
    remoteUsers
  } = useCallStore();

  const isSomeoneElseSharing = remoteUsers.some((user) => user.hasVideo);

  const handleToggleScreenShare = () => {
    if (!isScreenSharing && isSomeoneElseSharing) {
      alert('Đã có người khác đang chia sẻ màn hình. Vui lòng chờ họ tắt trước khi bạn chia sẻ.');
      return;
    }
    toggleScreenShare();
  };

  if (callState !== 'connected' || !isGroupCall || callType !== 'voice') {
    return null;
  }

  return (
    <div className="flex flex-col bg-emerald-50/50 px-3 py-2 border-t border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/30 shrink-0">
      <div 
        className="flex items-center gap-2 cursor-pointer group rounded-md p-1 -ml-1 transition hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40"
        onClick={() => setIsViewingVoiceGrid(!isViewingVoiceGrid)}
        title={isViewingVoiceGrid ? 'Trở lại tin nhắn' : 'Xem lưới Voice Channel'}
      >
        <SignalHigh className="w-4 h-4 text-emerald-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 truncate leading-none mb-1">
            Đã kết nối giọng nói
          </div>
          <div className="text-[11px] text-emerald-700/70 dark:text-emerald-300/60 truncate leading-none group-hover:underline">
            {callTitle || 'Kênh Thoại'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={toggleMic}
            className={`p-1.5 rounded-md transition ${
              isMicMuted 
                ? 'bg-rose-100/80 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30' 
                : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800/40'
            }`}
            title={isMicMuted ? 'Bật Micro' : 'Tắt Micro'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <button
            type="button"
            onClick={toggleCamera}
            className={`p-1.5 rounded-md transition ${
              isCameraMuted 
                ? 'bg-rose-100/80 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30' 
                : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800/40'
            }`}
            title={isCameraMuted ? 'Bật Camera' : 'Tắt Camera'}
          >
            {isCameraMuted ? <VideoOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleSpeaker}
            className={`p-1.5 rounded-md transition ${
              !isSpeakerOn 
                ? 'bg-rose-100/80 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30' 
                : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800/40'
            }`}
            title={!isSpeakerOn ? 'Bật Tai nghe' : 'Tắt Tai nghe (Deafen)'}
          >
            {/* Using Headphones for both states, just coloring/strikethrough via code or icon. Lucide doesn't have HeadphonesOff, so we use logic or opacity */}
            <div className="relative">
              <Headphones className="w-4 h-4" />
              {!isSpeakerOn && (
                <div className="absolute top-1/2 left-1/2 w-5 h-[2px] bg-current -translate-x-1/2 -translate-y-1/2 -rotate-45 shadow-[0_0_0_1px_white] dark:shadow-[0_0_0_1px_black]" />
              )}
            </div>
          </button>
          
          <button
            type="button"
            onClick={handleToggleScreenShare}
            disabled={!isScreenSharing && isSomeoneElseSharing}
            className={`p-1.5 rounded-md transition ${
              isScreenSharing 
                ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400' 
                : (!isScreenSharing && isSomeoneElseSharing)
                  ? 'text-slate-400/50 cursor-not-allowed dark:text-slate-600/50'
                  : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800/40'
            }`}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : isSomeoneElseSharing ? 'Đã có người đang chia sẻ' : 'Chia sẻ màn hình'}
          >
            <Monitor className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleChannelSound}
            className={`p-1.5 rounded-md transition ${
              !isChannelSoundEnabled 
                ? 'bg-amber-100/80 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-800/40' 
                : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800/40'
            }`}
            title={!isChannelSoundEnabled ? 'Bật âm thông báo (Tham gia/Rời khỏi)' : 'Tắt âm thông báo (Tham gia/Rời khỏi)'}
          >
            {isChannelSoundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        </div>
        
        <button
          type="button"
          onClick={hangupCall}
          className="p-1.5 rounded-md text-emerald-700 hover:bg-rose-100 hover:text-rose-600 dark:text-emerald-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition"
          title="Ngắt kết nối"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
