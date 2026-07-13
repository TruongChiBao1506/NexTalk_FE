import React, { useEffect, useRef, useState } from 'react';
import { BellRing, CornerUpLeft, Edit2, Trash2, Undo2, Pin, PinOff, Copy, MoreHorizontal, Smile, Forward, Check } from 'lucide-react';
import type { MessageResponse } from '../../types/chat';
import { stripHtml } from '../../utils/text';
import { useChatStore } from '../../store/chatStore';

interface MessageActionsBarProps {
  message: MessageResponse;
  isMe: boolean;
  onReply: () => void;
  onEdit: () => void;
  onRecall: () => void;
  onDelete: () => void;
  onPinToggle: () => void;
  onShare: () => void;
  onRemind: () => void;
  canPin?: boolean;
  canRecall?: boolean;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

interface MessageReactionButtonProps {
  onReact: (emoji: string) => void;
  align?: 'left' | 'right';
  onOpenChange?: (isOpen: boolean) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😡', '😮', '😢'];

export const MessageReactionButton: React.FC<MessageReactionButtonProps> = ({
  onReact,
  align = 'right',
  onOpenChange,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onOpenChange?.(showEmojiPicker);
  }, [showEmojiPicker, onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openPicker = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShowEmojiPicker(true);
  };

  const closePickerSoon = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setShowEmojiPicker(false);
      closeTimerRef.current = null;
    }, 220);
  };

  return (
    <div
      className="relative"
      ref={emojiPickerRef}
      onMouseEnter={openPicker}
      onMouseLeave={closePickerSoon}
    >
      <button
        type="button"
        onClick={() => setShowEmojiPicker((value) => !value)}
        onFocus={openPicker}
        className={`w-7 h-7 rounded-full bg-white dark:bg-discord-mid border border-gray-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-gray-500 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-indigo-500/15 transition-colors ${showEmojiPicker ? 'text-indigo-600 dark:text-white bg-gray-50 dark:bg-indigo-500/15' : ''
          }`}
        title="Thêm cảm xúc"
      >
        <Smile className="w-4 h-4" />
      </button>

      {showEmojiPicker && (
        <>
          <div className={`absolute bottom-7 z-40 h-3 w-40 ${align === 'left' ? 'left-0' : 'right-0'}`} />
          <div
            className={`absolute bottom-9 z-50 bg-white dark:bg-discord-mid border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg p-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-100 ${align === 'left' ? 'left-0' : 'right-0'}`}
            onMouseEnter={openPicker}
            onMouseLeave={closePickerSoon}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(emoji);
                  setShowEmojiPicker(false);
                }}
                className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform duration-150 text-base rounded hover:bg-gray-100 dark:hover:bg-indigo-500/15"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const MessageActionsBar: React.FC<MessageActionsBarProps> = ({
  message,
  isMe,
  onReply,
  onEdit,
  onRecall,
  onDelete,
  onPinToggle,
  onShare,
  onRemind,
  canPin = true,
  canRecall,
  onMenuOpenChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMenuOpenChange?.(showDropdown);
  }, [showDropdown, onMenuOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    const attachmentUrls = message.attachments?.map((attachment) => attachment.url) ?? [];
    const copiedText = [message.content, ...attachmentUrls]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join('\n');
    navigator.clipboard.writeText(stripHtml(copiedText || message.content));
    setShowDropdown(false);
  };

  const handleRemind = () => {
    onRemind();
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center bg-white dark:bg-discord-mid border border-gray-200 dark:border-zinc-700 rounded-md shadow-md px-1.5 py-0.5 space-x-1 text-gray-700 dark:text-zinc-100 select-none h-8 transition-colors">
      <button
        type="button"
        onClick={onReply}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-indigo-500/15 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
        title="Trả lời"
      >
        <CornerUpLeft className="w-4 h-4" />
      </button>

      {!message.isRecalled && (
        <button
          type="button"
          onClick={onShare}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-indigo-500/15 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          title="Chia sẻ tin nhắn"
        >
          <Forward className="w-4 h-4" />
        </button>
      )}

      {!message.isRecalled && (
        <button
          type="button"
          onClick={handleRemind}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-indigo-500/15 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          title="Tạo nhắc hẹn"
        >
          <BellRing className="w-4 h-4" />
        </button>
      )}

      {isMe && !message.isRecalled && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-indigo-500/15 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-indigo-500/15 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${showDropdown ? 'bg-gray-100 dark:bg-indigo-500/15 text-gray-900 dark:text-white' : ''
            }`}
          title="Thêm"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 bottom-9 z-50 min-w-[170px] bg-white dark:bg-discord-mid border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg p-1 flex flex-col text-xs text-gray-700 dark:text-zinc-100 animate-in fade-in slide-in-from-bottom-2 duration-100">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-500/15 dark:hover:text-white transition-colors duration-150 text-left font-medium"
            >
              <Copy className="w-3.5 h-3.5 mr-2" />
              <span>Sao chép nội dung</span>
            </button>

            <button
              type="button"
              onClick={handleRemind}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-500/15 dark:hover:text-white transition-colors duration-150 text-left font-medium"
            >
              <BellRing className="w-3.5 h-3.5 mr-2" />
              <span>Tạo nhắc hẹn</span>
            </button>

            {canPin && (
            <button
              type="button"
              onClick={() => {
                onPinToggle();
                setShowDropdown(false);
              }}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-500/15 dark:hover:text-white transition-colors duration-150 text-left font-medium"
            >
              {message.isPinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  <span>Bỏ ghim tin nhắn</span>
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5 mr-2" />
                  <span>Ghim tin nhắn</span>
                </>
              )}
            </button>
            )}

            {(canRecall ?? isMe) && !message.isRecalled && (
              <button
                type="button"
                onClick={() => {
                  onRecall();
                  setShowDropdown(false);
                }}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-500/20 dark:hover:text-rose-200 transition-colors duration-150 text-left text-red-500 dark:text-rose-300 font-medium"
              >
                <Undo2 className="w-3.5 h-3.5 mr-2" />
                <span>Thu hồi tin nhắn</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                useChatStore.getState().toggleSelectionMode();
                useChatStore.getState().toggleMessageSelection(message.id);
                setShowDropdown(false);
              }}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-500/15 dark:hover:text-white transition-colors duration-150 text-left font-medium"
            >
              <Check className="w-3.5 h-3.5 mr-2" />
              <span>Chọn tin nhắn</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDelete();
                setShowDropdown(false);
              }}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-500/20 dark:hover:text-rose-200 transition-colors duration-150 text-left text-red-500 dark:text-rose-300 border-t border-gray-150 dark:border-zinc-700 mt-1 pt-1.5 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span>Xóa phía tôi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
