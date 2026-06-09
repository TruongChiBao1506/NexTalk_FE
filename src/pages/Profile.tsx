import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, ShieldCheck, ShieldAlert, Loader2, Edit3, LogOut } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import EditProfileModal from '../components/profile/EditProfileModal';
import ThemeToggle from '../components/common/ThemeToggle';
import MobileBottomNav from '../components/common/MobileBottomNav';

export const Profile = () => {
  const navigate = useNavigate();
  const { profile, isLoading, error, fetchProfile } = useUserStore();
  const { logout } = useAuthStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  }, [fetchProfile]);

  return (
    <div className="relative h-dvh w-screen overflow-y-auto flex items-center justify-center p-4 pb-20 md:pb-4 bg-gradient-animate-light dark:bg-gradient-animate text-gray-900 dark:text-discord-text transition-colors duration-300">
      
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
          <span className="text-sm font-semibold">Back to Chat</span>
        </button>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl z-10 pt-20 md:pt-12">
        {/* Main profile card */}
        <div className="glass rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl dark:shadow-black/50 border border-white/20 dark:border-zinc-800/80 transition-all duration-300">
          
          {isLoading && !profile ? (
            <div className="flex flex-col items-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-discord-blurple" />
              <p className="text-sm text-gray-500 dark:text-discord-muted">Loading your profile...</p>
            </div>
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
            <div className="space-y-6">
              
              {/* Profile Card Header with Avatar */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-gray-150 dark:border-zinc-800/60">
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
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white dark:border-discord-mid" 
                    title={profile.status || 'ONLINE'} 
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
                  {profile.username}
                </h2>
                
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-md bg-gray-100 dark:bg-discord-black text-gray-650 dark:text-discord-muted border border-gray-200 dark:border-zinc-800/80 text-xs font-medium">
                  {profile.isVerified ? (
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

              {/* Bio description */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-discord-muted">Biography</span>
                <div className="bg-white/60 dark:bg-discord-black/40 p-4 rounded-2xl border border-gray-150 dark:border-zinc-900/40 min-h-[4.5rem]">
                  <p className="text-sm text-gray-700 dark:text-discord-text italic leading-relaxed m-0 break-words whitespace-pre-wrap">
                    {profile.bio ? `"${profile.bio}"` : 'No biography written yet.'}
                  </p>
                </div>
              </div>

              {/* Details table */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 sm:gap-4 rounded-2xl bg-white/50 dark:bg-discord-black/20 border border-gray-100 dark:border-zinc-900/30 text-sm text-left">
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-discord-muted shrink-0">
                    <Mail className="w-4.5 h-4.5" />
                    <span>Email Address</span>
                  </div>
                  <span className="font-semibold text-gray-950 dark:text-white break-all sm:break-normal text-left sm:text-right">{profile.email}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 sm:gap-4 rounded-2xl bg-white/50 dark:bg-discord-black/20 border border-gray-100 dark:border-zinc-900/30 text-sm text-left">
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-discord-muted shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                    <span>Date Joined</span>
                  </div>
                  <span className="font-semibold text-gray-950 dark:text-white text-left sm:text-right">
                    {new Date(profile.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Trigger Modal */}
              <button
                onClick={() => setIsEditOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.99] transition-all duration-200 shadow-md shadow-indigo-600/10 dark:shadow-discord-blurple/10"
              >
                <Edit3 className="w-4.5 h-4.5" />
                <span>Edit Profile</span>
              </button>

              {/* Log Out Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-rose-600 dark:text-rose-450 font-semibold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 focus:outline-none transition-all duration-200 disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <LogOut className="w-4.5 h-4.5" />
                )}
                <span>Log Out</span>
              </button>
            </div>
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Profile;
