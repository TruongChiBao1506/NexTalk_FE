import { MessageSquare, User, CircleUserRound, LogOut } from 'lucide-react';
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
    <aside className="hidden md:flex w-16 md:w-18 bg-gray-250 dark:bg-zinc-950 flex-col items-center py-4 border-r border-gray-300 dark:border-zinc-900/50 shrink-0">
      <div className="w-11 h-11 rounded-2xl bg-indigo-650 dark:bg-discord-blurple flex items-center justify-center text-white mb-6 shadow-md transition-all duration-300">
        <MessageSquare className="w-5 h-5" />
      </div>

      <div
        onClick={() => navigate('/friends')}
        className="relative w-11 h-11 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
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
        className="w-11 h-11 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
        title="Hồ sơ"
      >
        <CircleUserRound className="w-5 h-5" />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-450 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white hover:rounded-xl transition-all duration-300 disabled:opacity-50"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
