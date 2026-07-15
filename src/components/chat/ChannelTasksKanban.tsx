import { useState } from 'react';
import { Pin, AlertTriangle, Trash2, Paperclip, ExternalLink, Loader2 } from 'lucide-react';
import type { ChannelTaskPriority, ChannelTaskResponse, ChannelTaskStatus } from '../../types/group';

type Props = {
  tasks: ChannelTaskResponse[];
  onStatusChange: (task: ChannelTaskResponse, status: ChannelTaskStatus) => void;
  canModifyStatus: (task: ChannelTaskResponse) => boolean;
  canDeleteTask: (task: ChannelTaskResponse) => boolean;
  onTogglePin: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUploadAttachment?: (task: ChannelTaskResponse, file: File) => void;
  uploadingTaskId?: string | null;
  onJumpToSourceMessage?: (messageId: string) => void;
};

const columns: { status: ChannelTaskStatus; label: string; headerColor: string; badgeBg: string }[] = [
  { status: 'TODO', label: 'To Do', headerColor: 'border-slate-300 dark:border-zinc-700', badgeBg: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300' },
  { status: 'IN_PROGRESS', label: 'In Progress', headerColor: 'border-indigo-400 dark:border-indigo-600', badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
  { status: 'DONE', label: 'Done', headerColor: 'border-emerald-400 dark:border-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  { status: 'CANCELLED', label: 'Cancelled', headerColor: 'border-rose-400 dark:border-rose-600', badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
];

const priorityColors: Record<ChannelTaskPriority, string> = {
  LOW: 'text-gray-500 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400',
  MEDIUM: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-300',
  CRITICAL: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300',
};

const priorityLabels: Record<ChannelTaskPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Vừa',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
};

const formatDueDate = (dueAt: string | null) => {
  if (!dueAt) return 'Không có hạn';
  const d = new Date(dueAt);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const isTaskOverdue = (task: ChannelTaskResponse) => {
  return Boolean(task.dueAt && task.status !== 'DONE' && task.status !== 'CANCELLED' && new Date(task.dueAt).getTime() < Date.now());
};

export function ChannelTasksKanban({ tasks, onStatusChange, canModifyStatus, canDeleteTask, onTogglePin, onDeleteTask, onUploadAttachment, uploadingTaskId, onJumpToSourceMessage }: Props) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-x-auto p-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedTaskId) {
                const draggedTask = tasks.find((task) => task.id === draggedTaskId);
                if (draggedTask) onStatusChange(draggedTask, col.status);
                setDraggedTaskId(null);
              }
            }}
            className="flex min-h-0 flex-col rounded-2xl border border-gray-200 bg-gray-50/70 p-3 shadow-sm dark:border-zinc-800/80 dark:bg-discord-mid/60"
          >
            {/* Column Header */}
            <div className={`mb-3 flex items-center justify-between border-b-2 pb-2.5 ${col.headerColor}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-900 dark:text-white">{col.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${col.badgeBg}`}>
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Tasks Container */}
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {colTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-300 text-center text-xs font-bold text-gray-400 dark:border-zinc-700">
                  Kéo thả công việc vào đây
                </div>
              ) : (
                colTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  return (
                    <div
                      key={task.id}
                      draggable={canModifyStatus(task)}
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                      className={`group relative rounded-xl border p-3.5 shadow-sm transition-all duration-200 hover:shadow-md ${
                        canModifyStatus(task) ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${
                        overdue
                          ? 'border-rose-300 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/10'
                          : task.isPinned
                          ? 'border-amber-300 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5'
                          : 'border-gray-200 bg-white dark:border-zinc-800 dark:bg-discord-mid'
                      }`}
                    >
                      {/* Badges row */}
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {task.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                            <Pin className="h-3 w-3 fill-amber-600" />
                            Đã ghim
                          </span>
                        )}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 animate-pulse">
                            <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                            Quá hạn
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className={`m-0 text-xs font-black ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      {task.sourceMessage && onJumpToSourceMessage && (
                        <button type="button" onClick={() => onJumpToSourceMessage(task.sourceMessage!.messageId)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-300">
                          <ExternalLink className="h-3 w-3" /> Tin nhắn gốc
                        </button>
                      )}

                      {/* Attachments */}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {task.attachments && task.attachments.length > 0 && task.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300"
                          >
                            <Paperclip className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[100px]">{att.name}</span>
                            <ExternalLink className="h-2 w-2 opacity-60" />
                          </a>
                        ))}
                        {canModifyStatus(task) && onUploadAttachment && (
                          <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-dashed border-indigo-300 bg-indigo-50/40 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {uploadingTaskId === task.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Paperclip className="h-2.5 w-2.5" />}
                            {uploadingTaskId === task.id ? 'Đang tải...' : 'Nộp tệp'}
                            <input
                              type="file"
                              className="hidden"
                              disabled={Boolean(uploadingTaskId)}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (file) {
                                  onUploadAttachment(task, file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400 dark:border-zinc-800">
                        <span className={overdue ? 'font-black text-rose-600 dark:text-rose-400' : ''}>
                          {formatDueDate(task.dueAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          {canModifyStatus(task) && (
                            <button
                              type="button"
                              onClick={() => onTogglePin(task.id)}
                              className={`rounded-lg p-1 transition ${
                                task.isPinned ? 'text-amber-600 bg-amber-100' : 'text-gray-400 hover:text-amber-600'
                              }`}
                              title={task.isPinned ? 'Bỏ ghim' : 'Ghim task'}
                            >
                              <Pin className={`h-3.5 w-3.5 ${task.isPinned ? 'fill-amber-600' : ''}`} />
                            </button>
                          )}
                          {canDeleteTask(task) && (
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              className="rounded-lg p-1 text-gray-400 hover:text-rose-600"
                              title="Xóa công việc"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
