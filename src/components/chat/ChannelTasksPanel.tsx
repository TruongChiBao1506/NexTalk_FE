import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Plus, Trash2, X } from 'lucide-react';
import { groupService } from '../../services/groupService';
import type {
  ChannelResponse,
  ChannelTaskPriority,
  ChannelTaskResponse,
  ChannelTaskStatus,
  GroupResponse,
} from '../../types/group';

type Props = {
  group: GroupResponse;
  channel: ChannelResponse;
  currentUserId?: string;
};

const statusLabels: Record<ChannelTaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Completed',
  CANCELLED: 'Cancelled',
};

const priorityLabels: Record<ChannelTaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const priorityClass: Record<ChannelTaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
  MEDIUM: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  HIGH: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  CRITICAL: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

const statusClass: Record<ChannelTaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  DONE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const formatDueDate = (value?: string | null) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export function ChannelTasksPanel({ group, channel, currentUserId }: Props) {
  const [tasks, setTasks] = useState<ChannelTaskResponse[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | ChannelTaskStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ChannelTaskPriority>('MEDIUM');
  const [dueAt, setDueAt] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await groupService.getChannelTasks(group.id, channel.id);
      setTasks(response.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải công việc');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [group.id, channel.id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'all') return true;
      if (filter === 'mine') return task.assignees.some((assignee) => assignee.userId === currentUserId) || task.createdById === currentUserId;
      return task.status === filter;
    });
  }, [currentUserId, filter, tasks]);

  const createTask = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await groupService.createChannelTask(group.id, channel.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        assigneeIds,
      });
      if (response.data) setTasks((current) => [response.data!, ...current]);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueAt('');
      setAssigneeIds([]);
      setIsCreateOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tạo công việc');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (task: ChannelTaskResponse) => {
    const nextStatus: ChannelTaskStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    const previous = tasks;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item));
    try {
      const response = await groupService.updateChannelTaskStatus(group.id, channel.id, task.id, nextStatus);
      if (response.data) {
        setTasks((current) => current.map((item) => item.id === task.id ? response.data! : item));
      }
    } catch {
      setTasks(previous);
    }
  };

  const deleteTask = async (taskId: string) => {
    const previous = tasks;
    setTasks((current) => current.filter((task) => task.id !== taskId));
    try {
      await groupService.deleteChannelTask(group.id, channel.id, taskId);
    } catch {
      setTasks(previous);
    }
  };

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-gray-100 dark:bg-discord-dark">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-discord-mid">
        <div className="min-w-0">
          <h2 className="m-0 text-sm font-black text-gray-950 dark:text-white">Công việc #{channel.name}</h2>
          <p className="m-0 mt-0.5 text-xs font-semibold text-gray-500 dark:text-zinc-400">
            {tasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED').length} task đang mở
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">Tất cả</option>
            <option value="mine">Của tôi</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Completed</option>
          </select>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-indigo-600">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
              <p className="m-0 text-sm font-black text-gray-800 dark:text-zinc-100">Chưa có công việc</p>
              <p className="m-0 mt-1 text-xs text-gray-500 dark:text-zinc-400">Tạo task đầu tiên cho channel này.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-discord-mid">
            {filteredTasks.map((task) => (
              <div key={task.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
                <button type="button" onClick={() => updateStatus(task)} className="text-gray-400 hover:text-emerald-600">
                  {task.status === 'DONE' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`m-0 truncate text-sm font-black ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-950 dark:text-white'}`}>
                      {task.title}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusClass[task.status]}`}>{statusLabels[task.status]}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${priorityClass[task.priority]}`}>{priorityLabels[task.priority]}</span>
                  </div>
                  {task.description && <p className="m-0 mt-1 line-clamp-2 text-xs text-gray-500 dark:text-zinc-400">{task.description}</p>}
                  <p className="m-0 mt-1 text-[11px] font-bold text-gray-400">
                    {formatDueDate(task.dueAt)} · {task.assignees.length ? task.assignees.map((a) => a.username).join(', ') : 'Chưa giao'}
                  </p>
                </div>
                <button type="button" onClick={() => deleteTask(task.id)} className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-discord-mid">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-base font-black text-gray-950 dark:text-white">Tạo task mới</h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên task" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
              <div className="grid grid-cols-2 gap-3">
                <select value={priority} onChange={(e) => setPriority(e.target.value as ChannelTaskPriority)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
              </div>
              <div>
                <p className="mb-2 text-xs font-black text-gray-600 dark:text-zinc-300">Giao cho</p>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {group.members.map((member) => (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => toggleAssignee(member.userId)}
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${assigneeIds.includes(member.userId) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-600 dark:border-zinc-800 dark:text-zinc-300'}`}
                    >
                      {member.username}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800">Hủy</button>
              <button type="button" onClick={createTask} disabled={!title.trim() || isSaving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Tạo task
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
