import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, Clock, FileText, Image, Link, MessageSquare, Video, X } from 'lucide-react';
import type { MessageResponse } from '../../types/chat';
import { getMessagePreviewData } from '../../utils/messagePreview';

interface MessageReminderModalProps {
  message: MessageResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { remindAt: string; note: string }) => void;
}

const toDatetimeLocalValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const getPresetDate = (preset: '15m' | '1h' | 'tonight' | 'tomorrow') => {
  const now = new Date();

  if (preset === '15m') return new Date(now.getTime() + 15 * 60_000);
  if (preset === '1h') return new Date(now.getTime() + 60 * 60_000);
  if (preset === 'tonight') {
    const tonight = new Date(now);
    tonight.setHours(20, 0, 0, 0);
    if (tonight.getTime() <= now.getTime()) {
      tonight.setDate(tonight.getDate() + 1);
    }
    return tonight;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
};

const getPreviewIcon = (kind: ReturnType<typeof getMessagePreviewData>['kind']) => {
  if (kind === 'IMAGE' || kind === 'ALBUM' || kind === 'STICKER') return Image;
  if (kind === 'VIDEO') return Video;
  if (kind === 'FILE') return FileText;
  if (kind === 'LINK') return Link;
  return MessageSquare;
};

export const MessageReminderModal = ({
  message,
  isOpen,
  onClose,
  onSave,
}: MessageReminderModalProps) => {
  const [remindAt, setRemindAt] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setRemindAt(toDatetimeLocalValue(getPresetDate('1h')));
    setNote('');
  }, [isOpen, message?.id]);

  const preview = useMemo(() => getMessagePreviewData(message), [message]);
  const PreviewIcon = getPreviewIcon(preview.kind);
  const selectedTime = remindAt ? new Date(remindAt) : null;
  const isInvalid = !selectedTime || Number.isNaN(selectedTime.getTime()) || selectedTime.getTime() <= Date.now();

  if (!isOpen || !message) return null;

  const handleSave = () => {
    if (isInvalid || !selectedTime) return;
    onSave({ remindAt: selectedTime.toISOString(), note: note.trim() });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 text-gray-950 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-base font-bold">Tạo nhắc hẹn</h3>
            <p className="m-0 mt-1 text-sm text-gray-500 dark:text-zinc-400">
              NexTalk sẽ nhắc bạn quay lại tin nhắn này đúng thời gian đã chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
            <span>{message.senderUsername}</span>
            <span>•</span>
            <span>{preview.label}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            {preview.thumbnailUrl ? (
              <img src={preview.thumbnailUrl} alt={preview.label} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-gray-200 dark:bg-zinc-950 dark:text-indigo-300 dark:ring-zinc-800">
                <PreviewIcon className="h-5 w-5" />
              </div>
            )}
            <p className="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">
              {preview.fileName || preview.text}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['15m', '15 phút'],
            ['1h', '1 giờ'],
            ['tonight', 'Tối nay'],
            ['tomorrow', 'Ngày mai'],
          ].map(([preset, label]) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRemindAt(toDatetimeLocalValue(getPresetDate(preset as '15m' | '1h' | 'tonight' | 'tomorrow')))}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Thời gian nhắc
        </label>
        <input
          type="datetime-local"
          value={remindAt}
          min={toDatetimeLocalValue(new Date(Date.now() + 60_000))}
          onChange={(event) => setRemindAt(event.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />
        {isInvalid && (
          <p className="m-0 mt-1 text-xs font-medium text-rose-600 dark:text-rose-300">
            Vui lòng chọn thời gian trong tương lai.
          </p>
        )}

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Ghi chú
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={180}
          placeholder="Ví dụ: trả lời khách hàng, kiểm tra file, gọi lại..."
          className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isInvalid}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <BellRing className="h-4 w-4" />
            <span>Lưu nhắc hẹn</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageReminderModal;
