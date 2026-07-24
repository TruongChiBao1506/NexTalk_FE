import React from 'react';
import {
  Calendar,
  ExternalLink,
  FileText,
  Image,
  Link,
  MessageSquare,
  Pin,
  PinOff,
  Search,
  Video,
  X,
} from 'lucide-react';
import type { MessageAttachment, MessageResponse } from '../../types/chat';
import { formatFileSize, getFileIconConfig } from '../../utils/fileUtils';
import { stripHtml } from '../../utils/text';

type PinnedFilter = 'ALL' | 'MEDIA' | 'FILE' | 'LINK';

interface PinnedMessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: MessageResponse[];
  onUnpin: (messageId: string) => void;
  onJumpToMessage: (messageId: string) => void;
  canUnpin?: boolean;
}

const urlPattern = /https?:\/\/[^\s<>"']+/gi;

const getMessageText = (message: MessageResponse) => {
  if (message.isRecalled) return 'Tin nhắn đã bị thu hồi';
  return stripHtml(message.content ?? '').replace(/\s+/g, ' ').trim();
};

const getAttachments = (message: MessageResponse, type?: MessageAttachment['type']) =>
  (message.attachments ?? []).filter((attachment) => !type || attachment.type === type);

const getMessageLinks = (message: MessageResponse) => {
  const text = getMessageText(message);
  return text.match(urlPattern) ?? [];
};

const isMediaMessage = (message: MessageResponse) =>
  ['IMAGE', 'VIDEO', 'ALBUM'].includes(message.messageType) ||
  getAttachments(message).some((attachment) => attachment.type === 'IMAGE' || attachment.type === 'VIDEO');

const isFileMessage = (message: MessageResponse) =>
  message.messageType === 'FILE' || getAttachments(message, 'FILE').length > 0;

const isLinkMessage = (message: MessageResponse) => getMessageLinks(message).length > 0;

const getPinnedCategory = (message: MessageResponse): Exclude<PinnedFilter, 'ALL'> | 'TEXT' => {
  if (isMediaMessage(message)) return 'MEDIA';
  if (isFileMessage(message)) return 'FILE';
  if (isLinkMessage(message)) return 'LINK';
  return 'TEXT';
};

const getFilterLabel = (filter: PinnedFilter) => {
  if (filter === 'MEDIA') return 'Media';
  if (filter === 'FILE') return 'File';
  if (filter === 'LINK') return 'Link';
  return 'Tất cả';
};

const getFilterIcon = (filter: PinnedFilter) => {
  if (filter === 'MEDIA') return Image;
  if (filter === 'FILE') return FileText;
  if (filter === 'LINK') return Link;
  return Pin;
};

const formatPinnedDate = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} ${date.toLocaleDateString()}`;
};

const getHostName = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({
  isOpen,
  onClose,
  pinnedMessages,
  onUnpin,
  onJumpToMessage,
  canUnpin = true,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<PinnedFilter>('ALL');
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveFilter('ALL');
    }
  }, [isOpen]);

  const jumpToPinnedMessage = (messageId: string) => {
    onClose();
    window.setTimeout(() => onJumpToMessage(messageId), 60);
  };

  if (!isOpen) return null;

  const sortedMessages = [...pinnedMessages].sort(
    (a, b) => new Date(b.pinnedAt ?? b.createdAt).getTime() - new Date(a.pinnedAt ?? a.createdAt).getTime()
  );

  const counts = {
    ALL: sortedMessages.length,
    MEDIA: sortedMessages.filter(isMediaMessage).length,
    FILE: sortedMessages.filter(isFileMessage).length,
    LINK: sortedMessages.filter(isLinkMessage).length,
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMessages = sortedMessages.filter((message) => {
    const matchesFilter = activeFilter === 'ALL' || getPinnedCategory(message) === activeFilter;
    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    const searchable = [
      message.senderUsername,
      getMessageText(message),
      ...(message.attachments ?? []).map((attachment) => attachment.name ?? attachment.url),
      ...getMessageLinks(message),
    ].join(' ').toLowerCase();

    return searchable.includes(normalizedQuery);
  });

  const renderPreview = (message: MessageResponse) => {
    if (message.isRecalled) {
      return <p className="m-0 text-sm italic text-gray-500 dark:text-zinc-400">Tin nhắn đã bị thu hồi</p>;
    }

    const attachments = getAttachments(message);
    const mediaAttachments = attachments.filter((attachment) => attachment.type === 'IMAGE' || attachment.type === 'VIDEO');
    const fileAttachments = attachments.filter((attachment) => attachment.type === 'FILE');
    const links = getMessageLinks(message);
    const text = getMessageText(message);

    if (mediaAttachments.length > 0 || message.messageType === 'IMAGE' || message.messageType === 'VIDEO') {
      const mediaItems = mediaAttachments.length > 0
        ? mediaAttachments
        : [{ url: message.content, type: message.messageType as MessageAttachment['type'], name: message.messageType, size: null }];

      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {mediaItems.slice(0, 3).map((attachment, index) => (
              <div key={`${attachment.url}-${index}`} className="aspect-square overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-zinc-800">
                {attachment.type === 'IMAGE' ? (
                  <img src={attachment.url} alt={attachment.name ?? 'Pinned image'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Video className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {text && <p className="m-0 line-clamp-2 text-sm text-gray-700 dark:text-zinc-200">{text}</p>}
        </div>
      );
    }

    if (fileAttachments.length > 0 || message.messageType === 'FILE') {
      const file = fileAttachments[0] ?? {
        url: message.content,
        type: 'FILE' as const,
        name: message.content.split('/').pop() || 'Tệp đính kèm',
        size: null,
      };
      const { icon: FileIcon, colorClass, bgColorClass } = getFileIconConfig(file.name ?? file.url);

      return (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200 dark:bg-zinc-900/70 dark:ring-zinc-800">
          <div className={`rounded-lg p-2 ${bgColorClass}`}>
            <FileIcon className={`h-4 w-4 ${colorClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">{file.name ?? 'Tệp đính kèm'}</p>
            {file.size != null && file.size > 0 && (
              <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{formatFileSize(file.size)}</p>
            )}
          </div>
          {fileAttachments.length > 1 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              +{fileAttachments.length - 1}
            </span>
          )}
        </div>
      );
    }

    if (links.length > 0) {
      const primaryLink = links[0] ?? '';
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
            <Link className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-bold">{getHostName(primaryLink)}</p>
              <p className="m-0 truncate text-xs opacity-80">{primaryLink}</p>
            </div>
          </div>
          {text.replace(primaryLink, '').trim() && (
            <p className="m-0 line-clamp-2 text-sm text-gray-700 dark:text-zinc-200">{text}</p>
          )}
        </div>
      );
    }

    return <p className="m-0 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-zinc-200">{text || 'Tin nhắn trống'}</p>;
  };

  return (
    <aside className="z-30 flex h-full w-80 shrink-0 flex-col border-l border-gray-200 bg-white dark:border-zinc-800 dark:bg-discord-mid">
      <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <Pin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tin nhắn đã ghim</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                {pinnedMessages.length}
              </span>
            </div>
            <p className="m-0 mt-1 text-xs text-gray-500 dark:text-zinc-400">Lưu nhanh các nội dung quan trọng</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-zinc-900">
          {(['ALL', 'MEDIA', 'FILE', 'LINK'] as PinnedFilter[]).map((filter) => {
            const Icon = getFilterIcon(filter);
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-bold transition ${
                  active
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-300'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
                title={getFilterLabel(filter)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{counts[filter]}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus-within:border-indigo-500 focus-within:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:focus-within:border-indigo-500">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400 dark:text-zinc-100"
            placeholder="Tìm trong tin ghim"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {pinnedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-500 dark:text-zinc-400">
            <div className="rounded-full bg-gray-100 p-4 dark:bg-zinc-900">
              <MessageSquare className="h-7 w-7 text-gray-400" />
            </div>
            <p className="m-0 mt-3 text-sm font-bold text-gray-700 dark:text-zinc-200">Chưa có tin nhắn ghim</p>
            <p className="m-0 mt-1 text-xs leading-relaxed">Ghim tin nhắn để lưu thông báo, tài liệu, link hoặc nội dung cần xem lại.</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-500 dark:text-zinc-400">
            <Search className="h-7 w-7 text-gray-400" />
            <p className="m-0 mt-3 text-sm font-bold text-gray-700 dark:text-zinc-200">Không tìm thấy tin ghim</p>
            <p className="m-0 mt-1 text-xs leading-relaxed">Thử đổi từ khóa hoặc chọn bộ lọc khác.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((message) => {
              const category = getPinnedCategory(message);
              return (
                <article
                  key={message.id}
                  className="group rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
                >
                  <button
                    type="button"
                    onClick={() => jumpToPinnedMessage(message.id)}
                    className="block w-full text-left"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-gray-900 dark:text-white">@{message.senderUsername}</p>
                        <p className="m-0 mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400">
                          <Calendar className="h-3 w-3" />
                          <span>{formatPinnedDate(message.pinnedAt ?? message.createdAt)}</span>
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500 dark:bg-zinc-800 dark:text-zinc-300">
                        {category === 'TEXT' ? 'Text' : getFilterLabel(category)}
                      </span>
                    </div>

                    {renderPreview(message)}
                  </button>

                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-2 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => jumpToPinnedMessage(message.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                      title="Đi đến tin nhắn"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Đi đến</span>
                    </button>
                    {canUnpin && (
                      <button
                        type="button"
                        onClick={() => onUnpin(message.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                        title="Bỏ ghim"
                      >
                        <PinOff className="h-3.5 w-3.5" />
                        <span>Bỏ ghim</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
