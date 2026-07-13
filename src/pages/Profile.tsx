import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Cake, Bell, BellOff, ShieldCheck, ShieldAlert, Loader2, Edit3, LogOut, Lock, Trash2, Monitor, MapPin, X } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { SessionResponse } from '../services/authService';
import EditProfileModal from '../components/profile/EditProfileModal';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import ThemeToggle from '../components/common/ThemeToggle';
import MobileBottomNav from '../components/common/MobileBottomNav';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { userService } from '../services/userService';
import { useChatStore } from '../store/chatStore';
import { ProfileSkeleton } from '../components/common/Skeleton';
import { PinSetupModal } from '../components/chat/PinSetupModal';
import { ProfileDashboard } from '../components/profile/ProfileDashboard';

export const Profile = () => {
  const navigate = useNavigate();
  const { profile, isLoading, error, fetchProfile, updateProfile } = useUserStore();
  const { logout } = useAuthStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmResetPinOpen, setIsConfirmResetPinOpen] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [isPinInputModalOpen, setIsPinInputModalOpen] = useState(false);
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetPinError, setResetPinError] = useState('');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);

  const formatProfileDate = (date?: string | null) => {
    if (!date) return 'Chưa có dữ liệu';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'Chưa có dữ liệu';
    return parsed.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchProfile();
    loadSessions();
  }, [fetchProfile]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await authService.getSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const formatSessionDate = (date?: string | null) => {
    if (!date) return 'Chưa rõ';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'Chưa rõ';
    return parsed.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await authService.revokeSession(sessionId);
      if (response.success) {
        setSessions((current) => current.filter((session) => session.id !== sessionId));
        const currentRefreshToken = localStorage.getItem('nextalk_refreshToken');
        if (sessions.length === 1 && currentRefreshToken) {
          logout();
          navigate('/login');
        }
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'Không thể đăng xuất thiết bị này.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-gradient-animate-light px-4 pb-24 pt-20 text-gray-900 transition-colors duration-300 dark:bg-gradient-animate dark:text-discord-text md:px-8 md:pb-16 md:pt-20">

      {/* Background glow ornaments */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Floating Header controls */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span className="text-sm font-semibold">Quay về</span>
        </button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Main profile card */}
        <div className="rounded-3xl transition-all duration-300">

          {isLoading && !profile ? (
            <ProfileSkeleton />
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-sm max-w-sm mx-auto">
                {error}
              </div>
              <button
                onClick={() => fetchProfile()}
                className="py-2 px-4 rounded-xl text-white bg-indigo-650 dark:bg-discord-blurple text-sm font-semibold hover:opacity-90 transition-all duration-200"
              >
                Retry Load
              </button>
            </div>
          ) : profile ? (
            <>
            <ProfileDashboard
              profile={profile}
              sessionCount={sessions.length}
              isLoggingOut={isLoggingOut}
              onBack={() => navigate('/chat')}
              onEdit={() => setIsEditOpen(true)}
              onChangePassword={() => setIsChangePasswordOpen(true)}
              onManageSessions={() => { setIsSessionsModalOpen(true); void loadSessions(); }}
              onSetupPin={() => setIsPinSetupOpen(true)}
              onDeletePin={() => { setResetPinInput(''); setResetPinError(''); setIsPinInputModalOpen(true); }}
              onLogout={() => void handleLogout()}
               onUpdateSetting={updateProfile}
            />
            <div className="hidden">

              {/* Profile Card Header with Avatar */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-150 dark:border-zinc-800/60 md:row-span-7 md:self-start md:border-b-0 md:border-r md:pb-0 md:pr-6 dark:md:border-zinc-800/60">
                <div className="relative group mb-4">
                  {profile.avatarUrl ? (
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-discord-mid shadow-lg">
                      {profile.avatarUrl.endsWith('.svg') ? (
                        <object
                          data={profile.avatarUrl}
                          type="image/svg+xml"
                          className="w-full h-full object-cover"
                          aria-label="Profile Avatar"
                        />
                      ) : (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-indigo-600 dark:bg-discord-blurple flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status Indicator */}
                  <span
                    className={`absolute bottom-1.5 right-1.5 h-6 w-6 rounded-full border-4 border-white dark:border-discord-mid ${profile.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-400'}`}
                    title={profile.status === 'ONLINE' ? 'Đang online' : 'Đang offline'}
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
                  {profile.username}
                </h2>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-md bg-gray-100 dark:bg-discord-black text-gray-650 dark:text-discord-muted border border-gray-200 dark:border-zinc-800/80 text-xs font-medium">
                  {profile.isVerified ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tài khoản đã xác minh</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tài khoản chưa xác minh</span>
                    </>
                  )}
                </div>

                <div className="mt-6 flex w-full flex-col gap-3">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.99] transition-all duration-200 shadow-md shadow-indigo-600/10 dark:shadow-discord-blurple/10"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>

                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-gray-700 dark:text-zinc-300 font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 active:scale-[0.99] transition-all duration-200"
                  >
                    <Lock className="w-4.5 h-4.5" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-rose-600 dark:text-rose-450 font-semibold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 focus:outline-none transition-all duration-200 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <LogOut className="w-4.5 h-4.5" />
                    )}
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>

              {/* Bio description */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-discord-muted">Giới thiệu bản thân</span>
                <div className="bg-white/60 dark:bg-discord-black/40 p-3.5 rounded-2xl border border-gray-150 dark:border-zinc-900/40 min-h-[3.75rem]">
                  <p className="text-sm text-gray-700 dark:text-discord-text italic leading-relaxed m-0 break-words whitespace-pre-wrap">
                    {profile.bio ? `"${profile.bio}"` : 'Chưa có giới thiệu'}
                  </p>
                </div>
              </div>

              {/* Details table */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/50 p-3 text-left dark:border-zinc-900/30 dark:bg-discord-black/20">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="m-0 text-sm font-bold text-gray-900 dark:text-white">Thiết bị đăng nhập</h3>
                    <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                      {isLoadingSessions ? 'Đang tải phiên...' : `${sessions.length} phiên đang còn hiệu lực`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionsModalOpen(true);
                    loadSessions();
                  }}
                  className="shrink-0 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Quản lý
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 sm:gap-4 rounded-2xl bg-white/50 dark:bg-discord-black/20 border border-gray-100 dark:border-zinc-900/30 text-sm text-left">
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-discord-muted shrink-0">
                    <Mail className="w-4.5 h-4.5" />
                    <span>Địa chỉ email</span>
                  </div>
                  <span className="font-semibold text-gray-950 dark:text-white break-all sm:break-normal text-left sm:text-right">{profile.email}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 sm:gap-4 rounded-2xl bg-white/50 dark:bg-discord-black/20 border border-gray-100 dark:border-zinc-900/30 text-sm text-left">
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-discord-muted shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                    <span>Ngày tham gia</span>
                  </div>
                  <span className="font-semibold text-gray-950 dark:text-white text-left sm:text-right">
                    {new Date(profile.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-gray-100 bg-white/50 p-3 text-left text-sm dark:border-zinc-900/30 dark:bg-discord-black/20 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex shrink-0 items-center gap-2.5 text-gray-500 dark:text-discord-muted">
                    {profile.blockStrangerMessages ? <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" /> : <ShieldAlert className="h-4.5 w-4.5" />}
                    <div>
                      <span className="block">Chỉ nhận tin nhắn từ bạn bè</span>
                      <span className="block text-xs text-gray-400">Người lạ phải kết bạn trước khi nhắn tin</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => void updateProfile({ blockStrangerMessages: !profile.blockStrangerMessages })} className={`rounded-full px-4 py-2 text-xs font-bold text-white transition ${profile.blockStrangerMessages ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 hover:bg-gray-500'}`}>
                    {profile.blockStrangerMessages ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-gray-100 bg-white/50 p-3 text-left text-sm dark:border-zinc-900/30 dark:bg-discord-black/20 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex shrink-0 items-center gap-2.5 text-gray-500 dark:text-discord-muted">
                    <Cake className="h-4.5 w-4.5" />
                    <span>Ngày sinh</span>
                  </div>
                  <span className="font-semibold text-gray-950 dark:text-white sm:text-right">{formatProfileDate(profile.birthday)}</span>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-gray-100 bg-white/50 p-3 text-left text-sm dark:border-zinc-900/30 dark:bg-discord-black/20 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex shrink-0 items-center gap-2.5 text-gray-500 dark:text-discord-muted">
                    {profile.showActivityStatus !== false ? <Monitor className="h-4.5 w-4.5 text-emerald-500" /> : <Monitor className="h-4.5 w-4.5" />}
                    <div>
                      <span className="block">Trạng thái hoạt động</span>
                      <span className="block text-xs text-gray-400">Hiển thị Online và hoạt động gần đây</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => void updateProfile({ showActivityStatus: profile.showActivityStatus === false })} className={`rounded-full px-4 py-2 text-xs font-bold text-white transition ${profile.showActivityStatus !== false ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
                    {profile.showActivityStatus !== false ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-gray-100 bg-white/50 p-3 text-left text-sm dark:border-zinc-900/30 dark:bg-discord-black/20 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex shrink-0 items-center gap-2.5 text-gray-500 dark:text-discord-muted">
                    {profile.enableBirthdayNotification !== false ? <Bell className="h-4.5 w-4.5 text-indigo-500" /> : <BellOff className="h-4.5 w-4.5" />}
                    <span>Thông báo sinh nhật</span>
                  </div>
                  <span className={`font-semibold sm:text-right ${profile.enableBirthdayNotification !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'}`}>
                    {profile.enableBirthdayNotification !== false ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </div>

                {!profile.hasChatPin && (
                  <div className="flex flex-col justify-between gap-2 rounded-2xl border border-gray-100 bg-white/50 p-3 text-left text-sm dark:border-zinc-900/30 dark:bg-discord-black/20 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex shrink-0 items-center gap-2.5 text-gray-500 dark:text-discord-muted">
                      <Lock className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Chat PIN</span>
                    </div>
                    <button type="button" onClick={() => setIsPinSetupOpen(true)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                      Thiết lập PIN
                    </button>
                  </div>
                )}

                {profile.hasChatPin && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 sm:gap-4 rounded-2xl bg-white/50 dark:bg-discord-black/20 border border-gray-100 dark:border-zinc-900/30 text-sm text-left">
                    <div className="flex items-center gap-2.5 text-gray-500 dark:text-discord-muted shrink-0">
                      <Lock className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Khóa ẩn trò chuyện</span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đã thiết lập PIN</span>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPinInput('');
                          setResetPinError('');
                          setIsPinInputModalOpen(true);
                        }}
                        disabled={isResettingPin}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded-xl border border-rose-200/40 dark:border-rose-900/30 transition disabled:opacity-50"
                      >
                        {isResettingPin ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span>Xóa mã PIN</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-sm font-bold text-gray-900 dark:text-white">Thiết bị đăng nhập</h3>
                    <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Quản lý các phiên đang còn hiệu lực.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadSessions}
                    disabled={isLoadingSessions}
                    className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    {isLoadingSessions ? 'Đang tải' : 'Làm mới'}
                  </button>
                </div>

                <div className="space-y-2">
                  {isLoadingSessions && sessions.length === 0 ? (
                    <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/50 py-6 text-sm text-gray-500 dark:border-zinc-900/30 dark:bg-discord-black/20 dark:text-zinc-400">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải thiết bị...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-white/50 p-4 text-sm text-gray-500 dark:border-zinc-900/30 dark:bg-discord-black/20 dark:text-zinc-400">
                      Chưa có phiên đăng nhập nào.
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-gray-100 bg-white/55 p-3.5 text-left dark:border-zinc-900/30 dark:bg-discord-black/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <Monitor className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="m-0 truncate text-sm font-bold text-gray-950 dark:text-white">{session.deviceName || 'Thiết bị không xác định'}</p>
                                <p className="m-0 mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">{session.userAgent || 'Không có thông tin trình duyệt'}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(session.id)}
                                disabled={revokingSessionId === session.id}
                                className="shrink-0 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                              >
                                {revokingSessionId === session.id ? 'Đang thoát' : 'Đăng xuất'}
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {session.ipAddress || 'Không rõ IP'}
                              </span>
                              <span>Lần dùng gần nhất: {formatSessionDate(session.lastUsedAt || session.createdAt)}</span>
                              <span>Hết hạn: {formatSessionDate(session.expiresAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
            </>
          ) : null}

        </div>
      </div>

      {/* Render Edit Profile Modal */}
      {isEditOpen && profile && (
        <EditProfileModal
          user={profile}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isPinSetupOpen && (
        <PinSetupModal
          pendingHideId={null}
          onClose={() => setIsPinSetupOpen(false)}
          onSuccess={() => {
            setIsPinSetupOpen(false);
            void fetchProfile();
          }}
        />
      )}

      {/* Render Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}

      {/* Confirm PIN reset dialog */}
      <ConfirmDialog
        isOpen={isConfirmResetPinOpen}
        title="Xóa mã PIN ẩn cuộc trò chuyện?"
        description="Nếu xóa mã PIN, toàn bộ tin nhắn trong các cuộc trò chuyện bị ẩn sẽ bị xóa sạch hoàn toàn (không thể khôi phục) và các cuộc trò chuyện đó sẽ tự động hiển thị lại ở danh sách chính. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Xóa mã PIN"
        variant="danger"
        isLoading={isResettingPin}
        onCancel={() => {
          if (!isResettingPin) {
            setIsConfirmResetPinOpen(false);
          }
        }}
        onConfirm={async () => {
          setIsResettingPin(true);
          try {
            const res = await userService.resetChatPin();
            if (res.success) {
              useAuthStore.getState().updateUser(res.data);
              await fetchProfile();
              useChatStore.getState().fetchConversations();
              setIsConfirmResetPinOpen(false);
            } else {
              window.alert(res.message || 'Lỗi khi xóa mã PIN.');
            }
          } catch (err: any) {
            window.alert(err.response?.data?.message || 'Không thể xóa mã PIN.');
          } finally {
            setIsResettingPin(false);
          }
        }}
      />

      {/* Pin Input Reset Modal */}
      {isPinInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPinInputModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Xóa mã PIN ẩn trò chuyện</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 text-center">
              Nhập mã PIN hiện tại của bạn để tiếp tục. Các cuộc trò chuyện sẽ được bỏ ẩn và KHÔNG bị mất tin nhắn.
            </p>
            
            <div className="flex justify-center mb-6">
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`reset-pin-${index}`}
                    type="password"
                    maxLength={1}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={resetPinInput[index] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val) {
                        const newVal = resetPinInput.substring(0, index) + val + resetPinInput.substring(index + 1);
                        setResetPinInput(newVal.slice(0, 4));
                        setResetPinError('');
                        if (index < 3) {
                          document.getElementById(`reset-pin-${index + 1}`)?.focus();
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        if (!resetPinInput[index] && index > 0) {
                          const newVal = resetPinInput.substring(0, index - 1) + resetPinInput.substring(index);
                          setResetPinInput(newVal);
                          document.getElementById(`reset-pin-${index - 1}`)?.focus();
                        } else {
                          const newVal = resetPinInput.substring(0, index) + resetPinInput.substring(index + 1);
                          setResetPinInput(newVal);
                        }
                        setResetPinError('');
                      }
                    }}
                  />
                ))}
              </div>
            </div>
            
            {resetPinError && (
              <p className="text-sm text-rose-500 text-center mt-2 mb-4 font-medium">{resetPinError}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                disabled={resetPinInput.length !== 4 || isResettingPin}
                onClick={async () => {
                  setIsResettingPin(true);
                  setResetPinError('');
                  try {
                    const res = await userService.resetChatPin(resetPinInput);
                    if (res.success) {
                      useAuthStore.getState().updateUser(res.data);
                      await fetchProfile();
                      useChatStore.getState().fetchConversations();
                      setIsPinInputModalOpen(false);
                      setResetPinInput('');
                    } else {
                      setResetPinError(res.message || 'Mã PIN không chính xác.');
                    }
                  } catch (err: any) {
                    setResetPinError(err.response?.data?.message || 'Mã PIN không chính xác.');
                  } finally {
                    setIsResettingPin(false);
                  }
                }}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isResettingPin && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                Xác nhận xóa
              </button>
              
              <button
                onClick={() => {
                  setIsPinInputModalOpen(false);
                  setIsConfirmResetPinOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl text-gray-700 dark:text-zinc-300 font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
              >
                Quên mã PIN?
              </button>
            </div>
            
            <button
              onClick={() => setIsPinInputModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isSessionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSessionsModalOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-zinc-800">
              <div className="min-w-0">
                <h3 className="m-0 text-lg font-bold text-gray-950 dark:text-white">Thiết bị đăng nhập</h3>
                <p className="m-0 mt-1 text-sm text-gray-500 dark:text-zinc-400">
                  Quản lý các phiên đang còn hiệu lực trên tài khoản của bạn.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={loadSessions}
                  disabled={isLoadingSessions}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {isLoadingSessions && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Làm mới
                </button>
                <button
                  type="button"
                  onClick={() => setIsSessionsModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] space-y-2 overflow-y-auto p-4">
              {isLoadingSessions && sessions.length === 0 ? (
                <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-8 text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải thiết bị...
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  Chưa có phiên đăng nhập nào.
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-left dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                        <Monitor className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-bold text-gray-950 dark:text-white">
                              {session.deviceName || 'Thiết bị không xác định'}
                            </p>
                            <p className="m-0 mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">
                              {session.userAgent || 'Không có thông tin trình duyệt'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingSessionId === session.id}
                            className="shrink-0 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          >
                            {revokingSessionId === session.id ? 'Đang thoát' : 'Đăng xuất'}
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {session.ipAddress || 'Không rõ IP'}
                          </span>
                          <span>Lần dùng gần nhất: {formatSessionDate(session.lastUsedAt || session.createdAt)}</span>
                          <span>Hết hạn: {formatSessionDate(session.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Profile;
