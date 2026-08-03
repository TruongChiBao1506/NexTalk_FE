import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';
import { notificationService } from '../services/notificationService';
import { encryptedCacheService } from '../services/encryptedCacheService';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { useActionInboxStore } from './actionInboxStore';
import { useFriendStore } from './friendStore';
import type { ConversationResponse, ConversationSummaryResponse, MessageAttachment, MessageResponse, MessageStatusUpdateResponse, MessageType, TypingIndicatorEvent } from '../types/chat';
import { refreshAccessToken } from '../api/apiClient';
import { audioSynth } from '../utils/audioSynth';
import { purgeLegacyMessageDraftStorage } from '../utils/chatDraftPrivacy';

let presenceHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

const stopPresenceHeartbeat = () => {
  if (presenceHeartbeatTimer) clearInterval(presenceHeartbeatTimer);
  presenceHeartbeatTimer = null;
};

function isTokenExpired(token: string, offsetSeconds = 60): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const exp = decodedPayload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp - now < offsetSeconds;
  } catch {
    return true;
  }
}

function getTokenSessionId(token: string | null): string | null {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).sid ?? null;
  } catch {
    return null;
  }
}

const sortConversations = (conversations: ConversationResponse[]) =>
  [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

const getClientMessageId = (message: MessageResponse): string | undefined =>
  message.clientMessageId ?? message.metadata?.clientMessageId;

const mergeMessagesNewestFirst = (current: MessageResponse[], incoming: MessageResponse[]) => {
  const byId = new Map(current.map((message) => [message.id, message]));
  const optimisticIdByClientId = new Map(
    current
      .map((message) => [getClientMessageId(message), message.id] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0]))
  );
  incoming.forEach((message) => {
    const clientMessageId = getClientMessageId(message);
    const optimisticId = clientMessageId ? optimisticIdByClientId.get(clientMessageId) : undefined;
    if (optimisticId && optimisticId !== message.id) {
      byId.delete(optimisticId);
    }
    const existing = byId.get(message.id);
    byId.set(message.id, existing ? { ...existing, ...message } : message);
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const newerMessage = (current: MessageResponse | undefined, candidate: MessageResponse | undefined) => {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate.createdAt).getTime() > new Date(current.createdAt).getTime() ? candidate : current;
};

const reactionMessagePreview = (message: MessageResponse) => {
  if (message.messageType === 'GIF') return 'Đã gửi một ảnh GIF';
  const plainText = (message.content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plainText) return plainText.length > 56 ? `${plainText.slice(0, 53)}…` : plainText;
  const attachment = message.attachments?.[0];
  if (attachment?.type === 'IMAGE' || message.messageType === 'IMAGE') return 'Hình ảnh';
  if (attachment?.type === 'VIDEO' || message.messageType === 'VIDEO') return 'Video';
  if (message.messageType === 'AUDIO') return 'Tin nhắn thoại';
  if (message.messageType === 'STICKER') return 'Nhãn dán';
  return attachment?.name || 'Tin nhắn';
};

const createReactionConversationPreview = (
  message: MessageResponse,
  currentUserId: string | undefined,
  isPrivateConversation: boolean,
): MessageResponse | null => {
  const metadata = message.metadata ?? {};
  const reactorId = typeof metadata.reactionUserId === 'string' ? metadata.reactionUserId : '';
  if (
    metadata.realtimeEvent !== 'REACTION_UPDATED'
    || metadata.reactionAdded !== true
    || !currentUserId
    || message.senderId !== currentUserId
    || reactorId === currentUserId
    || !isPrivateConversation
  ) {
    return null;
  }
  const emoji = typeof metadata.reactionEmoji === 'string' ? metadata.reactionEmoji : '';
  const username = typeof metadata.reactionUsername === 'string' ? metadata.reactionUsername : '';
  const now = new Date().toISOString();
  return {
    ...message,
    id: `reaction-preview:${message.id}:${reactorId}:${Date.now()}`,
    senderId: reactorId,
    senderUsername: username,
    messageType: 'SYSTEM',
    content: `Đã bày tỏ cảm xúc${emoji ? ` ${emoji}` : ''} về tin nhắn của bạn “${reactionMessagePreview(message)}”`,
    createdAt: now,
    reactions: [],
    metadata: {
      systemType: 'REACTION_PREVIEW',
      sourceMessageId: message.id,
      reactionEmoji: emoji,
    },
  };
};

const isConversationPreviewOnly = (message: MessageResponse | null | undefined) =>
  message?.metadata?.systemType === 'REACTION_PREVIEW';

const typingIndicatorTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
const seenReceiptTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
const MESSAGE_PAGE_SIZE = 25;
const MESSAGE_PREFETCH_COUNT = 3;
const SEEN_RECEIPT_DEBOUNCE_MS = 400;
const initialHistoryRequests = new Map<string, Promise<MessageResponse[]>>();

const fetchInitialHistory = (ownerId: string, conversationId: string) => {
  const requestKey = `${ownerId}:${conversationId}`;
  const existing = initialHistoryRequests.get(requestKey);
  if (existing) return existing;

  const request = messageService
    .getConversationMessages(conversationId, 0, MESSAGE_PAGE_SIZE)
    .then((response) => {
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load message history');
      }
      return response.data;
    })
    .finally(() => {
      initialHistoryRequests.delete(requestKey);
    });
  initialHistoryRequests.set(requestKey, request);
  return request;
};

const scheduleSeenReceipt = (conversationId: string) => {
  const pending = seenReceiptTimeouts[conversationId];
  if (pending) clearTimeout(pending);

  seenReceiptTimeouts[conversationId] = setTimeout(() => {
    delete seenReceiptTimeouts[conversationId];
    messageService.markAsSeen(conversationId).catch((error) => {
      console.error('Failed to mark conversation as seen:', error);
    });
  }, SEEN_RECEIPT_DEBOUNCE_MS);
};

export interface TypingUser {
  userId: string;
  username: string;
  updatedAt: string;
}

export interface UnreadMarker {
  messageId: string;
  count: number;
}

// Drafts can contain private message content. Keep them in memory for the
// current authenticated session and remove plaintext values from older builds.
purgeLegacyMessageDraftStorage();

