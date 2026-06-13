import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User as UserIcon, CircleUserRound, LogOut, UserMinus, Loader2, AlertCircle, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFriendStore } from '../store/friendStore';
import { useGroupStore } from '../store/groupStore';
import { authService } from '../services/authService';
import ThemeToggle from '../components/common/ThemeToggle';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useChatStore } from '../store/chatStore';
import { formatRelativeTime } from '../utils/time';
import MobileBottomNav from '../components/common/MobileBottomNav';

type ActiveTab = 'friends' | 'groups' | 'pending' | 'chat_requests';

export const Friends = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const {
    friends,
    pending,
    isLoading: isStoreLoading,
    error: storeError,
    fetchFriends,
    fetchPending,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriendStore();
  const {
    groups,
    isLoading: isGroupLoading,
    error: groupError,
    fetchGroups,
  } = useGroupStore();

  const { getOrCreatePrivateConversation, fetchConversations, selectConversation } = useChatStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [chatRequests] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [removeFriendConfirm, setRemoveFriendConfirm] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    fetchConversations();
    fetchPending();
    if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [activeTab, fetchConversations, fetchFriends, fetchGroups, fetchPending]);

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
      const refreshToken = localStorage.getItem('nextalk_refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err) {
      console.error('Failed to log out from server:', err);
    } finally {
      logout();
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-gray-100 dark:bg-discord-black flex text-gray-900 dark:text-discord-text transition-colors duration-300">
      <aside className="hidden md:flex w-16 md:w-20 bg-gray-200 dark:bg-zinc-950 flex-col items-center py-4 border-r border-gray-300 dark:border-zinc-900/50 shrink-0">
        <div
          onClick={() => navigate('/chat')}
          className="w-12 h-12 rounded-2xl bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-6 cursor-pointer hover:bg-indigo-650 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300 shadow-md"
          title="Chat Home"
        >
          <MessageSquare className="w-6 h-6" />
        </div>
        <div
          onClick={() => setActiveTab('friends')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 cursor-pointer transition-all duration-300 ${
            activeTab !== 'pending'
              ? 'bg-indigo-600 dark:bg-discord-blurple text-white'
              : 'bg-gray-300 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white'
          }`}
          title="Friends List"
        >
          <UserIcon className="w-5 h-5" />
        </div>
        <div
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Hồ sơ"
        >
          <CircleUserRound className="w-5 h-5" />
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-450 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white hover:rounded-xl transition-all duration-300 disabled:opacity-50"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto p-4 md:p-8 pb-20 md:pb-8 space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-250 dark:border-zinc-800 gap-4">
          <div>
            <h2 className="text-2xl font-bold m-0 text-left text-gray-900 dark:text-white">Bạn bè</h2>
            <p className="text-sm text-gray-500 dark:text-discord-muted mt-1 text-left">
              Quản lý bạn bè và lời mời kết bạn. Tìm người mới bằng ô tìm kiếm ở trang Chat.
            </p>
          </div>

          <div className="flex flex-wrap bg-gray-200 dark:bg-discord-dark/50 p-1.5 rounded-xl border border-gray-300/40 dark:border-zinc-850/60 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'friends'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tất cả bạn bè ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === 'groups'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Nhóm ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold relative transition-all duration-200 ${
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
          </div>
        </header>

        {(storeError || groupError) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-left flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{storeError || groupError}</span>
          </div>
        )}

        <div className="flex-1 w-full">
          {(isStoreLoading || isGroupLoading) && friends.length === 0 && pending.length === 0 && groups.length === 0 ? (
            <div className="flex flex-col items-center py-16 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-discord-blurple" />
              <p className="text-sm text-gray-500 dark:text-discord-muted">Đang tải kết nối...</p>
            </div>
          ) : activeTab === 'friends' ? (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
                  <p className="text-gray-500 dark:text-discord-muted m-0">Chưa có bạn bè.</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:opacity-90 transition-all duration-250"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Tìm bạn trong Chat</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-white dark:bg-discord-mid rounded-2xl p-4 border border-gray-150 dark:border-zinc-850 shadow-sm flex items-center gap-4 transition-all duration-200 hover:shadow-md"
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
                          className="p-2 rounded-xl text-indigo-600 dark:text-discord-blurple hover:bg-indigo-600/10 dark:hover:bg-discord-blurple/10 active:scale-95 transition-all duration-200"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white dark:bg-discord-mid rounded-2xl p-4 border border-gray-150 dark:border-zinc-850 shadow-sm flex items-center gap-4 transition-all duration-200 hover:shadow-md"
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
                        onClick={() => handleOpenGroupChat(group.id, group.conversationId)}
                        disabled={!group.conversationId || actionLoadingId === group.id}
                        className="p-2 rounded-xl text-indigo-600 dark:text-discord-blurple hover:bg-indigo-600/10 dark:hover:bg-discord-blurple/10 active:scale-95 transition-all duration-200 disabled:opacity-45"
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
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
              <p className="text-gray-500 dark:text-discord-muted m-0">
                {chatRequests.length === 0 ? 'Không có tin nhắn chờ nào.' : `${chatRequests.length} tin nhắn chờ`}
              </p>
            </div>
          )}
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
      <MobileBottomNav />
    </div>
  );
};

export default Friends;
