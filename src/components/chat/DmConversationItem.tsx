// @ts-nocheck
import React, { memo } from 'react';
import {
  Pin, PinOff, Lock, Loader2, Trash2, MoreHorizontal, AlertTriangle, BellRing, Cloud,
} from 'lucide-react';
import type { ConversationResponse, MessageResponse } from '../../types/chat';

interface DmConversationItemProps {
  c: ConversationResponse;
  friend: any;
  friendDisplayName: string;
  lastMsg: MessageResponse | undefined;
  draftPreview: string;
  isSelected: boolean;
  unreadCount: number;
  hasUnread: boolean;
  openConversationMenuId: string | null;
  conversationActionId: string | null;
  formatConversationTime: (date: string) => string;
  formatLastMessage: (msg: MessageResponse, isGroup: boolean) => React.ReactNode;
  onSelect: () => void;
  onToggleMenu: () => void;
  onTogglePin: () => void;
  onHide: () => void;
  onDelete: () => void;
}

export const DmConversationItem = memo(({
  c,
  friend,
  friendDisplayName,
  lastMsg,
  draftPreview,
  isSelected,
  unreadCount,
  hasUnread,
  openConversationMenuId,
  conversationActionId,
  formatConversationTime,
  formatLastMessage,
  onSelect,
  onToggleMenu,
  onTogglePin,
  onHide,
  onDelete,
}: DmConversationItemProps) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative mb-1.5 flex items-center gap-3 rounded-2xl px-3 py-3 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-white shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:ring-indigo-500/20'
          : 'hover:bg-white/70 hover:shadow-sm dark:hover:bg-zinc-800/50'
      }`}
    >
      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        {c.type === 'CLOUD' ? (
          <div className="w-12 h-12 rounded-full bg-discord-blurple text-white font-bold flex items-center justify-center">
            <Cloud className="w-6 h-6" fill="currentColor" />
          </div>
        ) : friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt={friendDisplayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center text-lg">
            {friendDisplayName.charAt(0).toUpperCase()}
          </div>
        )}
        {friend.status !== 'HIDDEN' && c.type !== 'CLOUD' && (
          <span
            className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-discord-mid ${
              friend.status === 'ONLINE'
                ? 'bg-emerald-500'
                : friend.status === 'AWAY'
                  ? 'bg-amber-400'
                  : 'bg-gray-400 dark:bg-zinc-600'
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[14px] truncate ${
              hasUnread
                ? 'font-bold text-gray-900 dark:text-white'
                : 'font-medium text-gray-800 dark:text-zinc-200'
            }`}
          >
            {friendDisplayName}
            {c.pinned && <Pin className="ml-1.5 inline h-3 w-3 text-indigo-500" />}
          </span>
          {lastMsg && (
            <span
              className={`text-[11px] shrink-0 ${
                hasUnread
                  ? 'text-blue-600 dark:text-indigo-400 font-semibold'
                  : 'text-gray-400 dark:text-zinc-500'
              }`}
            >
              {formatConversationTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-[12px] truncate flex-1 ${
              hasUnread
                ? 'font-semibold text-gray-700 dark:text-zinc-200'
                : 'text-gray-400 dark:text-zinc-500'
            }`}
          >
            {draftPreview ? (
              <>
                <span className="font-bold text-rose-500 dark:text-rose-400">Bản nháp: </span>
                <span className="text-gray-600 dark:text-zinc-300">{draftPreview}</span>
              </>
            ) : lastMsg ? (
              <>
                {lastMsg.metadata?.priority === 'IMPORTANT' && (
                  <span className="text-rose-600 dark:text-rose-500 font-bold mr-1 inline-flex items-center gap-0.5 align-text-bottom">
                    <AlertTriangle className="w-3.5 h-3.5" /> [Quan trọng]
                  </span>
                )}
                {lastMsg.metadata?.priority === 'URGENT' && (
                  <span className="text-amber-600 dark:text-amber-500 font-bold mr-1 inline-flex items-center gap-0.5 align-text-bottom">
                    <BellRing className="w-3.5 h-3.5" /> [Khẩn cấp]
                  </span>
                )}
                {formatLastMessage(lastMsg, false)}
              </>
            ) : (
              'Bắt đầu cuộc trò chuyện'
            )}
          </p>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
              className={`rounded-md p-1.5 transition ${
                openConversationMenuId === c.id
                  ? 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Tùy chọn hội thoại"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {openConversationMenuId === c.id && (
              <div
                className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onTogglePin}
                  disabled={conversationActionId === `pin-${c.id}`}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {conversationActionId === `pin-${c.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : c.pinned ? (
                    <PinOff className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <Pin className="h-4 w-4 text-gray-500" />
                  )}
                  <span>{c.pinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}</span>
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={onHide}
                  disabled={conversationActionId === `hide-${c.id}`}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {conversationActionId === `hide-${c.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                  <span>Ẩn trò chuyện</span>
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={conversationActionId === `delete-${c.id}`}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  {conversationActionId === `delete-${c.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Xóa hội thoại</span>
                </button>
              </div>
            )}
          </div>
          {hasUnread && (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 dark:bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

DmConversationItem.displayName = 'DmConversationItem';
