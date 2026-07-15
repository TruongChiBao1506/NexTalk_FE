import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Plus, Trash2, X, ChevronDown, ChevronRight, CheckSquare, Square, List, ChartNoAxesGantt, Columns3, Pin, AlertTriangle, Paperclip, ExternalLink } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { fileService } from '../../services/fileService';
import { Skeleton } from '../common/Skeleton';
import { useChannelTaskStore } from '../../store/channelTaskStore';
import { stripHtml } from '../../utils/text';
import type { MessageResponse } from '../../types/chat';
import { ChannelTasksTimeline } from './ChannelTasksTimeline';
import { ChannelTasksKanban } from './ChannelTasksKanban';
import type {
  ChannelResponse,
  ChannelTaskPriority,
  ChannelTaskResponse,
  ChannelTaskStatus,
  GroupResponse,
  TaskAttachmentRequest,
  TaskAttachmentResponse,
} from '../../types/group';

type Props = {
  group: GroupResponse;
  channel: ChannelResponse;
  currentUserId?: string;
  sourceMessageDraft?: MessageResponse | null;
  onSourceMessageDraftConsumed?: () => void;
  onJumpToSourceMessage?: (messageId: string) => void;
  focusedTaskId?: string | null;
  onFocusedTaskHandled?: () => void;
};

const EMPTY_TASKS: ChannelTaskResponse[] = [];

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

