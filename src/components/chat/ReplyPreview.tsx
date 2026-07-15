import React from 'react';
import { BarChart3, CornerUpLeft, FileText, Image, Link, ListChecks, MessageSquare, Sticker, Video, X } from 'lucide-react';
import type { MessageResponse } from '../../types/chat';
import { formatFileSize } from '../../utils/fileUtils';
import { getMessagePreviewData } from '../../utils/messagePreview';

interface ReplyPreviewProps {
  replyTo: MessageResponse;
  onCancel: () => void;
}

const getPreviewIcon = (kind: ReturnType<typeof getMessagePreviewData>['kind']) => {
  if (kind === 'IMAGE' || kind === 'ALBUM') return Image;
  if (kind === 'VIDEO') return Video;
  if (kind === 'FILE') return FileText;
  if (kind === 'LINK') return Link;
  if (kind === 'POLL') return BarChart3;
  if (kind === 'TASK') return ListChecks;
  if (kind === 'STICKER') return Sticker;
  return MessageSquare;
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, onCancel }) => {
  const preview = getMessagePreviewData(replyTo);
  const PreviewIcon = getPreviewIcon(preview.kind);

  return (
    <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-gray-300 bg-white px-4 py-2.5 text-xs shadow-sm dark:border-zinc-900/60 dark:bg-discord-mid">
      <div className="flex min-w-0 items-center gap-3">
        <CornerUpLeft className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
        {preview.thumbnailUrl && (preview.kind === 'IMAGE' || preview.kind === 'STICKER' || preview.kind === 'ALBUM') ? (
          <img src={preview.thumbnailUrl} alt={preview.label} className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-zinc-800" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
            <PreviewIcon className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0">
          <p className="m-0 truncate text-[12px] font-semibold text-gray-500 dark:text-zinc-400">
            Đang trả lời <span className="text-gray-900 dark:text-white">@{replyTo.senderUsername}</span>
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-gray-700 dark:text-zinc-200">
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500 dark:bg-zinc-800 dark:text-zinc-300">
              {preview.label}
            </span>
            <span className="truncate font-medium">{preview.fileName || preview.text}</span>
            {preview.fileSize != null && preview.fileSize > 0 && (
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-zinc-500">{formatFileSize(preview.fileSize)}</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="ml-3 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        title="Hủy trả lời"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
