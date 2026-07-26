import { Bell, BellOff, Clock3, Loader2, MessageSquareText, X } from 'lucide-react';
import type { ConversationNotificationMode } from '../../types/chat';

interface ConversationNotificationSettingsProps {
  currentMode: ConversationNotificationMode;
  mutedUntil?: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (mode: ConversationNotificationMode, mutedUntil?: string | null) => Promise<void>;
}

const permanentOptions: Array<{
  mode: ConversationNotificationMode;
  title: string;
  description: string;
  icon: typeof Bell;
}> = [
  { mode: 'ALL', title: 'Tất cả tin nhắn', description: 'Nhận thông báo cho mọi tin nhắn mới.', icon: Bell },
  { mode: 'MENTIONS_ONLY', title: 'Chỉ mention', description: 'Chỉ thông báo khi có người nhắc đến bạn.', icon: MessageSquareText },
  { mode: 'NONE', title: 'Tắt cho đến khi bật lại', description: 'Tin nhắn vẫn đến và vẫn được tính là chưa đọc.', icon: BellOff },
];

const tomorrowMorning = () => {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(8, 0, 0, 0);
  return value.toISOString();
};

const formatRemainingMute = (mutedUntil: string) => {
  const remainingMinutes = Math.max(1, Math.ceil((new Date(mutedUntil).getTime() - Date.now()) / 60_000));
  const days = Math.floor(remainingMinutes / (24 * 60));
  const hours = Math.floor((remainingMinutes % (24 * 60)) / 60);
  const minutes = remainingMinutes % 60;

  if (days > 0) return `Còn ${days} ngày${hours > 0 ? ` ${hours} giờ` : ''}`;
  if (hours > 0) return `Còn ${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ''}`;
  return `Còn ${minutes} phút`;
};

export function ConversationNotificationSettings({
  currentMode,
  mutedUntil,
  saving,
  onClose,
  onSave,
}: ConversationNotificationSettingsProps) {
  const temporaryOptions = [
    { label: '1 giờ', until: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    { label: '8 giờ', until: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() },
    { label: 'Đến 08:00 ngày mai', until: tomorrowMorning() },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/35 p-3 backdrop-blur-[1px] sm:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-settings-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-discord-mid"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
          <div>
            <h3 id="notification-settings-title" className="m-0 text-sm font-black text-gray-950 dark:text-white">
              Thông báo cuộc trò chuyện
            </h3>
            <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
              Cài đặt này chỉ áp dụng cho tài khoản của bạn.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} title="Đóng" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-2 p-4">
          {permanentOptions.map(({ mode, title, description, icon: Icon }) => {
            const selected = currentMode === mode && !mutedUntil;
            return (
              <button
                key={mode}
                type="button"
                disabled={saving}
                onClick={() => void onSave(mode, null)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition disabled:cursor-wait disabled:opacity-60 ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{title}</strong>
                  <small className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-zinc-400">{description}</small>
                </span>
                {saving && selected && <Loader2 className="h-4 w-4 animate-spin" />}
                {!saving && selected && <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 px-4 py-4 dark:border-zinc-800">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            <Clock3 className="h-3.5 w-3.5" />
            Tắt tạm thời
          </div>
          <div className="grid grid-cols-3 gap-2">
            {temporaryOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                disabled={saving}
                onClick={() => void onSave('NONE', option.until)}
                className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-bold text-gray-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-indigo-500/10"
              >
                {option.label}
              </button>
            ))}
          </div>
          {mutedUntil && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex items-center gap-2 text-sm font-black">
                <Clock3 className="h-4 w-4" />
                Đang tắt tạm thời
              </div>
              <p className="m-0 mt-1 text-xs font-bold">{formatRemainingMute(mutedUntil)}</p>
              <p className="m-0 mt-0.5 text-[11px] font-medium opacity-80">
                Tự động bật lại lúc {new Date(mutedUntil).toLocaleString('vi-VN')}.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
