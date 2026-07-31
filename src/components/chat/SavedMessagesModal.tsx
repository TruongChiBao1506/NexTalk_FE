import React, { useEffect, useState } from 'react';
import { Bookmark, Loader2, Trash2, X } from 'lucide-react';
import { messageService, type SavedMessageResponse } from '../../services/messageService';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenMessage: (item: SavedMessageResponse) => void;
}

export const SavedMessagesModal: React.FC<Props> = ({ open, onClose, onOpenMessage }) => {
  const [items, setItems] = useState<SavedMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    messageService.getSavedMessages()
      .then((response) => setItems(response.data ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}>
      <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2"><Bookmark className="h-5 w-5 text-indigo-600" /><h3 className="m-0 text-base font-extrabold">Tin nhắn đã lưu</h3></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-4">
          {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" /> : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có tin nhắn nào được lưu.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenMessage(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onOpenMessage(item);
                  }}
                  className="cursor-pointer rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200 transition hover:bg-indigo-50 hover:ring-indigo-200 dark:bg-zinc-800/70 dark:ring-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-xs font-bold text-indigo-600 dark:text-indigo-300">{item.message.senderUsername}</div>
                      {item.conversationName && <div className="mb-1 text-[10px] font-semibold text-gray-400">{item.conversationName}</div>}
                      <p className="m-0 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-zinc-200">{item.message.content || `[${item.message.messageType}]`}</p>
                      <div className="mt-2 text-[10px] text-gray-400">Lưu lúc {new Date(item.savedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <button
                      title="Bỏ lưu"
                      onClick={async (event) => {
                        event.stopPropagation();
                        await messageService.removeSavedMessage(item.message.id);
                        setItems((current) => current.filter((saved) => saved.id !== item.id));
                      }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
