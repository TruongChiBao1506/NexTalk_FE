import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User as UserIcon, Settings, LogOut, Search, Check, X, UserMinus, UserPlus, Loader2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFriendStore } from '../store/friendStore';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import type { User } from '../types/auth';
import ThemeToggle from '../components/common/ThemeToggle';
import { useChatStore } from '../store/chatStore';
import { formatRelativeTime } from '../utils/time';
import MobileBottomNav from '../components/common/MobileBottomNav';

type ActiveTab = 'friends' | 'pending' | 'add_friend';

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
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend
  } = useFriendStore();

  const { getOrCreatePrivateConversation } = useChatStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');

  // Search user states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Action status states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [requestSentIds, setRequestSentIds] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'pending') {
      fetchPending();
    }
  }, [activeTab, fetchFriends, fetchPending]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const response = await userService.searchUser(searchQuery.trim());
      if (response.success && response.data && response.data.length > 0) {
        setSearchResult(response.data[0]);
      } else {
        setSearchError(response.message || 'No user found matching that username or email.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'No user found matching that username or email.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    setActionLoadingId(receiverId);
    const success = await sendFriendRequest(receiverId);
    if (success) {
      setRequestSentIds((prev) => [...prev, receiverId]);
    }
    setActionLoadingId(null);
  };

  const handleAccept = async (senderId: string) => {
    setActionLoadingId(senderId);
    await acceptRequest(senderId);
    setActionLoadingId(null);
  };

  const handleReject = async (senderId: string) => {
    setActionLoadingId(senderId);
    await rejectRequest(senderId);
    setActionLoadingId(null);
  };

  const handleRemove = async (friendId: string) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      setActionLoadingId(friendId);
      await removeFriend(friendId);
      setActionLoadingId(null);
    }
  };

  const handleStartChat = async (friendId: string) => {
    setActionLoadingId(friendId);
    const conversation = await getOrCreatePrivateConversation(friendId);
    setActionLoadingId(null);
    if (conversation) {
      navigate('/chat');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('nextalk_refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err: any) {
      console.error('Failed to log out from server:', err);
    } finally {
      logout();
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-gray-100 dark:bg-discord-black flex text-gray-900 dark:text-discord-text transition-colors duration-300">

      {/* Sidebar Navigation */}
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
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 cursor-pointer transition-all duration-300 ${activeTab !== 'add_friend' && activeTab !== 'pending'
            ? 'bg-indigo-600 dark:bg-discord-blurple text-white rounded-xl'
            : 'bg-gray-300 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl'
            }`}
          title="Friends List"
        >
          <UserIcon className="w-5 h-5" />
        </div>
        <div
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Settings & Profile"
        >
          <Settings className="w-5 h-5" />
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

      {/* Main Content Container */}
      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto p-4 md:p-8 pb-20 md:pb-8 space-y-6">

        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-250 dark:border-zinc-800 gap-4">
          <div>
            <h2 className="text-2xl font-bold m-0 text-left text-gray-900 dark:text-white">Hệ thống bạn bè</h2>
            <p className="text-sm text-gray-500 dark:text-discord-muted mt-1 text-left">Quản lý lời mời, chấp nhận kết nối và thêm bạn bè.</p>
          </div>

          {/* Sub-navigation tabs */}
          <div className="flex bg-gray-200 dark:bg-discord-dark/50 p-1.5 rounded-xl border border-gray-300/40 dark:border-zinc-850/60 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'friends'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Tất cả bạn bè ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold relative transition-all duration-200 ${activeTab === 'pending'
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
              onClick={() => setActiveTab('add_friend')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'add_friend'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Thêm bạn
            </button>
          </div>
        </header>

        {/* Status Messages */}
        {storeError && activeTab !== 'add_friend' && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-left flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{storeError}</span>
          </div>
        )}

        {/* Tab content wrapper */}
        <div className="flex-1 w-full">
          {isStoreLoading && friends.length === 0 && pending.length === 0 ? (
            <div className="flex flex-col items-center py-16 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-discord-blurple" />
              <p className="text-sm text-gray-500 dark:text-discord-muted">Fetching connections...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: All Friends */}
              {activeTab === 'friends' && (
                <div className="space-y-3">
                  {friends.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6">
                      <p className="text-gray-500 dark:text-discord-muted m-0">No friends added yet.</p>
                      <button
                        onClick={() => setActiveTab('add_friend')}
                        className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:opacity-90 transition-all duration-250"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Find Friends</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="bg-white dark:bg-discord-mid rounded-2xl p-4 border border-gray-150 dark:border-zinc-850 shadow-sm flex items-center gap-4 transition-all duration-200 hover:shadow-md"
                        >
                          {/* Avatar with Presence dot */}
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
                              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-discord-mid ${friend.status === 'AWAY' ? 'bg-amber-500' : friend.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'
                                }`}
                              title={friend.status}
                            />
                          </div>

                          {/* Profile Details */}
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-bold text-gray-950 dark:text-white truncate m-0">{friend.username}</h4>
                            <p className="text-xs text-gray-550 dark:text-discord-muted truncate mt-0.5">
                              {friend.status === 'OFFLINE' && friend.lastSeen ? (
                                <span className="text-gray-400 dark:text-discord-muted text-[11px]">
                                  Offline — Last seen {formatRelativeTime(friend.lastSeen)}
                                </span>
                              ) : (
                                friend.bio || "No status written."
                              )}
                            </p>
                          </div>

                          {/* Action Buttons */}
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
                              onClick={() => handleRemove(friend.id)}
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
              )}

              {/* Tab 2: Pending Requests */}
              {activeTab === 'pending' && (
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
                          {/* Sender details */}
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
                            <p className="text-xs text-gray-500 dark:text-discord-muted truncate mt-0.5">Sent you a friend invitation</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAccept(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
                              title="Accept Invitation"
                            >
                              {actionLoadingId === req.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4.5 h-4.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
                              title="Reject Invitation"
                            >
                              {actionLoadingId === req.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4.5 h-4.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Add Friend Form */}
              {activeTab === 'add_friend' && (
                <div className="space-y-6">
                  {/* Search Input Box */}
                  <form onSubmit={handleSearch} className="bg-white dark:bg-discord-mid border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90 m-0 text-left">
                      Tìm kiếm người dùng theo tên người dùng hoặc email
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Search className="h-4.5 w-4.5" />
                        </div>
                        <input
                          type="text"
                          placeholder="Nhập tên người dùng hoặc email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 focus:border-indigo-600 dark:focus:border-discord-blurple transition-all duration-200 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="py-2.5 px-5 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm shrink-0 flex items-center gap-1.5"
                      >
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Tìm</span>
                      </button>
                    </div>
                  </form>

                  {/* Search Error Alert */}
                  {searchError && (
                    <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-left flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold m-0">No Matches Found</h4>
                        <p className="text-xs mt-1 leading-relaxed text-rose-500">{searchError}</p>
                      </div>
                    </div>
                  )}

                  {/* Search Result Display */}
                  {searchResult && (
                    <div className="bg-white dark:bg-discord-mid border border-indigo-500/20 dark:border-zinc-850 rounded-3xl p-6 shadow-md animate-scale-up text-left space-y-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        {searchResult.avatarUrl ? (
                          <img
                            src={searchResult.avatarUrl}
                            alt={searchResult.username}
                            className="w-14 h-14 rounded-full object-cover border-2 border-indigo-50 dark:border-zinc-800"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-xl">
                            {searchResult.username?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-white m-0 text-base">{searchResult.username}</h4>
                            {searchResult.isVerified && (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-discord-muted truncate mt-0.5">{searchResult.email}</p>
                        </div>

                        {/* Add Action Button */}
                        <button
                          onClick={() => handleSendRequest(searchResult.id)}
                          disabled={
                            actionLoadingId === searchResult.id ||
                            requestSentIds.includes(searchResult.id)
                          }
                          className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${requestSentIds.includes(searchResult.id)
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-750 dark:bg-discord-blurple dark:hover:bg-indigo-650 text-white shadow-md'
                            }`}
                        >
                          {actionLoadingId === searchResult.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : requestSentIds.includes(searchResult.id) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {requestSentIds.includes(searchResult.id) ? 'Request Sent' : 'Add Friend'}
                          </span>
                        </button>
                      </div>

                      {searchResult.bio && (
                        <div className="bg-gray-50 dark:bg-discord-black/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-900/40">
                          <p className="text-xs text-gray-700 dark:text-zinc-350 italic m-0">"{searchResult.bio}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preset search suggestions ornament */}
                  {!searchResult && !searchError && (
                    <div className="p-6 rounded-3xl bg-indigo-50/30 dark:bg-discord-dark/20 border border-indigo-150/20 dark:border-zinc-900/30 text-left space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-750 dark:text-discord-blurple text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Hướng dẫn tìm kiếm</span>
                      </div>
                      <p className="text-xs text-gray-550 dark:text-discord-muted leading-relaxed">
                        Để thêm người dùng khác, vui lòng yêu cầu địa chỉ email hoặc tên người dùng của họ. Gõ chính xác chuỗi trong ô nhập ở trên và nhấp vào tìm kiếm.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Friends;
