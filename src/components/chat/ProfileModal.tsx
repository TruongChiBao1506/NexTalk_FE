import { X, Camera, Loader2, Check, Settings, Users, Search, UserCog, User, UserMinus, Crown } from 'lucide-react';
import type { User as AuthUser } from '../../types/auth';
import type { GroupResponse } from '../../types/group';
import type { ConversationResponse } from '../../types/chat';

interface ProfileModalProps {
  setIsProfileModalOpen: (val: boolean) => void;
  activeConversation: ConversationResponse;
  activeFriend: any;
  isUpdatingGroupAvatar: boolean;
  isGroupConversation: boolean;
  currentUserIsGroupOwner: boolean;
  groupAvatarInputRef: React.RefObject<HTMLInputElement>;
  activeGroup: GroupResponse | null;
  isEditingGroupName: boolean;
  editingGroupName: string;
  setEditingGroupName: (val: string) => void;
  setIsEditingGroupName: (val: boolean) => void;
  isRenamingGroup: boolean;
  handleRenameGroup: () => void;
  isTogglingApproval: boolean;
  handleToggleRequiresApproval: () => void;
  isTogglingTasks?: boolean;
  handleToggleTaskEnabled?: () => void;
  handleLeaveActiveGroup: () => void;
  profileActionLoading: boolean;
  formatProfileDate: (date: any) => string;
  canInviteToActiveGroup: boolean;
  setIsInviteMembersOpen: (val: boolean) => void;
  groupMemberSearchQuery: string;
  setGroupMemberSearchQuery: (val: string) => void;
  filteredGroupMembers: any[];
  canKickGroupMember: (member: any) => boolean;
  canSetGroupMemberRole: (member: any, role: string) => boolean;
  groupMemberActionId: string | null;
  roleLabels: Record<string, string>;
  handleUpdateGroupMemberRole: (member: any, role: string) => void;
  handleKickGroupMember: (member: any) => void;
  activeFriendIsFriend: boolean;
  activeFriendRequestSent: boolean;
  handleProfileFriendAction: () => void;
  handleToggleBlockUser: () => void;
  blockActionLoading: boolean;
  activePrivateChatBlockedByMe: boolean;
  formatRelativeTime: (date: any) => string;
  user: AuthUser | null;
}

