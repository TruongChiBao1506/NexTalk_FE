import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  Monitor,
  Palette,
  Phone,
  PhoneOff,
  Pin,
  PinOff,
  RotateCcw,
  Sparkles,
  Video,
  VideoOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
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
    track.play(containerRef.current);
    return () => {
      track.stop();
    };
  }, [track]);

  return <div ref={containerRef} className={`${className} overflow-hidden bg-slate-950`} />;
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
  <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white ${
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

const VoiceTile = ({ tile }: { tile: Tile }) => (
  <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
    <div className={`relative rounded-full ${tile.isSpeaking ? 'ring-4 ring-emerald-400/80 ring-offset-4 ring-offset-white animate-pulse' : ''}`}>
      <Avatar tile={tile} />
      {tile.isMuted && (
        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-white">
          <MicOff className="h-4 w-4" />
        </div>
      )}
    </div>
    <span className="max-w-full truncate text-sm font-semibold text-slate-900">{tile.isLocal ? 'Ban' : tile.name}</span>
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
    callNotices,
    remoteAudioPlaybackBlocked,
    localVideoTrack,
    screenVideoTrack,
    acceptCall,
    rejectCall,
    cancelCall,
    hangupCall,
    toggleMic,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
    startVideo,
    toggleScreenShare,
    resumeRemoteAudio,
    activeVoiceChannelId
  } = useCallStore();
  const callConversation = useChatStore((state) =>
    state.activeConversation?.id === conversationId
      ? state.activeConversation
      : state.conversations.find((conversation) => conversation.id === conversationId) ?? null
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
    const members = callConversation?.members ?? [];
    return new Map(members.map((member) => [javaStringHashUid(member.id), member]));
  }, [callConversation]);

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
  const displayName = isVoiceChannel ? `Kênh Thoại: ${callTitle}` : isGroupCall ? callTitle ?? 'Group call' : partner?.username ?? 'Unknown';
  const subtitle = isVoiceChannel
    ? 'Đã kết nối'
    : isGroupCall && callMemberCount
    ? `${callMemberCount} thành viên`
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
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none select-none sm:bottom-6 sm:right-6">
      {callState !== 'connected' && (
        <div className="pointer-events-auto flex w-[min(380px,calc(100vw-2rem))] flex-col items-center rounded-3xl border border-slate-200 bg-white/95 p-6 text-center text-slate-900 shadow-2xl shadow-slate-200/50 backdrop-blur-xl animate-fade-in">
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-full bg-indigo-600/30 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            <div className="relative z-10">
              <Avatar tile={{ id: 'ring', name: displayName, avatarUrl: partner?.avatarUrl }} />
            </div>
          </div>

          <h2 className="mb-2 max-w-full truncate text-xl font-bold tracking-tight">{displayName}</h2>
          <p className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-500">
            {callType === 'video' ? <Video className="h-4 w-4 text-indigo-500" /> : <Volume2 className="h-4 w-4 text-indigo-500" />}
            <span>
              {callState === 'ringing_incoming'
                ? isGroupCall ? `${subtitle} dang goi...` : callType === 'video' ? 'Cuoc goi video den...' : 'Cuoc goi thoai den...'
                : isGroupCall ? `${subtitle} - dang do chuong...` : 'Dang do chuong...'}
            </span>
          </p>

          <div className="flex items-center justify-center gap-8">
            <EndCallButton onClick={callState === 'ringing_incoming' ? () => rejectCall() : () => cancelCall('canceled')} />
            {callState === 'ringing_incoming' && (
              <button
                type="button"
                onClick={acceptCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 transition-transform duration-200 hover:scale-110 hover:bg-emerald-500 active:scale-95 cursor-pointer animate-pulse"
                title="Nhan cuoc goi"
              >
                {callType === 'video' ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
              </button>
            )}
          </div>
        </div>
      )}

      {callState === 'connected' && (
        <div className={`pointer-events-auto relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 text-slate-900 shadow-2xl shadow-slate-200/50 backdrop-blur-xl ${
          callType === 'video'
            ? 'h-[min(720px,calc(100vh-3rem))] w-[min(980px,calc(100vw-2rem))]'
            : 'w-[min(620px,calc(100vw-2rem))]'
        }`}>
          {callNotices.length > 0 && (
            <div className="pointer-events-none absolute left-1/2 top-16 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
              {callNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="max-w-[min(420px,calc(100vw-4rem))] rounded-full bg-white/85 px-3 py-1.5 text-center text-xs font-medium text-slate-600 shadow-lg ring-1 ring-slate-200 backdrop-blur"
                >
                  {notice.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-bold">{displayName}</p>
              <p className="m-0 text-xs text-slate-500">{subtitle}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {formatDuration(callDuration)}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-slate-50 p-3">
            {callType === 'video' ? (
              !isGroupCall && oneOnOneTile ? (
                <VideoTile tile={oneOnOneTile} />
              ) : shouldUseStageLayout ? (
                <div className="flex h-full flex-col gap-3">
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
                          title="Ghim nguoi nay"
                        >
                          <VideoTile tile={tile} compact />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`grid h-full gap-3 ${boardGridClass}`}>
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
              )
            ) : (
              !isGroupCall && oneOnOneTile ? (
                <div className="flex h-full min-h-[300px] items-center justify-center">
                  <div className="w-full max-w-xs">
                    <VoiceTile tile={oneOnOneTile} />
                  </div>
                </div>
              ) : (
                <div className="grid h-full min-h-[300px] grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
                  {allTiles.map((tile) => (
                    <VoiceTile key={tile.id} tile={tile} />
                  ))}
                </div>
              )
            )}
          </div>

          {remoteAudioPlaybackBlocked && (
            <div className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <button
                type="button"
                onClick={resumeRemoteAudio}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-zinc-950 shadow transition hover:bg-amber-400 active:scale-95"
              >
                <Volume2 className="h-4 w-4" />
                <span>Bat am thanh</span>
              </button>
            </div>
          )}

          <div className="z-30 flex w-full flex-wrap items-center justify-center gap-3 border-t border-slate-200 px-4 py-4">
            <button
              type="button"
              onClick={toggleMic}
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors cursor-pointer border border-slate-200/50 ${
                isMicMuted ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={isMicMuted ? 'Bat micro' : 'Tat micro'}
            >
              {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={toggleSpeaker}
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors cursor-pointer border border-slate-200/50 ${
                isSpeakerOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900' : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
              title={isSpeakerOn ? 'Tat loa' : 'Bat loa'}
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {callType === 'voice' ? (
              <button
                type="button"
                onClick={startVideo}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-100 text-slate-700 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                title="Chuyen sang video"
              >
                <Video className="h-5 w-5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors cursor-pointer border border-slate-200/50 ${
                    isCameraMuted ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  title={isCameraMuted ? 'Bat camera' : 'Tat camera'}
                >
                  {isCameraMuted ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={switchCamera}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-100 text-slate-700 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                  title="Doi camera truoc/sau"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors cursor-pointer border border-slate-200/50 ${
                    isScreenSharing ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  title={isScreenSharing ? 'Dung chia se man hinh' : 'Chia se man hinh'}
                >
                  <Monitor className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-50 text-slate-400 shadow-sm cursor-not-allowed"
                  title="Filter khuon mat dang duoc phat trien"
                >
                  <Sparkles className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-50 text-slate-400 shadow-sm cursor-not-allowed"
                  title="Doi hinh nen dang duoc phat trien"
                >
                  <Palette className="h-5 w-5" />
                </button>
              </>
            )}

            <EndCallButton onClick={hangupCall} large />
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
