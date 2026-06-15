import { useMemo, useRef, useEffect, useState } from 'react';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { ILocalVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { MicOff, Monitor } from 'lucide-react';

interface VideoPlayerProps {
  track: ILocalVideoTrack | IRemoteVideoTrack | null;
  className?: string;
}

interface Tile {
  id: string;
  name: string;
  avatarUrl: string | null | undefined;
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

const VideoTile = ({ tile, className, onClick }: { tile: Tile; className?: string; onClick?: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-slate-50 flex-shrink-0 transition-all duration-300 ${
      tile.isSpeaking ? 'border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400' : 'border-slate-200 dark:border-zinc-800 dark:bg-zinc-900/50'
    } ${className || 'w-full max-w-[320px] aspect-video hover:ring-2 hover:ring-indigo-400/50 cursor-pointer'}`}
    >
      {tile.videoTrack ? (
        <VideoTrackPlayer track={tile.videoTrack} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <div className={tile.isSpeaking ? 'rounded-full ring-4 ring-emerald-400/80 ring-offset-4 ring-offset-slate-50 dark:ring-offset-zinc-900 animate-pulse' : ''}>
            {tile.avatarUrl ? (
              <img src={tile.avatarUrl} alt={tile.name} className="h-24 w-24 rounded-full object-cover shadow-md" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white shadow-md">
                {tile.name ? tile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur shadow-sm">
        {tile.isMuted && <MicOff className="h-3 w-3 text-rose-400" />}
        {tile.videoTrack && <Monitor className="h-3 w-3 text-indigo-400" />}
        <span className="truncate max-w-[120px]">{tile.isLocal ? 'Bạn' : tile.name}</span>
      </div>
    </div>
  );
};

// Simple Java string hash to match backend (used for avatar mapping if needed)
const javaStringHashUid = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return String(hash & 0x7fffffff);
};

export const VoiceChannelGrid = () => {
  const { user: currentUser } = useAuthStore();
  const {
    isMicMuted,
    isCameraMuted,
    isScreenSharing,
    remoteUsers,
    activeSpeakerUids,
    localAgoraUid,
    localVideoTrack,
    screenVideoTrack,
    conversationId
  } = useCallStore();
  
  const callConversation = useChatStore((state) => 
    state.activeConversation?.id === conversationId 
      ? state.activeConversation 
      : state.conversations.find((conversation) => conversation.id === conversationId) ?? null
  );

  const memberByAgoraUid = useMemo(() => {
    const members = callConversation?.members ?? [];
    return new Map(members.map((member: any) => [javaStringHashUid(member.id), member]));
  }, [callConversation]);

  const localTile: Tile = {
    id: 'local',
    name: currentUser?.username ?? 'Bạn',
    avatarUrl: currentUser?.avatarUrl,
    isLocal: true,
    isMuted: isMicMuted,
    isSpeaking: localAgoraUid !== null && activeSpeakerUids.includes(String(localAgoraUid)),
    videoTrack: isScreenSharing ? screenVideoTrack : (!isCameraMuted ? localVideoTrack : null)
  };

  const remoteTiles: Tile[] = useMemo(() => remoteUsers.map((user) => {
    const uid = String(user.uid);
    const member = memberByAgoraUid.get(uid);
    return {
      id: uid,
      name: member?.username ?? `Thành viên ${uid}`,
      avatarUrl: member?.avatarUrl,
      isMuted: !user.hasAudio,
      isSpeaking: activeSpeakerUids.includes(uid),
      videoTrack: user.videoTrack ?? null
    };
  }), [activeSpeakerUids, memberByAgoraUid, remoteUsers]);

  const [pinnedTileId, setPinnedTileId] = useState<string | null>(null);

  const allTiles = [localTile, ...remoteTiles];

  const autoFocusedTile = useMemo(() => {
    return remoteTiles.find(t => t.videoTrack) || (localTile.videoTrack ? localTile : null);
  }, [remoteTiles, localTile]);

  const activeFocusedTile = pinnedTileId 
    ? allTiles.find(t => t.id === pinnedTileId) || autoFocusedTile
    : autoFocusedTile;

  const handleTogglePin = (id: string) => {
    if (pinnedTileId === id) {
      setPinnedTileId(null);
    } else {
      setPinnedTileId(id);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#f3f4f6] dark:bg-[#2b2d31] p-6 flex flex-col overflow-hidden">
      {activeFocusedTile ? (
        <div className="flex flex-col h-full gap-4 min-h-0">
          {/* Stage Area */}
          <div className="flex-1 min-h-0 w-full rounded-2xl overflow-hidden shadow-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/5">
            <VideoTile 
              tile={activeFocusedTile} 
              className="w-full h-full object-contain"
              onClick={() => handleTogglePin(activeFocusedTile.id)}
            />
          </div>
          
          {/* Other Participants Strip */}
          <div className="h-32 sm:h-40 flex-shrink-0 w-full overflow-x-auto overflow-y-hidden pb-2 px-1 flex gap-3 snap-x">
            {allTiles.filter(t => t.id !== activeFocusedTile.id).map((tile) => (
              <VideoTile 
                key={tile.id} 
                tile={tile} 
                className={`h-full aspect-video snap-center hover:ring-2 hover:ring-indigo-400/50 cursor-pointer transition-all duration-300 ${
                  tile.isSpeaking ? 'ring-2 ring-emerald-400' : ''
                }`}
                onClick={() => handleTogglePin(tile.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-wrap content-center justify-center gap-4 h-full">
            {allTiles.map((tile) => (
              <VideoTile 
                key={tile.id} 
                tile={tile} 
                onClick={() => handleTogglePin(tile.id)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

