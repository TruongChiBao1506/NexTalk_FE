import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Calendar, Trash2, X, Loader2, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';
import { conversationService, type ScheduledMessageResponse } from '../../services/conversationService';

interface Props {
  isOpen: boolean;
  conversationId: string;
  onClose: () => void;
}

const cleanPreview = (value: string) =>
  (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const formatScheduledAt = (value: string) => {
  try {
    return new Date(value).toLocaleString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

export const ScheduledMessagesModal: React.FC<Props> = ({ isOpen, conversationId, onClose }) => {
  const [items, setItems] = useState<ScheduledMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await conversationService.getPendingScheduledMessages();
      if (response.success && Array.isArray(response.data)) {
        const filtered = response.data
          .filter((item) => item.conversationId === conversationId && item.status === 'PENDING')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setItems(filtered);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách tin nhắn đã hẹn');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách tin nhắn đã hẹn');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isOpen) {
      void loadItems();
      setSuccessMessage(null);
    }
  }, [isOpen, loadItems]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setError(null);
    try {
      const response = await conversationService.cancelScheduledMessage(id);
      if (response.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setSuccessMessage('Đã hủy lịch gửi tin nhắn thành công');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.message || 'Không thể hủy lịch gửi');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy lịch gửi');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-zinc-700/80 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Tin nhắn đã hẹn giờ
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Danh sách tin nhắn tự động gửi trong cuộc trò chuyện này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Đang tải danh sách tin hẹn giờ...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Chưa có tin nhắn hẹn giờ nào
              </p>
              <p className="max-w-xs text-xs text-slate-500 dark:text-zinc-400">
                Bạn có thể dùng nút AI Sparkles ✨ để hẹn giờ gửi tin nhắn tự động.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-indigo-500/30 dark:hover:bg-zinc-800/80"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-100/80 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatScheduledAt(item.scheduledAt)}</span>
                    </div>

                    <button
                      type="button"
                      disabled={cancellingId === item.id}
                      onClick={() => void handleCancel(item.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition disabled:opacity-50"
                      title="Hủy lịch gửi tin này"
                    >
                      {cancellingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Hủy lịch</span>
                    </button>
                  </div>

                  <p className="line-clamp-3 text-sm text-slate-800 dark:text-zinc-200 font-normal leading-relaxed">
                    {cleanPreview(item.content) || '(Nội dung không xác định)'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end border-t border-slate-100 px-6 py-3.5 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
};
