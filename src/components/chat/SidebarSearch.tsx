import { Search } from 'lucide-react';

interface SidebarSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const SidebarSearch = ({ searchQuery, setSearchQuery }: SidebarSearchProps) => {
  return (
    <div className="px-3 py-2.5 shrink-0">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm người, nhóm, tin nhắn, file..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-100 dark:bg-zinc-800/80 text-sm px-9 py-2 rounded-full border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
        />
      </div>
    </div>
  );
};
