import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { useFriendStore } from './friendStore';
import { useCallStore } from './callStore';
import type { ConversationResponse, MessageResponse, MessageStatusUpdateResponse } from '../types/chat';
import { refreshAccessToken } from '../api/apiClient';

function isTokenExpired(token: string, offsetSeconds = 60): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const exp = decodedPayload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp - now < offsetSeconds;
  } catch (e) {
    return true;
  }
}


interface ChatState {
  conversations: ConversationResponse[];
  activeConversation: ConversationResponse | null;
  messages: MessageResponse[];
  lastMessages: Record<string, MessageResponse>;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  currentPage: number;
  isLoading: boolean;
  stompClient: Client | null;

  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendStompMessage: (content: string, messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE') => void;
  getOrCreatePrivateConversation: (friendId: string) => Promise<ConversationResponse | null>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  addIncomingMessage: (message: MessageResponse) => void;
  handleStatusUpdate: (update: MessageStatusUpdateResponse) => void;
  updateMemberPresence: (userId: string, status: string, lastSeen?: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  lastMessages: {},
  isConnected: false,
  isConnecting: false,
  error: null,
  hasMoreMessages: true,
  currentPage: 0,
  isLoading: false,
  stompClient: null,

  fetchConversations: async () => {
    try {
      const response = await conversationService.getUserConversations();
      if (response.success && response.data) {
        // Sort conversations by updatedAt descending
        const sorted = response.data.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        set({ conversations: sorted });
        
        // Mark all conversations as delivered
        for (const conv of sorted) {
          messageService.markAsDelivered(conv.id).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
    }
  },

  selectConversation: async (conversationId: string) => {
    // Mark any unread notifications for this conversation as read
    const notifications = useNotificationStore.getState().notifications;
    const unreadForThisConv = notifications.filter(n => n.referenceId === conversationId && !n.read);
    for (const n of unreadForThisConv) {
      useNotificationStore.getState().markAsRead(n.id).catch(() => {});
    }

    const { conversations } = get();
    const active = conversations.find((c) => c.id === conversationId) || null;

    let resolvedActive = active;
    if (!resolvedActive) {
      try {
        const response = await conversationService.getConversationById(conversationId);
        if (response.success && response.data) {
          resolvedActive = response.data;
          set((state) => ({
            conversations: [resolvedActive!, ...state.conversations],
          }));
        }
      } catch (err) {
        console.error('Failed to resolve conversation by ID:', err);
        return;
      }
    }

    set({
      activeConversation: resolvedActive,
      messages: [],
      currentPage: 0,
      hasMoreMessages: true,
      isLoading: true,
    });

    try {
      const response = await messageService.getConversationMessages(conversationId, 0, 10);
      if (response.success && response.data) {
        const history = response.data;
        
        // Mark messages as seen
        messageService.markAsSeen(conversationId).catch((e) => console.error('Failed to mark seen:', e));

        set((state) => {
          const updatedLastMessages = { ...state.lastMessages };
          if (history.length > 0) {
            updatedLastMessages[conversationId] = history[0];
          }
          return {
            messages: history,
            hasMoreMessages: history.length === 10,
            isLoading: false,
            lastMessages: updatedLastMessages,
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ isLoading: false });
    }
  },

  loadMoreMessages: async () => {
    const { activeConversation, currentPage, hasMoreMessages, messages, isLoading } = get();
    if (!activeConversation || !hasMoreMessages || isLoading) return;

    set({ isLoading: true });
    const nextPage = currentPage + 1;

    try {
      const response = await messageService.getConversationMessages(
        activeConversation.id,
        nextPage,
        10
      );
      if (response.success && response.data) {
        const history = response.data;
        set({
          messages: [...messages, ...history],
          currentPage: nextPage,
          hasMoreMessages: history.length === 10,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
      set({ isLoading: false });
    }
  },

  sendStompMessage: (content: string, messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE') => {
    const { stompClient, activeConversation } = get();
    if (!stompClient || !stompClient.connected || !activeConversation) {
      console.warn('[STOMP] Client not connected or no active conversation');
      return;
    }

    const messageRequest = {
      conversationId: activeConversation.id,
      content,
      messageType: messageType || 'TEXT',
    };

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(messageRequest),
    });
  },

  getOrCreatePrivateConversation: async (friendId: string) => {
    try {
      const response = await conversationService.getOrCreatePrivateConversation(friendId);
      if (response.success && response.data) {
        const conversation = response.data;

        set((state) => {
          const exists = state.conversations.some((c) => c.id === conversation.id);
          const updatedList = exists
            ? state.conversations
            : [conversation, ...state.conversations];
          return {
            conversations: updatedList,
          };
        });

        // Select it so we pull messages and focus it
        await get().selectConversation(conversation.id);
        return conversation;
      }
    } catch (err) {
      console.error('Failed to get or create private conversation:', err);
    }
    return null;
  },

  connectWebSocket: async () => {
    const { stompClient, isConnected, isConnecting } = get();
    // Do not reconnect if already active or connecting
    if (stompClient?.active || isConnected || isConnecting) return;

    set({ isConnecting: true, error: null });

    let accessToken = localStorage.getItem('nextalk_accessToken');
    if (!accessToken) {
      set({ isConnecting: false, error: 'No access token available' });
      return;
    }

    if (isTokenExpired(accessToken, 30)) {
      console.info('[STOMP] Access token expired or expiring soon, refreshing before connection...');
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        accessToken = refreshed;
      } else {
        set({ isConnecting: false, error: 'Session expired' });
        return;
      }
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL ?? ''}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      // Debug disabled to prevent JWT token leaking into browser console
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.beforeConnect = () => {
      // Always refresh token header before each connect/reconnect attempt
      const currentToken = localStorage.getItem('nextalk_accessToken');
      if (currentToken) {
        client.connectHeaders = {
          Authorization: `Bearer ${currentToken}`,
        };
      }
    };

    client.onConnect = () => {
      console.info('[STOMP] WebSocket connected.');
      set({ isConnected: true, isConnecting: false, stompClient: client });

      // Subscribe to personal private chat channel
      client.subscribe('/user/queue/private', (message) => {
        try {
          const body = JSON.parse(message.body);
          if (body.type === 'STATUS_UPDATE') {
            get().handleStatusUpdate(body);
          } else {
            get().addIncomingMessage(body);
          }
        } catch (e) {
          console.error('[STOMP] Failed to process incoming message:', e);
        }
      });

      // Subscribe to personal notifications channel
      client.subscribe('/user/queue/notifications', (message) => {
        try {
          const body = JSON.parse(message.body);
          const activeConversation = get().activeConversation;
          
          if (body.type === 'NEW_MESSAGE' && activeConversation && body.referenceId === activeConversation.id) {
            // Automatically mark as read if conversation is currently active
            const readNotification = { ...body, read: true };
            useNotificationStore.getState().addNotification(readNotification);
            notificationService.markAsRead(body.id).catch(() => {});
          } else {
            useNotificationStore.getState().addNotification(body);
          }
        } catch (e) {
          console.error('[STOMP] Failed to process incoming notification:', e);
        }
      });

      // Subscribe to global presence channel
      client.subscribe('/topic/presence', (message) => {
        try {
          const body = JSON.parse(message.body); // { userId, username, status, lastSeen }
          useFriendStore.getState().updateFriendPresence(body.userId, body.status, body.lastSeen);
          get().updateMemberPresence(body.userId, body.status, body.lastSeen);
        } catch (e) {
          console.error('[STOMP] Failed to process presence update:', e);
        }
      });

      // Subscribe to personal calling signals channel
      client.subscribe('/user/queue/calls', (message) => {
        try {
          const body = JSON.parse(message.body);
          useCallStore.getState().handleIncomingSignal(body);
        } catch (e) {
          console.error('[STOMP] Failed to process call signal:', e);
        }
      });
    };

    client.onDisconnect = () => {
      console.info('[STOMP] WebSocket disconnected.');
      set({ isConnected: false, stompClient: null });
    };

    client.onStompError = async (frame) => {
      console.error('[STOMP] STOMP error:', frame.headers['message']);
      set({ error: frame.headers['message'] || 'STOMP Protocol Error', isConnecting: false });

      // If connection fails due to invalid/expired token, refresh and reconnect
      const currentToken = localStorage.getItem('nextalk_accessToken');
      if (currentToken && isTokenExpired(currentToken, 30)) {
        console.log('[STOMP] STOMP error due to expired token. Refreshing token...');
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          console.log('[STOMP] Token refreshed, retrying WebSocket connection...');
          client.deactivate();
          set({ stompClient: null, isConnected: false });
          get().connectWebSocket();
        }
      }
    };

    client.onWebSocketError = async () => {
      console.error('[STOMP] WebSocket connection failed.');
      set({ error: 'WebSocket connection failed', isConnecting: false });

      // If connection fails due to invalid/expired token, refresh and reconnect
      const currentToken = localStorage.getItem('nextalk_accessToken');
      if (currentToken && isTokenExpired(currentToken, 30)) {
        console.log('[STOMP] Connection failed due to expired token. Refreshing token...');
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          console.log('[STOMP] Token refreshed, retrying WebSocket connection...');
          client.deactivate();
          set({ stompClient: null, isConnected: false });
          get().connectWebSocket();
        }
      }
    };

    client.activate();
  },

  disconnectWebSocket: () => {
    const { stompClient } = get();
    if (stompClient) {
      stompClient.deactivate();
      set({ stompClient: null, isConnected: false, isConnecting: false });
      console.info('[STOMP] Deactivated.');
    }
  },

  addIncomingMessage: (message: MessageResponse) => {
    const { activeConversation, conversations } = get();
    const currentUser = useAuthStore.getState().user;

    // Update lastMessages registry
    set((state) => ({
      lastMessages: {
        ...state.lastMessages,
        [message.conversationId]: message,
      },
    }));

    // If belongs to the active conversation, append it
    if (activeConversation && activeConversation.id === message.conversationId) {
      set((state) => ({
        messages: [message, ...state.messages],
      }));
      // If we are not the sender, mark it as SEEN
      if (currentUser && message.senderId !== currentUser.id) {
        messageService.markAsSeen(message.conversationId).catch(() => {});
      }
    } else {
      // If we are not the sender, mark it as DELIVERED
      if (currentUser && message.senderId !== currentUser.id) {
        messageService.markAsDelivered(message.conversationId).catch(() => {});
      }
    }

    // Bump the conversation to the top and update its updatedAt field
    const conversationIndex = conversations.findIndex((c) => c.id === message.conversationId);
    if (conversationIndex > -1) {
      set((state) => {
        const list = [...state.conversations];
        const target = { ...list[conversationIndex], updatedAt: message.createdAt };
        list.splice(conversationIndex, 1);
        return {
          conversations: [target, ...list],
        };
      });
    } else {
      // Fetch the conversation and prepend it
      conversationService.getConversationById(message.conversationId).then((response) => {
        if (response.success && response.data) {
          set((state) => ({
            conversations: [response.data, ...state.conversations],
          }));
        }
      });
    }
  },

  handleStatusUpdate: (update: MessageStatusUpdateResponse) => {
    const { activeConversation, messages, lastMessages } = get();

    // 1. Update the status in the active conversation's messages list in local state
    if (activeConversation && activeConversation.id === update.conversationId) {
      const updatedMessages = messages.map((msg) => {
        if (msg.senderId === update.userId) {
          return msg;
        }

        const statuses = msg.statuses ? [...msg.statuses] : [];
        const index = statuses.findIndex((s) => s.userId === update.userId);
        if (index > -1) {
          if (statuses[index].status === 'SEEN' && update.status === 'DELIVERED') {
            return msg;
          }
          statuses[index] = {
            ...statuses[index],
            status: update.status,
            updatedAt: update.updatedAt,
          };
        } else {
          statuses.push({
            userId: update.userId,
            username: update.username,
            status: update.status,
            updatedAt: update.updatedAt,
          });
        }
        return { ...msg, statuses };
      });
      set({ messages: updatedMessages });
    }

    // 2. Also update lastMessages statuses if applicable
    const lastMsg = lastMessages[update.conversationId];
    if (lastMsg && lastMsg.senderId !== update.userId) {
      const statuses = lastMsg.statuses ? [...lastMsg.statuses] : [];
      const index = statuses.findIndex((s) => s.userId === update.userId);
      if (index > -1) {
        if (!(statuses[index].status === 'SEEN' && update.status === 'DELIVERED')) {
          statuses[index] = {
            ...statuses[index],
            status: update.status,
            updatedAt: update.updatedAt,
          };
        }
      } else {
        statuses.push({
          userId: update.userId,
          username: update.username,
          status: update.status,
          updatedAt: update.updatedAt,
        });
      }
      set((state) => ({
        lastMessages: {
          ...state.lastMessages,
          [update.conversationId]: { ...lastMsg, statuses },
        },
      }));
    }
  },

  updateMemberPresence: (userId, status, lastSeen) => {
    const { conversations, activeConversation } = get();

    const updatedConversations = conversations.map((c) => {
      const updatedMembers = c.members.map((m) =>
        m.id === userId ? { ...m, status, lastSeen: lastSeen || m.lastSeen } : m
      );
      return { ...c, members: updatedMembers };
    });

    let updatedActive = activeConversation;
    if (activeConversation) {
      const updatedMembers = activeConversation.members.map((m) =>
        m.id === userId ? { ...m, status, lastSeen: lastSeen || m.lastSeen } : m
      );
      updatedActive = { ...activeConversation, members: updatedMembers };
    }

    set({
      conversations: updatedConversations,
      activeConversation: updatedActive,
    });
  },
}));
