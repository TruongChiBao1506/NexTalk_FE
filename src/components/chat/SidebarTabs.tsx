import React from 'react';
import { ConversationTagDropdown } from './ConversationTagDropdown';
import type { ConversationTag } from '../../services/conversationTagService';

interface SidebarTabsProps {
  conversationTab?: 'chats' | 'requests';
  setConversationTab?: (val: 'chats' | 'requests') => void;
  fetchIncomingChatRequests?: () => void;
  incomingRequestsCount?: number;
  tags?: ConversationTag[];
  selectedTagIds?: string[];
  filterStrangers?: boolean;
  onToggleTag?: (tagId: string) => void;
  onToggleFilterStrangers?: () => void;
  onOpenManageModal?: () => void;
}

export const SidebarTabs = ({
  tags = [],
  selectedTagIds = [],
  filterStrangers = false,
  onToggleTag,
  onToggleFilterStrangers,
  onOpenManageModal,
}: SidebarTabsProps) => {
  return (
    <div className="px-3 pb-2 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-1">
            Trò chuyện
          </span>
        </div>

        {/* Conversation Tag Filter Dropdown */}
        {onToggleTag && onToggleFilterStrangers && onOpenManageModal && (
          <ConversationTagDropdown
            tags={tags}
            selectedTagIds={selectedTagIds}
            filterStrangers={filterStrangers}
            onToggleTag={onToggleTag}
            onToggleFilterStrangers={onToggleFilterStrangers}
            onOpenManageModal={onOpenManageModal}
          />
        )}
      </div>
    </div>
  );
};
