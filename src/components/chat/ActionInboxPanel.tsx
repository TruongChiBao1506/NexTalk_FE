import { useEffect } from 'react';
import {
  AlarmClock,
  ArchiveX,
  BellRing,
  CalendarDays,
  Check,
  ClipboardList,
  Inbox,
  Loader2,
  MessageSquareText,
  PhoneMissed,
  UserPlus,
  X,
} from 'lucide-react';
import { useActionInboxStore } from '../../store/actionInboxStore';
import type { ActionItemStatus, NotificationResponse } from '../../types/notification';

interface Props {
  onOpenItem: (item: NotificationResponse) => void;
}

const tabs: Array<{ status: ActionItemStatus; label: string }> = [
  { status: 'PENDING', label: 'Cần xử lý' },
  { status: 'RESOLVED', label: 'Đã xử lý' },
  { status: 'DISMISSED', label: 'Đã bỏ qua' },
];

function ActionIcon({ type }: { type: NotificationResponse['type'] }) {
  const className = 'h-5 w-5';
  if (type === 'MENTION') return <MessageSquareText className={className} />;
  if (type === 'TASK_ASSIGNED' || type === 'TASK_DUE' || type === 'TASK_UPDATED') return <ClipboardList className={className} />;
  if (type === 'MISSED_CALL') return <PhoneMissed className={className} />;
  if (type === 'GROUP_EVENT_REMINDER') return <CalendarDays className={className} />;
  if (type === 'FRIEND_REQUEST' || type === 'GROUP_INVITE' || type === 'CHAT_REQUEST') return <UserPlus className={className} />;
  return <BellRing className={className} />;
}

function formatActionTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function ActionInboxPanel({ onOpenItem }: Props) {
  const {
    items,
    activeStatus,
    isOpen,
    isLoading,
    error,
    closePanel,
    fetchItems,
    updateAction,
  } = useActionInboxStore();

  useEffect(() => {
    if (isOpen) void fetchItems(activeStatus);
  }, [activeStatus, fetchItems, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex justify-end bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={closePanel}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-950"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Hộp Cần xử lý"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-slate-950 dark:text-white">
              <Inbox className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="m-0 text-base font-black">Hộp Cần xử lý</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Độc lập với trạng thái chưa đọc của cuộc trò chuyện.</p>
          </div>
          <button type="button" onClick={closePanel} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex gap-1 border-b border-slate-200 px-3 py-2 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.status}
              type="button"
              onClick={() => void fetchItems(tab.status)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
                activeStatus === tab.status
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Inbox className="mb-3 h-10 w-10 text-slate-300 dark:text-zinc-700" />
              <p className="m-0 text-sm font-bold text-slate-700 dark:text-zinc-200">Không có mục nào</p>
              <p className="mt-1 text-xs text-slate-400">Các việc quan trọng sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      closePanel();
                      onOpenItem(item);
                    }}
                    className="flex w-full gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <ActionIcon type={item.type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold leading-5 text-slate-900 dark:text-white">{item.content}</span>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-400">{formatActionTime(item.createdAt)} · Mở nội dung gốc</span>
                    </span>
                  </button>

                  {activeStatus === 'PENDING' && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
                      <button type="button" onClick={() => void updateAction(item.id, 'RESOLVED')} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
                        <Check className="h-3.5 w-3.5" /> Đã xử lý
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateAction(item.id, 'PENDING', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300"
                      >
                        <AlarmClock className="h-3.5 w-3.5" /> Nhắc ngày mai
                      </button>
                      <button type="button" onClick={() => void updateAction(item.id, 'DISMISSED')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800">
                        <ArchiveX className="h-3.5 w-3.5" /> Bỏ qua
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
