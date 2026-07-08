import { Search } from 'lucide-react';

interface SidebarSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const SidebarSearch = ({ searchQuery, setSearchQuery }: SidebarSearchProps) => {
  return (
    <div className="px-3 py-2.5 shrink-0">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm người, nhóm, tin nhắn..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/72 dark:bg-zinc-900/70 text-sm px-9 py-2 rounded-xl border border-indigo-100/80 dark:border-zinc-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition"
        />
      </div>
    </div>
  );
};
