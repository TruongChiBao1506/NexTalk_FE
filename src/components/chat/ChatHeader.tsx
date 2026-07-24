import React from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Sparkles,
  Loader2,
  Search,
  UserPlus,
  Pin,
  Info,
  Users,
  CheckCircle2,
  Bell,
  MessageSquare,
  Cloud
} from 'lucide-react';
import { useRelativeTime } from '../../hooks/useRelativeTime';

interface ChatHeaderProps {
  selectConversation: (conversation: any) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  isGroupConversation: boolean;
  activeGroup: any;
  activeFriend: any;
  activeConversation: any;
  activeCallTarget: any;
  initiateCall: (conversationId: string, type: 'voice' | 'video', target: any) => void;
  handleSummarizeConversation: () => void;
  isSummarizingConversation: boolean;
  isSearchPanelOpen: boolean;
  setIsSearchPanelOpen: (open: boolean) => void;
  isPinnedPanelOpen: boolean;
  setIsPinnedPanelOpen: (open: boolean) => void;
  isConversationInfoOpen: boolean;
  setIsConversationInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchPinnedMessages: (conversationId: string) => Promise<any>;
  canInviteToActiveGroup: boolean;
  setIsInviteMembersOpen: (open: boolean) => void;
  activeChannel?: any;
  isGroupModerator?: boolean;
  isTogglingTasks?: boolean;
  handleToggleTaskEnabled?: () => void;
  channelView?: 'chat' | 'tasks' | 'notifications';
  setChannelView?: (view: 'chat' | 'tasks' | 'notifications') => void;
  taskUnreadCount?: number;
  setTaskUnreadCount?: (count: number) => void;
}

