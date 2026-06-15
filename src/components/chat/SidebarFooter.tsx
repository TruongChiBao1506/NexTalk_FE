import type { User as AuthUser } from '../../types/auth';

interface SidebarFooterProps {
  user: AuthUser | null;
}

export const SidebarFooter = ({ user }: SidebarFooterProps) => {
  if (!user) return null;

  return (
    <div className="bg-gray-50 dark:bg-zinc-900/60 px-4 py-3 flex items-center gap-3 border-t border-gray-100 dark:border-zinc-800/60 shrink-0 text-left">
      <div className="relative shrink-0">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-[13px] font-bold truncate text-gray-900 dark:text-white m-0">{user.username}</h5>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
      </div>
    </div>
  );
};
