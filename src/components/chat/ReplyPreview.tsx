import React from 'react';
import { X, CornerUpLeft } from 'lucide-react';
import type { MessageResponse } from '../../types/chat';

interface ReplyPreviewProps {
  replyTo: MessageResponse;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, onCancel }) => {
  return (
    <div className="flex items-center justify-between bg-discord-dark-secondary px-4 py-2 border-t border-discord-gray-600 rounded-t-lg text-xs text-discord-gray-300 animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center space-x-2 truncate">
        <CornerUpLeft className="w-3.5 h-3.5 text-discord-gray-400 shrink-0" />
        <span className="text-discord-gray-400">
          Đang trả lời <span className="font-semibold text-discord-gray-200">@{replyTo.senderUsername}</span>
        </span>
        <span className="truncate italic text-discord-gray-400">
          "{replyTo.isRecalled ? 'Tin nhắn đã bị thu hồi' : replyTo.content}"
        </span>
      </div>
      <button
        onClick={onCancel}
        className="p-1 rounded hover:bg-discord-gray-700 hover:text-white transition-colors duration-150 ml-2 shrink-0"
        title="Hủy trả lời"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