import { GroupAvatar } from './GroupAvatar';

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectConversation,
  setIsProfileModalOpen,
  isGroupConversation,
  activeGroup,
  activeFriend,
  activeConversation,
  activeCallTarget,
  initiateCall,
  handleSummarizeConversation,
  isSummarizingConversation,
  isSearchPanelOpen,
  setIsSearchPanelOpen,
  isPinnedPanelOpen,
  setIsPinnedPanelOpen,
  isConversationInfoOpen,
  setIsConversationInfoOpen,
  channelView,
  setChannelView,
  taskUnreadCount,
  setTaskUnreadCount,
  fetchPinnedMessages,
  canInviteToActiveGroup,
  setIsInviteMembersOpen,
  activeChannel,
  isGroupModerator,
}) => {
  const lastSeenText = useRelativeTime(activeFriend?.lastSeen);
  const isChungChannel = !activeChannel || activeChannel.name?.toLowerCase() === 'chung' || activeChannel.name?.toLowerCase() === 'general';
  const shouldShowCallButtons = activeConversation && activeConversation.type !== 'CLOUD' && activeCallTarget && activeFriend?.email !== 'moderator@nextalk.local' && (
    !isGroupConversation || (isGroupModerator && isChungChannel)
  );

  return (
    <header className="min-h-14 border-b flex flex-col md:flex-row md:items-center gap-2 px-3 py-2 md:px-4 md:py-0 md:justify-between shrink-0">
      <div className="flex w-full min-w-0 items-center gap-2 text-left md:w-auto md:gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={() => selectConversation(null)}
          className="md:hidden p-2 rounded-xl bg-indigo-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition active:scale-95 shrink-0"
          title="Back to conversations list"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl pr-2 text-left transition hover:bg-indigo-50/80 dark:hover:bg-zinc-800/60 md:flex-none"
          title={isGroupConversation ? 'Xem thông tin nhóm' : 'Xem hồ sơ'}
        >
          {isGroupConversation ? (
            <GroupAvatar conversation={activeGroup} size={36} className="!rounded-xl border border-gray-200 dark:border-zinc-800" />
          ) : activeConversation?.type === 'CLOUD' ? (
            <div className="w-9 h-9 rounded-full bg-discord-blurple text-white font-semibold flex items-center justify-center text-xs shrink-0 shadow-sm">
              <Cloud className="w-5 h-5" fill="currentColor" />
            </div>
          ) : activeFriend?.avatarUrl ? (
            <img src={activeFriend.avatarUrl} alt={activeFriend.username} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600 dark:bg-discord-blurple text-white font-semibold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {(activeFriend?.username ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white m-0 leading-tight truncate">
              {activeConversation?.type === 'CLOUD'
                ? 'Cloud của tôi'
                : isGroupConversation
                  ? activeChannel
                    ? `${activeGroup?.name ?? 'Nhóm'} › #${activeChannel.name}`
                    : (activeGroup?.name || activeFriend?.username || activeConversation?.name || 'Nhóm')
                  : (activeFriend?.username ?? '')}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-discord-muted mt-0.5 flex items-center gap-1">
              {activeConversation?.type === 'CLOUD' ? (
                <span>Không gian lưu trữ cá nhân</span>
              ) : isGroupConversation ? (
                <>
                  <Users className="w-3 h-3" />
                  <span>{activeGroup?.memberCount ?? '?'} thành viên</span>
                </>
              ) : activeFriend && activeFriend.status?.toUpperCase() !== 'HIDDEN' ? (() => {
                const friendStatus = activeFriend.status?.toUpperCase() || 'OFFLINE';
                const isOnline = friendStatus === 'ONLINE';
                const isAway = friendStatus === 'AWAY';
                const isOffline = !isOnline && !isAway;
                return (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAway ? 'bg-amber-500' : isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-zinc-500'}`} />
                    <span className="truncate">
                      {isOnline ? 'Online' : isAway ? 'Away' : 'Offline'}
                      {isOffline && lastSeenText && (
                        <span className="text-[10px] text-gray-400 dark:text-discord-muted ml-1 normal-case font-normal">
                          · {lastSeenText}
                        </span>
                      )}
                    </span>
                  </>
                );
              })() : null}
            </p>
          </div>
        </button>
      </div>

      <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 text-gray-500 [-ms-overflow-style:none] [scrollbar-width:none] md:w-auto md:gap-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">


        {isGroupConversation && activeGroup && (activeChannel?.isTaskEnabled ?? false) && activeChannel && activeChannel.type !== 'VOICE' && setChannelView && (
          <>
            <button
              onClick={() => {
                setChannelView(channelView === 'tasks' ? 'chat' : 'tasks');
                setIsSearchPanelOpen(false);
                setIsPinnedPanelOpen(false);
                setIsConversationInfoOpen(false);
              }}
              title="Tasks"
              className={`nextalk-icon-button relative shrink-0 p-2 rounded-xl transition cursor-pointer ${
                channelView === 'tasks' ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/20' : ''
              }`}
            >
              {channelView === 'tasks' ? <MessageSquare className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </button>
            <button
              onClick={() => {
                setChannelView(channelView === 'notifications' ? 'chat' : 'notifications');
                if (setTaskUnreadCount) setTaskUnreadCount(0);
                setIsSearchPanelOpen(false);
                setIsPinnedPanelOpen(false);
                setIsConversationInfoOpen(false);
              }}
              title="Thông báo"
              className={`nextalk-icon-button relative shrink-0 p-2 rounded-xl transition cursor-pointer ${
                channelView === 'notifications' ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/20' : ''
              }`}
            >
              {channelView === 'notifications' ? <MessageSquare className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              {taskUnreadCount !== undefined && taskUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-discord-mid">
                  {taskUnreadCount > 99 ? '99+' : taskUnreadCount}
                </span>
              )}
            </button>
          </>
        )}

        {/* Voice Call Button (Gọi khẩn cấp, chỉ cho Trưởng/Phó nhóm) */}
        {shouldShowCallButtons && (
          <button
            onClick={() => initiateCall(activeConversation.id, 'voice', activeCallTarget)}
            title={isGroupConversation ? 'Cuộc gọi thoại khẩn cấp (Toàn nhóm)' : 'Cuộc gọi thoại'}
            className="nextalk-icon-button shrink-0 p-2 rounded-xl transition cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* Video Call Button */}
        {shouldShowCallButtons && (
          <button
            onClick={() => initiateCall(activeConversation.id, 'video', activeCallTarget)}
            title={isGroupConversation ? 'Cuộc gọi video nhóm (Khẩn cấp)' : 'Cuộc gọi video'}
            className="nextalk-icon-button shrink-0 p-2 rounded-xl transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
        )}

        {activeConversation && (
          <button
            onClick={handleSummarizeConversation}
            disabled={isSummarizingConversation}
            title="Tóm tắt cuộc trò chuyện"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {isSummarizingConversation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden lg:inline">Tóm tắt</span>
          </button>
        )}

        {/* Search Message Button */}
        {activeConversation && (
          <button
            onClick={() => {
              setIsSearchPanelOpen(!isSearchPanelOpen);
              setIsPinnedPanelOpen(false);
              setIsConversationInfoOpen(false);
            }}
            title="Tìm kiếm tin nhắn"
            className={`nextalk-icon-button shrink-0 p-2 rounded-xl transition cursor-pointer ${isSearchPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800' : ''
              }`}
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {isGroupConversation && activeGroup && canInviteToActiveGroup && (
          <button
            onClick={() => setIsInviteMembersOpen(true)}
            title="Mời bạn vào nhóm"
            className="nextalk-icon-button shrink-0 p-2 rounded-xl transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}



        {/* Pinned Messages Button */}
        {activeConversation && (
          <button
            onClick={() => {
              if (!isPinnedPanelOpen && activeConversation) {
                fetchPinnedMessages(activeConversation.id).catch((err) => {
                  console.error('Failed to fetch pinned messages when opening panel:', err);
                });
              }
              setIsPinnedPanelOpen(!isPinnedPanelOpen);
              setIsSearchPanelOpen(false);
              setIsConversationInfoOpen(false);
            }}
            title="Tin nhắn đã ghim"
            className={`nextalk-icon-button shrink-0 p-2 rounded-xl transition cursor-pointer ${isPinnedPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800' : ''
              }`}
          >
            <Pin className="w-4 h-4" />
          </button>
        )}

        {activeConversation && (
          <button
            onClick={() => {
              setIsConversationInfoOpen((open) => !open);
              setIsSearchPanelOpen(false);
              setIsPinnedPanelOpen(false);
            }}
            title="Thông tin hội thoại"
            className={`nextalk-icon-button shrink-0 p-2 rounded-xl transition cursor-pointer ${isConversationInfoOpen ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800' : ''
              }`}
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