export const ProfileModal = ({
  setIsProfileModalOpen,
  activeConversation,
  activeFriend,
  isUpdatingGroupAvatar,
  isGroupConversation,
  currentUserIsGroupOwner,
  groupAvatarInputRef,
  activeGroup,
  isEditingGroupName,
  editingGroupName,
  setEditingGroupName,
  setIsEditingGroupName,
  isRenamingGroup,
  handleRenameGroup,
  isTogglingApproval,
  handleToggleRequiresApproval,
  handleLeaveActiveGroup,
  profileActionLoading,
  formatProfileDate,
  canInviteToActiveGroup,
  setIsInviteMembersOpen,
  groupMemberSearchQuery,
  setGroupMemberSearchQuery,
  filteredGroupMembers,
  canKickGroupMember,
  canSetGroupMemberRole,
  groupMemberActionId,
  roleLabels,
  handleUpdateGroupMemberRole,
  handleKickGroupMember,
  activeFriendIsFriend,
  activeFriendRequestSent,
  handleProfileFriendAction,
  handleToggleBlockUser,
  blockActionLoading,
  activePrivateChatBlockedByMe,
  formatRelativeTime,
  user
}: ProfileModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => !isUpdatingGroupAvatar && setIsProfileModalOpen(false)}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={() => !isUpdatingGroupAvatar && setIsProfileModalOpen(false)}
            disabled={isUpdatingGroupAvatar}
            className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isGroupConversation ? (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => currentUserIsGroupOwner && groupAvatarInputRef.current?.click()}
                disabled={!currentUserIsGroupOwner || isUpdatingGroupAvatar}
                className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow disabled:cursor-default"
                title={currentUserIsGroupOwner ? 'Đổi ảnh nhóm' : 'Chỉ trưởng nhóm được đổi ảnh nhóm'}
              >
                {activeGroup?.avatarUrl ? (
                  <img src={activeGroup.avatarUrl} alt={activeGroup.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{(activeGroup?.name || activeFriend?.username || 'G').charAt(0).toUpperCase()}</span>
                )}
                {currentUserIsGroupOwner && (
                  <span className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white transition ${isUpdatingGroupAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isUpdatingGroupAvatar ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6" />
                    )}
                  </span>
                )}
              </button>
              <div className="min-w-0 pb-1 text-left flex-1">
                {isEditingGroupName && currentUserIsGroupOwner ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameGroup();
                        if (e.key === 'Escape') setIsEditingGroupName(false);
                      }}
                      maxLength={100}
                      autoFocus
                      disabled={isRenamingGroup}
                      className="flex-1 min-w-0 text-xl font-bold bg-gray-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-gray-900 dark:text-white border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={handleRenameGroup}
                      disabled={!editingGroupName.trim() || isRenamingGroup}
                      className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      {isRenamingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingGroupName(false)}
                      disabled={isRenamingGroup}
                      className="shrink-0 rounded-lg bg-gray-100 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h3 className="m-0 truncate text-xl font-bold">{activeGroup?.name || activeConversation.name || 'Nhóm chat'}</h3>
                    {currentUserIsGroupOwner && (
                      <button
                        type="button"
                        onClick={() => { setEditingGroupName(activeGroup?.name || activeConversation.name || ''); setIsEditingGroupName(true); }}
                        className="shrink-0 opacity-0 group-hover/name:opacity-100 rounded-md p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                        title="Đổi tên nhóm"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-discord-muted">
                  <Users className="h-3.5 w-3.5" />
                  <span>{activeGroup?.memberCount ?? activeConversation.members.length} thành viên</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 p-3 text-left dark:bg-discord-black/35">
              <div>
                <p className="m-0 text-sm font-semibold">
                  {currentUserIsGroupOwner ? 'Bạn là chủ nhóm' : 'Bạn là thành viên nhóm'}
                </p>
                <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">
                  {currentUserIsGroupOwner ? 'Chủ nhóm không thể thoát nhóm. Hãy chuyển quyền hoặc xoá nhóm nếu cần.' : 'Bạn có thể rời nhóm này bất cứ lúc nào.'}
                </p>
              </div>
              {!currentUserIsGroupOwner && (
                <button
                  type="button"
                  onClick={handleLeaveActiveGroup}
                  disabled={profileActionLoading}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {profileActionLoading ? 'Đang xử lý...' : 'Thoát nhóm'}
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Chủ nhóm</p>
                <p className="mt-1 truncate text-sm font-semibold">{activeGroup?.ownerUsername || 'Không rõ'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Ngày tạo</p>
                <p className="mt-1 truncate text-sm font-semibold">{formatProfileDate(activeGroup?.createdAt || activeConversation.createdAt)}</p>
              </div>
            </div>

            {activeGroup && currentUserIsGroupOwner && (
              <div className="mt-5 flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-3 text-left dark:bg-discord-black/35">
                <div>
                  <p className="m-0 text-sm font-semibold">Phê duyệt thành viên</p>
                  <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">Quản trị viên cần duyệt khi có người mới tham gia.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRequiresApproval}
                  disabled={isTogglingApproval}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeGroup.requiresApproval ? 'bg-indigo-600 dark:bg-discord-blurple' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={activeGroup.requiresApproval}
                >
                  <span className="sr-only">Toggle requires approval</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      activeGroup.requiresApproval ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="mt-5 text-left">
              <div className="mb-2 flex items-center justify-between">
                <p className="m-0 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Thành viên</p>
                {activeGroup && canInviteToActiveGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isUpdatingGroupAvatar) return;
                      setIsProfileModalOpen(false);
                      setIsInviteMembersOpen(true);
                    }}
                    disabled={isUpdatingGroupAvatar}
                    className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                  >
                    Mời thêm
                  </button>
                )}
              </div>
              {activeGroup && (
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={groupMemberSearchQuery}
                    onChange={(event) => setGroupMemberSearchQuery(event.target.value)}
                    placeholder="Tìm thành viên..."
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:bg-zinc-950"
                  />
                </div>
              )}
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {filteredGroupMembers.map((member) => {
                  const canKick = canKickGroupMember(member);
                  const canMakeDeputy = canSetGroupMemberRole(member, 'DEPUTY');
                  const canMakeMember = canSetGroupMemberRole(member, 'MEMBER') && member.role !== 'MEMBER';
                  const canTransferOwnership = canSetGroupMemberRole(member, 'OWNER');
                  const roleActionLoading = groupMemberActionId?.startsWith(`${member.userId}:`);
                  return (
                    <div key={member.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.username} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-sm font-semibold">{member.username}</p>
                        <p className="m-0 text-[11px] text-gray-400 dark:text-zinc-500">{roleLabels[member.role]}</p>
                      </div>
                      {(canTransferOwnership || canMakeDeputy || canMakeMember) && (
                        <div className="flex shrink-0 items-center gap-1">
                          {canTransferOwnership && (
                            <button
                              type="button"
                              onClick={() => handleUpdateGroupMemberRole(member, 'OWNER')}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-60 dark:hover:bg-amber-500/10"
                              title="Chuyển quyền trưởng nhóm"
                            >
                              {roleActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                            </button>
                          )}
                          {canMakeDeputy && (
                            <button
                              type="button"
                              onClick={() => handleUpdateGroupMemberRole(member, 'DEPUTY')}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-sky-500 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-60 dark:hover:bg-sky-500/10"
                              title="Đặt làm phó nhóm"
                            >
                              {roleActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                            </button>
                          )}
                          {canMakeMember && (
                            <button
                              type="button"
                              onClick={() => handleUpdateGroupMemberRole(member, 'MEMBER')}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 dark:hover:bg-zinc-800"
                              title="Hạ xuống thành viên"
                            >
                              {roleActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      )}
                      {canKick && (
                        <button
                          type="button"
                          onClick={() => handleKickGroupMember(member)}
                          disabled={Boolean(groupMemberActionId)}
                          className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 dark:hover:bg-rose-500/10"
                          title="Kick khỏi nhóm"
                        >
                          {groupMemberActionId === member.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
                {activeGroup && filteredGroupMembers.length === 0 && (
                  <p className="m-0 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-discord-black/35 dark:text-discord-muted">
                    Không tìm thấy thành viên phù hợp.
                  </p>
                )}
                {!activeGroup && (
                  <p className="m-0 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-discord-black/35 dark:text-discord-muted">
                    Chưa tải được thông tin nhóm.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4">
              {activeFriend?.avatarUrl ? (
                <img
                  src={activeFriend.avatarUrl}
                  alt={activeFriend.username}
                  className="h-20 w-20 shrink-0 rounded-full object-cover shadow"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white shadow">
                  {activeFriend?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 pb-1 text-left">
                <h3 className="m-0 truncate text-xl font-bold">{activeFriend?.username}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-discord-muted">
                  <span className={`h-2 w-2 rounded-full ${activeFriend?.status === 'AWAY' ? 'bg-amber-500' : activeFriend?.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                  <span className="capitalize">{activeFriend?.status?.toLowerCase()}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-left">
              {activeFriend?.email !== 'moderator@nextalk.local' && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                  <div>
                    <p className="m-0 text-sm font-semibold">
                      {activeFriendIsFriend ? 'Đã là bạn bè' : activeFriendRequestSent ? 'Đã gửi lời mời kết bạn' : 'Chưa là bạn bè'}
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">
                      {activeFriendIsFriend ? 'Bạn có thể nhắn tin trực tiếp với người này.' : 'Gửi lời mời để kết nối với người này.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProfileFriendAction}
                    disabled={profileActionLoading || activeFriendRequestSent}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                      activeFriendIsFriend
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {profileActionLoading ? 'Đang xử lý...' : activeFriendIsFriend ? 'Hủy bạn bè' : activeFriendRequestSent ? 'Đã gửi lời mời' : 'Thêm bạn'}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleBlockUser}
                    disabled={blockActionLoading}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                  >
                    {blockActionLoading ? 'Đang xử lý...' : activePrivateChatBlockedByMe ? 'Bỏ chặn' : 'Chặn'}
                  </button>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Email</p>
                <p className="mt-1 break-all text-sm font-semibold">{activeFriend?.email || 'Không có email'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Giới thiệu</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-zinc-200">{activeFriend?.bio || 'Chưa có giới thiệu.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Tham gia</p>
                  <p className="mt-1 text-sm font-semibold">{formatProfileDate(activeConversation.members.find((member) => member.id !== user?.id)?.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Lần cuối</p>
                  <p className="mt-1 text-sm font-semibold">
                    {activeFriend?.status === 'OFFLINE' && activeFriend?.lastSeen ? formatRelativeTime(activeFriend.lastSeen) : activeFriend?.status?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => !isUpdatingGroupAvatar && setIsProfileModalOpen(false)}
                disabled={isUpdatingGroupAvatar}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
