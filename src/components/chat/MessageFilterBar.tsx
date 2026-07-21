import React from 'react';

interface MessageFilterBarProps {
  filter: 'ALL' | 'MEDIA' | 'FILE' | 'LINK';
  setFilter: (filter: 'ALL' | 'MEDIA' | 'FILE' | 'LINK') => void;
}

export const MessageFilterBar: React.FC<MessageFilterBarProps> = ({ filter, setFilter }) => {
  const options = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'MEDIA', label: 'Hình ảnh & Video' },
    { id: 'FILE', label: 'Tài liệu' },
    { id: 'LINK', label: 'Link' },
  ] as const;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-10 dark:border-zinc-800/60 dark:bg-discord-dark/50 shadow-sm shrink-0 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        .filter-bar-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="flex items-center gap-2 filter-bar-scroll min-w-max">
        {options.map((opt) => {
          const isActive = filter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 select-none ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
