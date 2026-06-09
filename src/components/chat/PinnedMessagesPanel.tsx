import React from 'react';
import { X, PinOff, ExternalLink, MessageSquare } from 'lucide-react';
import type { MessageResponse } from '../../types/chat';

interface PinnedMessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: MessageResponse[];
  onUnpin: (messageId: string) => void;
  onJumpToMessage: (messageId: string) => void;
}

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({
  isOpen,
  onClose,
  pinnedMessages,
  onUnpin,
  onJumpToMessage,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  return (
    <div className="w-80 h-full border-l border-gray-200 dark:border-discord-gray-600 bg-white dark:bg-discord-dark-secondary flex flex-col z-30 animate-in slide-in-from-right duration-200 shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 dark:border-discord-gray-600 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-gray-700 dark:text-discord-gray-200 font-semibold text-sm">
          <MessageSquare className="w-4 h-4 text-gray-400 dark:text-discord-gray-400" />
          <span>Tin nhắn đã ghim ({pinnedMessages.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {pinnedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-450 dark:text-discord-gray-400 space-y-2">
            <div className="p-3 bg-gray-100 dark:bg-discord-dark-tertiary rounded-full">
              <MessageSquare className="w-6 h-6 text-gray-450 dark:text-discord-gray-500" />
            </div>
            <p className="text-xs">Không có tin nhắn nào được ghim trong cuộc hội thoại này.</p>
          </div>
        ) : (
          pinnedMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-gray-50 dark:bg-discord-dark border border-gray-200 dark:border-discord-gray-600 rounded-lg p-3 relative group hover:border-gray-300 dark:hover:border-discord-gray-400 transition-colors duration-150"
            >
              {/* Sender & Time */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-gray-700 dark:text-discord-gray-200 text-xs truncate max-w-[150px]">
                  @{msg.senderUsername}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-discord-gray-400">
                  {formatDate(msg.createdAt)}
                </span>
              </div>

              {/* Message Content */}
              <div className="text-xs text-gray-600 dark:text-discord-gray-300 break-words line-clamp-3">
                {msg.isRecalled ? (
                  <span className="italic text-gray-450 dark:text-discord-muted">Tin nhắn đã bị thu hồi</span>
                ) : (
                  msg.content
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-3 flex items-center justify-end space-x-2 border-t border-gray-200 dark:border-discord-gray-600/50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={() => onJumpToMessage(msg.id)}
                  className="flex items-center space-x-1 text-[10px] text-discord-blurple hover:underline font-semibold"
                  title="Đi đến tin nhắn"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Đi đến</span>
                </button>
                <button
                  onClick={() => onUnpin(msg.id)}
                  className="flex items-center space-x-1 text-[10px] text-rose-500 hover:text-rose-600 hover:underline font-semibold"
                  title="Bỏ ghim"
                >
                  <PinOff className="w-3 h-3" />
                  <span>Bỏ ghim</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
