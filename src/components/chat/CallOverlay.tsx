import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  Grip,
  Lock,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Pin,
  PinOff,
  ScreenShare,
  Settings,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useGroupStore } from '../../store/groupStore';
import type { ILocalVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

interface VideoPlayerProps {
  track: ILocalVideoTrack | IRemoteVideoTrack | null;
  className?: string;
}

type Tile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  videoTrack?: ILocalVideoTrack | IRemoteVideoTrack | null;
};

const VideoTrackPlayer = ({ track, className }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !track) return;
    track.play(containerRef.current, { fit: 'contain', mirror: false });
    return () => {
      track.stop();
    };
  }, [track]);

  return <div ref={containerRef} className={`nextalk-agora-contain ${className ?? ''} overflow-hidden bg-slate-950`} />;
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const nameInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

const javaStringHashUid = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return String(hash & 0x7fffffff);
};

const getBalancedGridClass = (count: number) => {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
  if (count === 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
  if (count <= 9) return 'grid-cols-2 sm:grid-cols-3';
  return 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';
};

const Avatar = ({ tile, size = 'large' }: { tile: Tile; size?: 'small' | 'large' }) => {
  const sizeClass = size === 'small' ? 'h-12 w-12 text-base' : 'h-20 w-20 text-3xl';
  return tile.avatarUrl ? (
    <img src={tile.avatarUrl} alt={tile.name} className={`${sizeClass} rounded-full object-cover shadow-xl`} />
  ) : (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700 shadow-xl`}>
      {nameInitial(tile.name)}
    </div>
  );
};

const VideoTile = ({
  tile,
  pinned,
  onTogglePin,
  compact = false
}: {
  tile: Tile;
  pinned?: boolean;
  onTogglePin?: () => void;
  compact?: boolean;
}) => (
  <div className={`nextalk-call-tile group relative h-full w-full overflow-hidden rounded-2xl border bg-white ${
    tile.isSpeaking ? 'border-emerald-400 shadow-lg shadow-emerald-500/20' : 'border-slate-200'
  }`}>
    {tile.videoTrack ? (
      <VideoTrackPlayer track={tile.videoTrack} className="h-full w-full" />
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-50">
        <div className={tile.isSpeaking ? 'rounded-full ring-4 ring-emerald-400/80 ring-offset-4 ring-offset-slate-50 animate-pulse' : ''}>
          <Avatar tile={tile} size={compact ? 'small' : 'large'} />
        </div>
        {!compact && <span className="max-w-[80%] truncate text-sm font-semibold text-slate-900">{tile.name}</span>}
      </div>
    )}

    <div className="absolute bottom-2 left-2 flex max-w-[70%] items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-900 backdrop-blur shadow-sm">
      {tile.isMuted && <MicOff className="h-3.5 w-3.5 text-red-500" />}
      <span className="truncate">{tile.isLocal ? 'Ban' : tile.name}</span>
    </div>

    {onTogglePin && (
      <button
        type="button"
        onClick={onTogglePin}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition hover:bg-black/75 group-hover:opacity-100"
        title={pinned ? 'Bo ghim' : 'Ghim nguoi nay'}
      >
        {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
    )}
  </div>
);

export const CallOverlay = () => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    callState,
    callType,
    isGroupCall,
    callTitle,
    callMemberCount,
    conversationId,
    caller,
    receiver,
    isMicMuted,
    isCameraMuted,
    isScreenSharing,
    isSpeakerOn,
    remoteUsers,
    activeSpeakerUids,
    localAgoraUid,
    localVideoTrack,
    screenVideoTrack,
    acceptCall,
    rejectCall,
    cancelCall,
    hangupCall,
    toggleMic,
    toggleCamera,
    toggleSpeaker,
    startVideo,
    toggleScreenShare,
    activeVoiceChannelId
  } = useCallStore();
  const callConversation = useChatStore((state) =>
    state.activeConversation?.id === conversationId
      ? state.activeConversation
      : state.conversations.find((conversation) => conversation.id === conversationId) ?? null
  );
  const callGroup = useGroupStore((state) =>
    state.groups.find((group) => group.id === conversationId) ?? null
  );

  const [callDuration, setCallDuration] = useState(0);
  const [pinnedTileId, setPinnedTileId] = useState<string | null>(null);
  const [recentSpeakerTileIds, setRecentSpeakerTileIds] = useState<string[]>([]);
  const connectedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (callState !== 'connected') {
      connectedAtRef.current = null;
      setCallDuration(0);
      setPinnedTileId(null);
      setRecentSpeakerTileIds([]);
      return;
    }

    connectedAtRef.current = connectedAtRef.current ?? Date.now();
    const updateDuration = () => {
      if (connectedAtRef.current) {
        setCallDuration(Math.floor((Date.now() - connectedAtRef.current) / 1000));
      }
    };

    updateDuration();
    const timer = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (callState !== 'connected' || callType !== 'video' || !isGroupCall || activeSpeakerUids.length === 0) return;

    const activeIds = activeSpeakerUids.map((uid) =>
      localAgoraUid !== null && uid === String(localAgoraUid) ? 'local' : uid
    );

    setRecentSpeakerTileIds((previous) => (
      Array.from(new Set([...activeIds, ...previous])).slice(0, 4)
    ));

    const timer = window.setTimeout(() => {
      setRecentSpeakerTileIds((previous) => previous.filter((id) => !activeIds.includes(id)));
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [activeSpeakerUids, callState, callType, isGroupCall, localAgoraUid]);

  const memberByAgoraUid = useMemo(() => {
    const members = callGroup?.members ?? callConversation?.members ?? [];
    return new Map(members.map((member: any) => [
      javaStringHashUid(member.userId ?? member.id),
      member
    ]));
  }, [callConversation, callGroup]);

  const remoteTiles: Tile[] = useMemo(() => remoteUsers.map((user) => {
    const uid = String(user.uid);
    const member = memberByAgoraUid.get(uid);
    const fallbackProfile = caller?.id !== currentUser?.id ? caller : receiver;

    return {
      id: uid,
      name: member?.username ?? fallbackProfile?.username ?? `Thanh vien ${uid}`,
      avatarUrl: member?.avatarUrl ?? fallbackProfile?.avatarUrl,
      isMuted: !user.hasAudio,
      isSpeaking: activeSpeakerUids.includes(uid),
      videoTrack: user.videoTrack ?? null
    };
  }), [activeSpeakerUids, caller, currentUser?.id, memberByAgoraUid, receiver, remoteUsers]);

  if (callState === 'idle') return null;

  const partner =
    callState === 'ringing_incoming'
      ? caller
      : callState === 'ringing_outgoing'
        ? receiver
        : caller?.id === currentUser?.id
          ? receiver
          : caller ?? receiver;

  if (!partner && !isGroupCall) return null;

  const isVoiceChannel = !!activeVoiceChannelId;

  // Kênh Thoại: dùng VoiceConnectedPanel + VoiceChannelGrid thay thế floating modal
  if (isVoiceChannel) return null;
  const displayName = isVoiceChannel ? `Kênh Thoại: ${callTitle}` : isGroupCall ? callTitle ?? 'Group call' : partner?.username ?? 'Unknown';
  const subtitle = isVoiceChannel
    ? 'Đã kết nối'
    : isGroupCall && callMemberCount
    ? `${callMemberCount} thành viên`
    : callState === 'connecting'
      ? 'Đang kết nối...'
    : callState === 'connected'
      ? 'Đã kết nối'
      : callType === 'video'
        ? 'Cuộc gọi video'
        : 'Cuộc gọi thoại';

  const localTile: Tile = {
    id: 'local',
    name: currentUser?.username ?? 'Ban',
    avatarUrl: currentUser?.avatarUrl,
    isLocal: true,
    isMuted: isMicMuted,
    isSpeaking: localAgoraUid !== null && activeSpeakerUids.includes(String(localAgoraUid)),
    videoTrack: callType === 'video' && !isCameraMuted ? (isScreenSharing ? screenVideoTrack : localVideoTrack) : null
  };

  const partnerTile: Tile | null = partner ? {
    id: partner.id,
    name: partner.username,
    avatarUrl: partner.avatarUrl,
    isMuted: false,
    isSpeaking: remoteTiles.some((tile) => tile.isSpeaking),
    videoTrack: remoteTiles[0]?.videoTrack ?? null
  } : null;

  const allTiles = [localTile, ...remoteTiles];
  const oneOnOneTile = remoteTiles[0] ?? partnerTile;
  const selectedPinnedTile = allTiles.find((tile) => tile.id === pinnedTileId) ?? null;
  const isLargeGroupVideo = isGroupCall && allTiles.length >= 5;
  const visibleBoardTiles = allTiles.slice(0, 16);
  const stageTiles = recentSpeakerTileIds
    .map((id) => allTiles.find((tile) => tile.id === id))
    .filter((tile): tile is Tile => Boolean(tile))
    .slice(0, 4);
  const activeStageTiles = selectedPinnedTile
    ? [selectedPinnedTile]
    : stageTiles.length > 0
      ? stageTiles
      : isLargeGroupVideo
        ? visibleBoardTiles.slice(0, 4)
        : [];
  const stripTiles = selectedPinnedTile || stageTiles.length > 0
    ? allTiles.filter((tile) => !activeStageTiles.some((stageTile) => stageTile.id === tile.id))
    : allTiles.slice(16);
  const shouldUseStageLayout = isLargeGroupVideo && (Boolean(selectedPinnedTile) || stageTiles.length > 0 || allTiles.length > 16);
  const boardGridClass = getBalancedGridClass(Math.min(visibleBoardTiles.length, 16));
  const stageGridClass = getBalancedGridClass(activeStageTiles.length);

  const EndCallButton = ({ onClick, large = false }: { onClick: () => void; large?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      className={`${large ? 'h-14 w-16 rounded-2xl' : 'h-16 w-16 rounded-full'} flex items-center justify-center bg-red-600 text-white shadow-xl shadow-red-950/60 ring-4 ring-red-500/25 transition-transform duration-200 hover:scale-105 hover:bg-red-500 active:scale-95 cursor-pointer`}
      title="Ket thuc cuoc goi"
    >
      <PhoneOff className={large ? 'h-6 w-6' : 'h-7 w-7'} />
    </button>
  );

  return (
    <div className="nextalk-call-overlay fixed bottom-4 right-4 z-50 pointer-events-none select-none sm:bottom-6 sm:right-6">
      {(callState !== 'connected' || callType === 'voice') && (
        <div className="nextalk-call-card pointer-events-auto flex w-[min(380px,calc(100vw-2rem))] flex-col items-center rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-6 text-center text-slate-900 shadow-2xl shadow-slate-200/50 backdrop-blur-xl animate-fade-in relative">
          
          {callState === 'connected' ? (
            <div className="flex w-full items-center justify-between text-slate-400 mb-6 px-2">
              <ChevronDown className="h-5 w-5 cursor-pointer hover:text-slate-800" />
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <Lock className="h-3 w-3" />
                <span>Mã hóa đầu cuối</span>
              </div>
              <UserPlus className="h-4 w-4 cursor-pointer hover:text-slate-800" />
            </div>
          ) : callState !== 'ringing_incoming' ? (
            <div className="text-sm font-bold text-blue-500 mb-6 tracking-wide">NexTalk</div>
          ) : null}

          {callState === 'ringing_incoming' ? (
             <div className="relative mb-3 mt-2">
               <div className="absolute -inset-2 rounded-full border-2 border-blue-100 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
               <div className="relative z-10 shadow-sm rounded-full bg-white p-0.5">
                 <Avatar tile={{ id: 'ring', name: displayName, avatarUrl: partner?.avatarUrl }} />
               </div>
               <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 border-2 border-white z-20">
                 {callType === 'video' ? <Video className="w-3 h-3 text-white" /> : <Phone className="w-3 h-3 text-white" />}
               </div>
             </div>
          ) : (
             <div className="relative mb-6">
               <div className="absolute -inset-4 rounded-full border border-blue-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
               <div className="absolute -inset-8 rounded-full border border-blue-500/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-1000" />
               <div className="relative z-10 shadow-lg shadow-slate-200 rounded-full">
                 <Avatar tile={{ id: 'ring', name: displayName, avatarUrl: partner?.avatarUrl }} />
               </div>
             </div>
          )}

          <h2 className="mb-1 max-w-full truncate text-[17px] font-bold text-slate-800">{displayName}</h2>
          
          {callState === 'ringing_incoming' ? (
            <p className="mb-6 text-xs font-medium text-blue-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              {callType === 'video' ? 'Cuộc gọi video đến...' : 'Cuộc gọi đến...'}
            </p>
          ) : callState === 'connected' ? (
            <p className="mb-8 text-sm font-semibold text-blue-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {formatDuration(callDuration)}
            </p>
          ) : (
            <p className="mb-8 text-sm font-semibold text-blue-500">
              {callState === 'connecting' ? 'Đang kết nối...' : 'Đang gọi...'}
            </p>
          )}

          {callState === 'ringing_incoming' ? (
            <>
              <div className="flex w-full items-center justify-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => rejectCall()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-red-600 transition-colors hover:bg-red-100 cursor-pointer"
                >
                  <div className="bg-red-600 rounded-full p-1.5">
                     <PhoneOff className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold">Từ chối</span>
                </button>
                <button
                  type="button"
                  onClick={acceptCall}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-green-600 transition-colors hover:bg-green-100 cursor-pointer"
                >
                  <div className="bg-green-600 rounded-full p-1.5 animate-pulse">
                     {callType === 'video' ? <Video className="h-3.5 w-3.5 text-white" /> : <Phone className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="text-sm font-bold">Trả lời</span>
                </button>
              </div>
              <div className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  <span>Mã hóa đầu cuối</span>
                </div>
                <Maximize2 className="h-3 w-3 cursor-pointer hover:text-slate-600" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className={`flex justify-center ${callState === 'connected' ? 'gap-4' : 'gap-6'} mb-8 w-full`}>
                <div className="flex flex-col items-center gap-2">
                  <button type="button" onClick={toggleMic} className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
                    {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                  <span className="text-[11px] text-slate-500 font-bold">Tắt tiếng</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button type="button" onClick={toggleSpeaker} className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
                    {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                  </button>
                  <span className="text-[11px] text-slate-500 font-bold">Loa ngoài</span>
                </div>
                {callState === 'connected' && (
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={startVideo} className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
                      <Video className="h-6 w-6" />
                    </button>
                    <span className="text-[11px] text-slate-500 font-bold">Video</span>
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <button type="button" className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
                    <Grip className="h-6 w-6" />
                  </button>
                  <span className="text-[11px] text-slate-500 font-bold">Bàn phím</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <EndCallButton onClick={() => callState === 'connected' || callState === 'connecting' ? hangupCall() : cancelCall('canceled')} />
                {callState !== 'connected' && callState !== 'connecting' && <span className="text-xs font-bold text-red-500 mt-1">Hủy bỏ</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {callState === 'connected' && callType === 'video' && (
        <div className="nextalk-call-card pointer-events-auto relative flex flex-col overflow-hidden rounded-2xl bg-black text-white shadow-2xl backdrop-blur-xl h-[min(720px,calc(100vh-3rem))] w-[min(980px,calc(100vw-2rem))] border-0">
          
          <div className="nextalk-call-canvas absolute inset-0 flex items-center justify-center bg-black z-0">
            {!isGroupCall && oneOnOneTile ? (
              <VideoTile tile={oneOnOneTile} />
            ) : shouldUseStageLayout ? (
              <div className="flex h-full w-full flex-col gap-3 p-3">
                <div className="min-h-0 flex-1">
                  <div className={`grid h-full gap-3 ${stageGridClass}`}>
                    {activeStageTiles.map((tile) => (
                      <VideoTile
                        key={tile.id}
                        tile={tile}
                        pinned={tile.id === pinnedTileId}
                        onTogglePin={() => setPinnedTileId(tile.id === pinnedTileId ? null : tile.id)}
                      />
                    ))}
                  </div>
                </div>
                {stripTiles.length > 0 && (
                  <div className="flex max-h-28 gap-2 overflow-x-auto pb-1">
                    {stripTiles.map((tile, index) => (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => setPinnedTileId(tile.id)}
                        className={`h-24 w-36 shrink-0 text-left ${index >= 5 ? 'hidden sm:block' : ''}`}
                        title="Ghim người này"
                      >
                        <VideoTile tile={tile} compact />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`grid h-full w-full gap-3 p-3 ${boardGridClass}`}>
                {visibleBoardTiles.map((tile, index) => (
                  <div key={tile.id} className={`min-h-0 ${index >= 6 ? 'hidden sm:block' : ''}`}>
                    <VideoTile
                      tile={tile}
                      onTogglePin={() => setPinnedTileId(tile.id)}
                      compact={index >= 6}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isGroupCall && (
            <div className="absolute bottom-24 right-6 z-30 pointer-events-auto h-44 w-32 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-2xl">
              <VideoTile tile={localTile} compact />
            </div>
          )}

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
             <div className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur rounded-full pl-2 pr-4 py-1.5 shadow-lg">
                 <Avatar tile={{ id: 'info', name: displayName, avatarUrl: partner?.avatarUrl }} size="small" />
                <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-slate-900" title={subtitle}>{displayName}</span>
                   <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>{formatDuration(callDuration)}</span>
                </div>
             </div>
             <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-2.5 shadow-lg">
                <button className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 px-2 cursor-pointer transition-colors"><Users className="w-4 h-4"/><span className="text-[9px] font-bold">People</span></button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 px-2 cursor-pointer transition-colors"><MessageSquare className="w-4 h-4"/><span className="text-[9px] font-bold">Chat</span></button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 px-2 cursor-pointer transition-colors"><Settings className="w-4 h-4"/><span className="text-[9px] font-bold">Settings</span></button>
             </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-xl shadow-black/20">
             <button onClick={toggleMic} className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                {isMicMuted ? <MicOff className="w-5 h-5 text-red-500"/> : <Mic className="w-5 h-5"/>}
                <span className="text-[10px] font-bold text-slate-600">Mute</span>
             </button>
             <button onClick={toggleCamera} className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                {isCameraMuted ? <VideoOff className="w-5 h-5 text-red-500"/> : <Camera className="w-5 h-5"/>}
                <span className="text-[10px] font-bold text-slate-600">Camera</span>
             </button>
             <button className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                <UserPlus className="w-5 h-5"/>
                <span className="text-[10px] font-bold text-slate-600">Add</span>
             </button>
             <button onClick={toggleScreenShare} className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                <ScreenShare className={`w-5 h-5 ${isScreenSharing ? 'text-blue-500' : ''}`} />
                <span className={`text-[10px] font-bold ${isScreenSharing ? 'text-blue-600' : 'text-slate-600'}`}>Share</span>
             </button>
             <button onClick={() => hangupCall()} className="flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white hover:bg-red-500 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30 ml-2 cursor-pointer">
                <span className="text-[11px] font-bold">End</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
