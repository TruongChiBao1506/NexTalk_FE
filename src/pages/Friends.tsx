import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User as UserIcon, CircleUserRound, LogOut, UserMinus, Loader2, AlertCircle, Users, UserPlus, X, Sparkles, Search, UserCheck, Clock3, Network } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFriendStore } from '../store/friendStore';
import { useGroupStore } from '../store/groupStore';
import { useChatRequestStore } from '../store/chatRequestStore';
import { authService } from '../services/authService';
import ThemeToggle from '../components/common/ThemeToggle';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useChatStore } from '../store/chatStore';
import { formatRelativeTime } from '../utils/time';
import MobileBottomNav from '../components/common/MobileBottomNav';

import { CardListSkeleton } from '../components/common/Skeleton';
import type { ChatRequestResponse } from '../types/chatRequest';

type ActiveTab = 'friends' | 'groups' | 'pending' | 'group_invitations';

export const Friends = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const {
    friends,
    pending,
    suggestions,
    isLoading: isStoreLoading,
    error: storeError,
    fetchFriends,
    fetchPending,
    fetchSuggestions,
    acceptRequest,
    rejectRequest,
    removeFriend,
    sendFriendRequest,
    cancelFriendRequest,
    fetchRelationStatuses,
  } = useFriendStore();
  const {
    groups,
    pendingInvitations,
    isLoading: isGroupLoading,
    error: groupError,
    fetchGroups,
    fetchPendingInvitations,
    acceptInvitation,
    rejectInvitation,
  } = useGroupStore();
  const {
    incoming: incomingChatRequests,
    outgoing: outgoingChatRequests,
    isLoadingIncoming: isLoadingIncomingChatRequests,
    isLoadingOutgoing: isLoadingOutgoingChatRequests,
    error: chatRequestError,
    fetchAll: fetchChatRequests,
    acceptRequest: acceptChatRequest,
    rejectRequest: rejectChatRequest,
    cancelRequest: cancelChatRequest,
    blockRequestSender,
    reportRequestSender,
  } = useChatRequestStore();

  const { getOrCreatePrivateConversation, fetchConversations, selectConversation } = useChatStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [removeFriendConfirm, setRemoveFriendConfirm] = useState<{ id: string; username: string } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ title: string; description: string; variant?: 'primary' | 'danger' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
    fetchPending();
    fetchPendingInvitations();
    fetchSuggestions();
    fetchChatRequests();
    if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [activeTab, fetchChatRequests, fetchConversations, fetchFriends, fetchGroups, fetchPending, fetchPendingInvitations, fetchSuggestions]);

  const chatRequestPeerIdsKey = [
    ...incomingChatRequests.map((request) => request.sender.id),
    ...outgoingChatRequests.map((request) => request.receiver.id),
  ].sort().join('|');

  useEffect(() => {
    if (!chatRequestPeerIdsKey) return;
    fetchRelationStatuses(chatRequestPeerIdsKey.split('|'));
  }, [chatRequestPeerIdsKey, fetchRelationStatuses]);

  const handleAccept = async (senderId: string) => {
    setActionLoadingId(senderId);
    const conversationId = await acceptRequest(senderId);
    setActionLoadingId(null);
    if (conversationId) {
      await fetchConversations();
      await selectConversation(conversationId);
      navigate('/chat');
    }
  };

  const handleReject = async (senderId: string) => {
    setActionLoadingId(senderId);
    await rejectRequest(senderId);
    setActionLoadingId(null);
  };

  const getChatRequestPeer = (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') =>
    direction === 'incoming' ? request.sender : request.receiver;

  const handleAcceptChatRequest = async (request: ChatRequestResponse) => {
    setActionLoadingId(request.id);
    const accepted = await acceptChatRequest(request.id);
    if (accepted?.conversationId) {
      await fetchConversations();
      await selectConversation(accepted.conversationId);
      setActionLoadingId(null);
      navigate('/chat');
      return;
    }
    setActionLoadingId(null);
  };

  const handleRejectChatRequest = async (request: ChatRequestResponse) => {
    setActionLoadingId(request.id);
    await rejectChatRequest(request.id);
    setActionLoadingId(null);
  };

  const handleCancelChatRequest = async (request: ChatRequestResponse) => {
    const confirmed = window.confirm(`Hủy tin nhắn chờ đã gửi cho ${request.receiver.username}?`);
    if (!confirmed) return;
    setActionLoadingId(request.id);
    await cancelChatRequest(request.id);
    setActionLoadingId(null);
  };

  const handleBlockChatRequest = async (request: ChatRequestResponse) => {
    const confirmed = window.confirm(`Chặn tin nhắn từ ${request.sender.username}?`);
    if (!confirmed) return;
    setActionLoadingId(request.id);
    await blockRequestSender(request);
    setActionLoadingId(null);
  };

  const handleReportChatRequest = async (request: ChatRequestResponse) => {
    const confirmed = window.confirm(`Báo xấu tin nhắn từ ${request.sender.username}? Người này sẽ bị chặn sau khi báo xấu.`);
    if (!confirmed) return;
    setActionLoadingId(request.id);
    const reported = await reportRequestSender(request);
    setActionLoadingId(null);
    if (reported) {
      setAlertDialog({
        title: 'Đã báo xấu',
        description: 'Đã báo xấu và chặn người dùng.',
        variant: 'primary',
      });
    }
  };

  const handleAddChatRequestPeer = async (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') => {
    const peer = getChatRequestPeer(request, direction);
    setActionLoadingId(`friend-${request.id}`);
    await sendFriendRequest(peer.id);
    setActionLoadingId(null);
  };

  const handleAcceptFriendFromChatRequest = async (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') => {
    const peer = getChatRequestPeer(request, direction);
    setActionLoadingId(`friend-${request.id}`);
    const conversationId = await acceptRequest(peer.id);
    setActionLoadingId(null);
    if (conversationId) {
      await fetchConversations();
    }
  };

  const handleOpenAcceptedChatRequest = async (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') => {
    const peer = getChatRequestPeer(request, direction);
    setActionLoadingId(request.id);
    if (request.conversationId) {
      await fetchConversations();
      await selectConversation(request.conversationId);
    } else {
      await getOrCreatePrivateConversation(peer.id);
    }
    setActionLoadingId(null);
    navigate('/chat');
  };

  // Các thao tác này được giữ sẵn cho giao diện hộp thư chờ đang được hoàn thiện.
  void handleAcceptChatRequest;
  void handleRejectChatRequest;
  void handleCancelChatRequest;
  void handleBlockChatRequest;
  void handleReportChatRequest;
  void handleAddChatRequestPeer;
  void handleAcceptFriendFromChatRequest;
  void handleOpenAcceptedChatRequest;

  const handleSendSuggestionRequest = async (userId: string) => {
    setActionLoadingId(userId);
    await sendFriendRequest(userId);
    setActionLoadingId(null);
  };

  const handleCancelSuggestionRequest = async (userId: string) => {
    setActionLoadingId(userId);
    await cancelFriendRequest(userId);
    setActionLoadingId(null);
  };

  const handleAcceptGroupInvite = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    await acceptInvitation(inviteId);
    setActionLoadingId(null);
  };

  const handleRejectGroupInvite = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    await rejectInvitation(inviteId);
    setActionLoadingId(null);
  };

  const handleRemoveConfirmed = async (friendId: string) => {
    setActionLoadingId(friendId);
    await removeFriend(friendId);
    setActionLoadingId(null);
    setRemoveFriendConfirm(null);
  };

  const handleStartChat = async (friendId: string) => {
    setActionLoadingId(friendId);
    const conversation = await getOrCreatePrivateConversation(friendId);
    setActionLoadingId(null);
    if (conversation) {
      navigate('/chat');
    }
  };

  const handleOpenGroupChat = async (groupId: string, conversationId: string | null) => {
    if (!conversationId) return;
    setActionLoadingId(groupId);
    await fetchConversations();
    await selectConversation(conversationId);
    setActionLoadingId(null);
    navigate('/chat');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Failed to log out from server:', err);
    } finally {
      logout();
      setIsLoggingOut(false);
    }
  };

  const totalChatRequests = incomingChatRequests.length + outgoingChatRequests.length;
  const isChatRequestLoading = isLoadingIncomingChatRequests || isLoadingOutgoingChatRequests;
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('vi');
  const visibleFriends = friends.filter((friend) =>
    !normalizedSearch || [friend.username, friend.bio].some((value) => value?.toLocaleLowerCase('vi').includes(normalizedSearch))
  );
  const onlineFriends = friends.filter((friend) => friend.status === 'ONLINE').length;

  return (
    <div className="nextalk-friends-shell h-dvh w-screen overflow-hidden flex bg-[#f6f7fc] text-slate-900 dark:bg-discord-dark dark:text-discord-text transition-colors duration-300">
      <aside className="hidden md:flex w-16 md:w-20 flex-col items-center py-4 border-r shrink-0">
        <div
          onClick={() => navigate('/chat')}
          className="w-12 h-12 rounded-2xl bg-white/55 dark:bg-zinc-900/60 flex items-center justify-center text-slate-600 dark:text-zinc-300 mb-6 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white transition-all duration-300 shadow-sm"
          title="Chat Home"
        >
          <MessageSquare className="w-6 h-6" />
        </div>
        <div
          onClick={() => setActiveTab('friends')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 cursor-pointer transition-all duration-300 ${
            activeTab !== 'pending'
              ? 'bg-indigo-600 dark:bg-discord-blurple text-white shadow-sm'
              : 'bg-white/55 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-300 hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white'
          }`}
          title="Friends List"
        >
          <UserIcon className="w-5 h-5" />
        </div>
        <div
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-2xl bg-white/55 dark:bg-zinc-900/60 flex items-center justify-center text-slate-600 dark:text-zinc-300 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white transition-all duration-300"
          title="Hồ sơ"
        >
          <CircleUserRound className="w-5 h-5" />
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-12 h-12 rounded-2xl bg-white/55 dark:bg-zinc-900/60 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all duration-300 disabled:opacity-50"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto mx-auto w-full max-w-[1440px] p-4 pb-24 md:p-8 md:pb-10 space-y-6">
        <header className="overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-[0_18px_55px_rgba(79,70,229,0.08)] dark:border-zinc-800 dark:bg-discord-mid">
          <div className="relative flex flex-col gap-7 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="relative z-10 max-w-2xl text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"><Network className="h-3.5 w-3.5" /> Không gian kết nối</div>
              <h1 className="m-0 text-3xl font-black tracking-tight text-slate-950 md:text-4xl dark:text-white">Bạn bè & cộng đồng</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-discord-muted">Quản lý các mối quan hệ, lời mời và nhóm của bạn trong một không gian rõ ràng, dễ theo dõi.</p>
            </div>
            <div className="relative z-10 grid w-full grid-cols-3 gap-2 xl:w-auto xl:min-w-[390px]">
              <div className="rounded-2xl bg-slate-50 p-3 text-left dark:bg-zinc-900/60"><UserCheck className="mb-2 h-4 w-4 text-indigo-600"/><strong className="block text-xl text-slate-950 dark:text-white">{friends.length}</strong><span className="text-[11px] text-slate-500">Bạn bè</span></div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-left dark:bg-emerald-500/10"><span className="mb-2 block h-2.5 w-2.5 rounded-full bg-emerald-500"/><strong className="block text-xl text-slate-950 dark:text-white">{onlineFriends}</strong><span className="text-[11px] text-slate-500">Trực tuyến</span></div>
              <div className="rounded-2xl bg-amber-50 p-3 text-left dark:bg-amber-500/10"><Clock3 className="mb-2 h-4 w-4 text-amber-600"/><strong className="block text-xl text-slate-950 dark:text-white">{pending.length + pendingInvitations.length}</strong><span className="text-[11px] text-slate-500">Đang chờ</span></div>
            </div>
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-500/10" />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 md:px-8 xl:flex-row xl:items-center xl:justify-between dark:border-zinc-800">
            <div className="relative w-full xl:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo tên hoặc giới thiệu..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-indigo-500/10" />
            </div>

          <div className="flex w-full max-w-full flex-nowrap overflow-x-auto rounded-xl bg-slate-100 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:w-auto xl:overflow-visible dark:bg-discord-dark/50 self-start xl:self-auto">
            <button
              onClick={() => setActiveTab('friends')}
              className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'friends'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tất cả bạn bè ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'groups'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Nhóm ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`relative shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Lời mời kết bạn
              {pending.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pending.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('group_invitations')}
              className={`relative shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'group_invitations'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Lời mời vào nhóm
              {pendingInvitations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingInvitations.length}
                </span>
              )}
            </button>
          </div>
          </div>
        </header>

        {(storeError || groupError || chatRequestError) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-left flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{storeError || groupError || chatRequestError}</span>
          </div>
        )}

        <div className="flex-1 w-full">
          {(isStoreLoading || isGroupLoading || isChatRequestLoading) && friends.length === 0 && pending.length === 0 && groups.length === 0 && totalChatRequests === 0 ? (
            <CardListSkeleton count={6} />
          ) : activeTab === 'friends' ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between text-left">
                <div><h2 className="m-0 text-2xl font-black text-slate-950 dark:text-white">Tất cả bạn bè</h2><p className="mt-1 text-sm text-slate-500">{visibleFriends.length} kết nối {searchQuery ? 'phù hợp tìm kiếm' : 'trong danh sách của bạn'}.</p></div>
                <button onClick={() => navigate('/chat')} className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:inline-flex"><UserPlus className="h-4 w-4"/> Thêm bạn mới</button>
              </div>
              {visibleFriends.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
                  <p className="text-gray-500 dark:text-discord-muted m-0">{searchQuery ? 'Không tìm thấy bạn bè phù hợp.' : 'Chưa có bạn bè.'}</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:opacity-90 transition-all duration-250"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Tìm bạn trong Chat</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="nextalk-soft-card group relative overflow-hidden rounded-2xl border border-white/70 p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_16px_35px_rgba(79,70,229,0.12)] dark:border-zinc-800 dark:hover:border-indigo-500/30"
                    >
                      <div className="relative shrink-0">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={friend.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-50 dark:border-zinc-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-lg">
                            {friend.username?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-discord-mid ${
                            friend.status === 'AWAY' ? 'bg-amber-500' : friend.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'
                          }`}
                          title={friend.status}
                        />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{friend.username}</h4>
                        <p className="text-xs text-gray-550 dark:text-discord-muted truncate mt-0.5">
                          {friend.status === 'OFFLINE' && friend.lastSeen ? (
                            <span className="text-gray-400 dark:text-discord-muted text-[11px]">
                              Offline - Last seen {formatRelativeTime(friend.lastSeen)}
                            </span>
                          ) : (
                            friend.bio || 'No status written.'
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartChat(friend.id)}
                          disabled={actionLoadingId === friend.id}
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-discord-blurple hover:bg-indigo-600 hover:text-white active:scale-95 transition-all duration-200"
                          title="Nhắn tin"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setRemoveFriendConfirm({ id: friend.id, username: friend.username })}
                          disabled={actionLoadingId === friend.id}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all duration-200"
                          title="Hủy kết bạn"
                        >
                          {actionLoadingId === friend.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserMinus className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-indigo-500 to-violet-500 transition-transform group-hover:scale-x-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'groups' ? (
            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
                  <p className="text-gray-500 dark:text-discord-muted m-0">Bạn chưa tham gia nhóm nào.</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:opacity-90 transition-all duration-250"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Tạo hoặc tham gia nhóm trong Chat</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="nextalk-soft-card rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-lg shrink-0">
                        {group.name?.charAt(0)?.toUpperCase() ?? '#'}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{group.name}</h4>
                        <p className="text-xs text-gray-550 dark:text-discord-muted truncate mt-0.5">
                          {group.memberCount} thành viên - Chủ nhóm: {group.ownerUsername || 'Không rõ'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenGroupChat(group.id, group.channels?.[0]?.conversationId ?? null)}
                        disabled={!group.channels || group.channels.length === 0 || actionLoadingId === group.id}
                        className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-discord-blurple hover:bg-indigo-600 hover:text-white active:scale-95 transition-all duration-200 disabled:opacity-45"
                        title="Nhắn tin nhóm"
                      >
                        {actionLoadingId === group.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <MessageSquare className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'pending' ? (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
                  <p className="text-gray-500 dark:text-discord-muted m-0">Không có yêu cầu kết bạn nào đang chờ xử lý.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-discord-mid rounded-2xl p-4 border border-gray-150 dark:border-zinc-850 shadow-sm flex items-center gap-4"
                    >
                      {req.avatarUrl ? (
                        <img
                          src={req.avatarUrl}
                          alt={req.username}
                          className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-md shrink-0">
                          {req.username?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{req.username}</h4>
                        <p className="text-xs text-gray-500 dark:text-discord-muted truncate mt-0.5">Đã gửi lời mời kết bạn</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="inline-flex min-w-[86px] items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                          title="Chấp nhận"
                        >
                          {actionLoadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đồng ý'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="inline-flex min-w-[86px] items-center justify-center rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          title="Từ chối"
                        >
                          {actionLoadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Từ chối'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {suggestions && suggestions.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-bold text-gray-950 dark:text-white text-lg m-0">Những người bạn có thể biết</h3>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800"></div>
                  </div>
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="bg-white dark:bg-discord-mid rounded-2xl p-4 border border-gray-150 dark:border-zinc-850 shadow-sm flex items-center gap-4 hover:shadow-md transition"
                      >
                        {suggestion.avatarUrl ? (
                          <img
                            src={suggestion.avatarUrl}
                            alt={suggestion.username}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-lg shrink-0">
                            {suggestion.username?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{suggestion.username}</h4>
                          <p className="text-sm text-gray-550 dark:text-discord-muted truncate mt-0.5 flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            Có {suggestion.mutualFriendsCount} bạn chung
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {suggestion.isRequestSent ? (
                            <button
                              onClick={() => handleCancelSuggestionRequest(suggestion.id)}
                              disabled={actionLoadingId === suggestion.id}
                              className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-[0.98] disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                            >
                              {actionLoadingId === suggestion.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                  <X className="w-4 h-4" />
                                  Hủy yêu cầu
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendSuggestionRequest(suggestion.id)}
                              disabled={actionLoadingId === suggestion.id}
                              className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 active:scale-[0.98] disabled:opacity-50 border border-indigo-200 dark:border-indigo-500/20"
                            >
                              {actionLoadingId === suggestion.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                  <UserPlus className="w-4 h-4" />
                                  Thêm bạn bè
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'group_invitations' ? (
            <div className="space-y-3">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
                  <p className="text-gray-500 dark:text-discord-muted m-0">Không có lời mời vào nhóm nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-white dark:bg-discord-mid rounded-2xl p-4 border border-gray-150 dark:border-zinc-850 shadow-sm flex items-center gap-4"
                    >
                      {invite.groupAvatarUrl ? (
                        <img
                          src={invite.groupAvatarUrl}
                          alt={invite.groupName}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-lg shrink-0">
                          {invite.groupName?.charAt(0)?.toUpperCase() ?? '#'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{invite.groupName}</h4>
                        <p className="text-xs text-gray-500 dark:text-discord-muted truncate mt-0.5">
                          Được mời bởi <strong>{invite.inviterUsername}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptGroupInvite(invite.id)}
                          disabled={actionLoadingId === invite.id}
                          className="inline-flex min-w-[86px] items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                          title="Chấp nhận"
                        >
                          {actionLoadingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đồng ý'}
                        </button>
                        <button
                          onClick={() => handleRejectGroupInvite(invite.id)}
                          disabled={actionLoadingId === invite.id}
                          className="inline-flex min-w-[86px] items-center justify-center rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          title="Từ chối"
                        >
                          {actionLoadingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Từ chối'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 text-left text-white shadow-[0_22px_50px_rgba(79,70,229,0.22)]">
            <div className="relative z-10 max-w-sm">
              <h3 className="m-0 text-xl font-black">Sẵn sàng kết nối?</h3>
              <p className="mt-2 text-sm font-medium text-indigo-50">
                Bắt đầu cuộc trò chuyện mới với bạn bè của bạn ngay hôm nay.
              </p>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
              >
                Nhắn tin ngay
              </button>
            </div>
            <MessageSquare className="absolute -bottom-7 right-8 h-28 w-28 rotate-12 text-white/12" />
          </div>

          <div className="nextalk-soft-card flex items-center gap-4 rounded-3xl bg-[#dfeaff] p-6 text-left dark:bg-indigo-500/10">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-xl font-black text-slate-950 dark:text-white">NexTalk AI</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                Gợi ý người bạn có cùng sở thích và giúp bạn bắt đầu cuộc trò chuyện tự nhiên hơn.
              </p>
            </div>
          </div>
        </section>
      </main>
      <ConfirmDialog
        isOpen={Boolean(removeFriendConfirm)}
        title="Hủy kết bạn"
        description={`Bạn có chắc muốn hủy kết bạn với ${removeFriendConfirm?.username ?? 'người này'}? Hai bạn vẫn có thể xem lại lịch sử trò chuyện.`}
        confirmLabel="Hủy bạn bè"
        variant="danger"
        isLoading={Boolean(removeFriendConfirm && actionLoadingId === removeFriendConfirm.id)}
        onCancel={() => {
          if (!actionLoadingId) {
            setRemoveFriendConfirm(null);
          }
        }}
        onConfirm={() => {
          if (removeFriendConfirm) {
            handleRemoveConfirmed(removeFriendConfirm.id);
          }
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(alertDialog)}
        title={alertDialog?.title ?? ''}
        description={alertDialog?.description ?? ''}
        confirmLabel="OK"
        variant={alertDialog?.variant ?? 'primary'}
        showCancel={false}
        onCancel={() => setAlertDialog(null)}
        onConfirm={() => setAlertDialog(null)}
      />
      <MobileBottomNav />
    </div>
  );
};

export default Friends;
