import React, { useState, useEffect } from 'react';
import { Calendar, Clock, VolumeX, X, Loader2, CalendarClock, AlertCircle } from 'lucide-react';
import { conversationService } from '../../services/conversationService';

interface Props {
  isOpen: boolean;
  conversationId: string;
  content: string;
  onClose: () => void;
  onSuccess: () => void;
}

const cleanContentText = (htmlContent: string) => {
  return (htmlContent || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

export const ScheduleSendModal: React.FC<Props> = ({
  isOpen,
  conversationId,
  content,
  onClose,
  onSuccess,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSilent, setIsSilent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      const defaultDate = now.toISOString().split('T')[0];
      const defaultTime = now.toTimeString().substring(0, 5);
      setDate(defaultDate);
      setTime(defaultTime);
      setIsSilent(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = cleanContentText(content);
    if (!rawText) {
      setError('Vui lòng nhập nội dung tin nhắn trước khi hẹn giờ');
      return;
    }
    if (!date || !time) {
      setError('Vui lòng chọn đầy đủ ngày và giờ gửi');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (isNaN(scheduledDate.getTime())) {
      setError('Thời gian không hợp lệ');
      return;
    }
    if (scheduledDate.getTime() <= Date.now() + 5000) {
      setError('Thời gian hẹn giờ phải lớn hơn thời gian hiện tại ít nhất 10 giây');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Calculate local timezone offset string e.g. +07:00
      const tzOffsetMin = -scheduledDate.getTimezoneOffset();
      const sign = tzOffsetMin >= 0 ? '+' : '-';
      const pad = (num: number) => String(Math.floor(Math.abs(num))).padStart(2, '0');
      const offsetStr = `${sign}${pad(tzOffsetMin / 60)}:${pad(tzOffsetMin % 60)}`;
      const isoWithOffset = `${date}T${time}:00${offsetStr}`;

      const response = await conversationService.scheduleMessage({
        message: {
          conversationId,
          content,
        },
        scheduledAt: isoWithOffset,
        silent: isSilent,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Không thể lên lịch gửi tin nhắn');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lên lịch gửi tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-zinc-700/80 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Hẹn giờ gửi tin nhắn
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Chọn ngày và giờ để tự động gửi nội dung này
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

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Content Preview Box */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/60">
            <span className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              Nội dung tin nhắn:
            </span>
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-800 dark:text-zinc-200 font-medium">
              {cleanContentText(content) || '(Chưa có nội dung văn bản)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Ngày gửi</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-discord-blurple dark:focus:ring-discord-blurple/30"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Giờ gửi</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-discord-blurple dark:focus:ring-discord-blurple/30"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/60 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 transition">
            <input
              type="checkbox"
              checked={isSilent}
              onChange={(e) => setIsSilent(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <VolumeX className="h-4 w-4 text-slate-500 dark:text-zinc-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Gửi im lặng</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Không phát chuông/âm thanh thông báo cho người nhận</span>
            </div>
          </label>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang hẹn giờ...</span>
                </>
              ) : (
                <>
                  <CalendarClock className="h-4 w-4" />
                  <span>Xác nhận hẹn giờ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