const shouldPlayIncomingMessageSound = (message: MessageResponse) => {
  const currentUserId = useAuthStore.getState().user?.id;
  if (!currentUserId) return false;
  if (!message?.id || !message.conversationId) return false;
  if (message.senderId === currentUserId) return false;
  if (message.messageType === 'SYSTEM') return false;
  if (message.metadata?.realtimeEvent === 'LINK_PREVIEW_UPDATED') return false;
  return true;
};

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
  isLoadingConversations: boolean;
  messagesCache: Record<string, MessageResponse[]>;
  paginationCache: Record<string, { currentPage: number; hasMoreMessages: boolean }>;
  pinnedMessagesCache: Record<string, MessageResponse[]>;
  stompClient: Client | null;
  replyTo: MessageResponse | null;
  pinnedMessages: MessageResponse[];
  subscribedGroupVoiceIds: string[];
  conversationSummaries: Record<string, ConversationSummaryResponse>;
  typingUsersByConversation: Record<string, TypingUser[]>;
  messageDrafts: Record<string, string>;
  unreadMarkersByConversation: Record<string, UnreadMarker>;
  unreadCounts: Record<string, number>;

  fetchConversations: () => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  selectConversation: (conversationId: string | null) => Promise<void>;
  updateConversation: (conversation: ConversationResponse) => void;
  loadMoreMessages: () => Promise<void>;
  sendStompMessage: (content: string, messageType?: MessageType, parentId?: string, attachments?: MessageAttachment[], priority?: string, clientMessageId?: string, selfDestructSeconds?: number, metadata?: Record<string, unknown>) => boolean;
  sendTypingIndicator: (typing: boolean, conversationId?: string) => void;
  setMessageDraft: (conversationId: string, content: string) => void;
  clearMessageDraft: (conversationId: string) => void;
  reloadMessageDrafts: () => void;
  clearUnreadMarker: (conversationId: string) => void;
  markConversationAsUnread: (conversationId: string) => Promise<boolean>;
  getOrCreatePrivateConversation: (friendId: string) => Promise<ConversationResponse | null>;
  getOrCreateCloudConversation: () => Promise<ConversationResponse | null>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  subscribeToGroupVoice: (groupId: string) => void;
  addIncomingMessage: (message: MessageResponse) => void;
  handleStatusUpdate: (update: MessageStatusUpdateResponse) => void;
  handleTypingIndicator: (event: TypingIndicatorEvent) => void;
  updateMemberPresence: (userId: string, status: string, lastSeen?: string) => void;
  setReplyTo: (message: MessageResponse | null) => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  recallMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  togglePinMessage: (messageId: string, isPinned: boolean) => Promise<void>;
  fetchPinnedMessages: (conversationId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  shareMessage: (messageId: string, targetConversationIds: string[]) => Promise<boolean>;
  setConversationSummary: (summary: ConversationSummaryResponse) => void;
  togglePinConversation: (conversationId: string, pinned: boolean) => Promise<boolean>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  toggleHideConversation: (conversationId: string, hidden: boolean) => Promise<boolean>;
  
  isSelectionMode: boolean;
  selectedMessageIds: string[];
  toggleSelectionMode: () => void;
  toggleMessageSelection: (messageId: string) => void;
  clearSelection: () => void;
  batchDeleteMessages: () => Promise<void>;
  batchRecallMessages: () => Promise<void>;
  batchShareMessages: (targetConversationIds: string[]) => Promise<void>;
  addOptimisticMessage: (message: MessageResponse) => void;
  updateOptimisticMessage: (clientMessageId: string, updates: Partial<MessageResponse> & { metadata?: Record<string, any> }) => void;
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
  isLoadingConversations: false,
  messagesCache: {},
  paginationCache: {},
  pinnedMessagesCache: {},
  stompClient: null,
  replyTo: null,
  pinnedMessages: [],
  subscribedGroupVoiceIds: [],
  conversationSummaries: {},
  typingUsersByConversation: {},
  messageDrafts: {},
  unreadMarkersByConversation: {},
  unreadCounts: {},
  isSelectionMode: false,
  selectedMessageIds: [],

  toggleSelectionMode: () => {
    set((state) => ({
      isSelectionMode: !state.isSelectionMode,
      selectedMessageIds: !state.isSelectionMode ? [] : state.selectedMessageIds
    }));
  },

  toggleMessageSelection: (messageId: string) => {
    set((state) => {
      const isSelected = state.selectedMessageIds.includes(messageId);
      let newSelection = [];
      if (isSelected) {
        newSelection = state.selectedMessageIds.filter(id => id !== messageId);
      } else {
        newSelection = [...state.selectedMessageIds, messageId];
      }
      return {
        selectedMessageIds: newSelection,
        isSelectionMode: newSelection.length > 0 ? true : false
      };
    });
  },

  clearSelection: () => {
    set({ isSelectionMode: false, selectedMessageIds: [] });
  },

  batchDeleteMessages: async () => {
    const { selectedMessageIds, messages } = get();
    if (selectedMessageIds.length === 0) return;
    try {
      const res = await messageService.batchDeleteMessages(selectedMessageIds);
      if (res.success) {
        set({
          messages: messages.filter(m => !selectedMessageIds.includes(m.id)),
          isSelectionMode: false,
          selectedMessageIds: []
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  batchRecallMessages: async () => {
    const { selectedMessageIds, messages } = get();
    if (selectedMessageIds.length === 0) return;
    try {
      const res = await messageService.batchRecallMessages(selectedMessageIds);
      if (res.success && res.data) {
        const recalledMap = new Map(res.data.map(m => [m.id, m]));
        set({
          messages: messages.map(m => recalledMap.has(m.id) ? recalledMap.get(m.id)! : m),
          isSelectionMode: false,
          selectedMessageIds: []
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  batchShareMessages: async (targetConversationIds: string[]) => {
    const { selectedMessageIds } = get();
    if (selectedMessageIds.length === 0) return;
    try {
      const res = await messageService.batchShareMessages(selectedMessageIds, targetConversationIds);
      if (res.success) {
        set({
          isSelectionMode: false,
          selectedMessageIds: []
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchConversations: async () => {
    const userId = useAuthStore.getState().user?.id;

    // Stale-while-revalidate from the current session's RAM-only cache.
    const cached = await encryptedCacheService.load(userId);
    if (cached && cached.conversations && cached.conversations.length > 0) {
      set({
        conversations: cached.conversations,
        lastMessages: { ...cached.lastMessages, ...get().lastMessages },
        unreadCounts: { ...cached.unreadCounts, ...get().unreadCounts },
        isLoadingConversations: false,
      });
    } else {
      set({ isLoadingConversations: true });
    }

    // Revalidate in the background with the server.
    try {
      const response = await conversationService.getConversationsWithPreviews();
      if (response.success && response.data) {
        const sorted = sortConversations(response.data.conversations);
        const freshLastMessages = { ...response.data.lastMessages, ...get().lastMessages };
        const freshUnreadCounts = { ...response.data.unreadCounts, ...get().unreadCounts };

        set({
          conversations: sorted,
          lastMessages: freshLastMessages,
          unreadCounts: freshUnreadCounts,
          isLoadingConversations: false,
        });

        if (userId) {
          sorted.slice(0, MESSAGE_PREFETCH_COUNT).forEach((conversation) => {
            if ((get().messagesCache[conversation.id]?.length ?? 0) > 0) return;
            void fetchInitialHistory(userId, conversation.id)
              .then((history) => {
                if (useAuthStore.getState().user?.id !== userId) return;
                set((state) => ({
                  messagesCache: {
                    ...state.messagesCache,
                    [conversation.id]: mergeMessagesNewestFirst(
                      state.messagesCache[conversation.id] ?? [],
                      history,
                    ),
                  },
                  paginationCache: {
                    ...state.paginationCache,
                    [conversation.id]: {
                      currentPage: 0,
                      hasMoreMessages: history.length === MESSAGE_PAGE_SIZE,
                    },
                  },
                }));
              })
              .catch(() => undefined);
          });
        }

        // Mark active conversation as delivered if present
        const currentActive = get().activeConversation;
        if (currentActive?.id) {
          messageService.markAsDelivered(currentActive.id).catch(() => {});
        }

        // Keep conversation previews in the session-only cache.
        await encryptedCacheService.save(userId, {
          conversations: sorted,
          lastMessages: freshLastMessages,
          unreadCounts: freshUnreadCounts,
        });
      }
    } catch (err) {
      console.error('Failed to fetch conversations with previews:', err);
      if (!cached) set({ isLoadingConversations: false });
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const response = await messageService.getUnreadCounts();
      if (response.success && response.data) {
        set({ unreadCounts: response.data });
      }
    } catch {
      // Giữ dữ liệu hiện tại nếu đồng bộ nền thất bại.
    }
  },

  markConversationAsUnread: async (conversationId: string) => {
    try {
      const response = await messageService.markConversationAsUnread(conversationId);
      if (!response.success || !response.data) return false;
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [conversationId]: Math.max(1, response.data!.unreadCount) },
        unreadMarkersByConversation: {
          ...state.unreadMarkersByConversation,
          [conversationId]: { messageId: response.data!.messageId, count: Math.max(1, response.data!.unreadCount) },
        },
      }));
      return true;
    } catch {
      return false;
    }
  },

  selectConversation: async (conversationId: string | null) => {
    const { activeConversation } = get();
    
    // Save current active conversation state to cache before switching
    if (activeConversation) {
      set((state) => ({
        messagesCache: {
          ...state.messagesCache,
          [activeConversation.id]: state.messages.filter((message) => !isConversationPreviewOnly(message)),
        },
        paginationCache: { ...state.paginationCache, [activeConversation.id]: { currentPage: state.currentPage, hasMoreMessages: state.hasMoreMessages } },
        pinnedMessagesCache: { ...state.pinnedMessagesCache, [activeConversation.id]: state.pinnedMessages }
      }));
    }

    if (!conversationId) {
      set({
        activeConversation: null,
        messages: [],
        currentPage: 0,
        hasMoreMessages: true,
        replyTo: null,
        pinnedMessages: [],
        typingUsersByConversation: {},
      });
      return;
    }

    // Mark any unread notifications for this conversation as read
    const notifications = useNotificationStore.getState().notifications;
    const unreadForThisConv = notifications.filter(n =>
      n.referenceId === conversationId &&
      !n.read &&
      (n.type === 'NEW_MESSAGE' || n.type === 'MENTION')
    );
    const unreadCountAtOpen = unreadForThisConv.length;
    for (const n of unreadForThisConv) {
      useNotificationStore.getState().markAsRead(n.id).catch(() => {});
    }

    const { conversations, messagesCache, paginationCache, pinnedMessagesCache, lastMessages } = get();
    const active = conversations.find((c) => c.id === conversationId) || null;

    let resolvedActive = active;
    if (!resolvedActive) {
      try {
        const response = await conversationService.getConversationById(conversationId);
        if (response.success && response.data) {
          resolvedActive = response.data;
          set((state) => ({
            conversations: sortConversations([resolvedActive!, ...state.conversations]),
          }));
        }
      } catch (err) {
        console.error('Failed to resolve conversation by ID:', err);
        return;
      }
    }

    const cachedConversationMessages = (messagesCache[conversationId] ?? [])
      .filter((message) => !isConversationPreviewOnly(message));
    const lastMessage = lastMessages[conversationId];
    const cachedMessages = cachedConversationMessages.length
      ? cachedConversationMessages
      : lastMessage && !isConversationPreviewOnly(lastMessage) ? [lastMessage] : [];
    const cachedPagination = paginationCache[conversationId] || { currentPage: 0, hasMoreMessages: true };
    const cachedPinnedMessages = pinnedMessagesCache[conversationId] || [];

    set({
      activeConversation: resolvedActive,
      messages: cachedMessages,
      currentPage: cachedPagination.currentPage,
      hasMoreMessages: cachedPagination.hasMoreMessages,
      isLoading: cachedMessages.length === 0,
      replyTo: null,
      pinnedMessages: cachedPinnedMessages,
      typingUsersByConversation: {
        ...get().typingUsersByConversation,
        [conversationId]: [],
      },
      unreadCounts: { ...get().unreadCounts, [conversationId]: 0 },
    });

    try {
      const ownerId = useAuthStore.getState().user?.id ?? 'anonymous-session';
      const history = await fetchInitialHistory(ownerId, conversationId);
        
      // Mark messages as seen
      scheduleSeenReceipt(conversationId);

      // Fetch pinned messages in background
      get().fetchPinnedMessages(conversationId).catch((e) => console.error('Failed to fetch pinned messages:', e));

      if (get().activeConversation?.id === conversationId) {
        set((state) => {
          const updatedLastMessages = { ...state.lastMessages };
          if (history.length > 0) {
            updatedLastMessages[conversationId] = newerMessage(updatedLastMessages[conversationId], history[0])!;
          }

          const newMessages = mergeMessagesNewestFirst(state.messages, history);
          const newHasMore = state.messages.length > 0 ? state.hasMoreMessages : history.length === MESSAGE_PAGE_SIZE;

          const markerIndex = unreadCountAtOpen > 0
            ? Math.min(unreadCountAtOpen, newMessages.length) - 1
            : -1;
          const unreadMarker = markerIndex >= 0 && newMessages[markerIndex]
            ? { messageId: newMessages[markerIndex].id, count: unreadCountAtOpen }
            : undefined;

          return {
            messages: newMessages,
            hasMoreMessages: newHasMore,
            isLoading: false,
            lastMessages: updatedLastMessages,
            unreadMarkersByConversation: unreadMarker
              ? {
                  ...state.unreadMarkersByConversation,
                  [conversationId]: unreadMarker,
                }
              : state.unreadMarkersByConversation,
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      if (get().activeConversation?.id === conversationId) {
        set({ isLoading: false });
      }
    }
  },

  updateConversation: (updatedConversation: ConversationResponse) => {
    set((state) => {
      const nextConversations = state.conversations.map((c) =>
        c.id === updatedConversation.id ? updatedConversation : c
      );
      
      let nextActiveConversation = state.activeConversation;
      if (state.activeConversation?.id === updatedConversation.id) {
        nextActiveConversation = updatedConversation;
      }
      
      return {
        conversations: sortConversations(nextConversations),
        activeConversation: nextActiveConversation,
      };
    });
  },

  loadMoreMessages: async () => {
    const { activeConversation, currentPage, hasMoreMessages, isLoading } = get();
    if (!activeConversation || !hasMoreMessages || isLoading) return;

    set({ isLoading: true });
    const nextPage = currentPage + 1;

    try {
      const response = await messageService.getConversationMessages(
        activeConversation.id,
        nextPage,
        MESSAGE_PAGE_SIZE
      );
      if (response.success && response.data) {
        const history = response.data;
        set((state) => ({
          messages: mergeMessagesNewestFirst(state.messages, history),
          currentPage: nextPage,
          hasMoreMessages: history.length === MESSAGE_PAGE_SIZE,
          isLoading: false,
        }));
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
      set({ isLoading: false });
    }
  },

  sendStompMessage: (content: string, messageType?: MessageType, parentId?: string, attachments?: MessageAttachment[], priority?: string, clientMessageId?: string, selfDestructSeconds?: number, metadata?: Record<string, unknown>) => {
    const { stompClient, activeConversation } = get();
    if (!stompClient || !stompClient.connected || !activeConversation) {
      console.warn('[STOMP] Client not connected or no active conversation');
      return false;
    }

    const messageRequest: Record<string, any> = {
      conversationId: activeConversation.id,
      content,
      messageType: messageType || 'TEXT',
      parentId: parentId || undefined,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      priority: priority || undefined,
      clientMessageId: clientMessageId || undefined,
      metadata,
    };
    if (selfDestructSeconds && selfDestructSeconds > 0) {
      messageRequest.selfDestructSeconds = selfDestructSeconds;
    }

    try {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(messageRequest),
      });
      return true;
    } catch (error) {
      console.error('[STOMP] Failed to publish message:', error);
      return false;
    }
  },

  sendTypingIndicator: (typing: boolean, conversationId?: string) => {
    const { stompClient, activeConversation } = get();
    const targetConversationId = conversationId ?? activeConversation?.id;
    if (!stompClient || !stompClient.connected || !targetConversationId) {
      return;
    }

    stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({
        conversationId: targetConversationId,
        typing,
      }),
    });
  },

  setMessageDraft: (conversationId: string, content: string) => {
    const normalizedContent = content === '<p><br></p>' ? '' : content;
    set((state) => {
      const nextDrafts = { ...state.messageDrafts };
      if (normalizedContent.trim()) {
        nextDrafts[conversationId] = normalizedContent;
      } else {
        delete nextDrafts[conversationId];
      }
      return { messageDrafts: nextDrafts };
    });
  },

  clearMessageDraft: (conversationId: string) => {
    set((state) => {
      if (!state.messageDrafts[conversationId]) return state;
      const nextDrafts = { ...state.messageDrafts };
      delete nextDrafts[conversationId];
      return { messageDrafts: nextDrafts };
    });
  },

  reloadMessageDrafts: () => {
    purgeLegacyMessageDraftStorage();
    set({ messageDrafts: {} });
  },

  clearUnreadMarker: (conversationId: string) => {
    set((state) => {
      if (!state.unreadMarkersByConversation[conversationId]) return state;
      const nextMarkers = { ...state.unreadMarkersByConversation };
      delete nextMarkers[conversationId];
      return { unreadMarkersByConversation: nextMarkers };
    });
  },

  getOrCreatePrivateConversation: async (friendId: string) => {
    try {
      const existing = get().conversations.find((conversation) =>
        conversation.type === 'PRIVATE' &&
        conversation.members.some((member) => member.id === friendId)
      );

      if (existing) {
        await get().selectConversation(existing.id);
        return existing;
      }

      const response = await conversationService.getOrCreatePrivateConversation(friendId);
      if (response.success && response.data) {
        const conversation = response.data;

        set((state) => {
          const exists = state.conversations.some((c) => c.id === conversation.id);
          const updatedList = exists
            ? state.conversations
            : sortConversations([conversation, ...state.conversations]);
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

  getOrCreateCloudConversation: async () => {
    try {
      const existing = get().conversations.find((conversation) =>
        conversation.type === 'CLOUD'
      );

      if (existing) {
        await get().selectConversation(existing.id);
        return existing;
      }

      const response = await conversationService.getOrCreateCloudConversation();
      if (response.success && response.data) {
        const conversation = response.data;

        set((state) => {
          const exists = state.conversations.some((c) => c.id === conversation.id);
          const updatedList = exists
            ? state.conversations
            : sortConversations([conversation, ...state.conversations]);
          return {
            conversations: updatedList,
          };
        });

        await get().selectConversation(conversation.id);
        return conversation;
      }
    } catch (err) {
      console.error('Failed to get or create cloud conversation:', err);
    }
    return null;
  },

  connectWebSocket: async () => {
    const connectionStartedAt = performance.now();
    const { stompClient, isConnected, isConnecting } = get();
    // Do not reconnect if already active or connecting
    if (stompClient?.active || isConnected || isConnecting) return;

    set({ isConnecting: true, error: null });

    let accessToken = useAuthStore.getState().accessToken;
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

    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? window.location.origin).replace(/\/$/, '');
    const wsRawUrl = baseUrl.replace(/^http/, 'ws') + '/ws-raw';

    let isUsingNativeWs = true;

    const createStompClient = (useRawWs: boolean): Client => {
      const stompClient = new Client({
        ...(useRawWs
          ? { brokerURL: wsRawUrl }
          : { webSocketFactory: () => new SockJS(`${baseUrl}/ws`) }),
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        debug: () => {},
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      stompClient.beforeConnect = () => {
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken) {
          stompClient.connectHeaders = {
            Authorization: `Bearer ${currentToken}`,
          };
        }
      };

      stompClient.onConnect = () => {
        const elapsedMs = Math.round(performance.now() - connectionStartedAt);
        console.info(`[STOMP] WebSocket connected (${useRawWs ? 'Native 1-RTT' : 'SockJS Fallback'}) in ${elapsedMs}ms.`);
        set({ isConnected: true, isConnecting: false, stompClient });
        stopPresenceHeartbeat();

        // Subscribe to global presence channel FIRST so we catch instant online broadcast
        stompClient.subscribe('/topic/presence', (message) => {
          try {
            const body = JSON.parse(message.body); // { userId, username, status, lastSeen }
            useFriendStore.getState().updateFriendPresence(body.userId, body.status, body.lastSeen);
            get().updateMemberPresence(body.userId, body.status, body.lastSeen);
          } catch (e) {
            console.error('[STOMP] Failed to process presence update:', e);
          }
        });

        // Subscribe to personal private chat channel
        stompClient.subscribe('/user/queue/private', (message) => {
          try {
            const body = JSON.parse(message.body);
            if (body.type === 'ALL_SESSIONS_REVOKED') {
              get().disconnectWebSocket();
              useAuthStore.getState().logout();
            } else if (body.type === 'SESSION_REVOKED') {
              const accessToken = useAuthStore.getState().accessToken;
              if (getTokenSessionId(accessToken) === body.sessionId) {
                get().disconnectWebSocket();
                useAuthStore.getState().logout();
              }
            } else if (body.type === 'STATUS_UPDATE') {
              get().handleStatusUpdate(body);
            } else if (body.type === 'TYPING') {
              get().handleTypingIndicator(body);
            } else if (body.type === 'CONVERSATION_SUMMARY') {
              get().setConversationSummary(body);
            } else if (body.type === 'CONVERSATION_UPDATE') {
              get().updateConversation(body.data);
            } else {
              if (shouldPlayIncomingMessageSound(body)) {
                audioSynth.playMessageNotification();
              }
              get().addIncomingMessage(body);
            }
          } catch (e) {
            console.error('[STOMP] Failed to process incoming message:', e);
          }
        });

        // Subscribe to personal notifications channel
        stompClient.subscribe('/user/queue/notifications', (message) => {
          try {
            const body = JSON.parse(message.body);
            const activeConversation = get().activeConversation;
            useActionInboxStore.getState().addActionItem(body);
            
            if ((body.type === 'NEW_MESSAGE' || body.type === 'MENTION') && activeConversation && body.referenceId === activeConversation.id) {
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

        // Send initial presence heartbeat NOW after subscriptions are registered
        const sendPresenceHeartbeat = () => stompClient.connected && stompClient.publish({ destination: '/app/presence.heartbeat', body: '{}' });
        sendPresenceHeartbeat();
        presenceHeartbeatTimer = setInterval(sendPresenceHeartbeat, 30_000);

        // Subscribe to personal calling signals channel
        stompClient.subscribe('/user/queue/calls', (message) => {
          try {
            const body = JSON.parse(message.body);
            void import('./callStore').then(({ useCallStore }) => {
              useCallStore.getState().handleIncomingSignal(body);
            });
          } catch (e) {
            console.error('[STOMP] Failed to process call signal:', e);
          }
        });
        void import('./callStore').then(({ useCallStore }) => {
          void useCallStore.getState().syncActiveCalls();
        });

        import('./groupStore').then(({ useGroupStore }) => {
          const groups = useGroupStore.getState().groups;
          groups.forEach((group) => get().subscribeToGroupVoice(group.id));
          const voiceChannelIds = groups.flatMap((group) =>
            group.channels.filter((channel) => channel.type === 'VOICE').map((channel) => channel.id)
          );
          void import('./callStore').then(({ useCallStore }) => {
            void useCallStore.getState().syncVoiceChannelMembers(voiceChannelIds);
          });
        }).catch(() => undefined);
      };

      stompClient.onDisconnect = () => {
        stopPresenceHeartbeat();
        console.info('[STOMP] WebSocket disconnected.');
        set({ isConnected: false, stompClient: null });
      };

      stompClient.onWebSocketError = async (evt) => {
        stopPresenceHeartbeat();
        console.warn('[STOMP] Native WebSocket error, attempting SockJS fallback:', evt);
        if (isUsingNativeWs) {
          isUsingNativeWs = false;
          stompClient.deactivate();
          const fallbackClient = createStompClient(false);
          fallbackClient.activate();
        }
      };

      stompClient.onStompError = async (frame) => {
        stopPresenceHeartbeat();
        console.error('[STOMP] STOMP error:', frame.headers['message']);
        set({ error: frame.headers['message'] || 'STOMP Protocol Error', isConnecting: false });

        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken && isTokenExpired(currentToken, 30)) {
          console.log('[STOMP] STOMP error due to expired token. Refreshing token...');
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            stompClient.deactivate();
            set({ stompClient: null, isConnected: false });
            get().connectWebSocket();
          }
        } else if (isUsingNativeWs) {
          isUsingNativeWs = false;
          stompClient.deactivate();
          const fallbackClient = createStompClient(false);
          fallbackClient.activate();
        }
      };

      return stompClient;
    };

    const initialClient = createStompClient(true);
    initialClient.activate();
  },

  disconnectWebSocket: () => {
    const { stompClient } = get();
    stopPresenceHeartbeat();
    const userId = useAuthStore.getState().user?.id;
    encryptedCacheService.clear(userId).catch(() => {});
    try {
      import('./callStore').then(({ useCallStore }) => {
        const callState = useCallStore.getState();
        if (callState.activeVoiceChannelId || callState.callState !== 'idle') {
          callState.hangupCall();
        }
      }).catch(() => undefined);
    } catch {
      // Ignore cleanup error
    }

    if (stompClient) {
      stompClient.deactivate();
      Object.values(typingIndicatorTimeouts).forEach(clearTimeout);
      Object.keys(typingIndicatorTimeouts).forEach((key) => delete typingIndicatorTimeouts[key]);
      console.info('[STOMP] Deactivated.');
    }
    set({
      stompClient: null,
      isConnected: false,
      isConnecting: false,
      subscribedGroupVoiceIds: [],
      typingUsersByConversation: {},
      messageDrafts: {},
    });
  },

  subscribeToGroupVoice: (groupId: string) => {
    const { stompClient, subscribedGroupVoiceIds } = get();
    if (!stompClient || !stompClient.connected) return;
    if (subscribedGroupVoiceIds.includes(groupId)) return;

    stompClient.subscribe(`/topic/group.${groupId}.voice`, (message) => {
      try {
        const body = JSON.parse(message.body);
        import('./callStore').then(({ useCallStore }) => {
          useCallStore.getState().handleVoiceChannelEvent(body);
        });
      } catch (e) {
        console.error('[STOMP] Failed to process voice channel event:', e);
      }
    });

    set({ subscribedGroupVoiceIds: [...subscribedGroupVoiceIds, groupId] });
  },

  addIncomingMessage: (message: MessageResponse) => {
    const { activeConversation, conversations } = get();
    const currentUser = useAuthStore.getState().user;
    const targetConversation = conversations.find((item) => item.id === message.conversationId)
      ?? (activeConversation?.id === message.conversationId ? activeConversation : undefined);
    const isReactionUpdate = message.metadata?.realtimeEvent === 'REACTION_UPDATED';
    const isLinkPreviewUpdate = message.metadata?.realtimeEvent === 'LINK_PREVIEW_UPDATED';
    const reactionPreview = createReactionConversationPreview(
      message,
      currentUser?.id,
      targetConversation?.type === 'PRIVATE',
    );

    // Update lastMessages registry
    set((state) => {
      const currentLastMessage = state.lastMessages[message.conversationId];
      const nextLastMessage = reactionPreview
        ?? (isReactionUpdate || isLinkPreviewUpdate
          ? (!currentLastMessage || currentLastMessage.id === message.id ? message : currentLastMessage)
          : message);
      return {
      lastMessages: nextLastMessage ? {
        ...state.lastMessages,
        [message.conversationId]: nextLastMessage,
      } : state.lastMessages,
      unreadCounts: isLinkPreviewUpdate
        ? state.unreadCounts
        : currentUser && message.senderId !== currentUser.id && activeConversation?.id !== message.conversationId
        ? { ...state.unreadCounts, [message.conversationId]: (state.unreadCounts[message.conversationId] ?? 0) + 1 }
        : { ...state.unreadCounts, [message.conversationId]: 0 },
    };
    });

    // Refresh the session-only conversation preview cache.
    const currentUserId = useAuthStore.getState().user?.id;
    const currentState = get();
    encryptedCacheService.patch(currentUserId, {
      lastMessages: currentState.lastMessages,
      unreadCounts: currentState.unreadCounts,
    }).catch(() => {});

    // If belongs to the active conversation
    if (activeConversation && activeConversation.id === message.conversationId) {
      const incomingClientMsgId = getClientMessageId(message);

      set((state) => {
        const matchingIndexes = state.messages.reduce<number[]>((indexes, item, index) => {
          if (item.id === message.id || (incomingClientMsgId && getClientMessageId(item) === incomingClientMsgId)) {
            indexes.push(index);
          }
          return indexes;
        }, []);
        const insertAt = matchingIndexes.length > 0 ? Math.min(...matchingIndexes) : 0;
        const updatedMessages = state.messages.filter((_, index) => !matchingIndexes.includes(index));
        updatedMessages.splice(insertAt, 0, message);
        return { messages: updatedMessages };
      });

      if (!isLinkPreviewUpdate && currentUser && message.senderId !== currentUser.id) {
        scheduleSeenReceipt(message.conversationId);
      }

      // Also update messagesCache if present
      set((state) => {
        const cached = state.messagesCache[message.conversationId];
        if (!cached) return state;
        const matchingIndexes = cached.reduce<number[]>((indexes, item, index) => {
          if (item.id === message.id || (incomingClientMsgId && getClientMessageId(item) === incomingClientMsgId)) {
            indexes.push(index);
          }
          return indexes;
        }, []);
        const insertAt = matchingIndexes.length > 0 ? Math.min(...matchingIndexes) : 0;
        const updatedCache = cached.filter((_, index) => !matchingIndexes.includes(index));
        updatedCache.splice(insertAt, 0, message);
        return {
          messagesCache: {
            ...state.messagesCache,
            [message.conversationId]: updatedCache
          }
        };
      });
      // Handle update pinned messages in local state
      if (message.isPinned) {
        set((state) => {
          const exists = state.pinnedMessages.some((m) => m.id === message.id);
          if (exists) {
            return {
              pinnedMessages: state.pinnedMessages.map((m) => (m.id === message.id ? message : m)),
            };
          } else {
            return {
              pinnedMessages: [message, ...state.pinnedMessages],
            };
          }
        });
      } else {
        // message is not pinned, remove it from pinnedMessages if it was there
        set((state) => ({
          pinnedMessages: state.pinnedMessages.filter((m) => m.id !== message.id),
        }));
      }
    } else {
      // If we are not the sender, mark it as DELIVERED
      if (!isLinkPreviewUpdate && currentUser && message.senderId !== currentUser.id) {
        messageService.markAsDelivered(message.conversationId).catch(() => {});
      }
    }

    // Bump the conversation to the top and update its updatedAt field
    const conversationIndex = conversations.findIndex((c) => c.id === message.conversationId);
    if (!isLinkPreviewUpdate && conversationIndex > -1) {
      set((state) => {
        const list = [...state.conversations];
        const target = { ...list[conversationIndex], updatedAt: message.createdAt };
        list.splice(conversationIndex, 1);
        return {
          conversations: sortConversations([target, ...list]),
        };
      });
    } else if (!isLinkPreviewUpdate) {
      // Fetch the conversation and prepend it
      conversationService.getConversationById(message.conversationId).then((response) => {
        if (response.success && response.data) {
          set((state) => ({
            conversations: sortConversations([response.data, ...state.conversations]),
          }));
        }
      });
    }

    // If it's a SYSTEM message (member join/leave/update), refresh group data
    // so the composite avatar and member list update in real-time
    if (message.messageType === 'SYSTEM') {
      import('./groupStore').then(({ useGroupStore }) => {
        useGroupStore.getState().fetchGroups();
      }).catch(() => undefined);
    }
  },

  handleStatusUpdate: (update: MessageStatusUpdateResponse) => {
    const { activeConversation, messages, lastMessages } = get();
    const currentUser = useAuthStore.getState().user;

    if (update.status === 'SEEN' && update.userId === currentUser?.id) {
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [update.conversationId]: 0 },
      }));

      const notifications = useNotificationStore.getState().notifications.filter((notification) =>
        notification.referenceId === update.conversationId &&
        !notification.read &&
        (notification.type === 'NEW_MESSAGE' || notification.type === 'MENTION')
      );
      notifications.forEach((notification) => {
        useNotificationStore.getState().markAsRead(notification.id).catch(() => undefined);
      });
    }

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

  handleTypingIndicator: (event: TypingIndicatorEvent) => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.id === event.userId) return;

    const timeoutKey = `${event.conversationId}:${event.userId}`;
    if (typingIndicatorTimeouts[timeoutKey]) {
      clearTimeout(typingIndicatorTimeouts[timeoutKey]);
      delete typingIndicatorTimeouts[timeoutKey];
    }

    set((state) => {
      const existingUsers = state.typingUsersByConversation[event.conversationId] ?? [];
      const nextUsers = event.typing
        ? [
            ...existingUsers.filter((user) => user.userId !== event.userId),
            {
              userId: event.userId,
              username: event.username,
              updatedAt: event.updatedAt,
            },
          ]
        : existingUsers.filter((user) => user.userId !== event.userId);

      return {
        typingUsersByConversation: {
          ...state.typingUsersByConversation,
          [event.conversationId]: nextUsers,
        },
      };
    });

    if (event.typing) {
      typingIndicatorTimeouts[timeoutKey] = setTimeout(() => {
        set((state) => {
          const existingUsers = state.typingUsersByConversation[event.conversationId] ?? [];
          return {
            typingUsersByConversation: {
              ...state.typingUsersByConversation,
              [event.conversationId]: existingUsers.filter((user) => user.userId !== event.userId),
            },
          };
        });
        delete typingIndicatorTimeouts[timeoutKey];
      }, 4000);
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

  setReplyTo: (message) => set({ replyTo: message }),

  editMessage: async (messageId, content) => {
    try {
      await messageService.editMessage(messageId, content);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  },

  recallMessage: async (messageId) => {
    try {
      await messageService.recallMessage(messageId);
    } catch (err) {
      console.error('Failed to recall message:', err);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) {
        set((state) => {
          const updatedMessages = state.messages.filter((m) => m.id !== messageId);
          const activeConversation = state.activeConversation;
          const updatedLastMessages = { ...state.lastMessages };
          if (activeConversation && updatedLastMessages[activeConversation.id]?.id === messageId) {
            updatedLastMessages[activeConversation.id] = updatedMessages[0];
          }
          return {
            messages: updatedMessages,
            lastMessages: updatedLastMessages,
          };
        });
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  },

  togglePinMessage: async (messageId, isPinned) => {
    try {
      const response = isPinned
        ? await messageService.unpinMessage(messageId)
        : await messageService.pinMessage(messageId);

      if (!response.success || !response.data) {
        return;
      }

      const updatedMessage = response.data;
      const activeConversation = get().activeConversation;

      set((state) => {
        const updatedMessages = state.messages.map((m) =>
          m.id === messageId ? { ...m, ...updatedMessage } : m
        );

        const updatedPinnedMessages = updatedMessage.isPinned
          ? state.pinnedMessages.some((m) => m.id === messageId)
            ? state.pinnedMessages.map((m) => (m.id === messageId ? updatedMessage : m))
            : [updatedMessage, ...state.pinnedMessages]
          : state.pinnedMessages.filter((m) => m.id !== messageId);

        return {
          messages: updatedMessages,
          pinnedMessages: updatedPinnedMessages,
        };
      });

      if (activeConversation) {
        try {
          await get().fetchPinnedMessages(activeConversation.id);
        } catch (err) {
          console.error('Failed to refresh pinned messages after toggle:', err);
        }
      }

    } catch (err) {
      console.error('Failed to toggle pin status:', err);
    }
  },

  fetchPinnedMessages: async (conversationId) => {
    try {
      const response = await messageService.getPinnedMessages(conversationId);
      if (response.success && response.data) {
        if (get().activeConversation?.id === conversationId) {
          set({ pinnedMessages: response.data });
        }
        set((state) => ({
          pinnedMessagesCache: { ...state.pinnedMessagesCache, [conversationId]: response.data }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch pinned messages:', err);
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const response = await messageService.reactToMessage(messageId, emoji);
      if (response.success && response.data) {
        const updatedMessage = response.data;
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === updatedMessage.id ? updatedMessage : message
          ),
          pinnedMessages: state.pinnedMessages.map((message) =>
            message.id === updatedMessage.id ? updatedMessage : message
          ),
          lastMessages: state.lastMessages[updatedMessage.conversationId]?.id === updatedMessage.id
            ? { ...state.lastMessages, [updatedMessage.conversationId]: updatedMessage }
            : state.lastMessages,
          messagesCache: Object.fromEntries(
            Object.entries(state.messagesCache).map(([conversationId, messages]) => [
              conversationId,
              messages.map((message) => message.id === updatedMessage.id ? updatedMessage : message),
            ])
          ),
          pinnedMessagesCache: Object.fromEntries(
            Object.entries(state.pinnedMessagesCache).map(([conversationId, messages]) => [
              conversationId,
              messages.map((message) => message.id === updatedMessage.id ? updatedMessage : message),
            ])
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to react to message:', err);
    }
  },

  shareMessage: async (messageId, targetConversationIds) => {
    try {
      const response = await messageService.shareMessage(messageId, targetConversationIds);
      if (response.success && response.data) {
        const currentActiveId = get().activeConversation?.id;
        for (const message of response.data) {
          set((state) => ({
            lastMessages: {
              ...state.lastMessages,
              [message.conversationId]: message,
            },
          }));

          if (currentActiveId === message.conversationId) {
            get().addIncomingMessage(message);
          }
        }
        await get().fetchConversations();
        return true;
      }
    } catch (err) {
      console.error('Failed to share message:', err);
    }
    return false;
  },

  setConversationSummary: (summary) => {
    set((state) => ({
      conversationSummaries: {
        ...state.conversationSummaries,
        [summary.conversationId]: summary,
      },
    }));
  },

  togglePinConversation: async (conversationId, pinned) => {
    try {
      const response = pinned
        ? await conversationService.unpinConversation(conversationId)
        : await conversationService.pinConversation(conversationId);
      if (response.success && response.data) {
        const updated = response.data;
        let groupConversationIds: Set<string> | null = null;
        if (updated.type === 'GROUP') {
          const { useGroupStore } = await import('./groupStore');
          const group = useGroupStore.getState().groups.find((candidate) =>
            candidate.conversationId === conversationId
            || candidate.channels?.some((channel) => channel.conversationId === conversationId)
          );
          if (group) {
            groupConversationIds = new Set([
              ...(group.conversationId ? [group.conversationId] : []),
              ...(group.channels ?? []).map((channel) => channel.conversationId),
            ]);
          }
        }
        set((state) => ({
          activeConversation: state.activeConversation?.id === updated.id
            ? updated
            : state.activeConversation && groupConversationIds?.has(state.activeConversation.id)
              ? { ...state.activeConversation, pinned: updated.pinned }
              : state.activeConversation,
          conversations: sortConversations(state.conversations.map((conversation) =>
            conversation.id === updated.id
              ? updated
              : groupConversationIds?.has(conversation.id)
                ? { ...conversation, pinned: updated.pinned }
                : conversation
          )),
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to update conversation pin:', err);
    }
    return false;
  },

  deleteConversation: async (conversationId) => {
    try {
      const response = await conversationService.deleteConversation(conversationId);
      if (response.success) {
        set((state) => {
          const isActive = state.activeConversation?.id === conversationId;
          const nextLastMessages = { ...state.lastMessages };
          delete nextLastMessages[conversationId];
          return {
            conversations: state.conversations.filter((conversation) => conversation.id !== conversationId),
            activeConversation: isActive ? null : state.activeConversation,
            messages: isActive ? [] : state.messages,
            currentPage: isActive ? 0 : state.currentPage,
            hasMoreMessages: isActive ? true : state.hasMoreMessages,
            replyTo: isActive ? null : state.replyTo,
            pinnedMessages: isActive ? [] : state.pinnedMessages,
            lastMessages: nextLastMessages,
          };
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
    return false;
  },

  toggleHideConversation: async (conversationId, hidden) => {
    try {
      const response = await conversationService.updateHidden(conversationId, hidden);
      if (response.success && response.data) {
        const updated = response.data;
        set((state) => {
          const isActive = state.activeConversation?.id === conversationId;
          let nextConversations = [...state.conversations];
          if (hidden) {
            nextConversations = nextConversations.filter(c => c.id !== conversationId);
          } else {
            const exists = nextConversations.some(c => c.id === conversationId);
            if (exists) {
              nextConversations = nextConversations.map(c => c.id === conversationId ? updated : c);
            } else {
              nextConversations.push(updated);
            }
          }
          return {
            conversations: sortConversations(nextConversations),
            activeConversation: isActive ? (hidden ? null : updated) : state.activeConversation,
            messages: isActive && hidden ? [] : state.messages,
          };
        });

        if (updated.type === 'GROUP') {
          const { useGroupStore } = await import('./groupStore');
          useGroupStore.setState((state) => ({
            groups: state.groups.map((group) => {
              if (!group.channels.some((channel) => channel.conversationId === conversationId)) {
                return group;
              }

              const channels = group.channels.map((channel) =>
                channel.conversationId === conversationId
                  ? { ...channel, hidden }
                  : channel
              );
              const currentConversationWasHidden =
                hidden && group.conversationId === conversationId;
              const nextConversationId = currentConversationWasHidden
                ? channels.find((channel) => !channel.hidden && channel.name === 'Chung')?.conversationId
                  ?? channels.find((channel) => !channel.hidden && channel.type === 'TEXT' && !channel.isPrivate)?.conversationId
                  ?? channels.find((channel) => !channel.hidden)?.conversationId
                  ?? null
                : group.conversationId;

              return { ...group, channels, conversationId: nextConversationId };
            }),
          }));
          await useGroupStore.getState().fetchGroups({ skipCache: true });
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to update conversation hidden status:', err);
    }
    return false;
  },

  addOptimisticMessage: (message: MessageResponse) => {
    set((state) => {
      const activeConvoId = state.activeConversation?.id;
      const isCurrentConvo = activeConvoId === message.conversationId;
      const newMessages = isCurrentConvo ? [message, ...state.messages] : state.messages;

      const cached = state.messagesCache[message.conversationId];
      const newCache = cached
        ? { ...state.messagesCache, [message.conversationId]: [message, ...cached] }
        : state.messagesCache;

      return {
        messages: newMessages,
        messagesCache: newCache,
        lastMessages: {
          ...state.lastMessages,
          [message.conversationId]: message
        }
      };
    });
  },

  updateOptimisticMessage: (clientMessageId: string, updates: Partial<MessageResponse> & { metadata?: Record<string, any> }) => {
    set((state) => {
      const updateList = (list: MessageResponse[]) =>
        list.map((m) => {
          if (getClientMessageId(m) === clientMessageId) {
            return {
              ...m,
              ...updates,
              metadata: {
                ...m.metadata,
                ...updates.metadata
              }
            };
          }
          return m;
        });

      return {
        messages: updateList(state.messages),
        messagesCache: Object.fromEntries(
          Object.entries(state.messagesCache).map(([cid, list]) => [cid, updateList(list)])
        ),
        lastMessages: Object.fromEntries(
          Object.entries(state.lastMessages).map(([cid, message]) => [
            cid,
            message && getClientMessageId(message) === clientMessageId
              ? updateList([message])[0]
              : message
          ])
        ),
      };
    });
  },
}));
