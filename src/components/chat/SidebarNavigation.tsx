import { User, CircleUserRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

interface SidebarNavigationProps {
  pendingCount: number;
  handleLogout: () => void;
  isLoggingOut: boolean;
}

export const SidebarNavigation = ({
  pendingCount,
  handleLogout,
  isLoggingOut,
}: SidebarNavigationProps) => {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-16 md:w-18 flex-col items-center py-4 border-r shrink-0">
      <div className="w-11 h-11 rounded-2xl bg-white/75 dark:bg-zinc-900/70 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mb-6 shadow-sm ring-1 ring-indigo-100 dark:ring-zinc-800 transition-all duration-300">
        <span className="text-sm font-black">N</span>
      </div>

      <div
        onClick={() => navigate('/friends')}
        className="relative w-11 h-11 rounded-2xl bg-white/55 dark:bg-zinc-900/60 flex items-center justify-center text-slate-600 dark:text-zinc-300 mb-3 cursor-pointer hover:bg-indigo-600 hover:text-white dark:hover:bg-discord-blurple transition-all duration-300"
        title="Friends List"
      >
        <User className="w-5 h-5" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-gray-250 dark:ring-zinc-950">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </div>

      <div
        onClick={() => navigate('/profile')}
        className="w-11 h-11 rounded-2xl bg-white/55 dark:bg-zinc-900/60 flex items-center justify-center text-slate-600 dark:text-zinc-300 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white transition-all duration-300"
        title="Hồ sơ"
      >
        <CircleUserRound className="w-5 h-5" />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-11 h-11 rounded-2xl bg-white/55 dark:bg-zinc-900/60 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all duration-300 disabled:opacity-50"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
