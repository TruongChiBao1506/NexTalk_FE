import React, { useEffect, useRef, useState } from 'react';
import { Tag as TagIcon, ChevronDown, UserX, Settings } from 'lucide-react';
import type { ConversationTag } from '../../services/conversationTagService';

interface ConversationTagDropdownProps {
  tags: ConversationTag[];
  selectedTagIds: string[];
  filterStrangers: boolean;
  onToggleTag: (tagId: string) => void;
  onToggleFilterStrangers: () => void;
  onOpenManageModal: () => void;
}

export const ConversationTagDropdown: React.FC<ConversationTagDropdownProps> = ({
  tags,
  selectedTagIds,
  filterStrangers,
  onToggleTag,
  onToggleFilterStrangers,
  onOpenManageModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalActiveFilters = selectedTagIds.length + (filterStrangers ? 1 : 0);

  return (
    <div className="relative inline-block text-left select-none" ref={dropdownRef}>
      {/* Main Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
          totalActiveFilters > 0
            ? 'bg-indigo-50 text-indigo-650 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
            : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800'
        }`}
      >
        <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
        <span>Phân loại</span>
        {totalActiveFilters > 0 && (
          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
            {totalActiveFilters}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown matching Zalo UI screenshot */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800/60 mb-1">
            Theo thẻ phân loại
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {tags.map((tag) => {
              const isChecked = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggleTag(tag.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  {/* Tag Tag Icon */}
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-sm transform rotate-45"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 truncate text-gray-800 dark:text-zinc-200">{tag.name}</span>
                </button>
              );
            })}

            {/* Stranger Messages Filter Item */}
            <button
              type="button"
              onClick={onToggleFilterStrangers}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition"
            >
              <input
                type="checkbox"
                checked={filterStrangers}
                onChange={() => {}}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <UserX className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="flex-1 truncate text-gray-800 dark:text-zinc-200">Tin nhắn từ người lạ</span>
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-800 pt-1.5 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenManageModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Quản lý thẻ phân loại</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
