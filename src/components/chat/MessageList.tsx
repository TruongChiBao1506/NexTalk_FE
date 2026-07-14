// @ts-nocheck
import React, { useState } from 'react';
import {
  Pin,
  PinOff,
  Sparkles,
  Video,
  Phone,
  ListChecks,
  Check,
  CornerUpLeft,
  Download,
  CheckCheck,
  Loader2,
  ArrowDown,
  FileText,
  Image,
  PhoneMissed,
  Users,
  AlertTriangle,
  Play,
  Lock,
  Hash,
  Mic,
  MicOff,
  Settings,
  Search,
  Paperclip,
  MoreVertical,
  Reply,
  Copy,
  Trash2,
  Edit2,
  CornerUpRight,
  FileQuestion,
  Cloud,
  Folder,
  BellRing,
  BarChart3,
  Link,
  Sticker,
  MessageSquare,
  ExternalLink,
  X
} from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';
import { getFileIconConfig, formatFileSize, downloadFile } from '../../utils/fileUtils';
import { MessageActionsBar, MessageReactionButton } from './MessageContextMenu';
import { MessageReactions } from './MessageReactions';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { getMessagePreviewData } from '../../utils/messagePreview';
import { Skeleton } from '../common/Skeleton';
import { messageService } from '../../services/messageService';
import { useChatStore } from '../../store/chatStore';

