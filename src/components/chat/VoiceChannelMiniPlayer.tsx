import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ILocalVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { ChevronDown, Expand, Headphones, Mic, MicOff, MonitorUp, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { useChatStore } from '../../store/chatStore';
import { useGroupStore } from '../../store/groupStore';

function VideoTrackPlayer({ track }: { track: ILocalVideoTrack | IRemoteVideoTrack }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    track.play(container, { fit: 'contain', mirror: false });
    return () => track.stop();
  }, [track]);

  return <div ref={containerRef} className="nextalk-agora-contain h-full w-full overflow-hidden bg-slate-950" />;
}

export function VoiceChannelMiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeConversation = useChatStore((state) => state.activeConversation);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const groups = useGroupStore((state) => state.groups);
  const activeVoiceChannelId = useCallStore((state) => state.activeVoiceChannelId);
  const callTitle = useCallStore((state) => state.callTitle);
  const remoteUsers = useCallStore((state) => state.remoteUsers);
  const isScreenSharing = useCallStore((state) => state.isScreenSharing);
  const screenVideoTrack = useCallStore((state) => state.screenVideoTrack);
  const isMicMuted = useCallStore((state) => state.isMicMuted);
  const isSpeakerOn = useCallStore((state) => state.isSpeakerOn);
  const toggleMic = useCallStore((state) => state.toggleMic);
  const toggleSpeaker = useCallStore((state) => state.toggleSpeaker);
  const hangupCall = useCallStore((state) => state.hangupCall);
  const [isExpanded, setIsExpanded] = useState(true);

  const activeChannel = useMemo(
    () => groups.flatMap((group) => group.channels ?? []).find((channel) => channel.id === activeVoiceChannelId),
    [activeVoiceChannelId, groups],
  );
  const remotePresenter = remoteUsers.find((user) => user.videoTrack);
  const presenterTrack = remotePresenter?.videoTrack ?? (isScreenSharing ? screenVideoTrack : null);
  const isViewingActiveChannel = location.pathname === '/chat'
    && activeConversation?.id === activeChannel?.conversationId;

  useEffect(() => {
    if (presenterTrack) setIsExpanded(true);
  }, [presenterTrack]);

  if (!activeVoiceChannelId || !activeChannel || !presenterTrack || isViewingActiveChannel) return null;

  const openVoiceChannel = async () => {
    navigate('/chat');
    await selectConversation(activeChannel.conversationId);
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="fixed right-5 top-5 z-[70] flex max-w-[220px] items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl ring-1 ring-white/15 hover:bg-slate-800"
      >
        <MonitorUp className="h-5 w-5 text-emerald-400" />
        <span className="truncate">Đang trình bày</span>
      </button>
    );
  }

  return (
    <aside className="fixed right-5 top-5 z-[70] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl ring-1 ring-white/15">
      <button
        type="button"
        onClick={() => void openVoiceChannel()}
        className="flex min-h-12 w-full items-center gap-3 px-4 text-left hover:bg-white/5"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">Đang trình bày</span>
          <span className="block truncate text-xs text-slate-400">{callTitle || activeChannel.name}</span>
        </span>
        <Expand className="h-4 w-4 text-slate-300" />
      </button>

      <button
        type="button"
        onClick={() => void openVoiceChannel()}
        className="block aspect-video w-full cursor-pointer bg-black"
        title="Quay lại kênh thoại"
      >
        <VideoTrackPlayer track={presenterTrack} />
      </button>

      <div className="flex min-h-12 items-center justify-between gap-3 px-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
          <Headphones className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate">Đang kết nối kênh thoại</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void toggleMic()}
            title={isMicMuted ? 'Bật micro' : 'Tắt micro'}
            className={`rounded-full p-2 transition ${isMicMuted ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleSpeaker}
            title={isSpeakerOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className={`rounded-full p-2 transition ${!isSpeakerOn ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            title="Thu nhỏ"
            className="rounded-full bg-slate-700 p-2 transition hover:bg-slate-600"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={hangupCall}
            title="Rời kênh thoại"
            className="rounded-full bg-rose-600 p-2 transition hover:bg-rose-500"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
