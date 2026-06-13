import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { LogOut, User, CircleUserRound, ShieldAlert, ShieldCheck, Mail, Calendar, MessageSquare } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';

export const ChatPlaceholder = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('nextalk_refreshToken');
      if (refreshToken) {
        // Call backend logout API to invalidate the refresh token
        await authService.logout(refreshToken);
      }
    } catch (err: any) {
      console.error('Failed to log out from server:', err);
    } finally {
      // Always logout locally even if server request fails
      logout();
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-discord-black flex text-gray-900 dark:text-discord-text transition-colors duration-300">
      
      {/* Sidebar Navigation Mock */}
      <aside className="w-16 md:w-20 bg-gray-200 dark:bg-zinc-950 flex flex-col items-center py-4 border-r border-gray-300 dark:border-zinc-900/50">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-discord-blurple flex items-center justify-center text-white mb-6 cursor-pointer hover:rounded-xl transition-all duration-300 shadow-md">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div 
          onClick={() => navigate('/friends')}
          className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Friends List"
        >
          <User className="w-5 h-5" />
        </div>
        <div 
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 flex flex-col justify-start max-w-4xl mx-auto space-y-6">
        
        {/* Header section */}
        <header className="flex justify-between items-center pb-5 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold m-0 text-left text-gray-900 dark:text-white">NexTalk Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-discord-muted mt-1 text-left">Phase 1: Authentication Completed Successfully</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 dark:border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-500 animate-pulse" />
            Authenticated
          </div>
        </header>

        {/* User Card */}
        {user ? (
          <section className="bg-white dark:bg-discord-mid rounded-3xl p-6 md:p-8 shadow-md dark:shadow-black/20 border border-gray-150 dark:border-zinc-850 flex flex-col md:flex-row gap-6 md:gap-8 items-center text-center md:text-left transition-all duration-300">
            {/* Avatar */}
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-zinc-850"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 dark:bg-discord-blurple flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online badge */}
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white dark:border-discord-mid" title="Online" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
                    {user.username}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-discord-black text-gray-600 dark:text-discord-muted border border-gray-200 dark:border-zinc-800 text-xs font-medium self-start md:self-auto">
                    {user.isVerified ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Verified Account</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>Unverified Account</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 dark:text-discord-muted mt-1 text-sm flex items-center justify-center md:justify-start gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>

              {user.bio && (
                <div className="bg-gray-50 dark:bg-discord-black/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-900/50">
                  <p className="text-sm italic text-gray-650 dark:text-discord-text/90">
                    "{user.bio}"
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1.5">
                <div className="text-xs text-gray-400 dark:text-discord-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-discord-blurple border border-indigo-500/20 transition-all duration-200"
                >
                  Manage Profile
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white dark:bg-discord-mid rounded-3xl p-8 border border-gray-150 dark:border-zinc-850 text-center">
            <p className="text-gray-500 dark:text-discord-muted">No active user session found.</p>
          </section>
        )}

        {/* Phase progress list */}
        <section className="bg-white dark:bg-discord-mid rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 dark:border-zinc-850 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0 text-left">Phase 1 Authentication Deliverables Checklist</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left text-sm">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓</span>
              <span className="text-gray-800 dark:text-zinc-200">Register with Email Validation</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓</span>
              <span className="text-gray-800 dark:text-zinc-200">Login with Form & Zod Validation</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓</span>
              <span className="text-gray-800 dark:text-zinc-200">Silently Refresh Access Tokens</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓</span>
              <span className="text-gray-800 dark:text-zinc-200">Protected Routes Route Guards</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 col-span-1 md:col-span-2">
              <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓</span>
              <span className="text-gray-800 dark:text-zinc-200">Logout API Invalidation & Session Purge</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChatPlaceholder;
