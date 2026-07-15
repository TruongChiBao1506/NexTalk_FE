import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';
import type { ChannelTaskResponse, ChannelTaskStatus } from '../../types/group';

type Props = {
  tasks: ChannelTaskResponse[];
  onTaskOpen: (task: ChannelTaskResponse) => void;
};

const statusColors: Record<ChannelTaskStatus, string> = {
  TODO: 'bg-indigo-500 text-white',
  IN_PROGRESS: 'bg-amber-500 text-white',
  DONE: 'bg-emerald-500 text-white',
  CANCELLED: 'bg-zinc-400 text-white',
};

const statusLabels: Record<ChannelTaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export function ChannelTasksTimeline({ tasks, onTaskOpen }: Props) {
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Generate 14 days around baseDate (starting 3 days prior)
  const days = useMemo(() => {
    const list: Date[] = [];
    const start = new Date(baseDate);
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [baseDate]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  }), [tasks]);

  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handlePrevRange = () => {
    setBaseDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextRange = () => {
    setBaseDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-discord-mid">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-black text-gray-800 dark:text-zinc-200">
            Timeline (14 ngày)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevRange}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Tuần trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={handleNextRange}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Tuần sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-zinc-400">
          {Object.entries(statusLabels).map(([status, label]) => (
            <span key={status} className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${statusColors[status as ChannelTaskStatus].split(' ')[0]}`} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="flex min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex min-w-full flex-col">
          {/* Timeline Header Row */}
          <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Task Info Column Header */}
            <div className="sticky left-0 z-30 w-64 shrink-0 border-r border-gray-200 bg-gray-50 px-4 py-2 text-xs font-black text-gray-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Công việc
            </div>

            {/* Date Columns Header */}
            <div className="flex flex-1">
              {days.map((day) => {
                const dateKey = formatDateKey(day);
                const isToday = dateKey === todayStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={dateKey}
                    className={`w-24 shrink-0 border-r border-gray-200 px-1 py-1.5 text-center dark:border-zinc-800/80 ${
                      isToday
                        ? 'bg-indigo-50/70 font-black text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
                        : isWeekend
                        ? 'bg-gray-100/50 text-gray-400 dark:bg-zinc-900/60 dark:text-zinc-500'
                        : 'text-gray-600 dark:text-zinc-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold">
                      {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-black">
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Rows */}
          {sortedTasks.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs font-bold text-gray-400 dark:text-zinc-500">
              Chưa có công việc nào để hiển thị trên Timeline.
            </div>
          ) : (
            sortedTasks.map((task) => {
              const startDate = new Date(task.startAt || task.createdAt);
              const dueDate = task.dueAt ? new Date(task.dueAt) : startDate;

              const isOverdue =
                task.dueAt &&
                new Date(task.dueAt).getTime() < new Date().getTime() &&
                task.status !== 'DONE' &&
                task.status !== 'CANCELLED';

              return (
                <div
                  key={task.id}
                  className="flex border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/30"
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  {/* Fixed Task Title Column */}
                  <button
                    type="button"
                    onClick={() => onTaskOpen(task)}
                    className="sticky left-0 z-10 flex w-64 shrink-0 flex-col justify-center border-r border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50 dark:border-zinc-800 dark:bg-discord-mid dark:hover:bg-zinc-900"
                  >
                    <span
                      className={`truncate text-xs font-black ${
                        task.status === 'DONE'
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900 dark:text-white'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-bold">
                        <User className="h-3 w-3" />
                        {task.assignees.length ? task.assignees[0].username : 'Chưa giao'}
                      </span>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          ({task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length})
                        </span>
                      )}
                      {!task.dueAt && (
                        <span className="rounded-full border border-dashed border-slate-400 px-1.5 py-0.5 font-bold text-slate-500 dark:border-zinc-500 dark:text-zinc-400">
                          Chưa có hạn
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Date Grid Columns with Task Bar Overlay */}
                  <div className="relative flex flex-1 items-center">
                    {days.map((day) => {
                      const dateKey = formatDateKey(day);
                      const isToday = dateKey === todayStr;
                      return (
                        <div
                          key={dateKey}
                          className={`h-full w-24 shrink-0 border-r border-gray-100 dark:border-zinc-800/40 ${
                            isToday ? 'border-x-2 border-x-indigo-300 bg-indigo-50/50 dark:border-x-indigo-500/40 dark:bg-indigo-500/10' : ''
                          }`}
                        />
                      );
                    })}

                    {days.findIndex((day) => formatDateKey(day) === todayStr) >= 0 && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.65)] dark:bg-indigo-400"
                        style={{ left: `${days.findIndex((day) => formatDateKey(day) === todayStr) * 96 + 48}px` }}
                      />
                    )}

                    {/* Colored Task Timeline Bar */}
                    <div className="absolute inset-y-0 flex items-center px-1 py-1.5 w-full">
                      {days.map((day, idx) => {
                        const dayStart = day.getTime();
                        const dayEnd = dayStart + 86400000;

                        // Check if task falls within this day cell
                        const isCovered = Boolean(task.dueAt) &&
                          startDate.getTime() <= dayEnd && dueDate.getTime() >= dayStart;

                        const isFirstDay = idx === 0 || startDate.getTime() >= dayStart && startDate.getTime() < dayEnd;
                        const isLastDay = idx === days.length - 1 || dueDate.getTime() >= dayStart && dueDate.getTime() < dayEnd;

                        if (!isCovered) return <div key={idx} className="w-24 shrink-0" />;

                        return (
                          <div
                            key={idx}
                            role="button"
                            tabIndex={0}
                            onClick={() => onTaskOpen(task)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') onTaskOpen(task);
                            }}
                            className={`group relative h-7 w-24 shrink-0 px-0.5 flex items-center justify-between text-[11px] font-bold shadow-sm transition-all ${
                              !task.dueAt
                                ? 'border border-dashed border-slate-400 bg-slate-100 text-slate-600 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-300'
                                : isOverdue
                                ? 'bg-rose-500 text-white'
                                : statusColors[task.status]
                            } ${isFirstDay ? 'rounded-l-lg' : ''} ${isLastDay ? 'rounded-r-lg' : ''}`}
                          >
                            {isFirstDay && (
                              <span className="truncate px-2 text-[10px] font-black" title={task.title}>
                                {task.dueAt ? task.title : 'Chưa có hạn'}
                              </span>
                            )}

                            {/* Tooltip on Hover */}
                            {hoveredTaskId === task.id && isFirstDay && (
                              <div className="absolute bottom-full left-0 z-40 mb-2 w-48 rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl dark:border-zinc-700 dark:bg-discord-dark dark:text-white">
                                <p className="m-0 text-xs font-black">{task.title}</p>
                                <p className="m-0 mt-1 text-[10px] text-gray-500 dark:text-zinc-400">
                                  Trạng thái: <span className="font-bold">{statusLabels[task.status]}</span>
                                </p>
                                {task.dueAt && (
                                  <p className="m-0 mt-0.5 text-[10px] text-gray-500 dark:text-zinc-400">
                                    Hạn chót: {new Date(task.dueAt).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
