import React, { useEffect, useRef, useState } from 'react';
import { CornerUpLeft, Edit2, Trash2, Undo2, Pin, PinOff, Copy, MoreHorizontal, Smile } from 'lucide-react';
import type { MessageResponse } from '../../types/chat';

interface MessageActionsBarProps {
  message: MessageResponse;
  isMe: boolean;
  onReply: () => void;
  onEdit: () => void;
  onRecall: () => void;
  onDelete: () => void;
  onPinToggle: () => void;
  onReact: (emoji: string) => void;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😡'];

export const MessageActionsBar: React.FC<MessageActionsBarProps> = ({
  message,
  isMe,
  onReply,
  onEdit,
  onRecall,
  onDelete,
  onPinToggle,
  onReact,
  onMenuOpenChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onMenuOpenChange) {
      onMenuOpenChange(showDropdown || showEmojiPicker);
    }
  }, [showDropdown, showEmojiPicker, onMenuOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center bg-white dark:bg-discord-dark border border-gray-200 dark:border-discord-gray-600 rounded-md shadow-md px-1.5 py-0.5 space-x-1 text-gray-700 dark:text-discord-gray-200 select-none h-8 transition-colors">
      {/* Quick Reactions */}
      {!message.isRecalled && (
        <div className="flex items-center space-x-0.5 border-r border-gray-200 dark:border-discord-gray-600 pr-1 mr-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="hover:scale-125 transition-transform duration-150 px-1 py-0.5 text-base rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
          
          {/* Reaction Picker Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${showEmojiPicker ? 'bg-gray-100 dark:bg-discord-gray-700 text-gray-900 dark:text-white' : ''}`}
              title="Thêm cảm xúc"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute right-0 bottom-9 z-50 bg-white dark:bg-discord-dark-secondary border border-gray-200 dark:border-discord-gray-600 rounded-md shadow-lg p-2 flex space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-100">
                {['😮', '😢', '👏', '🎉', '🔥', '💯'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform duration-150 text-lg px-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <button
        onClick={onReply}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
        title="Trả lời"
      >
        <CornerUpLeft className="w-4 h-4" />
      </button>

      {isMe && !message.isRecalled && (
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {/* More Options Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-discord-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${showDropdown ? 'bg-gray-100 dark:bg-discord-gray-700 text-gray-900 dark:text-white' : ''}`}
          title="Thêm"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 bottom-9 z-50 min-w-[170px] bg-white dark:bg-discord-dark-secondary border border-gray-200 dark:border-discord-gray-600 rounded-md shadow-lg p-1 flex flex-col text-xs text-gray-700 dark:text-discord-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-100">
            <button
              onClick={handleCopy}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-discord-blurple dark:hover:text-white transition-colors duration-150 text-left font-medium"
            >
              <Copy className="w-3.5 h-3.5 mr-2" />
              <span>Sao chép nội dung</span>
            </button>

            <button
              onClick={() => {
                onPinToggle();
                setShowDropdown(false);
              }}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-discord-blurple dark:hover:text-white transition-colors duration-150 text-left font-medium"
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

            {isMe && !message.isRecalled && (
              <button
                onClick={() => {
                  onRecall();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center px-2 py-1.5 rounded hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-500 dark:hover:text-white transition-colors duration-150 text-left text-red-500 dark:text-red-400 font-medium"
              >
                <Undo2 className="w-3.5 h-3.5 mr-2" />
                <span>Thu hồi tin nhắn</span>
              </button>
            )}

            <button
              onClick={() => {
                onDelete();
                setShowDropdown(false);
              }}
              className="w-full flex items-center px-2 py-1.5 rounded hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-500 dark:hover:text-white transition-colors duration-150 text-left text-red-500 dark:text-red-400 border-t border-gray-150 dark:border-discord-gray-600 mt-1 pt-1.5 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span>Xoá phía tôi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
