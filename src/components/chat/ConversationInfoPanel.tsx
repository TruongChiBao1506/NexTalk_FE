import React, { useEffect, useState } from 'react';
import {
  X,
  Search,
  Pin,
  Bell,
  BellOff,
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
  Palette,
  Pencil
} from 'lucide-react';
import type { ConversationResponse } from '../../types/chat';
import type { ChannelResponse } from '../../types/group';
import { GroupQrModal } from './GroupQrModal';
import { GroupAvatar } from './GroupAvatar';
import { groupService } from '../../services/groupService';
import { useGroupStore } from '../../store/groupStore';
import { downloadFile } from '../../utils/fileUtils';

interface ConversationInfoPanelProps {
  isConversationInfoOpen: boolean;
  setIsConversationInfoOpen: (open: boolean) => void;
  isGroupConversation: boolean;
  activeGroup: any;
  activeFriend: any;
  activeConversation: ConversationResponse;
  activeChannel?: ChannelResponse | null;
  isGroupModerator?: boolean;
  isTogglingTasks?: boolean;
  handleToggleTaskEnabled?: () => void;
  setIsProfileModalOpen: (open: boolean) => void;
  onOpenSearch: () => void;
  onToggleMuted: () => Promise<void>;
  getConversationInfoSubtitle: () => string;
  isPinnedPanelOpen: boolean;
  setIsPinnedPanelOpen: (open: boolean) => void;
  fetchPinnedMessages: (conversationId: string) => Promise<any>;
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
  onOpenMedia: (media: { url: string; type: 'IMAGE' | 'VIDEO'; name?: string }) => void;
  currentUserId: string;
  onUpdateNickname: (userId: string, nickname: string) => Promise<void>;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  isConversationInfoOpen,
  setIsConversationInfoOpen,
  isGroupConversation,
  activeGroup,
  activeFriend,
  activeConversation,
  activeChannel,
  isGroupModerator,
  isTogglingTasks,
  handleToggleTaskEnabled,
  setIsProfileModalOpen,
  onOpenSearch,
  onToggleMuted,
  getConversationInfoSubtitle,
  isPinnedPanelOpen,
  setIsPinnedPanelOpen,
  fetchPinnedMessages,
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
  onOpenMedia,
  currentUserId,
  onUpdateNickname,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showGroupQrModal, setShowGroupQrModal] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);
  const [showNicknameManager, setShowNicknameManager] = useState(false);
  const [editingNicknameUserId, setEditingNicknameUserId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [savingNicknameUserId, setSavingNicknameUserId] = useState<string | null>(null);
  const [taskAttachments, setTaskAttachments] = useState<Array<{
    id: string;
    url: string;
    name: string;
    type: string;
    taskId: string;
    taskTitle: string;
  }>>([]);

  useEffect(() => {
    if (!isConversationInfoOpen || !activeGroup?.id || !activeChannel?.id || !activeChannel.isTaskEnabled) {
      setTaskAttachments([]);
      return;
    }

    let cancelled = false;
    const loadTaskAttachments = async () => {
      try {
        const response = await groupService.getChannelTasks(activeGroup.id, activeChannel.id);
        if (cancelled) return;
        setTaskAttachments((response.data ?? []).flatMap((task) =>
          (task.attachments ?? []).map((attachment) => ({
            ...attachment,
            taskId: task.id,
            taskTitle: task.title,
          }))
        ));
      } catch {
        if (!cancelled) setTaskAttachments([]);
      }
    };

    const handleTaskAttachmentsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ groupId?: string; channelId?: string }>).detail;
      if (detail?.groupId === activeGroup.id && detail?.channelId === activeChannel.id) {
        void loadTaskAttachments();
      }
    };

    void loadTaskAttachments();
    window.addEventListener('nextalk:task-attachments-updated', handleTaskAttachmentsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('nextalk:task-attachments-updated', handleTaskAttachmentsUpdated);
    };
  }, [activeChannel?.id, activeChannel?.isTaskEnabled, activeGroup?.id, isConversationInfoOpen]);

  const saveNickname = async (userId: string, nickname: string) => {
    setSavingNicknameUserId(userId);
    try {
      await onUpdateNickname(userId, nickname);
      setEditingNicknameUserId(null);
      setNicknameDraft('');
    } finally {
      setSavingNicknameUserId(null);
    }
  };

  const handleToggleNotifications = async () => {
    const nextMuted = !activeConversation.muted;
    try {
      await onToggleMuted();
      setNotificationFeedback(nextMuted ? 'Đã tắt thông báo' : 'Đã bật thông báo');
    } catch {
      setNotificationFeedback('Không thể cập nhật thông báo');
    } finally {
      window.setTimeout(() => setNotificationFeedback(null), 2200);
    }
  };

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
              <GroupAvatar conversation={activeGroup} size={80} className="!rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700" />
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
                {isGroupConversation ? (activeGroup?.name || activeConversation.name || activeFriend?.username) : (activeFriend?.id ? activeConversation.nicknames?.[activeFriend.id] : null) || activeFriend?.username}
              </span>
            </button>
            <p className="m-0 text-xs font-medium text-gray-500 dark:text-zinc-400">{getConversationInfoSubtitle()}</p>
          </section>

          <button type="button" onClick={() => setShowNicknameManager(true)} className="mt-6 flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <Pencil className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="min-w-0 flex-1 text-sm font-bold text-gray-800 dark:text-zinc-100">Biệt danh</span>
            <span className="text-xs text-gray-400">{activeConversation.members.length} thành viên ›</span>
          </button>

          <section className={`${showNicknameManager ? 'absolute inset-0 z-20 flex flex-col bg-white p-4 dark:bg-discord-mid' : 'hidden'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="m-0 text-base font-bold text-gray-950 dark:text-white">Chỉnh sửa biệt danh</h4>
              <button type="button" title="Đóng" onClick={() => { setShowNicknameManager(false); setEditingNicknameUserId(null); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 dark:border-zinc-700">
              {activeConversation.members.map((member) => {
                const nickname = activeConversation.nicknames?.[member.id] || '';
                const isEditing = editingNicknameUserId === member.id;
                const isSaving = savingNicknameUserId === member.id;
                return (
                  <div key={member.id} className="border-b border-gray-100 px-3 py-3 last:border-b-0 dark:border-zinc-800">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={nicknameDraft}
                          onChange={(event) => setNicknameDraft(event.target.value.slice(0, 40))}
                          onKeyDown={(event) => { if (event.key === 'Enter') void saveNickname(member.id, nicknameDraft); }}
                          placeholder={`Biệt danh cho ${member.username}`}
                          autoFocus
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <button type="button" disabled={isSaving} onClick={() => void saveNickname(member.id, nicknameDraft)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                          {isSaving ? 'Lưu...' : 'Lưu'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-zinc-200">
                          {nickname ? `${nickname} - ${member.username}` : member.username}{member.id === currentUserId ? ' (Bạn)' : ''}
                        </span>
                        <button type="button" title="Chỉnh sửa biệt danh" onClick={() => { setNicknameDraft(nickname); setEditingNicknameUserId(member.id); }} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-zinc-800">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {nickname && (
                          <button type="button" disabled={isSaving} title="Xóa biệt danh" onClick={() => { if (window.confirm(`Xóa biệt danh của ${member.id === currentUserId ? 'bạn' : member.username}?`)) void saveNickname(member.id, ''); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-zinc-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-zinc-400">Mọi thành viên đều có thể thay đổi biệt danh. Thay đổi sẽ được thông báo trong cuộc trò chuyện.</p>
          </section>

          {isGroupConversation && activeGroup && activeChannel && (isGroupModerator || activeGroup.members.find((m: any) => m.userId === currentUserId)?.role === 'OWNER') && (
            <section className="mt-6 px-4">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-3 text-left dark:bg-discord-black/35">
                <div>
                  <p className="m-0 text-sm font-semibold">Quản lý công việc kênh #{activeChannel.name}</p>
                  <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">Bật/tắt tính năng quản lý công việc cho kênh này.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const nextState = !(activeChannel.isTaskEnabled ?? false);
                      await groupService.updateChannel(activeGroup.id, activeChannel.id, { isTaskEnabled: nextState });
                      const updatedGroup = await groupService.getGroup(activeGroup.id);
                      if (updatedGroup.success && updatedGroup.data) {
                        useGroupStore.getState().upsertGroup(updatedGroup.data);
                      }
                    } catch (e) {
                      console.error('Failed to update channel task setting:', e);
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                    (activeChannel.isTaskEnabled ?? false) ? 'bg-indigo-600 dark:bg-discord-blurple' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={activeChannel.isTaskEnabled ?? false}
                >
                  <span className="sr-only">Toggle channel tasks</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      (activeChannel.isTaskEnabled ?? false) ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </section>
          )}

          <section className="mt-6">
            <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Lối tắt nhanh</h4>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Search className="h-4 w-4" />
                <span>Tìm kiếm</span>
              </button>
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
                <span>Tin đã ghim</span>
              </button>
              <button
                type="button"
                onClick={handleToggleNotifications}
                disabled={conversationActionId === activeConversation.id}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {activeConversation.muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span>{activeConversation.muted ? 'Bật thông báo' : 'Tắt thông báo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Palette className="h-4 w-4" />
                <span>Chủ đề</span>
              </button>
            </div>
            {notificationFeedback && (
              <p role="status" className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-center text-xs font-semibold text-white dark:bg-white dark:text-gray-900">
                {notificationFeedback}
              </p>
            )}
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
                    <button
                      type="button"
                      onClick={() => setShowGroupQrModal(true)}
                      className="flex-1 rounded-lg bg-indigo-100 py-2 text-center text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30"
                    >
                      Mã QR
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
                    {(showAllMedia ? activeConversationMedia : activeConversationMedia.slice(0, 8)).map((item, index) => (
                      <button
                        type="button"
                        key={`${item.url}-${index}`}
                        onClick={() => onOpenMedia({ url: item.url, type: item.type, name: item.name || getFileName(item.url) })}
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
                {activeConversationMedia.length > 8 && (
                  <button type="button" onClick={() => setShowAllMedia((value) => !value)} className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    {showAllMedia ? 'Thu gọn' : `Xem tất cả ${activeConversationMedia.length}`}
                  </button>
                )}
              </div>

              {activeChannel?.isTaskEnabled && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                      <Pin className="h-4 w-4 text-indigo-600" />
                      Tệp công việc
                    </span>
                    <span className="text-xs text-gray-400">{taskAttachments.length}</span>
                  </div>
                  <div className="space-y-2">
                    {taskAttachments.length > 0 ? taskAttachments.map((item) => (
                      <div key={`${item.taskId}-${item.id}`} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-zinc-900/50">
                        {item.type === 'IMAGE' ? (
                          <button type="button" onClick={() => onOpenMedia({ url: item.url, type: 'IMAGE', name: item.name })} className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-200">
                            <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <FileText className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-semibold text-gray-800 hover:text-indigo-600 dark:text-zinc-100">{item.name}</span>
                          <span className="block truncate text-[11px] text-gray-400">Công việc: {item.taskTitle}</span>
                        </a>
                        <button type="button" onClick={() => void downloadFile(item.url, item.name)} className="rounded-md p-2 text-gray-400 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800" title="Tải tệp">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    )) : (
                      <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có tệp công việc.</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    File tài liệu
                  </span>
                  <span className="text-xs text-gray-400">{activeConversationFiles.length}</span>
                </div>
                <div className="space-y-2">
                  {activeConversationFiles.length > 0 ? (showAllFiles ? activeConversationFiles : activeConversationFiles.slice(0, 5)).map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="flex w-full items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-zinc-900/50"
                    >
                      <button type="button" onClick={() => handleJumpToMessage(item.message.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left transition hover:text-indigo-600">
                        <FileText className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">{item.name || getFileName(item.url)}</span>
                      </button>
                      <button type="button" onClick={() => void downloadFile(item.url, item.name || getFileName(item.url))} className="rounded-md p-2 text-gray-400 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800" title="Tải file" aria-label={`Tải ${item.name || getFileName(item.url)}`}>
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )) : (
                    <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có file tài liệu.</p>
                  )}
                  {activeConversationFiles.length > 5 && (
                    <button type="button" onClick={() => setShowAllFiles((value) => !value)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      {showAllFiles ? 'Thu gọn' : `Xem tất cả ${activeConversationFiles.length}`}
                    </button>
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
                  {activeConversationLinks.length > 0 ? (showAllLinks ? activeConversationLinks : activeConversationLinks.slice(0, 5)).map((item, index) => (
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
                  {activeConversationLinks.length > 5 && (
                    <button type="button" onClick={() => setShowAllLinks((value) => !value)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      {showAllLinks ? 'Thu gọn' : `Xem tất cả ${activeConversationLinks.length}`}
                    </button>
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
      {showGroupQrModal && activeGroup && (
        <GroupQrModal
          group={activeGroup}
          onClose={() => setShowGroupQrModal(false)}
        />
      )}
    </aside>
  );
};
