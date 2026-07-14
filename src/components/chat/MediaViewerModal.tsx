import { X, Download, Trash2 } from 'lucide-react';
import { downloadFile } from '../../utils/fileUtils';

export type ActiveMediaProps = {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  name?: string;
  messageId?: string;
  canRecall?: boolean;
};

interface MediaViewerModalProps {
  activeMedia: ActiveMediaProps;
  onClose: () => void;
  onRecallAttachment?: (messageId: string, url: string) => void;
}

export const MediaViewerModal = ({ activeMedia, onClose, onRecallAttachment }: MediaViewerModalProps) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar with buttons */}
      <div className="absolute top-4 right-4 z-[110] flex items-center gap-3">
        {activeMedia.canRecall && activeMedia.messageId && onRecallAttachment && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Bạn có chắc chắn muốn thu hồi tệp này khỏi cuộc trò chuyện?')) {
                onRecallAttachment(activeMedia.messageId!, activeMedia.url);
                onClose();
              }
            }}
            className="rounded-full bg-red-500/20 text-red-400 p-2.5 backdrop-blur-md transition hover:bg-red-500/30 hover:scale-105"
            title="Thu hồi ảnh/tệp này"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void downloadFile(activeMedia.url, activeMedia.name || 'download');
          }}
          className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105"
          title="Tải xuống tệp gốc"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105"
          title="Đóng (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Media container */}
      <div
        className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {activeMedia.type === 'IMAGE' ? (
          <img
            src={activeMedia.url}
            alt={activeMedia.name || 'Shared Media'}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl select-none"
          />
        ) : (
          <video
            src={activeMedia.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
          />
        )}
      </div>

      {/* Optional Caption/Name at the bottom */}
      {activeMedia.name && (
        <p className="mt-4 max-w-[80vw] truncate text-sm font-semibold text-white/80 backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full">
          {activeMedia.name}
        </p>
      )}
    </div>
  );
};
