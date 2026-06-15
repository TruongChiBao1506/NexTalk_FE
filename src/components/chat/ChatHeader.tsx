import React from 'react';
import {
  ArrowLeft,
  Phone,
  Headphones,
  Video,
  Sparkles,
  Loader2,
  Search,
  UserPlus,
  Pin,
  Info,
  Users
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/time';
import { useCallStore } from '../../store/callStore';

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
}

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
  fetchPinnedMessages,
  canInviteToActiveGroup,
  setIsInviteMembersOpen,
  activeChannel,
  isGroupModerator,
}) => {
  const isChungChannel = !activeChannel || activeChannel.name?.toLowerCase() === 'chung' || activeChannel.name?.toLowerCase() === 'general';
  const shouldShowCallButtons = activeConversation && activeCallTarget && (
    !isGroupConversation || (isGroupModerator && isChungChannel)
  );

  return (
    <header className="min-h-14 bg-gray-150 dark:bg-discord-dark border-b border-gray-300 dark:border-zinc-900/50 flex flex-col md:flex-row md:items-center gap-2 px-3 py-2 md:px-4 md:py-0 md:justify-between shrink-0">
      <div className="flex w-full min-w-0 items-center gap-2 text-left md:w-auto md:gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={() => selectConversation(null)}
          className="md:hidden p-2 rounded-xl bg-gray-200/65 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition active:scale-95 shrink-0"
          title="Back to conversations list"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl pr-2 text-left transition hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 md:flex-none"
          title={isGroupConversation ? 'Xem thông tin nhóm' : 'Xem hồ sơ'}
        >
          {isGroupConversation ? (
            activeGroup?.avatarUrl ? (
              <img src={activeGroup.avatarUrl} alt={activeGroup.name} className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-zinc-800 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600/80 dark:bg-discord-blurple/80 text-white font-bold flex items-center justify-center text-sm shrink-0">
                {(activeGroup?.name || activeFriend?.username || '?').charAt(0).toUpperCase()}
              </div>
            )
          ) : activeFriend?.avatarUrl ? (
            <img src={activeFriend.avatarUrl} alt={activeFriend.username} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-semibold flex items-center justify-center text-xs shrink-0">
              {(activeFriend?.username ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white m-0 leading-tight truncate">
              {isGroupConversation
                ? activeChannel
                  ? `${activeGroup?.name ?? 'Nhóm'} › #${activeChannel.name}`
                  : (activeGroup?.name || activeFriend?.username || activeConversation?.name || 'Nhóm')
                : (activeFriend?.username ?? '')}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-discord-muted mt-0.5 flex items-center gap-1">
              {isGroupConversation ? (
                <>
                  <Users className="w-3 h-3" />
                  <span>{activeGroup?.memberCount ?? '?'} members</span>
                </>
              ) : activeFriend ? (
                <>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeFriend.status === 'AWAY' ? 'bg-amber-500' : activeFriend.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-550'}`} />
                  <span className="capitalize truncate">
                    {activeFriend.status.toLowerCase()}
                    {activeFriend.status === 'OFFLINE' && activeFriend.lastSeen && (
                      <span className="text-[10px] text-gray-400 dark:text-discord-muted ml-1 normal-case font-normal">
                        — Last seen {formatRelativeTime(activeFriend.lastSeen)}
                      </span>
                    )}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </button>
      </div>

      <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 text-gray-500 [-ms-overflow-style:none] [scrollbar-width:none] md:w-auto md:gap-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">


        {/* Voice Call Button (Gọi khẩn cấp, chỉ cho Trưởng/Phó nhóm) */}
        {shouldShowCallButtons && (
          <button
            onClick={() => initiateCall(activeConversation.id, 'voice', activeCallTarget)}
            title={isGroupConversation ? 'Cuộc gọi thoại khẩn cấp (Toàn nhóm)' : 'Cuộc gọi thoại'}
            className="shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* Video Call Button */}
        {shouldShowCallButtons && (
          <button
            onClick={() => initiateCall(activeConversation.id, 'video', activeCallTarget)}
            title={isGroupConversation ? 'Cuộc gọi video nhóm (Khẩn cấp)' : 'Cuộc gọi video'}
            className="shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
        )}

        {activeConversation && (
          <button
            onClick={handleSummarizeConversation}
            disabled={isSummarizingConversation}
            title="Tóm tắt cuộc trò chuyện"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
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
            className={`shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
              isSearchPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {isGroupConversation && activeGroup && canInviteToActiveGroup && (
          <button
            onClick={() => setIsInviteMembersOpen(true)}
            title="Mời bạn vào nhóm"
            className="shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
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
            className={`shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
              isPinnedPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
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
            className={`shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-550 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
              isConversationInfoOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
