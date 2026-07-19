import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserMinus, Loader2, AlertCircle, Users, UserPlus, X, Search, UserCheck, Clock3, Send, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFriendStore } from '../store/friendStore';
import { useGroupStore } from '../store/groupStore';
import { useChatRequestStore } from '../store/chatRequestStore';
import { authService } from '../services/authService';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useChatStore } from '../store/chatStore';
import { formatRelativeTime } from '../utils/time';
import MobileBottomNav from '../components/common/MobileBottomNav';
import DesktopSidebar from '../components/common/DesktopSidebar';

import { CardListSkeleton } from '../components/common/Skeleton';
import type { ChatRequestResponse } from '../types/chatRequest';

type ActiveTab = 'friends' | 'groups' | 'requests' | 'sent' | 'suggestions';

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
  const matchesSearch = (...values: Array<string | null | undefined>) =>
    !normalizedSearch || values.some((value) => value?.toLocaleLowerCase('vi').includes(normalizedSearch));
  const visibleFriends = friends.filter((friend) => matchesSearch(friend.username, friend.bio));
  const visibleGroups = groups.filter((group) => matchesSearch(group.name, group.ownerUsername));
  const visiblePending = pending.filter((request) => matchesSearch(request.username, request.email));
  const sentSuggestions = suggestions.filter((suggestion) => suggestion.isRequestSent);
  const discoverSuggestions = suggestions.filter((suggestion) => !suggestion.isRequestSent);
  const visibleSentSuggestions = sentSuggestions.filter((suggestion) => matchesSearch(suggestion.username, suggestion.email));
  const visibleDiscoverSuggestions = discoverSuggestions.filter((suggestion) => matchesSearch(suggestion.username, suggestion.email));
  const visibleActiveSuggestions = activeTab === 'sent' ? visibleSentSuggestions : visibleDiscoverSuggestions;
  const visibleGroupInvitations = pendingInvitations.filter((invitation) => matchesSearch(invitation.groupName, invitation.inviterUsername));
  const friendTabs: Array<{ key: ActiveTab; label: string; description: string; count: number; icon: LucideIcon }> = [
    { key: 'friends', label: 'Bạn bè', description: 'Danh sách kết nối', count: friends.length, icon: UserCheck },
    { key: 'groups', label: 'Nhóm', description: 'Những nhóm đang tham gia', count: groups.length, icon: Users },
    { key: 'requests', label: 'Lời mời', description: 'Đang chờ bạn xử lý', count: pending.length + pendingInvitations.length, icon: Clock3 },
    { key: 'sent', label: 'Đã gửi', description: 'Đang chờ phản hồi', count: sentSuggestions.length, icon: Send },
    { key: 'suggestions', label: 'Khám phá', description: 'Tìm thêm bạn mới', count: discoverSuggestions.length, icon: Search },
  ];

  return (
    <div className="nextalk-friends-shell h-dvh w-screen overflow-hidden flex bg-[#f6f7fc] text-slate-900 dark:bg-discord-dark dark:text-discord-text transition-colors duration-300">
      <DesktopSidebar activePage="friends" onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <section className="hidden h-dvh w-[360px] shrink-0 flex-col border-r border-[#dbe4ff] bg-[#eef4ff]/95 md:flex dark:border-[#2a3348] dark:bg-[#121827]">
        <div className="border-b border-[#dbe4ff] px-5 pb-5 pt-6 dark:border-[#2a3348]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="m-0 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Danh bạ NexTalk</p>
              <h1 className="mb-0 mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Kết nối</h1>
            </div>
            <button type="button" onClick={() => setActiveTab('suggestions')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700" aria-label="Tìm bạn mới" title="Tìm bạn mới">
              <UserPlus className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-0 mt-2 text-xs text-slate-500 dark:text-discord-muted">Bạn bè, nhóm và lời mời của bạn.</p>
        </div>

        <div className="border-b border-[#dbe4ff] p-4 dark:border-[#2a3348]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tên, email hoặc nhóm..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-indigo-500/10" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-white" aria-label="Xóa tìm kiếm"><X className="h-4 w-4" /></button>}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Danh mục bạn bè">
          {friendTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${isActive ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-zinc-800 dark:text-indigo-200 dark:ring-zinc-700' : 'text-slate-600 hover:bg-white/65 hover:text-slate-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' : 'bg-white/65 text-slate-500 dark:bg-zinc-900/60 dark:text-zinc-400'}`}><TabIcon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm font-bold">{tab.label}</strong><span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400 dark:text-zinc-500">{tab.description}</span></span>
                {tab.count > 0 && <span className={`flex min-w-6 items-center justify-center rounded-full px-1.5 py-1 text-[10px] font-black ${tab.key === 'requests' ? 'bg-rose-500 text-white' : isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200' : 'bg-white text-slate-500 dark:bg-zinc-900 dark:text-zinc-400'}`}>{tab.count > 99 ? '99+' : tab.count}</span>}
              </button>
            );
          })}
        </nav>
      </section>

      <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-24 md:p-7 md:pb-10">
        <div className="mx-auto w-full max-w-[1100px] space-y-5">
          <header className="space-y-4 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left"><p className="m-0 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">Danh bạ NexTalk</p><h1 className="mb-0 mt-1 text-2xl font-black text-slate-950 dark:text-white">Kết nối</h1></div>
              <button type="button" onClick={() => setActiveTab('suggestions')} className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white"><UserPlus className="h-5 w-5" /></button>
            </div>
            <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tên, email hoặc nhóm..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}</div>
            <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {friendTabs.map((tab) => { const TabIcon = tab.icon; return <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold ${activeTab === tab.key ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'text-slate-500 dark:text-zinc-400'}`}><TabIcon className="h-4 w-4" />{tab.label}{tab.count > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">{tab.count}</span>}</button>; })}
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
                <div><h2 className="m-0 text-lg font-black text-slate-950 dark:text-white">Tất cả bạn bè</h2><p className="mt-1 text-xs text-slate-500">{visibleFriends.length} kết nối {searchQuery ? 'phù hợp tìm kiếm' : 'trong danh sách của bạn'}.</p></div>
              </div>
              {visibleFriends.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-discord-mid">
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
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {visibleFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="group flex min-h-[78px] items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-zinc-800 dark:bg-discord-mid dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
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
                              Ngoại tuyến · {formatRelativeTime(friend.lastSeen)}
                            </span>
                          ) : (
                            friend.bio || 'Chưa có trạng thái'
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'groups' ? (
            <div className="space-y-4">
              <div className="text-left"><h2 className="m-0 text-lg font-black text-slate-950 dark:text-white">Nhóm của bạn</h2><p className="mt-1 text-xs text-slate-500">{visibleGroups.length} nhóm {searchQuery ? 'phù hợp tìm kiếm' : 'đang tham gia'}.</p></div>
              {visibleGroups.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-discord-mid">
                  <p className="text-gray-500 dark:text-discord-muted m-0">{searchQuery ? 'Không tìm thấy nhóm phù hợp.' : 'Bạn chưa tham gia nhóm nào.'}</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:opacity-90 transition-all duration-250"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Tạo hoặc tham gia nhóm trong Chat</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {visibleGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex min-h-[78px] items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-zinc-800 dark:bg-discord-mid dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-lg shrink-0">
                        {group.name?.charAt(0)?.toUpperCase() ?? '#'}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{group.name}</h4>
                        <p className="text-xs text-gray-550 dark:text-discord-muted truncate mt-0.5">
                          {group.memberCount} thành viên · Chủ nhóm: {group.ownerUsername || 'Không rõ'}
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
          ) : activeTab === 'requests' ? (
            <div className="space-y-4">
              <div className="text-left"><h2 className="m-0 text-lg font-black text-slate-950 dark:text-white">Lời mời</h2><p className="mt-1 text-xs text-slate-500">Xử lý lời mời kết bạn và lời mời tham gia nhóm.</p></div>

              <div className="flex items-center gap-3"><h3 className="m-0 text-sm font-bold text-slate-700 dark:text-zinc-200">Kết bạn</h3><div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" /></div>
              {visiblePending.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center dark:border-zinc-800 dark:bg-discord-mid">
                  <p className="m-0 text-sm text-gray-500 dark:text-discord-muted">{searchQuery ? 'Không tìm thấy lời mời kết bạn phù hợp.' : 'Không có lời mời kết bạn nào.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visiblePending.map((req) => (
                    <div key={req.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-discord-mid">
                      {req.avatarUrl ? <img src={req.avatarUrl} alt={req.username} className="h-11 w-11 shrink-0 rounded-full border border-gray-200 object-cover dark:border-zinc-800" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-650 text-md font-bold text-white dark:bg-discord-blurple">{req.username?.charAt(0)?.toUpperCase() ?? '?'}</div>}
                      <div className="min-w-0 flex-1 text-left"><h4 className="m-0 truncate font-bold text-gray-950 dark:text-white">{req.username}</h4><p className="mt-0.5 truncate text-xs text-gray-500 dark:text-discord-muted">Muốn kết nối với bạn</p></div>
                      <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                        <button onClick={() => handleAccept(req.id)} disabled={actionLoadingId === req.id} className="inline-flex min-w-[86px] flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:flex-none">{actionLoadingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đồng ý'}</button>
                        <button onClick={() => handleReject(req.id)} disabled={actionLoadingId === req.id} className="inline-flex min-w-[86px] flex-1 items-center justify-center rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 sm:flex-none dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">Từ chối</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-3"><h3 className="m-0 text-sm font-bold text-slate-700 dark:text-zinc-200">Mời vào nhóm</h3><div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" /></div>
              {visibleGroupInvitations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center dark:border-zinc-800 dark:bg-discord-mid">
                  <p className="m-0 text-sm text-gray-500 dark:text-discord-muted">{searchQuery ? 'Không tìm thấy lời mời nhóm phù hợp.' : 'Không có lời mời vào nhóm nào.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleGroupInvitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-discord-mid"
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

                      <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                        <button
                          onClick={() => handleAcceptGroupInvite(invite.id)}
                          disabled={actionLoadingId === invite.id}
                          className="inline-flex min-w-[86px] flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 sm:flex-none"
                          title="Chấp nhận"
                        >
                          {actionLoadingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đồng ý'}
                        </button>
                        <button
                          onClick={() => handleRejectGroupInvite(invite.id)}
                          disabled={actionLoadingId === invite.id}
                          className="inline-flex min-w-[86px] flex-1 items-center justify-center rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 sm:flex-none dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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
          ) : activeTab === 'sent' || activeTab === 'suggestions' ? (
            <div className="space-y-4">
              <div className="text-left">
                <h2 className="m-0 text-lg font-black text-slate-950 dark:text-white">{activeTab === 'sent' ? 'Lời mời đã gửi' : 'Khám phá'}</h2>
                <p className="mt-1 text-xs text-slate-500">{activeTab === 'sent' ? 'Những lời mời đang chờ người khác phản hồi.' : 'Những người bạn có thể biết trên NexTalk.'}</p>
              </div>
              {visibleActiveSuggestions.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-discord-mid">
                  <p className="m-0 text-sm text-gray-500 dark:text-discord-muted">{searchQuery ? 'Không tìm thấy kết quả phù hợp.' : activeTab === 'sent' ? 'Bạn chưa gửi lời mời nào.' : 'Chưa có gợi ý kết bạn.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleActiveSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-indigo-200 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-discord-mid dark:hover:border-indigo-500/30">
                      {suggestion.avatarUrl ? <img src={suggestion.avatarUrl} alt={suggestion.username} className="h-12 w-12 shrink-0 rounded-full border border-gray-200 object-cover dark:border-zinc-800" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-650 text-lg font-bold text-white dark:bg-discord-blurple">{suggestion.username?.charAt(0)?.toUpperCase() ?? '?'}</div>}
                      <div className="min-w-0 flex-1 text-left"><h4 className="m-0 truncate font-bold text-gray-950 dark:text-white">{suggestion.username}</h4><p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-550 dark:text-discord-muted"><Users className="h-4 w-4" />Có {suggestion.mutualFriendsCount} bạn chung</p></div>
                      <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                        {suggestion.isRequestSent ? (
                          <button onClick={() => handleCancelSuggestionRequest(suggestion.id)} disabled={actionLoadingId === suggestion.id} className="inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:flex-none dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-red-500/10 dark:hover:text-red-400">{actionLoadingId === suggestion.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4" />Hủy lời mời</>}</button>
                        ) : (
                          <button onClick={() => handleSendSuggestionRequest(suggestion.id)} disabled={actionLoadingId === suggestion.id} className="inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50 sm:flex-none dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20">{actionLoadingId === suggestion.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" />Kết bạn</>}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
        </div>
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
