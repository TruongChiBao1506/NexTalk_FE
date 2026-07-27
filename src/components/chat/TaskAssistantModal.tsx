import { useEffect, useState } from 'react';
import { Bot, Check, Loader2, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import {
  taskAssistantService,
  type TaskAssistantResult,
} from '../../services/taskAssistantService';

interface TaskAssistantModalProps {
  conversationId: string;
  groupId?: string;
  channelId?: string;
  onClose: () => void;
  onActionCompleted?: (toolName: string) => void | Promise<void>;
}

const getErrorMessage = (error: unknown) => {
  const value = error as {
    response?: { data?: { message?: string; errors?: string[] } };
    message?: string;
  };
  return value.response?.data?.message
    || value.response?.data?.errors?.[0]
    || value.message
    || 'Không thể xử lý yêu cầu lúc này.';
};

const textArgument = (value: unknown) => typeof value === 'string' ? value : '';

const formatDateTime = (value: unknown) => {
  const text = textArgument(value);
  if (!text) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function TaskAssistantModal({
  conversationId,
  groupId,
  channelId,
  onClose,
  onActionCompleted,
}: TaskAssistantModalProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<TaskAssistantResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [loading, onClose]);

  const ask = async () => {
    const normalizedPrompt = prompt.trim();
    if (normalizedPrompt.length < 3 || loading) return;
    setLoading(true);
    setError('');
    setResponse(null);
    try {
      const result = await taskAssistantService.ask({
        conversationId,
        prompt: normalizedPrompt,
        groupId,
        channelId,
      });
      setResponse(result.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const resolveAction = async (confirmed: boolean) => {
    if (!response?.confirmationId || loading) return;
    const toolName = response.action?.toolName;
    setLoading(true);
    setError('');
    try {
      const result = confirmed
        ? await taskAssistantService.confirm(response.confirmationId)
        : await taskAssistantService.reject(response.confirmationId);
      setResponse(result.data);
      if (confirmed && toolName && onActionCompleted) {
        void Promise.resolve(onActionCompleted(toolName)).catch(() => {});
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 cursor-default"
        onClick={() => !loading && onClose()}
      />
      <section className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Trợ lý tác vụ</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Antigravity · tối đa 30 yêu cầu/ngày</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Search className="mb-1.5 h-4 w-4" />
              Tìm và đọc tin nhắn trong hội thoại này
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="mb-1.5 h-4 w-4" />
              Tạo task, nhắc việc sau khi bạn xác nhận
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-zinc-200">
            Bạn muốn trợ lý làm gì?
          </label>
          <textarea
            autoFocus
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void ask();
            }}
            disabled={loading || response?.status === 'CONFIRMATION_REQUIRED'}
            maxLength={2000}
            rows={4}
            placeholder="Ví dụ: Tìm các tin nhắn nói về hạn nộp báo cáo và tạo task cho nhóm..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />

          {error && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          {response && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-100">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Kết quả từ trợ lý
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-zinc-300">
                {response.reply}
              </p>

              {response.status === 'CONFIRMATION_REQUIRED' && response.action && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {response.action.label}
                  </div>
                  {response.action.toolName === 'schedule_reminder' ? (
                    <div className="mt-2 space-y-1.5 text-sm leading-5 text-amber-800 dark:text-amber-300">
                      <div>
                        <span className="font-semibold">Thời gian:</span>{' '}
                        {formatDateTime(response.action.arguments.remindAt)}
                      </div>
                      {textArgument(response.action.arguments.note) && (
                        <div>
                          <span className="font-semibold">Nội dung:</span>{' '}
                          {textArgument(response.action.arguments.note)}
                        </div>
                      )}
                    </div>
                  ) : response.action.toolName === 'create_channel_task' ? (
                    <div className="mt-2 space-y-1.5 text-sm leading-5 text-amber-800 dark:text-amber-300">
                      <div>
                        <span className="font-semibold">Công việc:</span>{' '}
                        {textArgument(response.action.arguments.title)}
                      </div>
                      {textArgument(response.action.arguments.dueAt) && (
                        <div>
                          <span className="font-semibold">Hạn hoàn thành:</span>{' '}
                          {formatDateTime(response.action.arguments.dueAt)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-300">
                      {response.action.summary}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    NexTalk chưa thực hiện thay đổi này.
                  </p>
                </div>
              )}

              {response.status === 'COMPLETED' && (
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> Hoàn tất
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-zinc-800">
          {response?.status === 'CONFIRMATION_REQUIRED' ? (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => void resolveAction(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Hủy hành động
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void resolveAction(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận thực hiện
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={loading || prompt.trim().length < 3}
              onClick={() => void ask()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Thực hiện
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
