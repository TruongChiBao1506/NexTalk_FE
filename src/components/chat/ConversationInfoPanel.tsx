import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
  Pencil,
  UserMinus,
  Camera,
  Crown,
  UserCog,
  User,
  UserPlus,
  Users,
  ChevronDown,
  MailOpen
} from 'lucide-react';
import type { ConversationNotificationMode, ConversationResponse } from '../../types/chat';
import type { ChannelResponse, GroupMemberResponse, GroupRole } from '../../types/group';
import { GroupQrModal } from './GroupQrModal';
import { GroupAvatar } from './GroupAvatar';
import { groupService } from '../../services/groupService';
import { useGroupStore } from '../../store/groupStore';
import { useFriendStore } from '../../store/friendStore';
import { downloadFile } from '../../utils/fileUtils';
import { ConversationNotificationSettings } from './ConversationNotificationSettings';
import { GroupEventsSection } from './GroupEventsSection';

interface ConversationInfoPanelProps {
  isConversationInfoOpen: boolean;
  setIsConversationInfoOpen: (open: boolean) => void;
  isGroupConversation: boolean;
  activeGroup: any;
  activeFriend: any;
  activeConversation: ConversationResponse;
  activeChannel?: ChannelResponse | null;
  isTogglingTasks?: boolean;
  handleToggleTaskEnabled?: () => void;
  onOpenSearch: () => void;
  onUpdateNotificationSettings: (mode: ConversationNotificationMode, mutedUntil?: string | null) => Promise<void>;
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
  activeFriendIsFriend: boolean;
  handleProfileFriendAction: () => void;
  currentUserIsGroupOwner: boolean;
  isUpdatingGroupAvatar: boolean;
  onGroupAvatarSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  handleToggleBlockUser: () => void;
  blockActionLoading: boolean;
  activePrivateChatBlockedByMe: boolean;
  isRefreshingInviteCode: boolean;
  handleRefreshInviteCode: () => void;
  setIsThemeModalOpen: (open: boolean) => void;
  onOpenMedia: (media: { url: string; type: 'IMAGE' | 'VIDEO'; name?: string }) => void;
  currentUserId: string;
  onUpdateNickname: (userId: string, nickname: string) => Promise<void>;
  onMarkUnread: () => Promise<void>;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  isConversationInfoOpen,
  setIsConversationInfoOpen,
  isGroupConversation,
  activeGroup,
  activeFriend,
  activeConversation,
  activeChannel,
  onOpenSearch,
  onUpdateNotificationSettings,
  onMarkUnread,
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
  activeFriendIsFriend,
  handleProfileFriendAction,
  currentUserIsGroupOwner,
  isUpdatingGroupAvatar,
  onGroupAvatarSelected,
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
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showNicknameManager, setShowNicknameManager] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');
  const [groupMemberActionId, setGroupMemberActionId] = useState<string | null>(null);
  const [friendRequestActionId, setFriendRequestActionId] = useState<string | null>(null);
  const [groupManagementFeedback, setGroupManagementFeedback] = useState<string | null>(null);
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
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const updateMemberRole = useGroupStore((state) => state.updateMemberRole);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const relationStatuses = useFriendStore((state) => state.relationStatuses);
  const fetchRelationStatuses = useFriendStore((state) => state.fetchRelationStatuses);
  const sendFriendRequest = useFriendStore((state) => state.sendFriendRequest);
  const acceptFriendRequest = useFriendStore((state) => state.acceptRequest);

  const currentGroupMembership = activeGroup?.members?.find(
    (member: GroupMemberResponse) => member.userId === currentUserId,
  ) as GroupMemberResponse | undefined;
  const leaderRoles: GroupRole[] = ['OWNER', 'LEADER', 'ADMIN'];
  const isLeaderRole = (role?: GroupRole | null) => Boolean(role && leaderRoles.includes(role));
  const currentUserIsActualOwner =
    currentGroupMembership?.role === 'OWNER' || activeGroup?.ownerId === currentUserId;
  const canManageMemberRoles = isLeaderRole(currentGroupMembership?.role);
  const roleLabels: Record<GroupRole, string> = {
    OWNER: 'Trưởng nhóm',
    LEADER: 'Trưởng nhóm',
    ADMIN: 'Trưởng nhóm',
    DEPUTY: 'Phó nhóm',
    MEMBER: 'Thành viên',
  };

  const canSetGroupMemberRole = (member: GroupMemberResponse, role: GroupRole) => {
    if (!activeGroup || member.userId === currentUserId || member.role === role) return false;
    if (role === 'OWNER') return currentUserIsActualOwner && member.role !== 'OWNER';
    return canManageMemberRoles
      && !isLeaderRole(member.role)
      && (role === 'DEPUTY' || role === 'MEMBER');
  };

  const handleUpdateGroupMemberRole = async (member: GroupMemberResponse, role: GroupRole) => {
    if (!activeGroup || !canSetGroupMemberRole(member, role) || groupMemberActionId) return;

    const isOwnershipTransfer = role === 'OWNER';
    const confirmed = window.confirm(
      isOwnershipTransfer
        ? `Chuyển quyền Trưởng nhóm cho ${member.username}? Sau thao tác này bạn sẽ trở thành Thành viên.`
        : `Cập nhật ${member.username} thành ${roleLabels[role]}?`,
    );
    if (!confirmed) return;

    setGroupMemberActionId(`${member.userId}:${role}`);
    setGroupManagementFeedback(null);
    try {
      const ok = await updateMemberRole(activeGroup.id, member.userId, role);
      if (!ok) {
        setGroupManagementFeedback('Không thể cập nhật vai trò thành viên.');
        return;
      }
      await fetchGroups();
      await fetchConversations();
      setGroupManagementFeedback(
        isOwnershipTransfer
          ? `Đã chuyển quyền Trưởng nhóm cho ${member.username}.`
          : `Đã cập nhật vai trò của ${member.username}.`,
      );
    } finally {
      setGroupMemberActionId(null);
    }
  };

  const normalizedGroupMemberSearch = groupMemberSearchQuery.trim().toLowerCase();
  const filteredGroupMembers = (activeGroup?.members ?? []).filter((member: GroupMemberResponse) => {
    if (!normalizedGroupMemberSearch) return true;
    return [member.username, roleLabels[member.role]]
      .some((value) => value.toLowerCase().includes(normalizedGroupMemberSearch));
  });

  useEffect(() => {
    setGroupMemberSearchQuery('');
    setGroupManagementFeedback(null);
    setShowGroupMembers(false);
  }, [activeGroup?.id]);

  useEffect(() => {
    if (!showGroupMembers) return;
    const memberIds = (activeGroup?.members ?? [])
      .map((member: GroupMemberResponse) => member.userId)
      .filter((userId: string) => userId !== currentUserId);
    void fetchRelationStatuses(memberIds);
  }, [activeGroup?.members, currentUserId, fetchRelationStatuses, showGroupMembers]);

  const handleSendGroupMemberFriendRequest = async (member: GroupMemberResponse) => {
    if (friendRequestActionId || member.userId === currentUserId) return;
    setFriendRequestActionId(member.userId);
    setGroupManagementFeedback(null);
    try {
      const isIncomingRequest = relationStatuses[member.userId] === 'INCOMING_PENDING';
      const ok = isIncomingRequest
        ? Boolean(await acceptFriendRequest(member.userId))
        : await sendFriendRequest(member.userId);
      setGroupManagementFeedback(
        ok
          ? isIncomingRequest
            ? `Bạn và ${member.username} đã trở thành bạn bè.`
            : `Đã gửi lời mời kết bạn đến ${member.username}.`
          : `Không thể cập nhật kết nối với ${member.username}.`,
      );
    } finally {
      setFriendRequestActionId(null);
    }
  };

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

  const handleUpdateNotificationSettings = async (
    mode: ConversationNotificationMode,
    mutedUntil?: string | null
  ) => {
    try {
      await onUpdateNotificationSettings(mode, mutedUntil);
      setNotificationFeedback('Đã cập nhật thông báo');
      setShowNotificationSettings(false);
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

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
          <section className="order-[-3] flex flex-col items-center text-center">
            {isGroupConversation ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => currentUserIsGroupOwner && groupAvatarInputRef.current?.click()}
                  disabled={!currentUserIsGroupOwner || isUpdatingGroupAvatar}
                  className="group/avatar relative block overflow-hidden rounded-2xl disabled:cursor-default"
                  title={currentUserIsGroupOwner ? 'Đổi ảnh đại diện nhóm' : 'Bạn không có quyền đổi ảnh đại diện nhóm'}
                >
                  <GroupAvatar conversation={activeGroup} size={80} className="!rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700" />
                  {currentUserIsGroupOwner && (
                    <span
                      className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 text-white transition ${
                        isUpdatingGroupAvatar
                          ? 'opacity-100'
                          : 'opacity-0 group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100'
                      }`}
                    >
                      {isUpdatingGroupAvatar
                        ? <Loader2 className="h-6 w-6 animate-spin" />
                        : <Camera className="h-6 w-6" />}
                    </span>
                  )}
                </button>
                <input
                  ref={groupAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onGroupAvatarSelected}
                />
              </div>
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
            <div className="mt-3 max-w-full px-2 py-1 text-lg font-bold text-gray-950 dark:text-white">
              <span className="block truncate">
                {isGroupConversation ? (activeGroup?.name || activeConversation.name || activeFriend?.username) : (activeFriend?.id ? activeConversation.nicknames?.[activeFriend.id] : null) || activeFriend?.username}
              </span>
            </div>
            <p className="m-0 text-xs font-medium text-gray-500 dark:text-zinc-400">{getConversationInfoSubtitle()}</p>
          </section>

          {isGroupConversation && activeGroup && showGroupMembers && (
            <section className="mt-3 rounded-xl border border-gray-200 p-3 dark:border-zinc-700">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                <input
                  type="search"
                  value={groupMemberSearchQuery}
                  onChange={(event) => setGroupMemberSearchQuery(event.target.value)}
                  placeholder="Tìm thành viên..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-1 dark:border-zinc-700">
                {filteredGroupMembers.map((member: GroupMemberResponse) => {
                  const canTransferOwnership = canSetGroupMemberRole(member, 'OWNER');
                  const canMakeDeputy = canSetGroupMemberRole(member, 'DEPUTY');
                  const canMakeMember = canSetGroupMemberRole(member, 'MEMBER');
                  const roleActionLoading = groupMemberActionId?.startsWith(`${member.userId}:`);
                  const friendRelation = relationStatuses[member.userId];
                  const canSendFriendRequest = member.userId !== currentUserId
                    && (!friendRelation || friendRelation === 'NONE' || friendRelation === 'REJECTED');
                  const friendRequestPending = friendRelation === 'OUTGOING_PENDING';
                  const canAcceptFriendRequest = friendRelation === 'INCOMING_PENDING';

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/60"
                    >
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.username}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="m-0 truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">
                          {member.username}{member.userId === currentUserId ? ' (Bạn)' : ''}
                        </p>
                        <p className="m-0 text-[11px] text-gray-400 dark:text-zinc-500">
                          {roleLabels[member.role]}
                        </p>
                      </div>

                      {(canSendFriendRequest || canAcceptFriendRequest || friendRequestPending) && (
                        <button
                          type="button"
                          onClick={() => void handleSendGroupMemberFriendRequest(member)}
                          disabled={Boolean(friendRequestActionId) || friendRequestPending}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-default disabled:opacity-60 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                          title={friendRequestPending
                            ? 'Lời mời kết bạn đã được gửi'
                            : canAcceptFriendRequest
                              ? `Chấp nhận lời mời của ${member.username}`
                              : `Kết bạn với ${member.username}`}
                        >
                          {friendRequestActionId === member.userId
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <UserPlus className="h-3.5 w-3.5" />}
                          <span>{friendRequestPending ? 'Đã gửi' : canAcceptFriendRequest ? 'Chấp nhận' : 'Kết bạn'}</span>
                        </button>
                      )}

                      {(canTransferOwnership || canMakeDeputy || canMakeMember) && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          {canTransferOwnership && (
                            <button
                              type="button"
                              onClick={() => void handleUpdateGroupMemberRole(member, 'OWNER')}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 dark:hover:bg-amber-500/10"
                              title="Chuyển quyền Trưởng nhóm"
                            >
                              {roleActionLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Crown className="h-4 w-4" />}
                            </button>
                          )}
                          {canMakeDeputy && (
                            <button
                              type="button"
                              onClick={() => void handleUpdateGroupMemberRole(member, 'DEPUTY')}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-sky-500 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50 dark:hover:bg-sky-500/10"
                              title="Bổ nhiệm Phó nhóm"
                            >
                              {roleActionLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <UserCog className="h-4 w-4" />}
                            </button>
                          )}
                          {canMakeMember && (
                            <button
                              type="button"
                              onClick={() => void handleUpdateGroupMemberRole(member, 'MEMBER')}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-zinc-800"
                              title="Hạ xuống Thành viên"
                            >
                              {roleActionLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <User className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredGroupMembers.length === 0 && (
                  <p className="m-0 px-3 py-4 text-center text-sm text-gray-500 dark:text-zinc-400">
                    Không tìm thấy thành viên phù hợp.
                  </p>
                )}
              </div>

              {groupManagementFeedback && (
                <p
                  role="status"
                  className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-center text-xs font-semibold text-white dark:bg-white dark:text-gray-900"
                >
                  {groupManagementFeedback}
                </p>
              )}
            </section>
          )}

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

          <section className="order-[-2] mt-6">
            <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Lối tắt nhanh</h4>
            <div className="grid grid-cols-5 gap-2">
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
                onClick={() => setShowNotificationSettings(true)}
                disabled={conversationActionId === activeConversation.id}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {activeConversation.muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span>{activeConversation.mutedUntil ? 'Tắt tạm thời' : 'Thông báo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Palette className="h-4 w-4" />
                <span>Chủ đề</span>
              </button>
              <button
                type="button"
                onClick={() => void onMarkUnread()}
                className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <MailOpen className="h-4 w-4" />
                <span>Chưa đọc</span>
              </button>
            </div>
            {notificationFeedback && (
              <p role="status" className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-center text-xs font-semibold text-white dark:bg-white dark:text-gray-900">
                {notificationFeedback}
              </p>
            )}
          </section>

          {isGroupConversation && activeGroup && (
            <GroupEventsSection
              group={activeGroup}
              conversationId={activeConversation.id}
              currentUserRole={currentGroupMembership?.role}
              onGroupsChanged={fetchGroups}
            />
          )}

          {isGroupConversation && activeGroup && (
            <section className="order-[-1] mt-6">
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

              <button
                type="button"
                onClick={() => setShowGroupMembers((value) => !value)}
                className="mt-4 w-full overflow-hidden rounded-xl border border-gray-200 text-left transition hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                aria-expanded={showGroupMembers}
              >
                <span className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">Thành viên nhóm</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${showGroupMembers ? 'rotate-180' : ''}`}
                  />
                </span>
                <span className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {activeGroup.memberCount ?? activeGroup.members.length} thành viên
                  </span>
                </span>
              </button>
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
                  <span className="min-w-0 flex-1">
                    {activeConversation.type === 'GROUP' ? 'Bỏ ẩn kênh' : 'Bỏ ẩn trò chuyện'}
                  </span>
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
                  <span className="min-w-0 flex-1">
                    {activeConversation.type === 'GROUP' ? 'Ẩn kênh bằng PIN' : 'Ẩn trò chuyện bằng PIN'}
                  </span>
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
                  <>
                    {activeFriendIsFriend && (
                      <button
                        type="button"
                        onClick={handleProfileFriendAction}
                        disabled={profileActionLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                      >
                        {profileActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                        <span>Hủy kết bạn</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleBlockUser}
                      disabled={blockActionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    >
                      {blockActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                      <span>{activePrivateChatBlockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</span>
                    </button>
                  </>
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
      {showNotificationSettings && (
        <ConversationNotificationSettings
          currentMode={activeConversation.notificationMode ?? (activeConversation.muted ? 'NONE' : 'ALL')}
          mutedUntil={activeConversation.mutedUntil}
          saving={conversationActionId === activeConversation.id}
          onClose={() => setShowNotificationSettings(false)}
          onSave={handleUpdateNotificationSettings}
        />
      )}
    </aside>
  );
};
