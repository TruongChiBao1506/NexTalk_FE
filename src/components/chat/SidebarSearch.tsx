import { Lock, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const SidebarSearch = ({ searchQuery, setSearchQuery }: SidebarSearchProps) => {
  const hasChatPin = useAuthStore((state) => state.user?.hasChatPin);
  const isChatPinEntry = Boolean(hasChatPin && /^\d{1,4}$/.test(searchQuery));

  return (
    <div className="px-3 py-2.5 shrink-0">
      <div className="relative">
        {isChatPinEntry
          ? <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          : <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
        <input
          type={isChatPinEntry ? 'password' : 'text'}
          autoComplete="off"
          placeholder="Tìm người, nhóm, tin nhắn..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full bg-white/72 dark:bg-zinc-900/70 text-sm pl-9 ${searchQuery ? 'pr-10' : 'pr-9'} py-2 rounded-xl border border-indigo-100/80 dark:border-zinc-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition`}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Xóa nội dung tìm kiếm"
            title="Xóa nội dung tìm kiếm"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
