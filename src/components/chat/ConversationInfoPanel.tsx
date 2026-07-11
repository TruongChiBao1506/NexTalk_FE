import React, { useState } from 'react';
import {
  X,
  Pin,
  BellOff,
  UserPlus,
  Settings,
  Image,
  Video,
  FileText,
  Download,
  Link,
  ExternalLink,
  Shield,
  Unlock,
  Lock,
  PinOff,
  Trash2,
  Loader2,
  LogOut,
  Users,
  Palette
} from 'lucide-react';
import type { ConversationResponse } from '../../types/chat';

interface ConversationInfoPanelProps {
  isConversationInfoOpen: boolean;
  setIsConversationInfoOpen: (open: boolean) => void;
  isGroupConversation: boolean;
  activeGroup: any;
  activeFriend: any;
  activeConversation: ConversationResponse;
  setIsProfileModalOpen: (open: boolean) => void;
  getConversationInfoSubtitle: () => string;
  isPinnedPanelOpen: boolean;
  setIsPinnedPanelOpen: (open: boolean) => void;
  fetchPinnedMessages: (conversationId: string) => Promise<any>;
  canInviteToActiveGroup: boolean;
  setIsInviteMembersOpen: (open: boolean) => void;
  setIsGroupApprovalsModalOpen: (open: boolean) => void;
  isLoadingConversationArchive: boolean;
  activeConversationMedia: any[];
  handleJumpToMessage: (messageId: string) => void;
  getFileName: (url: string) => string;
  activeConversationFiles: any[];
  activeConversationLinks: any[];
  handleUpdateSelfDestruct: (seconds: number) => void;
  isUpdatingSelfDestruct: boolean;
  getSelfDestructLabel: (seconds?: number) => string;
  selfDestructOptions: { value: number; label: string }[];
  conversationActionId: string | null;
  setConversationActionId: (id: string | null) => void;
  toggleHideConversation: (conversationId: string, hidden: boolean) => Promise<boolean>;
  fetchConversations: () => Promise<void>;
  handleHideClick: (conversationId: string) => void;
  handleToggleConversationPin: (conversationId: string, pinned: boolean) => void;
  handleDeleteConversation: (conversationId: string) => void;
  handleLeaveActiveGroup: () => void;
  profileActionLoading: boolean;
  currentUserIsGroupOwner: boolean;
  handleToggleBlockUser: () => void;
  blockActionLoading: boolean;
  activePrivateChatBlockedByMe: boolean;
  isRefreshingInviteCode: boolean;
  handleRefreshInviteCode: () => void;
  setIsThemeModalOpen: (open: boolean) => void;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  isConversationInfoOpen,
  setIsConversationInfoOpen,
  isGroupConversation,
  activeGroup,
  activeFriend,
  activeConversation,
  setIsProfileModalOpen,
  getConversationInfoSubtitle,
  isPinnedPanelOpen,
  setIsPinnedPanelOpen,
  fetchPinnedMessages,
  canInviteToActiveGroup,
  setIsInviteMembersOpen,
  setIsGroupApprovalsModalOpen,
  isLoadingConversationArchive,
  activeConversationMedia,
  handleJumpToMessage,
  getFileName,
  activeConversationFiles,
  activeConversationLinks,
  handleUpdateSelfDestruct,
  isUpdatingSelfDestruct,
  getSelfDestructLabel,
  selfDestructOptions,
  conversationActionId,
  setConversationActionId,
  toggleHideConversation,
  fetchConversations,
  handleHideClick,
  handleToggleConversationPin,
  handleDeleteConversation,
  handleLeaveActiveGroup,
  profileActionLoading,
  currentUserIsGroupOwner,
  handleToggleBlockUser,
  blockActionLoading,
  activePrivateChatBlockedByMe,
  isRefreshingInviteCode,
  handleRefreshInviteCode,
  setIsThemeModalOpen,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInviteLink = () => {
    if (!activeGroup?.inviteCode) return;
    const link = `${window.location.origin}/g/${activeGroup.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <aside
      className={`absolute bottom-0 right-0 top-14 z-30 w-full border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-zinc-800 dark:bg-discord-mid md:w-[360px] xl:w-[25vw] ${
        isConversationInfoOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
      aria-hidden={!isConversationInfoOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="m-0 text-sm font-bold text-gray-950 dark:text-white">Thông tin hội thoại</h3>
          <button
            type="button"
            onClick={() => setIsConversationInfoOpen(false)}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <section className="flex flex-col items-center text-center">
            {isGroupConversation ? (
              activeGroup?.avatarUrl ? (
                <img
                  src={activeGroup.avatarUrl}
                  alt={activeGroup.name}
                  className="h-20 w-20 rounded-2xl object-cover shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-sm">
                  {(activeGroup?.name || activeFriend?.username || activeConversation?.name || 'G').charAt(0).toUpperCase()}
                </div>
              )
            ) : activeFriend?.avatarUrl ? (
              <img
                src={activeFriend.avatarUrl}
                alt={activeFriend.username}
                className="h-20 w-20 rounded-full object-cover shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shadow-sm">
                {(activeFriend?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="mt-3 max-w-full rounded-lg px-2 py-1 text-lg font-bold text-gray-950 transition hover:bg-gray-100 dark:text-white dark:hover:bg-zinc-800"
              title={isGroupConversation ? 'Xem hồ sơ nhóm' : 'Xem hồ sơ'}
            >
              <span className="block truncate">
                {isGroupConversation ? (activeGroup?.name || activeConversation.name || activeFriend?.username) : activeFriend?.username}
              </span>
            </button>
            <p className="m-0 text-xs font-medium text-gray-500 dark:text-zinc-400">{getConversationInfoSubtitle()}</p>
          </section>

          <section className="mt-6">
            <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Lối tắt nhanh</h4>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isPinnedPanelOpen && activeConversation) {
                    fetchPinnedMessages(activeConversation.id).catch((err) => console.error('Failed to fetch pinned messages:', err));
                  }
                  setIsPinnedPanelOpen(true);
                  setIsConversationInfoOpen(false);
                }}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Pin className="h-4 w-4" />
                <span>Ghim</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <BellOff className="h-4 w-4" />
                <span>Tắt báo</span>
              </button>
              {isGroupConversation && activeGroup?.requiresApproval && currentUserIsGroupOwner && (
                <button
                  type="button"
                  onClick={() => setIsGroupApprovalsModalOpen(true)}
                  className="relative flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                >
                  <Users className="h-4 w-4" />
                  <span>Chờ duyệt</span>
                  {activeGroup.pendingApprovalCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-discord-mid">
                      {activeGroup.pendingApprovalCount}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                disabled={!isGroupConversation || !canInviteToActiveGroup}
                onClick={() => setIsInviteMembersOpen(true)}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <UserPlus className="h-4 w-4" />
                <span>Thêm</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Settings className="h-4 w-4" />
                <span>Cài đặt</span>
              </button>
            </div>
          </section>

          {isGroupConversation && activeGroup && (
            <section className="mt-6">
              <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Liên kết tham gia nhóm</h4>
              {activeGroup.inviteCode ? (
                <div className="flex flex-col gap-2">
                  <div className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-zinc-900/50 dark:text-zinc-300 dark:ring-zinc-800">
                    <span className="truncate">{`${window.location.origin}/g/${activeGroup.inviteCode}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="flex-1 rounded-lg bg-indigo-50 py-2 text-center text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                    >
                      {copiedLink ? 'Đã copy' : 'Copy liên kết'}
                    </button>
                    {currentUserIsGroupOwner && (
                      <button
                        type="button"
                        onClick={handleRefreshInviteCode}
                        disabled={isRefreshingInviteCode}
                        title="Làm mới liên kết"
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-center text-xs font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      >
                        {isRefreshingInviteCode ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Làm mới'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg bg-gray-50 px-3 py-4 text-center ring-1 ring-inset ring-gray-200 dark:bg-zinc-900/50 dark:ring-zinc-800">
                  <p className="m-0 text-xs italic text-gray-500 dark:text-zinc-400">Nhóm chưa có liên kết. Vui lòng tạo liên kết mới.</p>
                  {currentUserIsGroupOwner && (
                    <button
                      type="button"
                      onClick={handleRefreshInviteCode}
                      disabled={isRefreshingInviteCode}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-discord-blurple dark:hover:bg-indigo-500"
                    >
                      {isRefreshingInviteCode ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tạo liên kết'}
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="m-0 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Kho lưu trữ</h4>
              {isLoadingConversationArchive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang tải
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                    <Image className="h-4 w-4 text-indigo-600" />
                    Ảnh & video
                  </span>
                  <span className="text-xs text-gray-400">{activeConversationMedia.length}</span>
                </div>
                {activeConversationMedia.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {activeConversationMedia.map((item, index) => (
                      <button
                        type="button"
                        key={`${item.url}-${index}`}
                        onClick={() => handleJumpToMessage(item.message.id)}
                        className="aspect-square overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 transition hover:ring-indigo-500 dark:bg-zinc-900 dark:ring-zinc-800"
                        title={item.name || getFileName(item.url)}
                      >
                        {item.type === 'IMAGE' ? (
                          <img src={item.url} alt={item.name || 'Shared image'} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Video className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có ảnh hoặc video.</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    File tài liệu
                  </span>
                  <span className="text-xs text-gray-400">{activeConversationFiles.length}</span>
                </div>
                <div className="space-y-2">
                  {activeConversationFiles.length > 0 ? activeConversationFiles.map((item, index) => (
                    <button
                      type="button"
                      key={`${item.url}-${index}`}
                      onClick={() => handleJumpToMessage(item.message.id)}
                      className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-left transition hover:bg-indigo-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">
                        {item.name || getFileName(item.url)}
                      </span>
                      <Download className="h-4 w-4 shrink-0 text-gray-400" />
                    </button>
                  )) : (
                    <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có file tài liệu.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                    <Link className="h-4 w-4 text-indigo-600" />
                    Link đã chia sẻ
                  </span>
                  <span className="text-xs text-gray-400">{activeConversationLinks.length}</span>
                </div>
                <div className="space-y-2">
                  {activeConversationLinks.length > 0 ? activeConversationLinks.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-900/50"
                    >
                      <button
                        type="button"
                        onClick={() => handleJumpToMessage(item.message.id)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-gray-800 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                        title={item.url}
                      >
                        {item.url}
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800"
                        title="Mở link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )) : (
                    <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có link đã chia sẻ.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Bảo mật & cài đặt</h4>
            <div className="space-y-2">
              <div className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 text-left text-sm font-semibold text-gray-700 dark:bg-zinc-900/50 dark:text-zinc-200">
                <Shield className="h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <span className="block">Tin nhắn tự xóa</span>
                  <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-zinc-400">
                    Áp dụng cho tin nhắn mới
                  </span>
                </div>
                <select
                  value={activeConversation.selfDestructSeconds ?? 0}
                  onChange={(event) => handleUpdateSelfDestruct(Number(event.target.value))}
                  disabled={isUpdatingSelfDestruct}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none transition focus:border-indigo-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  title={`Đang đặt: ${getSelfDestructLabel(activeConversation.selfDestructSeconds)}`}
                >
                  {selfDestructOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg bg-indigo-50 px-3 py-3 text-left text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
              >
                <Palette className="h-4 w-4 text-indigo-500" />
                <span className="min-w-0 flex-1">Đổi chủ đề / Hình nền</span>
              </button>

              {activeConversation.hidden ? (
                <button
                  type="button"
                  onClick={async () => {
                    setConversationActionId(`unhide-${activeConversation.id}`);
                    try {
                      const ok = await toggleHideConversation(activeConversation.id, false);
                      if (ok) {
                        await fetchConversations();
                      }
                    } finally {
                      setConversationActionId(null);
                    }
                  }}
                  disabled={conversationActionId === `unhide-${activeConversation.id}`}
                  className="flex w-full items-center gap-3 rounded-lg bg-emerald-50 px-3 py-3 text-left text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                >
                  {conversationActionId === `unhide-${activeConversation.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  ) : (
                    <Unlock className="h-4 w-4 text-emerald-550" />
                  )}
                  <span className="min-w-0 flex-1">Bỏ ẩn trò chuyện</span>
                  <span className="text-xs text-emerald-500 font-bold">Đang ẩn</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleHideClick(activeConversation.id)}
                  disabled={conversationActionId === `hide-${activeConversation.id}`}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {conversationActionId === `hide-${activeConversation.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="min-w-0 flex-1">Ẩn trò chuyện bằng PIN</span>
                  <span className="text-xs text-gray-400">Tắt</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleToggleConversationPin(activeConversation.id, activeConversation.pinned ?? false)}
                disabled={conversationActionId === `pin-${activeConversation.id}`}
                className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {conversationActionId === `pin-${activeConversation.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                ) : activeConversation.pinned ? (
                  <PinOff className="h-4 w-4 text-indigo-500" />
                ) : (
                  <Pin className="h-4 w-4 text-gray-500" />
                )}
                <span className="min-w-0 flex-1">
                  {activeConversation.pinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}
                </span>
                <span className="text-xs text-gray-400">
                  {activeConversation.pinned ? 'Đang ghim' : 'Tắt'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConversation(activeConversation.id)}
                disabled={conversationActionId === `delete-${activeConversation.id}`}
                className="flex w-full items-center gap-3 rounded-lg bg-rose-50 px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
              >
                {conversationActionId === `delete-${activeConversation.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="min-w-0 flex-1">Xóa hội thoại</span>
                <span className="text-xs font-semibold text-rose-400">Ẩn khỏi danh sách</span>
              </button>
              {isGroupConversation ? (
                <button
                  type="button"
                  onClick={handleLeaveActiveGroup}
                  disabled={profileActionLoading || currentUserIsGroupOwner}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                  title={currentUserIsGroupOwner ? 'Chủ nhóm cần chuyển quyền trước khi rời nhóm' : 'Thoát nhóm'}
                >
                  {profileActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  <span>{currentUserIsGroupOwner ? 'Chủ nhóm không thể rời' : 'Thoát nhóm'}</span>
                </button>
              ) : (
                activeFriend?.email !== 'moderator@nextalk.local' && (
                  <button
                    type="button"
                    onClick={handleToggleBlockUser}
                    disabled={blockActionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                  >
                    {blockActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    <span>{activePrivateChatBlockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</span>
                  </button>
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
};
