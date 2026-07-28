import { useEffect } from 'react';
import { Archive, CalendarClock, CheckCircle2, ClipboardList, Loader2, Repeat2, X } from 'lucide-react';
import { useMyTasksStore } from '../../store/myTasksStore';
import type { ChannelTaskResponse } from '../../types/group';

interface Props {
  onOpenTask: (task: ChannelTaskResponse) => void;
}

const statusLabels: Record<ChannelTaskResponse['status'], string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function MyTasksPanel({ onOpenTask }: Props) {
  const { tasks, archived, isOpen, isLoading, error, closePanel, fetchTasks } = useMyTasksStore();

  useEffect(() => {
    if (isOpen) void fetchTasks(archived);
  }, [archived, fetchTasks, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[129] flex justify-end bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={closePanel}>
      <aside className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-950" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              <h2 className="m-0 text-base font-black text-slate-950 dark:text-white">Task của tôi</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Tổng hợp task được giao từ tất cả nhóm và channel.</p>
          </div>
          <button type="button" onClick={closePanel} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex gap-2 border-b border-slate-200 p-3 dark:border-zinc-800">
          <button type="button" onClick={() => void fetchTasks(false)} className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${!archived ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-500'}`}>
            Đang hoạt động
          </button>
          <button type="button" onClick={() => void fetchTasks(true)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${archived ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-500'}`}>
            <Archive className="h-3.5 w-3.5" /> Đã lưu trữ
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <CheckCircle2 className="mb-3 h-11 w-11 text-emerald-400" />
              <p className="m-0 text-sm font-black text-slate-800 dark:text-white">Không có task nào</p>
              <p className="mt-1 text-xs text-slate-400">Task được giao cho bạn sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  type="button"
                  key={task.id}
                  onClick={() => {
                    closePanel();
                    onOpenTask(task);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-black text-slate-900 dark:text-white">{task.title}</p>
                      <p className="m-0 mt-1 truncate text-xs font-semibold text-slate-400">{task.groupName} · #{task.channelName}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">{statusLabels[task.status]}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                    {task.dueAt && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{new Date(task.dueAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                    {task.recurrence && task.recurrence !== 'NONE' && <span className="inline-flex items-center gap-1 text-indigo-600"><Repeat2 className="h-3.5 w-3.5" />Lặp lại</span>}
                    {!!task.dependencies?.length && <span>{task.dependencies.length} phụ thuộc</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
