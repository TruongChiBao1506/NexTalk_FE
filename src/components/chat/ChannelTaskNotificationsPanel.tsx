import { useEffect, useMemo, useState } from 'react';
import { BellRing, AlertTriangle, PlusCircle, RefreshCw, CheckCircle2, CheckCheck, Loader2, Info } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { useChatStore } from '../../store/chatStore';
import type { ChannelResponse, GroupResponse, TaskActivityResponse, TaskActivityType } from '../../types/group';

type Props = {
  group: GroupResponse;
  channel: ChannelResponse;
  currentUserId?: string;
  onReadStateChanged?: () => void;
};

const activityIcons: Record<TaskActivityType, any> = {
  TASK_CREATED: PlusCircle,
  STATUS_CHANGED: RefreshCw,
  SUBTASK_COMPLETED: CheckCircle2,
  ASSIGNEE_UPDATED: Info,
  DUE_APPROACHING: BellRing,
  TASK_OVERDUE: AlertTriangle,
};

const activityIconColors: Record<TaskActivityType, string> = {
  TASK_CREATED: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
  STATUS_CHANGED: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
  SUBTASK_COMPLETED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
  ASSIGNEE_UPDATED: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400',
  DUE_APPROACHING: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
  TASK_OVERDUE: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
};

const formatTimeAgo = (isoStr: string) => {
  const d = new Date(isoStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export function ChannelTaskNotificationsPanel({ group, channel, currentUserId, onReadStateChanged }: Props) {
  const [activities, setActivities] = useState<TaskActivityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'alerts' | 'activities'>('all');

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const res = await groupService.getTaskActivities(group.id, channel.id);
      setActivities(res.data ?? []);
    } catch {
      // Ignore load errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
    const stompClient = (useChatStore.getState() as any).stompClient;
    if (!stompClient) return;
    try {
      const sub = stompClient.subscribe(`/topic/channel.${channel.id}.task-activities`, (frame: any) => {
        try {
          const newAct: TaskActivityResponse = JSON.parse(frame.body);
          setActivities((prev) => [newAct, ...prev.filter((a) => a.id !== newAct.id)]);
        } catch {}
      });
      return () => {
        try { sub.unsubscribe(); } catch {}
      };
    } catch {}
  }, [group.id, channel.id]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filter === 'all') return true;
      if (filter === 'alerts') return act.type === 'DUE_APPROACHING' || act.type === 'TASK_OVERDUE';
      return act.type !== 'DUE_APPROACHING' && act.type !== 'TASK_OVERDUE';
    });
  }, [activities, filter]);

  const markAllAsRead = async () => {
    setActivities((prev) => prev.map((a) => ({ ...a, isRead: true })));
    try {
      await groupService.markTaskActivitiesAsRead(group.id, channel.id);
      if (onReadStateChanged) onReadStateChanged();
    } catch {
      void loadActivities();
    }
  };

  const unreadCount = activities.filter((a) => !a.isRead).length;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-gray-100 dark:bg-discord-dark">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-discord-mid">
        <div>
          <h2 className="m-0 text-sm font-black text-gray-950 dark:text-white">
            Thông báo công việc #{channel.name}
          </h2>
          <p className="m-0 mt-0.5 text-xs font-semibold text-gray-500 dark:text-zinc-400">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setFilter('alerts')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filter === 'alerts'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-zinc-900 dark:text-amber-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Nhắc Deadline
            </button>
            <button
              type="button"
              onClick={() => setFilter('activities')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filter === 'activities'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Hoạt động
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              Đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Content List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-indigo-600">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <BellRing className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-zinc-600" />
              <p className="m-0 text-sm font-black text-gray-800 dark:text-zinc-100">Chưa có thông báo</p>
              <p className="m-0 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                Các sự kiện và nhắc nhở deadline của kênh sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((act) => {
              const IconComp = activityIcons[act.type] || Info;
              const colorStyle = activityIconColors[act.type] || 'text-gray-600 bg-gray-50';

              return (
                <div
                  key={act.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-sm transition ${
                    !act.isRead
                      ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-500/30 dark:bg-indigo-500/5'
                      : 'border-gray-200 bg-white dark:border-zinc-800 dark:bg-discord-mid'
                  }`}
                >
                  <div className={`mt-0.5 rounded-xl p-2 shrink-0 ${colorStyle}`}>
                    <IconComp className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {act.actorUsername}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {formatTimeAgo(act.createdAt)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-xs text-gray-700 dark:text-zinc-300">
                      {act.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
