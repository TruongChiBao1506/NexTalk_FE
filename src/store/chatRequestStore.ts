import { create } from 'zustand';
import { blockService } from '../services/blockService';
import { chatRequestService } from '../services/chatRequestService';
import type { ChatRequestResponse, CreateChatRequestPayload } from '../types/chatRequest';

interface ChatRequestState {
  incoming: ChatRequestResponse[];
  outgoing: ChatRequestResponse[];
  isLoadingIncoming: boolean;
  isLoadingOutgoing: boolean;
  error: string | null;
  fetchIncoming: () => Promise<void>;
  fetchOutgoing: () => Promise<void>;
  fetchAll: () => Promise<void>;
  createRequest: (data: CreateChatRequestPayload) => Promise<ChatRequestResponse | null>;
  acceptRequest: (requestId: string) => Promise<ChatRequestResponse | null>;
  rejectRequest: (requestId: string) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  blockRequestSender: (request: ChatRequestResponse) => Promise<boolean>;
  reportRequestSender: (request: ChatRequestResponse) => Promise<boolean>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useChatRequestStore = create<ChatRequestState>((set, get) => ({
  incoming: [],
  outgoing: [],
  isLoadingIncoming: false,
  isLoadingOutgoing: false,
  error: null,

  fetchIncoming: async () => {
    set({ isLoadingIncoming: true, error: null });
    try {
      const response = await chatRequestService.getIncoming();
      if (response.success && response.data) {
        set({ incoming: response.data });
      } else {
        set({ error: response.message || 'Failed to load incoming chat requests' });
      }
    } catch (err: any) {
      console.error('Failed to fetch incoming chat requests:', err);
      set({ error: getErrorMessage(err, 'Failed to fetch incoming chat requests') });
    } finally {
      set({ isLoadingIncoming: false });
    }
  },

  fetchOutgoing: async () => {
    set({ isLoadingOutgoing: true, error: null });
    try {
      const response = await chatRequestService.getOutgoing();
      if (response.success && response.data) {
        set({ outgoing: response.data });
      } else {
        set({ error: response.message || 'Failed to load outgoing chat requests' });
      }
    } catch (err: any) {
      console.error('Failed to fetch outgoing chat requests:', err);
      set({ error: getErrorMessage(err, 'Failed to fetch outgoing chat requests') });
    } finally {
      set({ isLoadingOutgoing: false });
    }
  },

  fetchAll: async () => {
    await Promise.allSettled([get().fetchIncoming(), get().fetchOutgoing()]);
  },

  createRequest: async (data) => {
    set({ error: null });
    try {
      const response = await chatRequestService.create(data);
      if (response.success && response.data) {
        const created = response.data;
        set((state) => ({
          outgoing: state.outgoing.some((request) => request.id === created.id)
            ? state.outgoing
            : [created, ...state.outgoing],
        }));
        return created;
      }
      set({ error: response.message || 'Failed to send chat request' });
    } catch (err: any) {
      console.error('Failed to send chat request:', err);
      set({ error: getErrorMessage(err, 'Failed to send chat request') });
      throw err;
    }
    return null;
  },

  acceptRequest: async (requestId) => {
    set({ error: null });
    try {
      const response = await chatRequestService.accept(requestId);
      if (response.success && response.data) {
        const accepted = response.data;
        set((state) => ({
          incoming: state.incoming.filter((request) => request.id !== requestId),
          outgoing: state.outgoing.filter((request) => request.id !== requestId),
        }));
        return accepted;
      }
      set({ error: response.message || 'Failed to accept chat request' });
    } catch (err: any) {
      console.error('Failed to accept chat request:', err);
      set({ error: getErrorMessage(err, 'Failed to accept chat request') });
    }
    return null;
  },

  rejectRequest: async (requestId) => {
    set({ error: null });
    try {
      const response = await chatRequestService.reject(requestId);
      if (response.success) {
        set((state) => ({
          incoming: state.incoming.filter((request) => request.id !== requestId),
          outgoing: state.outgoing.filter((request) => request.id !== requestId),
        }));
        return true;
      }
      set({ error: response.message || 'Failed to reject chat request' });
    } catch (err: any) {
      console.error('Failed to reject chat request:', err);
      set({ error: getErrorMessage(err, 'Failed to reject chat request') });
    }
    return false;
  },

  cancelRequest: async (requestId) => {
    set({ error: null });
    try {
      const response = await chatRequestService.cancel(requestId);
      if (response.success) {
        set((state) => ({
          outgoing: state.outgoing.filter((request) => request.id !== requestId),
        }));
        return true;
      }
      set({ error: response.message || 'Failed to cancel chat request' });
    } catch (err: any) {
      console.error('Failed to cancel chat request:', err);
      set({ error: getErrorMessage(err, 'Failed to cancel chat request') });
    }
    return false;
  },

  blockRequestSender: async (request) => {
    set({ error: null });
    try {
      await blockService.blockUser(request.sender.id);
      return await get().rejectRequest(request.id);
    } catch (err: any) {
      console.error('Failed to block chat request sender:', err);
      set({ error: getErrorMessage(err, 'Failed to block chat request sender') });
      return false;
    }
  },

  reportRequestSender: async (request) => {
    set({ error: null });
    try {
      await blockService.blockUser(request.sender.id);
      return await get().rejectRequest(request.id);
    } catch (err: any) {
      console.error('Failed to report chat request sender:', err);
      set({ error: getErrorMessage(err, 'Failed to report chat request sender') });
      return false;
    }
  },
}));
