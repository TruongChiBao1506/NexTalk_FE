import { create } from 'zustand';
import { groupService } from '../services/groupService';
import type { ChannelTaskResponse, TaskActivityResponse } from '../types/group';

const TASK_TTL = 2 * 60_000;
const ACTIVITY_TTL = 45_000;

type Updater<T> = T | ((current: T) => T);

type ChannelTaskState = {
  tasksByChannel: Record<string, ChannelTaskResponse[]>;
  activitiesByChannel: Record<string, TaskActivityResponse[]>;
  tasksFetchedAt: Record<string, number>;
  activitiesFetchedAt: Record<string, number>;
  loadingTasks: Record<string, boolean>;
  loadingActivities: Record<string, boolean>;
  fetchTasks: (groupId: string, channelId: string, force?: boolean) => Promise<ChannelTaskResponse[]>;
  fetchActivities: (groupId: string, channelId: string, force?: boolean) => Promise<TaskActivityResponse[]>;
  setTasks: (channelId: string, updater: Updater<ChannelTaskResponse[]>) => void;
  setActivities: (channelId: string, updater: Updater<TaskActivityResponse[]>) => void;
  prependActivity: (channelId: string, activity: TaskActivityResponse) => void;
  markActivitiesRead: (channelId: string) => void;
  invalidateTasks: (channelId: string) => void;
  clear: () => void;
};

export const useChannelTaskStore = create<ChannelTaskState>((set, get) => ({
  tasksByChannel: {},
  activitiesByChannel: {},
  tasksFetchedAt: {},
  activitiesFetchedAt: {},
  loadingTasks: {},
  loadingActivities: {},

  fetchTasks: async (groupId, channelId, force = false) => {
    const state = get();
    const cached = state.tasksByChannel[channelId];
    if (!force && cached && Date.now() - (state.tasksFetchedAt[channelId] || 0) < TASK_TTL) return cached;
    if (state.loadingTasks[channelId]) return cached ?? [];
    set((current) => ({ loadingTasks: { ...current.loadingTasks, [channelId]: true } }));
    try {
      const response = await groupService.getChannelTasks(groupId, channelId);
      const tasks = response.data ?? [];
      set((current) => ({
        tasksByChannel: { ...current.tasksByChannel, [channelId]: tasks },
        tasksFetchedAt: { ...current.tasksFetchedAt, [channelId]: Date.now() },
      }));
      return tasks;
    } finally {
      set((current) => ({ loadingTasks: { ...current.loadingTasks, [channelId]: false } }));
    }
  },

  fetchActivities: async (groupId, channelId, force = false) => {
    const state = get();
    const cached = state.activitiesByChannel[channelId];
    if (!force && cached && Date.now() - (state.activitiesFetchedAt[channelId] || 0) < ACTIVITY_TTL) return cached;
    if (state.loadingActivities[channelId]) return cached ?? [];
    set((current) => ({ loadingActivities: { ...current.loadingActivities, [channelId]: true } }));
    try {
      const response = await groupService.getTaskActivities(groupId, channelId);
      const activities = (response.data ?? []).slice(0, 100);
      set((current) => ({
        activitiesByChannel: { ...current.activitiesByChannel, [channelId]: activities },
        activitiesFetchedAt: { ...current.activitiesFetchedAt, [channelId]: Date.now() },
      }));
      return activities;
    } finally {
      set((current) => ({ loadingActivities: { ...current.loadingActivities, [channelId]: false } }));
    }
  },

  setTasks: (channelId, updater) => set((state) => {
    const current = state.tasksByChannel[channelId] ?? [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    return { tasksByChannel: { ...state.tasksByChannel, [channelId]: next } };
  }),
  setActivities: (channelId, updater) => set((state) => {
    const current = state.activitiesByChannel[channelId] ?? [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    return { activitiesByChannel: { ...state.activitiesByChannel, [channelId]: next.slice(0, 100) } };
  }),
  prependActivity: (channelId, activity) => get().setActivities(channelId, (items) => [activity, ...items.filter((item) => item.id !== activity.id)]),
  markActivitiesRead: (channelId) => get().setActivities(channelId, (items) => items.map((item) => ({ ...item, isRead: true }))),
  invalidateTasks: (channelId) => set((state) => ({ tasksFetchedAt: { ...state.tasksFetchedAt, [channelId]: 0 } })),
  clear: () => set({ tasksByChannel: {}, activitiesByChannel: {}, tasksFetchedAt: {}, activitiesFetchedAt: {}, loadingTasks: {}, loadingActivities: {} }),
}));