interface MessageListProps {
  pinnedMessages: any[];
  handleJumpToMessage: (id: string) => void;
  canPinMessage: (msg: any) => boolean;
  togglePinMessage: (id: string, isPinned: boolean) => void;
  activeConversationSummary: any;
  onSummarizeConversation: () => void;
  isSummarizingConversation: boolean;
  typingUsers: any[];
  unreadMarker: { messageId: string; count: number } | null;
  onDismissUnreadMarker: () => void;
  onJumpToUnreadMarker: (behavior?: ScrollBehavior) => void;
  conversationInfoOffsetClass: string;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  handleMessagesScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  visibleMessages: any[];
  user: any;
  isGroupConversation: boolean;
  activeFriend: any;
  getSenderAvatar: (msg: any) => string | null;
  getSenderUsername: (msg: any) => string;
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  activeMenuMessageId: string | null;
  setActiveMenuMessageId: (id: string | null) => void;
  reactToMessage: (msgId: string, emoji: string) => void;
  setReplyTo: (msg: any) => void;
  setEditingMessageId: (id: string | null) => void;
  setEditInputText: (text: string) => void;
  recallMessage: (id: string) => void;
  deleteMessage: (id: string) => void;
  setSharingMessage: (msg: any) => void;
  setReminderTargetMessage: (msg: any) => void;
  onDeleteMessageReminder: (reminderId: string) => void;
  onRecreateMessageReminder: (messageId: string) => void;
  canRecallMessageInActiveConversation: (msg: any) => boolean;
  getFileName: (url: string) => string;
  setActiveMedia: (media: any) => void;
  renderFormattedMessage: (content: string) => React.ReactNode;
  stripMessageMarkup: (content: string) => string;
  formatMessageTime: (date: any) => string;
  getMessageStatus: (msg: any) => string;
  formatDividerDate: (date: any) => string;
  isCallHistoryMessage: (msg: any) => boolean;
  getCallHistorySummary: (msg: any) => string;
  getCallHistoryDetailStatus: (metadata: any) => string;
  formatCallLogTime: (date: any) => string;
  expandedCallLogId: string | null;
  setExpandedCallLogId: (id: string | null) => void;
  activeCallTarget: any;
  initiateCall: (conversationId: string, type: 'voice' | 'video', target: any) => void;
  activeConversation: any;
  getPollMetadata: (msg: any) => any;
  handlePollVote: (msgId: string, optionId: string) => void;
  pollActionMessageId: string | null;
  setPollVoterDialog: (dialog: any) => void;
  pollNewOptionText: Record<string, string>;
  setPollNewOptionText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleAddPollOption: (msgId: string) => void;
  handleLockPoll: (msgId: string) => void;
  handleDeletePoll: (msgId: string) => void;
  hasMoreMessages: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  showScrollToLatest: boolean;
  scrollToBottom: (behavior?: 'auto' | 'smooth') => void;
  isGroupModeratorRole: (role: any) => boolean;
  currentGroupMembership: any;
  editingMessageId: string | null;
  editInputText: string;
  handleSaveEdit: (msgId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  pinnedMessages,
  handleJumpToMessage,
  canPinMessage,
  togglePinMessage,
  activeConversationSummary,
  onSummarizeConversation,
  isSummarizingConversation,
  typingUsers,
  unreadMarker,
  onDismissUnreadMarker,
  onJumpToUnreadMarker,
  conversationInfoOffsetClass,
  messagesContainerRef,
  handleMessagesScroll,
  messagesEndRef,
  visibleMessages,
  user,
  isGroupConversation,
  activeFriend,
  getSenderAvatar,
  getSenderUsername,
  hoveredMessageId,
  setHoveredMessageId,
  activeMenuMessageId,
  setActiveMenuMessageId,
  reactToMessage,
  setReplyTo,
  setEditingMessageId,
  setEditInputText,
  recallMessage,
  deleteMessage,
  setSharingMessage,
  setReminderTargetMessage,
  onDeleteMessageReminder,
  onRecreateMessageReminder,
  canRecallMessageInActiveConversation,
  getFileName,
  setActiveMedia,
  renderFormattedMessage,
  stripMessageMarkup,
  formatMessageTime,
  getMessageStatus,
  formatDividerDate,
  isCallHistoryMessage,
  getCallHistorySummary,
  getCallHistoryDetailStatus,
  formatCallLogTime,
  expandedCallLogId,
  setExpandedCallLogId,
  activeCallTarget,
  initiateCall,
  activeConversation,
  getPollMetadata,
  handlePollVote,
  pollActionMessageId,
  setPollVoterDialog,
  pollNewOptionText,
  setPollNewOptionText,
  handleAddPollOption,
  handleLockPoll,
  handleDeletePoll,
  hasMoreMessages,
  sentinelRef,
  showScrollToLatest,
  scrollToBottom,
  isGroupModeratorRole,
  currentGroupMembership,
  editingMessageId,
  editInputText,
  handleSaveEdit,
}) => {
  const [dismissedSummaryMarkerId, setDismissedSummaryMarkerId] = useState<string | null>(null);
  const getMessageStatusLabel = (msg: any) => {
    const status = getMessageStatus(msg);
    if (status === 'SEEN') {
      if (isGroupConversation) {
        const seenCount = (msg.statuses ?? []).filter((item: any) => item.userId !== user?.id && item.status === 'SEEN').length;
        return seenCount > 0 ? `${seenCount} người đã xem` : 'Đã xem';
      }
      return 'Đã xem';
    }
    return status === 'DELIVERED' ? 'Đã nhận' : 'Đã gửi';
  };
  const getNicknameSystemText = (msg: any) => {
    const metadata = msg.metadata ?? {};
    const actorIsViewer = metadata.actorId === user?.id;
    const targetIsViewer = metadata.targetUserId === user?.id;
    const actorIsTarget = metadata.actorId === metadata.targetUserId;
    const actor = actorIsViewer ? 'Bạn' : (msg.senderUsername || metadata.actorUsername || 'Một thành viên');
    const oldNickname = String(metadata.oldNickname || '');
    const newNickname = String(metadata.newNickname || '');
    const possessiveTarget = actorIsTarget ? 'của mình' : targetIsViewer ? 'của bạn' : `của ${metadata.targetUsername}`;
    const setTarget = actorIsTarget ? 'của mình' : targetIsViewer ? 'cho bạn' : `cho ${metadata.targetUsername}`;
    if (!newNickname) return `${actor} đã xóa biệt danh ${possessiveTarget}.`;
    if (!oldNickname) return `${actor} đã đặt biệt danh ${setTarget} là "${newNickname}".`;
    return `${actor} đã đổi biệt danh ${possessiveTarget} từ "${oldNickname}" thành "${newNickname}".`;
  };
  const isSelectionMode = useChatStore((state) => state.isSelectionMode);
  const selectedMessageIds = useChatStore((state) => state.selectedMessageIds);
  const toggleMessageSelection = useChatStore((state) => state.toggleMessageSelection);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'recall' | 'delete' | null;
    messageId: string | null;
  }>({ isOpen: false, type: null, messageId: null });

  const getReplyPreviewIcon = (kind: ReturnType<typeof getMessagePreviewData>['kind']) => {
    if (kind === 'IMAGE' || kind === 'ALBUM') return Image;
    if (kind === 'VIDEO') return Video;
    if (kind === 'AUDIO') return Mic;
    if (kind === 'FILE') return FileText;
    if (kind === 'LINK') return Link;
    if (kind === 'POLL') return BarChart3;
    if (kind === 'STICKER') return Sticker;
    return MessageSquare;
  };

  const renderReplyPreviewContent = (message: any) => {
    const preview = getMessagePreviewData(message);
    const ReplyIcon = getReplyPreviewIcon(preview.kind);

    return (
      <>
        <span className="shrink-0 font-bold text-indigo-600 dark:text-indigo-400">
          @{message?.senderUsername ?? 'tin nhắn cũ'}
        </span>
        {preview.thumbnailUrl && (preview.kind === 'IMAGE' || preview.kind === 'STICKER' || preview.kind === 'ALBUM') ? (
          <img src={preview.thumbnailUrl} alt={preview.label} className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-gray-200 dark:ring-zinc-700" />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/70 text-indigo-600 ring-1 ring-gray-200 dark:bg-zinc-900/70 dark:text-indigo-300 dark:ring-zinc-700">
            <ReplyIcon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="min-w-0">
          <span className="mr-1 font-bold text-gray-500 dark:text-zinc-400">{preview.label}</span>
          <span className="truncate">{preview.fileName || preview.text}</span>
        </span>
      </>
    );
  };

  const renderReplyPreviewCard = (message: any) => {
    const preview = getMessagePreviewData(message);
    const ReplyIcon = getReplyPreviewIcon(preview.kind);
    const previewText = preview.fileName || preview.text;

    return (
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {preview.thumbnailUrl && (preview.kind === 'IMAGE' || preview.kind === 'STICKER' || preview.kind === 'ALBUM') ? (
          <img src={preview.thumbnailUrl} alt={preview.label} className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-indigo-100 dark:ring-zinc-700" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-100 dark:bg-zinc-900/70 dark:text-indigo-300 dark:ring-zinc-700">
            <ReplyIcon className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[12px] font-black text-indigo-600 dark:text-indigo-300">
              @{message?.senderUsername ?? 'tin nhắn cũ'}
            </span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-zinc-600" />
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
              {preview.label}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] font-medium text-slate-600 dark:text-zinc-300">
            {previewText}
          </span>
        </span>
      </div>
    );
  };

  const renderInlineReplyPreview = (message: any, isOwnMessage: boolean) => {
    const preview = getMessagePreviewData(message);
    const previewText = preview.fileName || preview.text;

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (message?.id) {
            handleJumpToMessage(message.id);
          }
        }}
        className={`mb-2 block w-full overflow-hidden rounded-lg text-left transition hover:brightness-[0.98] ${isOwnMessage
            ? 'bg-blue-200/55 text-slate-700 dark:bg-indigo-900/35 dark:text-zinc-100'
            : 'bg-indigo-50 text-slate-700 dark:bg-indigo-500/10 dark:text-zinc-100'
          }`}
      >
        <span className="flex min-w-0 border-l-4 border-blue-500 px-3 py-2 dark:border-indigo-400">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-black text-slate-700 dark:text-zinc-100">
              {message?.senderUsername ?? 'Tin nhắn cũ'}
            </span>
            <span className="mt-1 block truncate text-[13px] font-medium text-slate-600 dark:text-zinc-300">
              {previewText}
            </span>
          </span>
        </span>
      </button>
    );
  };

  const isAudioFileName = (value?: string | null) => {
    if (!value) return false;
    return /\.(webm|mp3|wav|ogg|oga|m4a|aac)$/i.test(value.split('?')[0]);
  };

  const isAudioMessage = (message: any) => {
    const attachment = message?.attachments?.[0];
    return message?.messageType === 'AUDIO'
      || attachment?.type === 'AUDIO'
      || isAudioFileName(attachment?.name)
      || isAudioFileName(attachment?.url)
      || isAudioFileName(message?.content);
  };

  const getLinkPreview = (message: any) => {
    const preview = message?.metadata?.linkPreview;
    if (!preview || !preview.url || (!preview.title && !preview.description && !preview.image)) {
      return null;
    }
    return preview;
  };

  const getLinkHost = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const renderLinkPreviewCard = (message: any, isMine: boolean) => {
    const preview = getLinkPreview(message);
    if (!preview) return null;

    return (
      <button
        type="button"
        onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}
        className={`mt-3 block w-full max-w-[330px] overflow-hidden rounded-xl text-left transition hover:brightness-95 ${isMine
            ? 'bg-white/92 ring-1 ring-blue-200/90 shadow-sm dark:bg-zinc-900/80 dark:ring-indigo-500/25'
            : 'bg-gray-50 ring-1 ring-gray-200 dark:bg-zinc-900/70 dark:ring-zinc-800'
          }`}
      >
        {preview.image && (
          <img
            src={preview.image}
            alt={preview.title || preview.siteName || 'Link preview'}
            className="h-36 w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="space-y-1 p-3">
          <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${isMine ? 'text-indigo-600 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-300'
            }`}>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{preview.siteName || getLinkHost(preview.url)}</span>
          </div>
          {preview.title && (
            <p className={`m-0 line-clamp-2 text-sm font-bold leading-snug ${isMine ? 'text-slate-900 dark:text-white' : 'text-gray-950 dark:text-white'
              }`}>
              {preview.title}
            </p>
          )}
          {preview.description && (
            <p className={`m-0 line-clamp-2 text-xs leading-relaxed ${isMine ? 'text-slate-600 dark:text-zinc-300' : 'text-gray-600 dark:text-zinc-300'
              }`}>
              {preview.description}
            </p>
          )}
        </div>
      </button>
    );
  };

  const renderReminderSystemMessage = (msg: any) => {
    const metadata = msg.metadata ?? {};
    const isDeleted = metadata.reminderStatus === 'DELETED';
    const isActiveCreatedNotice = metadata.reminderStatus === 'CREATED' && !metadata.isDeleted;

    return (
      <div className="inline-flex max-w-[min(88vw,620px)] items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-gray-200 dark:bg-zinc-900/95 dark:text-zinc-200 dark:ring-zinc-700">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isDeleted
            ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
            : 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300'
          }`}>
          <BellRing className="h-4 w-4" />
        </span>
        <span className="min-w-0 truncate">
          <span>{isDeleted ? 'Bạn xóa nhắc hẹn ' : 'Bạn tạo nhắc hẹn mới '}</span>
          <span className="font-bold text-slate-700 dark:text-zinc-100">
            {metadata.note || metadata.preview || 'tin nhắn'}
          </span>
          {metadata.remindAt && (
            <span className="font-semibold text-slate-500 dark:text-zinc-300">
              {' - '}
              {new Date(metadata.remindAt).toLocaleString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </span>
        {isActiveCreatedNotice && (
          <>
            <button
              type="button"
              onClick={() => handleJumpToMessage(metadata.messageId)}
              className="shrink-0 text-sm font-bold text-sky-600 transition hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200"
            >
              Xem
            </button>
            <button
              type="button"
              onClick={() => onDeleteMessageReminder(metadata.reminderId)}
              className="shrink-0 text-sm font-bold text-rose-500 transition hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200"
            >
              Xóa
            </button>
          </>
        )}
        {isDeleted && (
          <button
            type="button"
            onClick={() => onRecreateMessageReminder(metadata.messageId)}
            className="shrink-0 text-sm font-bold text-sky-600 transition hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Tạo mới
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Pinned Messages Banner */}
      {pinnedMessages && pinnedMessages.length > 0 && (() => {
        const latestPinned = {
          ...[...pinnedMessages].sort(
            (a, b) => new Date(b.pinnedAt ?? b.createdAt).getTime() - new Date(a.pinnedAt ?? a.createdAt).getTime()
          )[0]
        };
        const latestPinnedPreview = getMessagePreviewData(latestPinned);
        const latestPinnedText = latestPinnedPreview.fileName || latestPinnedPreview.text;
        if (!latestPinned.isRecalled) {
          latestPinned.content = latestPinnedText;
        }
        return (
          <div className={`bg-white/88 dark:bg-discord-dark border-b border-indigo-100 dark:border-zinc-800/60 px-3 py-2 flex items-center gap-3 shrink-0 select-none group transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
            {/* Left accent bar */}
            <div className="w-0.5 h-8 rounded-full bg-indigo-500 dark:bg-discord-blurple shrink-0" />

            {/* Pin icon */}
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
              <Pin className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 fill-current" />
            </div>

            {/* Text content */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => handleJumpToMessage(latestPinned.id)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide shrink-0">
                  Tin nhắn
                </span>
                {pinnedMessages.length > 1 && (
                  <span className="text-[10px] text-gray-400 dark:text-zinc-550 shrink-0">
                    ({pinnedMessages.length})
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-800 dark:text-zinc-200 truncate leading-tight mt-0.5">
                <span className="font-semibold text-gray-700 dark:text-zinc-300">
                  {latestPinned.senderUsername}:
                </span>{' '}
                <span className="text-gray-550 dark:text-zinc-405">
                  {latestPinned.isRecalled ? 'Tin nhắn đã bị thu hồi' : latestPinned.content}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {pinnedMessages.length > 1 && (
                <button
                  onClick={() => handleJumpToMessage(latestPinned.id)}
                  className="px-2 py-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                  title="Xem tất cả tin nhắn đã ghim"
                >
                  Xem tất cả
                </button>
              )}
              {canPinMessage(latestPinned) && (
                <button
                  onClick={() => togglePinMessage(latestPinned.id, true)}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                  title="Bỏ ghim"
                >
                  <PinOff className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {activeConversationSummary && (
        <div className={`m-4 mb-0 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-left shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-white p-1.5 text-indigo-600 shadow-sm dark:bg-zinc-900/80 dark:text-indigo-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="m-0 text-sm font-bold text-indigo-700 dark:text-indigo-200">Tóm tắt cuộc trò chuyện</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-500 dark:bg-zinc-900/70 dark:text-indigo-300">
                  {activeConversationSummary.sourceMessageCount} tin nhắn
                </span>
              </div>
              <p className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-zinc-200">
                {activeConversationSummary.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {!activeConversationSummary && unreadMarker && unreadMarker.count >= 15 && dismissedSummaryMarkerId !== unreadMarker.messageId && (
        <div className={`mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 ${conversationInfoOffsetClass}`}>
          <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-300"><Sparkles className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-bold text-indigo-800 dark:text-indigo-200">Bạn có {unreadMarker.count} tin nhắn chưa đọc</p>
            <p className="m-0 mt-0.5 text-xs text-indigo-600/80 dark:text-indigo-300/80">AI có thể giúp bạn nắm nhanh nội dung chính.</p>
          </div>
          <button type="button" disabled={isSummarizingConversation} onClick={onSummarizeConversation} className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {isSummarizingConversation ? 'Đang tóm tắt...' : 'Tóm tắt bằng AI'}
          </button>
          <button type="button" onClick={() => setDismissedSummaryMarkerId(unreadMarker.messageId)} className="shrink-0 rounded-lg p-1.5 text-indigo-400 transition hover:bg-white hover:text-indigo-700 dark:hover:bg-zinc-900" aria-label="Ẩn gợi ý tóm tắt">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className={`flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse transition-[margin] duration-300 ${conversationInfoOffsetClass}`}
      >
        <div ref={messagesEndRef} />

        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2 px-3 py-1.5 shrink-0">
            <div className="rounded-2xl rounded-bl-none border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 shadow-sm dark:border-zinc-800 dark:bg-discord-mid dark:text-zinc-300">
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} đang nhập`
                  : `${typingUsers.slice(0, 2).map((typingUser: any) => typingUser.username).join(', ')}${typingUsers.length > 2 ? ` và ${typingUsers.length - 2} người khác` : ''} đang nhập`}
              </span>
              <span className="ml-1 inline-flex translate-y-0.5 items-center gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
              </span>
            </div>
          </div>
        )}

        {visibleMessages.map((msg: any, index: number) => {
          const isMe = msg.senderId === user?.id;
          const isMentionedCurrentUser = !isMe && Boolean(
            msg.metadata?.mentionAll ||
            (Array.isArray(msg.metadata?.mentionedUserIds) && msg.metadata.mentionedUserIds.includes(user?.id))
          );
          const nextMsg = visibleMessages[index + 1];
          const showDivider = !nextMsg ||
            new Date(msg.createdAt).toDateString() !== new Date(nextMsg.createdAt).toDateString();

          const renderPriorityBadge = () => {
            if (!msg.metadata?.priority) return null;
            const isImportant = msg.metadata.priority === 'IMPORTANT';

            const textColor = isImportant
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-amber-600 dark:text-amber-300';

            return (
              <div className="flex mb-1 shrink-0">
                <div className={`inline-flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider drop-shadow-sm ${textColor}`}>
                  {isImportant ? <AlertTriangle className="w-3.5 h-3.5" /> : <BellRing className="w-3.5 h-3.5" />}
                  {isImportant ? 'Quan trọng' : 'Khẩn cấp'}
                </div>
              </div>
            );
          };

          // In group chat, show sender names above non-self messages
          const prevMsg = visibleMessages[index - 1];
          const showSenderName = isGroupConversation && !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

          // Find parent message if replied to
          const parentMessage = msg.parentId ? visibleMessages.find((m) => m.id === msg.parentId) : null;
          const isCallLog = isCallHistoryMessage(msg);
          const callMetadata = msg.metadata as any;

          const isUnreadMarkerTarget = unreadMarker?.messageId === msg.id;

          return (
            <React.Fragment key={msg.id}>
              <div
                id={`message-${msg.id}`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`relative group flex flex-col space-y-1 py-1.5 px-3 rounded-xl transition-colors ${isMentionedCurrentUser
                    ? 'border-l-2 border-amber-400 pl-2 dark:border-amber-500 hover:bg-white/35 dark:hover:bg-zinc-800/10'
                    : 'hover:bg-white/35 dark:hover:bg-zinc-800/10'
                  } ${index === visibleMessages.length - 1 ? (isMe ? 'animate-slide-in-bottom' : 'animate-slide-in-left') : ''}`}
              >
                {showDivider && (
                  <div className="flex items-center justify-center my-4 shrink-0 select-none">
                    <div className="flex-1 h-px bg-gray-250 dark:bg-zinc-800/80" />
                    <span className="px-3 text-[10px] font-bold text-slate-500 dark:text-discord-muted bg-[#f8faff] dark:bg-discord-dark uppercase tracking-wider">
                      {formatDividerDate(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-gray-250 dark:bg-zinc-800/80" />
                  </div>
                )}

                {msg.messageType === 'SYSTEM' ? (
                  <div className="flex justify-center py-1.5 select-none">
                    {msg.metadata?.systemType === 'AI_BOT_PENDING' ? (
                      <div className="w-full max-w-[min(86vw,620px)] select-none rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-left text-gray-700 shadow-sm ring-1 ring-white/70 dark:border-indigo-500/20 dark:bg-zinc-900/95 dark:text-zinc-200 dark:ring-zinc-800/80">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          <span>{msg.metadata?.botName || 'NexTalk AI'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                          <span>Đang suy nghĩ và chuẩn bị câu trả lời...</span>
                        </div>
                      </div>
                    ) : msg.metadata?.systemType === 'AI_BOT_REPLY' ? (
                      <div className="w-full max-w-[min(86vw,620px)] select-text rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-left text-gray-700 shadow-sm ring-1 ring-white/70 dark:border-indigo-500/20 dark:bg-zinc-900/95 dark:text-zinc-200 dark:ring-zinc-800/80">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          <span>{msg.metadata?.botName || 'NexTalk AI'}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {stripMessageMarkup(msg.content)}
                        </div>
                      </div>
                    ) : msg.metadata?.systemType === 'MESSAGE_REMINDER' ? (
                      renderReminderSystemMessage(msg)
                    ) : isCallLog ? (
                      <div className="w-full max-w-[min(86vw,560px)] rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 text-center text-gray-600 shadow-sm dark:border-indigo-500/20 dark:bg-[#151b2a] dark:text-zinc-300 dark:shadow-black/20">
                        <button
                          type="button"
                          onClick={() => setExpandedCallLogId(expandedCallLogId === msg.id ? null : msg.id)}
                          className="mx-auto flex max-w-full items-center justify-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-300"
                          title="Xem chi tiết cuộc gọi"
                        >
                          {callMetadata?.callType === 'VIDEO' ? (
                            <Video className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <Phone className="h-4 w-4 text-indigo-500" />
                          )}
                          <span className="truncate">{getCallHistorySummary(msg)}</span>
                        </button>

                        {expandedCallLogId === msg.id && (
                          <div className="mt-3 border-t border-gray-200 pt-3 text-left text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="m-0 font-bold text-gray-700 dark:text-zinc-200">Thời gian gọi</p>
                                <p className="m-0 mt-0.5">{formatCallLogTime(callMetadata?.startedAt)}</p>
                              </div>
                              <div>
                                <p className="m-0 font-bold text-gray-700 dark:text-zinc-200">Thời lượng</p>
                                <p className="m-0 mt-0.5">{getCallHistoryDetailStatus(callMetadata)}</p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <p className="m-0 mb-2 font-bold text-gray-700 dark:text-zinc-200">
                                Thành viên đã tham gia ({callMetadata?.participantCount ?? callMetadata?.participants?.length ?? 0})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(callMetadata?.participants ?? []).map((participant: any) => (
                                  <span
                                    key={participant.id}
                                    className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
                                  >
                                    {participant.avatarUrl ? (
                                      <img src={participant.avatarUrl} alt={participant.username} className="h-5 w-5 rounded-full object-cover" />
                                    ) : (
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                                        {(participant.username || '?').charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                    <span className="truncate">{participant.username}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {activeConversation && activeCallTarget && (
                              <div className="mt-3 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => initiateCall(
                                    activeConversation.id,
                                    callMetadata?.callType === 'VIDEO' ? 'video' : 'voice',
                                    activeCallTarget
                                  )}
                                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                                >
                                  {callMetadata?.callType === 'VIDEO' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                                  <span>Gọi lại</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex max-w-[min(86vw,520px)] items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-gray-600 shadow-sm ring-1 ring-gray-200 dark:bg-zinc-900/95 dark:text-zinc-200 dark:ring-zinc-700">
                        <Pin className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                        <span className="min-w-0 truncate">
                          {msg.metadata?.systemType === 'NICKNAME_UPDATED' ? (
                            getNicknameSystemText(msg)
                          ) : (
                            <><span className="font-semibold">{isMe ? 'Bạn' : msg.senderUsername}</span>{' '}{stripMessageMarkup(msg.content)}</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : msg.messageType === 'POLL' ? (
                  <div className="flex justify-center py-2">
                    {(() => {
                      const metadata = getPollMetadata(msg);
                      const options = metadata.options ?? [];
                      const totalVotes = options.reduce((sum: number, option: any) => sum + (option.voterIds?.length ?? 0), 0);
                      const isExpired = Boolean(metadata.expiresAt && new Date(metadata.expiresAt).getTime() <= Date.now());
                      const isLocked = Boolean(metadata.locked || isExpired || msg.isRecalled);
                      const canManagePoll = msg.senderId === user?.id ||
                        isGroupModeratorRole(currentGroupMembership?.role);

                      if (msg.isRecalled) {
                        return (
                          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 text-center text-sm text-gray-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-400">
                            Bình chọn đã bị xóa
                          </div>
                        );
                      }

                      return (
                        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                          <div className="border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                  <ListChecks className="h-3.5 w-3.5" />
                                  <span>Bình chọn</span>
                                  {msg.isPinned && <span>• Đã ghim</span>}
                                </div>
                                <h4 className="m-0 text-base font-bold text-gray-950 dark:text-white">{metadata.question || msg.content}</h4>
                                <p className="m-0 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                                  {metadata.allowMultiple ? 'Có thể chọn nhiều phương án' : 'Chọn một phương án'}
                                  {metadata.anonymous ? ' • Ẩn danh' : ''}
                                  {metadata.expiresAt ? ` • Hạn ${formatCallLogTime(metadata.expiresAt)}` : ''}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {canPinMessage(msg) && (
                                  <button
                                    type="button"
                                    onClick={() => togglePinMessage(msg.id, !!msg.isPinned)}
                                    className={`rounded-full p-1.5 transition ${msg.isPinned
                                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20'
                                        : 'bg-gray-100 text-gray-505 hover:bg-gray-202 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                      }`}
                                    title={msg.isPinned ? 'Bỏ ghim bình chọn' : 'Ghim bình chọn'}
                                  >
                                    {msg.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                                {isLocked && (
                                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-505 dark:bg-zinc-800 dark:text-zinc-400">
                                    Đã khóa
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 px-4 py-3">
                            {options.map((option: any) => {
                              const voteCount = option.voterIds?.length ?? 0;
                              const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                              const selected = Boolean(user?.id && option.voterIds?.includes(user.id));
                              return (
                                <div key={option.id} className="rounded-xl border border-gray-200 bg-gray-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-950/50">
                                  <div className="flex w-full items-center gap-3 text-left">
                                    <button
                                      type="button"
                                      onClick={() => !isLocked && handlePollVote(msg.id, option.id)}
                                      disabled={isLocked || pollActionMessageId === msg.id}
                                      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                                    >
                                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white dark:border-zinc-650 dark:bg-zinc-900'
                                        }`}>
                                        {selected && <Check className="h-3.5 w-3.5" />}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-905 dark:text-zinc-100">{option.text}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (!metadata.anonymous) {
                                          setPollVoterDialog({ option, anonymous: Boolean(metadata.anonymous) });
                                        }
                                      }}
                                      className={`shrink-0 text-xs font-bold ${metadata.anonymous ? 'cursor-default text-gray-400' : 'text-indigo-600 hover:underline dark:text-indigo-300'}`}
                                      disabled={metadata.anonymous}
                                      title={metadata.anonymous ? 'Bình chọn ẩn danh' : 'Xem người đã chọn'}
                                    >
                                      {voteCount} vote
                                    </button>
                                  </div>
                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
                                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
                                  </div>
                                  {!metadata.anonymous && (option.voters?.length ?? 0) > 0 && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                      <div className="flex -space-x-2">
                                        {(option.voters ?? []).slice(-6).map((voter: any) => (
                                          voter.avatarUrl ? (
                                            <img
                                              key={voter.id}
                                              src={voter.avatarUrl}
                                              alt={voter.username}
                                              className="h-6 w-6 rounded-full border-2 border-white object-cover shadow-sm dark:border-zinc-950"
                                              title={voter.username}
                                            />
                                          ) : (
                                            <div
                                              key={voter.id}
                                              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-[10px] font-bold text-white shadow-sm dark:border-zinc-950"
                                              title={voter.username}
                                            >
                                              {voter.username.charAt(0).toUpperCase()}
                                            </div>
                                          )
                                        ))}
                                      </div>
                                      {(option.voters?.length ?? 0) > 6 && (
                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                                          +{(option.voters?.length ?? 0) - 6}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {metadata.allowAddOptions && !isLocked && (
                            <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
                              <input
                                value={pollNewOptionText[msg.id] ?? ''}
                                onChange={(event) => setPollNewOptionText((values) => ({ ...values, [msg.id]: event.target.value }))}
                                placeholder="Thêm lựa chọn..."
                                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddPollOption(msg.id)}
                                disabled={pollActionMessageId === msg.id || !pollNewOptionText[msg.id]?.trim()}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                              >
                                Thêm
                              </button>
                            </div>
                          )}

                          {canManagePoll && !isLocked && (
                            <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
                              <button
                                type="button"
                                onClick={() => handleLockPoll(msg.id)}
                                disabled={pollActionMessageId === msg.id}
                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-205 dark:hover:bg-zinc-700"
                              >
                                Khóa bình chọn
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePoll(msg.id)}
                                disabled={pollActionMessageId === msg.id}
                                className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-505/20"
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    {/* Quoted Message / Reply Preview */}
                    {false && msg.parentId && (
                      <div className={`flex mb-1.5 max-w-[min(85vw,27rem)] ${isMe ? 'self-end mr-11' : 'ml-11'}`}>
                        <div
                          className={`group/reply flex w-full overflow-hidden rounded-2xl border bg-white/82 shadow-sm ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-zinc-900/78 dark:ring-zinc-800/70 ${isMe ? 'border-indigo-200/80 dark:border-indigo-500/25' : 'border-slate-200/80 dark:border-zinc-800'} cursor-pointer`}
                          onClick={() => msg.parentId && handleJumpToMessage(msg.parentId)}
                        >
                          <div className="w-1.5 shrink-0 bg-indigo-500/85 dark:bg-indigo-400" />
                          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition group-hover/reply:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300">
                              <CornerUpLeft className="h-3.5 w-3.5" />
                            </span>
                            {renderReplyPreviewCard(parentMessage)}
                            <span className="hidden">
                              @{parentMessage ? parentMessage.senderUsername : 'tin nhắn cũ'}
                            </span>
                            <span className="hidden">
                              {parentMessage ? (
                                parentMessage.isRecalled ? (
                                  <span className="truncate">Tin nhắn đã bị thu hồi</span>
                                ) : (
                                  <>
                                    {parentMessage.content && <span className="truncate">{stripMessageMarkup(parentMessage.content)}</span>}
                                    {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                                      <span className="flex items-center gap-1 opacity-80 font-medium shrink-0">
                                        {parentMessage.attachments[0].type === 'IMAGE' && (
                                          <img src={parentMessage.attachments[0].url} alt="attachment" className="w-4 h-4 object-cover rounded-sm shrink-0" />
                                        )}
                                        <span>
                                          {parentMessage.attachments[0].type === 'IMAGE' ? '[Hình ảnh]' : parentMessage.attachments[0].type === 'VIDEO' ? '[Video]' : '[Tệp đính kèm]'}
                                        </span>
                                      </span>
                                    )}
                                  </>
                                )
                              ) : (
                                <span className="truncate">tin nhắn đã bị xoá hoặc không tìm thấy</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex gap-3 max-w-[min(80vw,28rem)] sm:max-w-xl md:max-w-2xl ${isMe ? 'self-end flex-row-reverse' : 'self-start'} ${isSelectionMode ? 'items-center cursor-pointer transition hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 p-2 -m-2 rounded-xl' : ''}`}
                      onClick={() => {
                        if (isSelectionMode) toggleMessageSelection(msg.id);
                      }}
                    >

                      {/* Avatar */}
                      {!isMe && !isSelectionMode && (
                        <div className="shrink-0 mt-0.5">
                          {(() => {
                            const avatarUrl = isGroupConversation
                              ? getSenderAvatar(msg)
                              : activeFriend.avatarUrl;
                            const senderName = isGroupConversation
                              ? getSenderUsername(msg)
                              : activeFriend.username;
                            return avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-850"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-505 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
                                {senderName.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      <div className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
                        {showSenderName && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-discord-blurple mb-1 ml-0.5">
                            {getSenderUsername(msg)}
                          </span>
                        )}

                        <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                          {/* Context menu actions bar */}
                          {(hoveredMessageId === msg.id || activeMenuMessageId === msg.id) && !msg.isRecalled && !isSelectionMode && (
                            <div
                              className={`absolute z-20 animate-in fade-in zoom-in-95 duration-100 bottom-full mb-1 md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${isMe
                                  ? 'right-0 md:right-[calc(100%+8px)] md:left-auto'
                                  : 'left-0 md:left-[calc(100%+8px)] md:right-auto'
                                }`}
                            >
                              <MessageActionsBar
                                message={msg}
                                isMe={isMe}
                                onReply={() => setReplyTo(msg)}
                                onEdit={() => {
                                  setEditingMessageId(msg.id);
                                  setEditInputText(stripMessageMarkup(msg.content));
                                }}
                                onRecall={() => {
                                  setConfirmState({ isOpen: true, type: 'recall', messageId: msg.id });
                                }}
                                onDelete={() => {
                                  setConfirmState({ isOpen: true, type: 'delete', messageId: msg.id });
                                }}
                                onPinToggle={() => togglePinMessage(msg.id, !!msg.isPinned)}
                                onShare={() => setSharingMessage(msg)}
                                onRemind={() => setReminderTargetMessage(msg)}
                                canPin={canPinMessage(msg)}
                                canRecall={canRecallMessageInActiveConversation(msg)}
                                onMenuOpenChange={(isOpen) => setActiveMenuMessageId(isOpen ? msg.id : null)}
                              />
                            </div>
                          )}



                          {msg.forwardedFromMessageId && (
                            <div className="inline-flex max-w-[180px] sm:max-w-[240px] items-center gap-1.5 text-[11px] text-gray-500 dark:text-discord-muted mb-1">
                              <CornerUpLeft className="w-3 h-3 rotate-180 text-gray-400 dark:text-zinc-555 shrink-0" />
                              <span className="truncate">
                                Tin chuyển tiếp{msg.forwardedFromSenderUsername ? ` từ ${msg.forwardedFromSenderUsername}` : ''}
                              </span>
                            </div>
                          )}

                          {msg.isRecalled ? (
                            <div className={`w-fit max-w-[min(80vw,28rem)] p-3 rounded-2xl text-sm leading-relaxed text-left break-words shadow-sm italic text-gray-550 dark:text-zinc-500 ${isMe
                                ? 'bg-indigo-650/20 dark:bg-discord-blurple/10 text-gray-450 dark:text-zinc-500 rounded-tr-none'
                                : 'bg-white/80 dark:bg-discord-mid/50 text-gray-555 dark:text-zinc-555 rounded-tl-none border border-indigo-100/70 dark:border-zinc-850/30'
                              }`}>
                              {renderPriorityBadge()}
                              <span>Tin nhắn đã bị thu hồi</span>
                            </div>
                          ) : msg.attachments && msg.attachments.length > 0 ? (
                            <div className={`w-fit max-w-[min(80vw,28rem)] p-2 rounded-2xl text-sm shadow-sm ${isMe
                                ? 'nextalk-themed-bubble rounded-tr-none'
                                : 'bg-white dark:bg-discord-mid text-gray-905 dark:text-discord-text rounded-tl-none border border-indigo-100/80 dark:border-zinc-850/60'
                              }`}>
                              {renderPriorityBadge()}
                              {(() => {
                                const mediaAttachments = msg.attachments.filter((a: any) => a.type === 'IMAGE' || a.type === 'VIDEO');
                                const fileAttachments = msg.attachments.filter((a: any) => a.type !== 'IMAGE' && a.type !== 'VIDEO');
                                const mediaCount = mediaAttachments.length;
                                const visibleMedia = mediaAttachments.slice(0, 4);

                                return (
                                  <div className="flex flex-col gap-1.5">
                                    {mediaCount > 0 && (
                                      <div className={`grid gap-1.5 ${mediaCount === 1 ? 'grid-cols-1 max-w-[340px]' : 'grid-cols-2 max-w-[420px]'}`}>
                                        {visibleMedia.map((attachment: any, idx: number) => {
                                          const mediaType = attachment.type;
                                          let tileClass = 'col-span-1 h-36';
                                          if (mediaCount === 1) tileClass = 'col-span-1 max-h-80 min-h-[140px]';
                                          else if (mediaCount === 2) tileClass = 'col-span-1 h-44';
                                          else if (mediaCount === 3) tileClass = idx === 0 ? 'col-span-2 h-44' : 'col-span-1 h-32';
                                          else tileClass = 'col-span-1 h-32';

                                          const isFourthWithMore = idx === 3 && mediaCount > 4;

                                          return (
                                            <div
                                              key={`${attachment.url}-${idx}`}
                                              className={`relative overflow-hidden bg-black/10 w-full rounded-xl cursor-pointer group ${tileClass}`}
                                              onClick={() => setActiveMedia({ url: attachment.url, type: mediaType, name: attachment.name ?? undefined, messageId: msg.id, canRecall: isMe })}
                                              title={attachment.name || getFileName(attachment.url)}
                                            >
                                              {attachment.type === 'IMAGE' ? (
                                                <img
                                                  src={attachment.url}
                                                  alt={attachment.name || 'Shared image'}
                                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                />
                                              ) : (
                                                <VideoThumbnail
                                                  src={attachment.url}
                                                  onClick={() => setActiveMedia({ url: attachment.url, type: mediaType, name: attachment.name ?? undefined, messageId: msg.id, canRecall: isMe })}
                                                />
                                              )}

                                              {isMe && !isFourthWithMore && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Thu hồi ảnh này khỏi tin nhắn?')) {
                                                      void messageService.recallAttachment(msg.id, attachment.url);
                                                    }
                                                  }}
                                                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white backdrop-blur-sm z-10"
                                                  title="Thu hồi ảnh này"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}

                                              {msg.metadata?.optimistic && (
                                                <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center text-white z-20 pointer-events-none">
                                                  <Loader2 className="w-5 h-5 animate-spin mb-1 text-white" />
                                                  <span className="text-[11px] font-extrabold">{msg.metadata?.progress ?? 0}%</span>
                                                </div>
                                              )}

                                              {msg.metadata?.deliveryState === 'failed' && (
                                                <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-2 z-20">
                                                  <AlertCircle className="w-6 h-6 text-rose-400 mb-1" />
                                                  <span className="text-[11px] font-bold text-rose-200 text-center">Gửi thất bại</span>
                                                </div>
                                              )}

                                              {isFourthWithMore && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white text-2xl font-extrabold rounded-xl transition-all group-hover:bg-black/70">
                                                  +{mediaCount - 3}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {fileAttachments.map((attachment: any, idx: number) => {
                                      const fileUrl = attachment.url;
                                      const fileName = attachment.name || getFileName(attachment.url);
                                      if (attachment.type === 'AUDIO' || isAudioFileName(fileName) || isAudioFileName(fileUrl)) {
                                        return (
                                          <div key={`${attachment.url}-${idx}`} className={`w-[min(78vw,330px)] rounded-2xl p-2 shadow-sm ${isMe
                                              ? 'nextalk-themed-bubble rounded-tr-none'
                                              : 'bg-white dark:bg-discord-mid rounded-tl-none border border-indigo-100/80 dark:border-zinc-800'
                                            }`}>
                                            <div className="hidden">
                                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isMe ? 'bg-white/15 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                }`}>
                                                <Mic className="h-4.5 w-4.5" />
                                              </span>
                                              <div className="min-w-0 flex-1 text-left">
                                                <p className="m-0 truncate text-[13px] font-bold">{fileName || 'Tin nhắn thoại'}</p>
                                                {attachment.size != null && attachment.size > 0 && (
                                                  <p className={`m-0 text-[11px] ${isMe ? 'text-slate-500 dark:text-zinc-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                                                    {formatFileSize(attachment.size)}
                                                  </p>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => downloadFile(fileUrl, fileName || 'voice-message.webm')}
                                                className={`rounded-lg p-2 transition ${isMe ? 'text-slate-600 hover:bg-blue-200/60 dark:text-zinc-200 dark:hover:bg-white/10' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300'}`}
                                                title="Tải xuống"
                                              >
                                                <Download className="h-4 w-4" />
                                              </button>
                                            </div>
                                            <audio
                                              controls
                                              preload="metadata"
                                              src={fileUrl}
                                              className="block h-9 w-full"
                                            />
                                          </div>
                                        );
                                      }
                                      const { icon: FileIcon, colorClass, bgColorClass } = getFileIconConfig(fileName);

                                      return (
                                        <div key={`${attachment.url}-${idx}`} className="flex flex-col gap-1 w-full max-w-sm">
                                          <div className={`flex items-center gap-3 p-3 rounded-2xl border text-sm w-full ${isMe
                                              ? 'nextalk-themed-bubble rounded-tr-none'
                                            : 'bg-white dark:bg-discord-mid border-indigo-100 dark:border-zinc-850 text-gray-900 dark:text-white rounded-tl-none shadow-sm'
                                          }`}>
                                          <div className={`p-2.5 rounded-xl shrink-0 ${bgColorClass} ${colorClass}`}>
                                            <FileIcon className="w-5 h-5" />
                                          </div>
                                          <div className="flex-1 min-w-0 text-left">
                                            <p className="font-semibold text-xs truncate m-0" title={fileName}>
                                              {fileName}
                                            </p>
                                            {attachment.size != null && attachment.size > 0 && (
                                              <span className={`text-[10px] mt-0.5 block ${isMe ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {formatFileSize(attachment.size)}
                                              </span>
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => downloadFile(fileUrl, fileName)}
                                            className={`p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition shrink-0 ${isMe ? 'text-slate-600 dark:text-zinc-200' : 'text-gray-550 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white'}`}
                                            title="Tải xuống"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                );
                              })()}
                              {msg.content && (
                                <div className="mt-2 px-1">
                                  {renderFormattedMessage(msg.content)}
                                </div>
                              )}
                            </div>
                          ) : msg.messageType === 'STICKER' ? (
                            <div className="w-[130px] h-[130px] shrink-0 select-none">
                              <img
                                src={msg.content}
                                alt="Sticker"
                                className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
                                loading="lazy"
                              />
                            </div>
                          ) : msg.messageType === 'IMAGE' ? (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-300 dark:border-zinc-800 shadow-sm max-w-[280px] sm:max-w-[360px] bg-black/5 dark:bg-black/25">
                              <div className="absolute top-2 left-2 z-10 pointer-events-none drop-shadow-md">
                                {renderPriorityBadge()}
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveMedia({ url: msg.content, type: 'IMAGE' })}
                                className="w-full h-full p-0 border-0 outline-none"
                              >
                                <img
                                  src={msg.content}
                                  alt="Shared Image"
                                  className="max-h-72 w-full object-contain hover:opacity-95 transition-opacity cursor-zoom-in"
                                />
                              </button>
                            </div>
                          ) : msg.messageType === 'VIDEO' ? (
                            <div className={`relative flex flex-col w-full max-w-sm rounded-2xl border overflow-hidden shadow-sm ${isMe
                                ? 'border-indigo-505/50 dark:border-discord-blurple/50 rounded-tr-none'
                                : 'border-indigo-100 dark:border-zinc-800 rounded-tl-none'
                              }`}>
                              <div className="absolute top-2 left-2 z-10 pointer-events-none drop-shadow-md">
                                {renderPriorityBadge()}
                              </div>
                              {(() => {
                                const attachment = msg.attachments?.[0];
                                const fileUrl = attachment?.url || msg.content;
                                return (
                                  <VideoThumbnail
                                    src={fileUrl}
                                    onClick={() => setActiveMedia({ url: fileUrl, type: 'VIDEO' })}
                                  />
                                );
                              })()}
                              {(msg.attachments && msg.attachments.length > 0 && msg.content) && (
                                <div className={`px-3 py-2 text-sm ${isMe ? 'nextalk-themed-bubble' : 'bg-white dark:bg-discord-mid text-gray-900 dark:text-white'}`}>
                                  {renderFormattedMessage(msg.content)}
                                </div>
                              )}
                            </div>
                          ) : isAudioMessage(msg) ? (
                            <div className={`w-[min(78vw,330px)] rounded-2xl p-2 shadow-sm ${isMe
                                ? 'nextalk-themed-bubble rounded-tr-none'
                                : 'bg-white dark:bg-discord-mid rounded-tl-none border border-indigo-100/80 dark:border-zinc-800'
                              }`}>
                              {renderPriorityBadge()}
                              {(() => {
                                const attachment = msg.attachments?.[0];
                                const audioUrl = attachment?.url || msg.content;
                                const audioName = attachment?.name || 'Tin nhắn thoại';
                                return (
                                  <>
                                    <div className="hidden">
                                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isMe ? 'bg-white/15 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
                                        }`}>
                                        <Mic className="h-4.5 w-4.5" />
                                      </span>
                                      <div className="min-w-0 flex-1 text-left">
                                        <p className="m-0 truncate text-[13px] font-bold">{audioName}</p>
                                        {attachment?.size != null && attachment.size > 0 && (
                                          <p className={`m-0 text-[11px] ${isMe ? 'text-slate-500 dark:text-zinc-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                                            {formatFileSize(attachment.size)}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => downloadFile(audioUrl, audioName)}
                                        className={`rounded-lg p-2 transition ${isMe ? 'text-slate-600 hover:bg-blue-200/60 dark:text-zinc-200 dark:hover:bg-white/10' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300'}`}
                                        title="Tải xuống"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <audio
                                      controls
                                      preload="metadata"
                                      src={audioUrl}
                                      className="block h-9 w-full"
                                    />
                                    {msg.content && (
                                      <div className="px-1 text-sm">
                                        {renderFormattedMessage(msg.content)}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : msg.messageType === 'FILE' ? (
                            <div className="flex flex-col gap-1 w-full max-w-sm">
                              <div className={`flex flex-col p-3 rounded-2xl border text-sm w-full shadow-sm bg-white dark:bg-zinc-900 ${isMe
                                  ? 'border-indigo-100 dark:border-indigo-500/30 rounded-tr-none'
                                  : 'border-indigo-100 dark:border-zinc-800 rounded-tl-none'
                                }`}>
                                {renderPriorityBadge()}
                                <div className="flex items-center gap-3">
                                  {(() => {
                                    const attachment = msg.attachments?.[0];
                                    const fileUrl = attachment?.url || msg.content;
                                    const fileName = attachment?.name || getFileName(fileUrl);
                                    const fileSize = attachment?.size;
                                    const { icon: FileIcon, colorClass, bgColorClass } = getFileIconConfig(fileName);

                                    return (
                                      <>
                                        <div className={`p-2.5 rounded-xl shrink-0 ${bgColorClass} ${colorClass}`}>
                                          <FileIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left flex flex-col justify-center">
                                          <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate m-0 leading-tight" title={fileName}>
                                            {fileName}
                                          </p>
                                          {fileSize != null && fileSize > 0 && (
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                              {formatFileSize(fileSize)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors"
                                            title="Mở"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => downloadFile(fileUrl, fileName)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors"
                                            title="Tải xuống"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              {(msg.attachments && msg.attachments.length > 0 && msg.content) && (
                                <div className={`px-2 py-1 text-sm ${isMe ? 'text-indigo-900 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {renderFormattedMessage(msg.content)}
                                </div>
                              )}
                            </div>
                          ) : editingMessageId === msg.id ? (
                            /* Edit Mode */
                            <div className="flex flex-col gap-2 min-w-[260px] max-w-full">
                              <textarea
                                value={editInputText}
                                onChange={(e) => {
                                  setEditInputText(e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(msg.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessageId(null);
                                  }
                                }}
                                rows={2}
                                className="w-full bg-white dark:bg-zinc-800 border-2 border-indigo-400 dark:border-indigo-500 rounded-xl px-3 py-2 text-sm text-gray-905 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 resize-none shadow-sm transition-colors leading-relaxed"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-650 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                                >
                                  Huỷ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-lg transition-colors shadow-sm"
                                >
                                  Lưu
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`w-fit max-w-[min(80vw,28rem)] p-3 rounded-2xl text-sm leading-relaxed text-left break-words shadow-sm ${isMe
                                ? msg.parentId
                                  ? 'bg-blue-100 text-slate-700 border border-blue-200 rounded-tr-none dark:bg-indigo-500/20 dark:text-zinc-100 dark:border-indigo-500/30'
                                  : 'nextalk-themed-bubble rounded-tr-none'
                                : 'bg-white dark:bg-discord-mid text-gray-900 dark:text-discord-text rounded-tl-none border border-indigo-100/80 dark:border-zinc-850/60'
                              }`}>
                              {renderPriorityBadge()}
                              <div className="m-0">
                                {msg.parentId && renderInlineReplyPreview(parentMessage, isMe)}
                                {renderFormattedMessage(msg.content)}
                                {renderLinkPreviewCard(msg, isMe)}
                                {msg.isEdited && (
                                  <span className="text-[10px] text-gray-400 dark:text-discord-muted ml-1.5" title={msg.editedAt ? `Chỉnh sửa lúc: ${new Date(msg.editedAt).toLocaleString()}` : ''}>
                                    (đã chỉnh sửa)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {(hoveredMessageId === msg.id || activeMenuMessageId === msg.id) && !msg.isRecalled && (
                            <div className="absolute -bottom-3 right-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <MessageReactionButton
                                onReact={(emoji) => reactToMessage(msg.id, emoji)}
                                align={isMe ? 'right' : 'left'}
                                onOpenChange={(isOpen) => setActiveMenuMessageId(isOpen ? msg.id : null)}
                              />
                            </div>
                          )}

                          {/* Reactions list */}
                          {!msg.isRecalled && msg.reactions && msg.reactions.length > 0 && (
                            <div className={`mt-1 max-w-[min(72vw,360px)] ${isMe ? 'self-end pr-1' : 'self-start pl-1'}`}>
                              <MessageReactions
                                reactions={msg.reactions}
                                currentUserId={user?.id ?? ''}
                                onReactToggle={(emoji) => reactToMessage(msg.id, emoji)}
                                isMe={isMe}
                              />
                            </div>
                          )}
                        </div>

                        {/* Status block */}
                        <span className={`text-[10px] text-gray-500 dark:text-discord-muted mt-1 ${isMe ? 'text-right' : 'text-left'} flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {msg.isPinned && (
                            <Pin className="w-3 h-3 text-amber-505 fill-current mr-0.5 shrink-0" aria-label="Đã ghim" />
                          )}
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMe && (
                            <span className={`inline-flex shrink-0 items-center gap-1 font-semibold ${getMessageStatus(msg) === 'SEEN' ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-zinc-500'}`} title={getMessageStatusLabel(msg)}>
                              {getMessageStatus(msg) === 'SEEN' && (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-505 dark:text-sky-400" />
                              )}
                              {getMessageStatus(msg) === 'DELIVERED' && (
                                <CheckCheck className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-505" />
                              )}
                              {getMessageStatus(msg) === 'SENT' && (
                                <Check className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                              )}
                              <span>{getMessageStatusLabel(msg)}</span>
                            </span>
                          )}
                        </span>
                      </div>
                      {isSelectionMode && (
                        <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:bg-zinc-900 transition-colors" style={{ backgroundColor: selectedMessageIds.includes(msg.id) ? '#4f46e5' : undefined }}>
                          {selectedMessageIds.includes(msg.id) && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {isUnreadMarkerTarget && (
                <div className="flex items-center gap-3 py-1.5 shrink-0 select-none">
                  <div className="h-px flex-1 bg-sky-200 dark:bg-sky-500/30" />
                  <button
                    type="button"
                    onClick={onDismissUnreadMarker}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 shadow-sm transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
                    title="Ẩn dấu tin nhắn mới"
                  >
                    <span>{unreadMarker.count > 1 ? `${unreadMarker.count} tin nhắn mới` : 'Tin nhắn mới'}</span>
                    <X className="h-3 w-3" />
                  </button>
                  <div className="h-px flex-1 bg-sky-200 dark:bg-sky-500/30" />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {hasMoreMessages && (
          <div ref={sentinelRef} className="flex w-full shrink-0 flex-col gap-2 py-3 select-none">
            <Skeleton className="h-9 w-64 rounded-2xl" />
            <Skeleton className="h-9 w-80 max-w-[78%] self-end rounded-2xl" />
            <Skeleton className="h-9 w-56 rounded-2xl" />
          </div>
        )}

        {false && hasMoreMessages && (
          <div ref={sentinelRef} className="flex justify-center py-3 shrink-0 w-full select-none">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold py-1.5 px-3 bg-indigo-50/50 dark:bg-zinc-800/50 border border-indigo-100/30 dark:border-zinc-800/40 rounded-full">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tải tin nhắn cũ hơn...</span>
            </div>
          </div>
        )}
      </div>

      {showScrollToLatest && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className={`absolute bottom-28 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-100 bg-white/95 px-4 py-2 text-sm font-bold text-indigo-600 shadow-lg shadow-indigo-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-indigo-50 active:translate-y-0 dark:border-indigo-505/20 dark:bg-zinc-900/95 dark:text-indigo-305 dark:hover:bg-zinc-800 ${conversationInfoOffsetClass}`}
          title="Cuộn về tin nhắn mới nhất"
        >
          <ArrowDown className="h-4 w-4" />
          <span>Cuộn về tin nhắn mới nhất</span>
        </button>
      )}

      {unreadMarker && (
        <button
          type="button"
          onClick={() => onJumpToUnreadMarker('smooth')}
          className={`absolute bottom-40 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-sky-100 bg-white/95 px-4 py-2 text-sm font-bold text-sky-600 shadow-lg shadow-sky-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-sky-50 active:translate-y-0 dark:border-sky-500/20 dark:bg-zinc-900/95 dark:text-sky-300 dark:hover:bg-zinc-800 ${conversationInfoOffsetClass}`}
          title="Nhảy tới tin nhắn mới"
        >
          <ArrowDown className="h-4 w-4" />
          <span>{unreadMarker.count > 1 ? `${unreadMarker.count} tin nhắn mới` : 'Tin nhắn mới'}</span>
        </button>
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.type === 'recall' ? 'Thu hồi tin nhắn' : 'Xóa tin nhắn'}
        description={
          confirmState.type === 'recall'
            ? 'Bạn có chắc chắn muốn thu hồi tin nhắn này không? Hành động này sẽ xóa tin nhắn ở cả phía bạn và người nhận.'
            : 'Bạn có chắc chắn muốn xóa tin nhắn này không? Tin nhắn sẽ chỉ bị xóa ở phía bạn.'
        }
        confirmLabel={confirmState.type === 'recall' ? 'Thu hồi' : 'Xóa'}
        variant="danger"
        onCancel={() => setConfirmState({ isOpen: false, type: null, messageId: null })}
        onConfirm={() => {
          if (confirmState.type === 'recall' && confirmState.messageId) {
            recallMessage(confirmState.messageId);
          } else if (confirmState.type === 'delete' && confirmState.messageId) {
            deleteMessage(confirmState.messageId);
          }
          setConfirmState({ isOpen: false, type: null, messageId: null });
        }}
      />
    </>
  );
};
