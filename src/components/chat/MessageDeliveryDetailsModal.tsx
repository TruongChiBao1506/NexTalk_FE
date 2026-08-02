import { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCheck, Loader2, X } from 'lucide-react';
import {
  messageService,
  type DeliveryStatusFilter,
  type MessageDeliveryDetailsResponse,
  type MessageDeliveryParticipant,
} from '../../services/messageService';

interface Props {
  messageId: string | null;
  onClose: () => void;
}

const FILTERS: Array<{ value: DeliveryStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SEEN', label: 'Đã xem' },
  { value: 'DELIVERED', label: 'Đã nhận' },
  { value: 'SENT', label: 'Đã gửi' },
];

const statusLabel = (status: MessageDeliveryParticipant['status']) => {
  if (status === 'SEEN') return 'Đã xem';
  if (status === 'DELIVERED') return 'Đã nhận';
  return 'Đã gửi';
};

const statusIcon = (status: MessageDeliveryParticipant['status']) => {
  if (status === 'SEEN') return <CheckCheck className="h-4 w-4 text-sky-600" />;
  if (status === 'DELIVERED') return <CheckCheck className="h-4 w-4 text-slate-500" />;
  return <Check className="h-4 w-4 text-slate-500" />;
};

export function MessageDeliveryDetailsModal({ messageId, onClose }: Props) {
  const [filter, setFilter] = useState<DeliveryStatusFilter>('ALL');
  const [details, setDetails] = useState<MessageDeliveryDetailsResponse | null>(null);
  const [items, setItems] = useState<MessageDeliveryParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (page: number, append: boolean) => {
    if (!messageId) return;
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const response = await messageService.getMessageDeliveryDetails(messageId, filter, page);
      setDetails(response.data);
      setItems((current) => append ? [...current, ...response.data.items] : response.data.items);
    } catch {
      setError('Không thể tải chi tiết trạng thái. Vui lòng thử lại.');
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!messageId) return;
    setDetails(null);
    setItems([]);
    void load(0, false);
  }, [messageId, filter]);

  useEffect(() => {
    if (!messageId) setFilter('ALL');
  }, [messageId]);

  if (!messageId) return null;

  const countFor = (value: DeliveryStatusFilter) => {
    if (!details) return null;
    if (value === 'SEEN') return details.seenCount;
    if (value === 'DELIVERED') return details.deliveredCount;
    if (value === 'SENT') return details.sentCount;
    return details.totalRecipients;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}>
      <div className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="m-0 text-base font-extrabold text-slate-900 dark:text-white">Chi tiết trạng thái gửi</h3>
            <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Trạng thái của từng người nhận</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === item.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {item.label}{countFor(item.value) !== null ? ` (${countFor(item.value)})` : ''}
            </button>
          ))}
        </div>

        <div className="min-h-40 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
          ) : error ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-center text-sm text-rose-600">
              <AlertCircle className="h-6 w-6" />
              <span>{error}</span>
              <button type="button" onClick={() => void load(0, false)} className="rounded-lg bg-rose-50 px-3 py-1.5 font-bold hover:bg-rose-100 dark:bg-rose-500/10">Thử lại</button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-zinc-400">Chưa có người nhận ở trạng thái này.</div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.userId} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/70">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                      {item.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.username}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">{new Date(item.updatedAt).toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    {statusIcon(item.status)}<span>{statusLabel(item.status)}</span>
                  </div>
                </div>
              ))}
              {details?.hasMore && (
                <button type="button" disabled={loadingMore} onClick={() => void load(details.page + 1, true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                  {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Xem thêm
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