const ChannelTasksSkeleton = () => (
  <div className="min-h-0 flex-1 overflow-hidden p-4" aria-label="Đang tải công việc">
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-discord-mid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-zinc-800">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className={`h-4 ${index % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

export function ChannelTasksPanel({ group, channel, currentUserId, sourceMessageDraft, onSourceMessageDraftConsumed, onJumpToSourceMessage, focusedTaskId, onFocusedTaskHandled }: Props) {
  const userRole = group.members.find((m) => m.userId === currentUserId)?.role;
  const isLeader = userRole === 'OWNER' || userRole === 'LEADER' || userRole === 'ADMIN';
  const canModifyStatus = (task: ChannelTaskResponse) => task.createdById === currentUserId || task.assignees.some((a) => a.userId === currentUserId) || isLeader;
  const canDeleteTask = (task: ChannelTaskResponse) => task.createdById === currentUserId || isLeader;

  const tasks = useChannelTaskStore((state) => state.tasksByChannel[channel.id] ?? EMPTY_TASKS);
  const hasCachedTasks = useChannelTaskStore((state) => Object.prototype.hasOwnProperty.call(state.tasksByChannel, channel.id));
  const storeLoading = useChannelTaskStore((state) => state.loadingTasks[channel.id] ?? false);
  const fetchCachedTasks = useChannelTaskStore((state) => state.fetchTasks);
  const setCachedTasks = useChannelTaskStore((state) => state.setTasks);
  const setTasks = (updater: ChannelTaskResponse[] | ((current: ChannelTaskResponse[]) => ChannelTaskResponse[])) => setCachedTasks(channel.id, updater);
  const [filter, setFilter] = useState<'all' | 'mine' | ChannelTaskStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const isLoading = storeLoading && !hasCachedTasks;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [confirmStatusTask, setConfirmStatusTask] = useState<{ task: ChannelTaskResponse; nextStatus: ChannelTaskStatus } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ChannelTaskPriority>('MEDIUM');
  const [startAt, setStartAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [newSubtasks, setNewSubtasks] = useState<{ title: string }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [newAttachments, setNewAttachments] = useState<TaskAttachmentRequest[]>([]);
  const [sourceMessage, setSourceMessage] = useState<MessageResponse | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [attachmentFeedback, setAttachmentFeedback] = useState<string | null>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [inlineSubtaskInputs, setInlineSubtaskInputs] = useState<Record<string, string>>({});

  const loadTasks = async (force = false) => {
    setError(null);
    try {
      await fetchCachedTasks(group.id, channel.id, force);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải công việc');
    } finally {}
  };

  useEffect(() => {
    void loadTasks();
  }, [group.id, channel.id]);

  useEffect(() => {
    if (!sourceMessageDraft) return;
    const plainText = stripHtml(sourceMessageDraft.content || '').trim();
    const fallback = sourceMessageDraft.attachments?.[0]?.name || 'Công việc từ tin nhắn';
    setTitle((plainText || fallback).slice(0, 100));
    setDescription(plainText);
    setNewAttachments((sourceMessageDraft.attachments || []).map((attachment) => ({
      url: attachment.url,
      name: attachment.name || 'File',
      type: attachment.type || 'FILE',
      size: attachment.size,
    })));
    setSourceMessage(sourceMessageDraft);
    setIsCreateOpen(true);
    onSourceMessageDraftConsumed?.();
  }, [sourceMessageDraft, onSourceMessageDraftConsumed]);

  useEffect(() => {
    if (!focusedTaskId || isLoading) return;
    setFilter('all');
    setViewMode('list');
    setExpandedTaskIds((current) => current.includes(focusedTaskId) ? current : [...current, focusedTaskId]);
    window.setTimeout(() => {
      document.getElementById(`channel-task-${focusedTaskId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onFocusedTaskHandled?.();
    }, 100);
  }, [focusedTaskId, isLoading, onFocusedTaskHandled]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'all') return true;
      if (filter === 'mine') return task.assignees.some((assignee) => assignee.userId === currentUserId);
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
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        assigneeIds,
        subtasks: newSubtasks.filter(s => s.title.trim()).map(s => ({ title: s.title.trim() })),
        attachments: newAttachments,
        sourceMessageId: sourceMessage?.id,
      });
      if (response.data) setTasks((current) => [response.data!, ...current]);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStartAt('');
      setDueAt('');
      setAssigneeIds([]);
      setNewSubtasks([]);
      setSubtaskInput('');
      setNewAttachments([]);
      setSourceMessage(null);
      setIsCreateOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tạo công việc');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatusValue = async (task: ChannelTaskResponse, nextStatus: ChannelTaskStatus) => {
    if (task.status === nextStatus) return;
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

  const confirmStatusChange = (task: ChannelTaskResponse, nextStatus: ChannelTaskStatus) => {
    if (task.status === nextStatus) return;
    setConfirmStatusTask({ task, nextStatus });
  };

  const toggleSubtask = async (task: ChannelTaskResponse, subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { id: s.id, title: s.title, isCompleted: !s.isCompleted } : { id: s.id, title: s.title, isCompleted: s.isCompleted }
    );
    const previous = tasks;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, subtasks: updatedSubtasks } : item))
    );
    try {
      const response = await groupService.updateChannelTask(group.id, channel.id, task.id, {
        subtasks: updatedSubtasks,
      });
      if (response.data) {
        setTasks((current) => current.map((item) => (item.id === task.id ? response.data! : item)));
      }
    } catch {
      setTasks(previous);
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const addSubtaskToTask = async (task: ChannelTaskResponse) => {
    const inputTitle = (inlineSubtaskInputs[task.id] || '').trim();
    if (!inputTitle) return;
    const existing = task.subtasks || [];
    const updatedSubtasks = [...existing.map(s => ({ id: s.id, title: s.title, isCompleted: s.isCompleted })), { title: inputTitle, isCompleted: false }];
    const previous = tasks;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, subtasks: updatedSubtasks as any } : item))
    );
    setInlineSubtaskInputs((prev) => ({ ...prev, [task.id]: '' }));
    try {
      const response = await groupService.updateChannelTask(group.id, channel.id, task.id, {
        subtasks: updatedSubtasks,
      });
      if (response.data) {
        setTasks((current) => current.map((item) => (item.id === task.id ? response.data! : item)));
      }
    } catch {
      setTasks(previous);
    }
  };

  const deleteSubtaskFromTask = async (task: ChannelTaskResponse, subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks
      .filter((s) => s.id !== subtaskId)
      .map((s) => ({ id: s.id, title: s.title, isCompleted: s.isCompleted }));
    const previous = tasks;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, subtasks: updatedSubtasks as any } : item))
    );
    try {
      const response = await groupService.updateChannelTask(group.id, channel.id, task.id, {
        subtasks: updatedSubtasks,
      });
      if (response.data) {
        setTasks((current) => current.map((item) => (item.id === task.id ? response.data! : item)));
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

  const togglePinTask = async (taskId: string) => {
    // 1. Instant Optimistic UI Update
    setTasks((current) => {
      const updated = current.map((t) =>
        t.id === taskId ? { ...t, isPinned: !t.isPinned, pinnedAt: !t.isPinned ? new Date().toISOString() : null } : t
      );
      return updated.sort((t1, t2) => {
        if (Boolean(t1.isPinned) !== Boolean(t2.isPinned)) {
          return t1.isPinned ? -1 : 1;
        }
        return new Date(t2.createdAt).getTime() - new Date(t1.createdAt).getTime();
      });
    });

    try {
      const response = await groupService.togglePinChannelTask(group.id, channel.id, taskId);
      if (response.data) {
        setTasks((current) => {
          const updated = current.map((t) => (t.id === taskId ? response.data! : t));
          return updated.sort((t1, t2) => {
            if (Boolean(t1.isPinned) !== Boolean(t2.isPinned)) {
              return t1.isPinned ? -1 : 1;
            }
            return new Date(t2.createdAt).getTime() - new Date(t1.createdAt).getTime();
          });
        });
      }
    } catch {
      void loadTasks();
    }
  };

  const uploadAttachmentToTask = async (task: ChannelTaskResponse, file: File) => {
    if (uploadingTaskId) return;
    setUploadingTaskId(task.id);
    setAttachmentFeedback(null);
    try {
      const uploaded = await fileService.uploadFile(file);
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const fileType = isImg ? 'IMAGE' : isVid ? 'VIDEO' : 'FILE';
      const newAtt: TaskAttachmentResponse = {
        id: crypto.randomUUID(),
        url: uploaded.data.url,
        name: file.name,
        type: fileType,
        size: file.size,
      };
      const updatedAttachments = [...(task.attachments ?? []), newAtt];

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, attachments: updatedAttachments } : item))
      );

      const response = await groupService.updateChannelTask(group.id, channel.id, task.id, {
        attachments: updatedAttachments,
      });
      if (response.data) {
        setTasks((current) => current.map((item) => (item.id === task.id ? response.data! : item)));
      }
      setAttachmentFeedback(`Đã nộp “${file.name}” vào công việc.`);
      window.dispatchEvent(new CustomEvent('nextalk:task-attachments-updated', {
        detail: { groupId: group.id, channelId: channel.id },
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể nộp tệp vào công việc');
      void loadTasks();
    } finally {
      setUploadingTaskId(null);
    }
  };

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  };

  const currentUserRole = group.members.find((m) => m.userId === currentUserId)?.role;
  const canAssignToOthers = currentUserRole === 'OWNER' || currentUserRole === 'LEADER';
  const assignableMembers = canAssignToOthers ? group.members : group.members.filter((m) => m.userId === currentUserId);

  const isTaskOverdue = (task: ChannelTaskResponse) => {
    return Boolean(task.dueAt && task.status !== 'DONE' && new Date(task.dueAt).getTime() < Date.now());
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
          <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Columns3 className="h-4 w-4" />
              Bảng công việc
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'timeline'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <ChartNoAxesGantt className="h-4 w-4" />
              Timeline
            </button>
          </div>
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
            <option value="CANCELLED">Đã hủy</option>
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
      {attachmentFeedback && (
        <div className="mx-4 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {attachmentFeedback}
        </div>
      )}

      {isLoading ? (
        <ChannelTasksSkeleton />
      ) : viewMode === 'timeline' ? (
        <ChannelTasksTimeline
          tasks={filteredTasks}
          onTaskOpen={(task) => {
            setViewMode('list');
            setFilter('all');
            setExpandedTaskIds((current) => current.includes(task.id) ? current : [...current, task.id]);
          }}
        />
      ) : viewMode === 'kanban' ? (
        <ChannelTasksKanban
          tasks={filteredTasks}
          onStatusChange={updateStatusValue}
          canModifyStatus={canModifyStatus}
          canDeleteTask={canDeleteTask}
          onTogglePin={togglePinTask}
          onDeleteTask={deleteTask}
          onUploadAttachment={uploadAttachmentToTask}
          uploadingTaskId={uploadingTaskId}
          onJumpToSourceMessage={onJumpToSourceMessage}
          onToggleSubtask={toggleSubtask}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
              <p className="m-0 text-sm font-black text-gray-800 dark:text-zinc-100">Chưa có công việc</p>
              <p className="m-0 mt-1 text-xs text-gray-500 dark:text-zinc-400">Tạo task đầu tiên cho channel này.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-discord-mid">
            {filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task);
              return (
                <div
                  key={task.id}
                  id={`channel-task-${task.id}`}
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl transition ${focusedTaskId === task.id ? 'relative z-10 ring-2 ring-inset ring-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10' : ''} ${
                    overdue
                      ? 'border-rose-200 bg-rose-50/40 dark:border-rose-500/30 dark:bg-rose-500/5'
                      : 'border-gray-100 dark:border-zinc-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
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
                    <h3 className={`m-0 truncate text-sm font-black ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-950 dark:text-white'}`}>
                      {task.title}
                    </h3>
                    {task.sourceMessage && onJumpToSourceMessage && (
                      <button
                        type="button"
                        onClick={() => onJumpToSourceMessage(task.sourceMessage!.messageId)}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                        title={task.sourceMessage.preview}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Tin nhắn gốc
                      </button>
                    )}
                    {canModifyStatus(task) ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === task.id ? null : task.id)}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${statusClass[task.status]} hover:opacity-80`}
                        >
                          <span className="text-[10px] font-black">{statusLabels[task.status]}</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdownId === task.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenDropdownId(null)} />
                            <div className="absolute left-0 top-full z-40 mt-1 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-discord-dark">
                              {(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as ChannelTaskStatus[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    confirmStatusChange(task, st);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
                                >
                                  {statusLabels[st]}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusClass[task.status]}`}>{statusLabels[task.status]}</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${priorityClass[task.priority]}`}>{priorityLabels[task.priority]}</span>
                  </div>
                  {task.description && <p className="m-0 mt-1 line-clamp-2 text-xs text-gray-500 dark:text-zinc-400">{task.description}</p>}

                  {/* Checklist Subtasks Accordion Dropdown (Only when subtasks exist) */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                      <button
                        type="button"
                        onClick={() => toggleTaskExpand(task.id)}
                        className="flex w-full items-center justify-between text-left text-[11px] font-black text-gray-600 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-1.5">
                          {expandedTaskIds.includes(task.id) ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          <span>
                            Checklist ({task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length})
                          </span>
                        </div>
                        <span>
                          {Math.round((task.subtasks.filter((s) => s.isCompleted).length / task.subtasks.length) * 100)}%
                        </span>
                      </button>

                      {expandedTaskIds.includes(task.id) && (
                        <div className="mt-2 space-y-2 pt-1 border-t border-gray-200/60 dark:border-zinc-800/80">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-400"
                              style={{
                                width: `${(task.subtasks.filter((s) => s.isCompleted).length / task.subtasks.length) * 100}%`,
                              }}
                            />
                          </div>

                          <div className="space-y-1">
                            {task.subtasks.map((st) => (
                              <div key={st.id} className="flex items-center justify-between group rounded-lg px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                <button
                                  type="button"
                                  onClick={() => toggleSubtask(task, st.id)}
                                  className="flex flex-1 items-center gap-2 text-left text-xs font-medium text-gray-700 dark:text-zinc-300"
                                >
                                  {st.isCompleted ? (
                                    <CheckSquare className="h-4 w-4 shrink-0 text-emerald-500" />
                                  ) : (
                                    <Square className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                                  )}
                                  <span className={st.isCompleted ? 'line-through opacity-60' : ''}>{st.title}</span>
                                </button>
                                {canModifyStatus(task) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteSubtaskFromTask(task, st.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 p-1 transition"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {canModifyStatus(task) && (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                value={inlineSubtaskInputs[task.id] || ''}
                                onChange={(e) =>
                                  setInlineSubtaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void addSubtaskToTask(task);
                                  }
                                }}
                                placeholder="Thêm công việc con mới..."
                                className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => void addSubtaskToTask(task)}
                                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700"
                              >
                                Thêm
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add subtask trigger when task has 0 subtasks */}
                  {(!task.subtasks || task.subtasks.length === 0) && canModifyStatus(task) && (
                    <div className="mt-1.5">
                      {!expandedTaskIds.includes(task.id) ? (
                        <button
                          type="button"
                          onClick={() => toggleTaskExpand(task.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <Plus className="h-3 w-3" />
                          Thêm công việc con
                        </button>
                      ) : (
                        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                          <input
                            value={inlineSubtaskInputs[task.id] || ''}
                            onChange={(e) => setInlineSubtaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void addSubtaskToTask(task);
                              }
                            }}
                            placeholder="Nhập tên công việc con..."
                            className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => void addSubtaskToTask(task)}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            Thêm
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTaskExpand(task.id)}
                            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attachments List */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {task.attachments && task.attachments.length > 0 && task.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50/50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">{att.name}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </a>
                    ))}
                    {canModifyStatus(task) && (
                      <label className={`inline-flex items-center gap-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/30 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/5 dark:text-indigo-300 ${uploadingTaskId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-indigo-50'}`}>
                        {uploadingTaskId === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                        {uploadingTaskId === task.id ? 'Đang tải...' : 'Nộp tệp'}
                        <input
                          type="file"
                          className="hidden"
                          disabled={Boolean(uploadingTaskId)}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.currentTarget.value = '';
                            if (file) {
                              void uploadAttachmentToTask(task, file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <p className="m-0 mt-1 flex flex-wrap items-center gap-1 text-[11px] font-bold text-gray-400">
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-3 w-3" />
                        Hạn: {formatDueDate(task.dueAt)} (Đã quá hạn)
                      </span>
                    ) : (
                      <span>{formatDueDate(task.dueAt)}</span>
                    )}
                    <span>· {task.assignees.length ? task.assignees.map((a) => a.username).join(', ') : 'Chưa giao'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {canModifyStatus(task) && (
                    <button
                      type="button"
                      onClick={() => togglePinTask(task.id)}
                      className={`rounded-xl p-2 transition ${
                        task.isPinned
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500 dark:hover:bg-zinc-800'
                      }`}
                      title={task.isPinned ? 'Bỏ ghim công việc' : 'Ghim công việc lên đầu'}
                    >
                      <Pin className={`h-4 w-4 ${task.isPinned ? 'fill-amber-500' : ''}`} />
                    </button>
                  )}
                  {canDeleteTask(task) && (
                    <button type="button" onClick={() => deleteTask(task.id)} className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
      )}

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
              {sourceMessage && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Tạo từ tin nhắn của {sourceMessage.senderUsername || 'thành viên'}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-zinc-300">
                    {stripHtml(sourceMessage.content || '') || sourceMessage.attachments?.[0]?.name || 'Tệp đính kèm'}
                  </p>
                </div>
              )}
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên task" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select value={priority} onChange={(e) => setPriority(e.target.value as ChannelTaskPriority)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400">
                  Ngày bắt đầu
                  <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400">
                  Hạn chót
                  <input type="datetime-local" value={dueAt} min={startAt || undefined} onChange={(e) => setDueAt(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
                </label>
              </div>
              <div>
                <p className="mb-2 text-xs font-black text-gray-600 dark:text-zinc-300">Giao cho</p>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {assignableMembers.map((member) => (
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
              <div>
                <p className="mb-2 text-xs font-black text-gray-600 dark:text-zinc-300">Checklist công việc phụ</p>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subtaskInput.trim()) {
                          setNewSubtasks((prev) => [...prev, { title: subtaskInput.trim() }]);
                          setSubtaskInput('');
                        }
                      }
                    }}
                    placeholder="Thêm công việc con..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (subtaskInput.trim()) {
                        setNewSubtasks((prev) => [...prev, { title: subtaskInput.trim() }]);
                        setSubtaskInput('');
                      }
                    }}
                    className="rounded-xl bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {newSubtasks.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {newSubtasks.map((st, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium dark:bg-zinc-900">
                        <span className="dark:text-zinc-200">{st.title}</span>
                        <button
                          type="button"
                          onClick={() => setNewSubtasks((prev) => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-gray-600 dark:text-zinc-300">Tệp & Hình ảnh đính kèm</p>
                  <button
                    type="button"
                    disabled={isUploadingAttachment}
                    onClick={() => taskFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-indigo-400"
                  >
                    {isUploadingAttachment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                    Đính kèm tệp
                  </button>
                  <input
                    ref={taskFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const selectedFiles = Array.from(files);
                      e.currentTarget.value = '';
                      setIsUploadingAttachment(true);
                      try {
                        for (const file of selectedFiles) {
                          const uploaded = await fileService.uploadFile(file);
                          const isImg = file.type.startsWith('image/');
                          const isVid = file.type.startsWith('video/');
                          const fileType = isImg ? 'IMAGE' : isVid ? 'VIDEO' : 'FILE';
                          setNewAttachments((prev) => [
                            ...prev,
                            { url: uploaded.data.url, name: file.name, type: fileType, size: file.size },
                          ]);
                        }
                      } catch {
                        setError('Không thể tải tệp đính kèm');
                      } finally {
                        setIsUploadingAttachment(false);
                      }
                    }}
                  />
                </div>
                {newAttachments.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {newAttachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium dark:bg-zinc-900">
                        <span className="truncate text-gray-700 dark:text-zinc-200 max-w-[200px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setNewAttachments((prev) => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button disabled={!title.trim() || isSaving || isUploadingAttachment} type="button" onClick={createTask} className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
              {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Tạo task'}
            </button>
          </div>
        </div>
      )}

      {confirmStatusTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-discord-mid">
            <h3 className="m-0 mb-2 text-lg font-black text-gray-950 dark:text-white">Xác nhận</h3>
            <p className="m-0 mb-6 text-sm text-gray-500 dark:text-zinc-400">
              Bạn có chắc muốn chuyển trạng thái công việc này thành "{statusLabels[confirmStatusTask.nextStatus]}"?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmStatusTask(null);
                  setTasks([...tasks]);
                }}
                className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  updateStatusValue(confirmStatusTask.task, confirmStatusTask.nextStatus);
                  setConfirmStatusTask(null);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
