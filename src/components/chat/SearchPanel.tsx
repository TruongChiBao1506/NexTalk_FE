import React, { useState } from 'react';
import { X, Search, ExternalLink, Loader2 } from 'lucide-react';
import { messageService } from '../../services/messageService';
import type { MessageResponse } from '../../types/chat';
import type { MessageType } from '../../types/chat';
import { SearchResultSkeleton } from '../common/Skeleton';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId: string | null;
  onJumpToMessage: (messageId: string, conversationId: string) => void;
  members?: Array<{ id: string; username: string }>;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  activeConversationId,
  onJumpToMessage,
  members = [],
}) => {
  const [query, setQuery] = useState('');
  const [onlyCurrent, setOnlyCurrent] = useState(true);
  const [results, setResults] = useState<MessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [messageType, setMessageType] = useState<MessageType | ''>('');
  const [senderId, setSenderId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent, cursor: string | null = null) => {
    if (e) e.preventDefault();
    if (!query.trim() && !messageType && !senderId && !from && !to) return;

    setIsLoading(true);
    setSearched(true);
    try {
      const convId = onlyCurrent && activeConversationId ? activeConversationId : undefined;
      const response = await messageService.searchMessagesCursor({
        query: query.trim(),
        conversationId: convId,
        senderId: senderId || undefined,
        messageType: messageType || undefined,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
        cursor: cursor || undefined,
        limit: 20,
      });
      if (response.success && response.data) {
        setResults((current) => {
          if (!cursor) return response.data!.items;
          const byId = new Map(current.map((message) => [message.id, message]));
          response.data!.items.forEach((message) => byId.set(message.id, message));
          return [...byId.values()];
        });
        setHasMore(response.data.hasMore);
        setNextCursor(response.data.nextCursor);
      }
    } catch (err) {
      console.error('Failed to search messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' ' + date.toLocaleDateString();
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <mark key={i} className="bg-yellow-500/40 text-yellow-100 rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="w-80 h-full border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-discord-mid flex flex-col z-30 animate-in slide-in-from-right duration-200 shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 dark:border-discord-gray-600 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-gray-700 dark:text-discord-gray-200 font-semibold text-sm">
          <Search className="w-4 h-4 text-gray-400 dark:text-discord-gray-400" />
          <span>Tìm kiếm tin nhắn</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-discord-gray-600 shrink-0">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Nhập từ khoá..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-discord-dark border border-gray-200 dark:border-discord-gray-600 rounded px-3 py-1.5 pl-9 text-sm text-gray-700 dark:text-discord-gray-200 placeholder-gray-400 dark:placeholder-discord-muted focus:outline-none focus:border-indigo-500 dark:focus:border-discord-blurple transition-colors duration-150"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-discord-gray-500" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-2.5 text-gray-450 hover:text-gray-700 dark:text-discord-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeConversationId && (
            <label className="flex items-center space-x-2 text-xs text-gray-500 dark:text-discord-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyCurrent}
                onChange={(e) => setOnlyCurrent(e.target.checked)}
                className="rounded bg-gray-50 dark:bg-discord-dark border-gray-200 dark:border-discord-gray-600 text-discord-blurple focus:ring-0 w-3.5 h-3.5"
              />
              <span>Chỉ tìm trong cuộc trò chuyện này</span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select value={messageType} onChange={(event) => setMessageType(event.target.value as MessageType | '')} className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 dark:border-discord-gray-600 dark:bg-discord-dark dark:text-zinc-200">
              <option value="">Mọi loại tin</option>
              <option value="TEXT">Văn bản</option>
              <option value="IMAGE">Hình ảnh</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Tin thoại</option>
              <option value="FILE">Tệp</option>
              <option value="POLL">Bình chọn</option>
            </select>
            <select value={senderId} onChange={(event) => setSenderId(event.target.value)} disabled={!onlyCurrent || members.length === 0} className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 disabled:opacity-50 dark:border-discord-gray-600 dark:bg-discord-dark dark:text-zinc-200">
              <option value="">Mọi người gửi</option>
              {members.map((member) => <option key={member.id} value={member.id}>@{member.username}</option>)}
            </select>
            <label className="text-[10px] text-gray-500 dark:text-zinc-400">Từ ngày<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-discord-gray-600 dark:bg-discord-dark" /></label>
            <label className="text-[10px] text-gray-500 dark:text-zinc-400">Đến ngày<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-discord-gray-600 dark:bg-discord-dark" /></label>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!query.trim() && !messageType && !senderId && !from && !to)}
            className="w-full flex items-center justify-center space-x-1.5 bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-55 disabled:hover:bg-discord-blurple text-white font-medium py-1.5 px-4 rounded text-xs transition-colors duration-150"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Tìm kiếm</span>
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <SearchResultSkeleton count={4} />
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-450 dark:text-discord-gray-400 space-y-2">
            <div className="p-3 bg-gray-100 dark:bg-discord-dark-tertiary rounded-full">
              <Search className="w-6 h-6 text-gray-450 dark:text-discord-gray-500" />
            </div>
            <p className="text-xs">Nhập từ khóa lịch sử chat để tìm kiếm.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-450 dark:text-discord-gray-400 space-y-2">
            <p className="text-xs">Không tìm thấy kết quả nào trùng khớp.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-semibold text-gray-500 dark:text-discord-gray-500 tracking-wider">
              Đã tải {results.length} kết quả
            </p>
            {results.map((msg) => (
              <div
                key={msg.id}
                className="bg-gray-50 dark:bg-discord-dark border border-gray-200 dark:border-discord-gray-600 rounded-lg p-3 relative group hover:border-gray-300 dark:hover:border-discord-gray-400 transition-colors duration-150"
              >
                {/* Sender & Date */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-700 dark:text-discord-gray-200 text-xs truncate max-w-[150px]">
                    @{msg.senderUsername}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-discord-gray-450 shrink-0">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>

                {/* Content */}
                <div className="text-xs text-gray-600 dark:text-discord-gray-300 break-words line-clamp-4">
                  {msg.isRecalled ? (
                    <span className="italic text-gray-450 dark:text-discord-muted">Tin nhắn đã bị thu hồi</span>
                  ) : (
                    highlightText(msg.content, query)
                  )}
                </div>

                {/* Action footer */}
                <div className="mt-2.5 flex items-center justify-end border-t border-gray-200 dark:border-discord-gray-600/50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => onJumpToMessage(msg.id, msg.conversationId)}
                    className="flex items-center space-x-1 text-[10px] text-discord-blurple hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Đi đến tin nhắn</span>
                  </button>
                </div>
              </div>
            ))}
            {hasMore && (
              <button type="button" disabled={isLoading || !nextCursor} onClick={() => void handleSearch(undefined, nextCursor)} className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                {isLoading ? 'Đang tải…' : 'Tải thêm kết quả'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
