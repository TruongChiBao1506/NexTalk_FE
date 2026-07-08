import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import DOMPurify from 'dompurify';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import 'quill-mention/autoregister';
import 'quill-mention/dist/quill.mention.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useGroupStore } from '../store/groupStore';
import { useFriendStore } from '../store/friendStore';
import { useChatRequestStore } from '../store/chatRequestStore';
import { authService } from '../services/authService';
import { fileService } from '../services/fileService';
import { messageService } from '../services/messageService';
import { reminderService } from '../services/reminderService';
import { blockService } from '../services/blockService';
import { groupService } from '../services/groupService';
import { conversationService } from '../services/conversationService';
import { ensureFreshAccessToken } from '../api/apiClient';
import {
  MessageSquare, Loader2, Users, Plus, ArrowLeft, UserPlus, Sparkles,
  Shield, Lock, Headphones, Mic, BellRing
} from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CallOverlay from '../components/chat/CallOverlay';
import { useCallStore } from '../store/callStore';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import { useNotificationStore } from '../store/notificationStore';
import { formatRelativeTime } from '../utils/time';
import { useStickerStore } from '../store/stickerStore';
import MobileBottomNav from '../components/common/MobileBottomNav';
import type { CallHistoryMetadata, ConversationResponse, MessageAttachment, MessageResponse, PollMetadata } from '../types/chat';
import type { ChannelResponse, GroupResponse, GroupRole } from '../types/group';
import type { ChatRequestResponse } from '../types/chatRequest';
import type { User as AuthUser } from '../types/auth';

// Phase 10 Components
import { PinnedMessagesPanel } from '../components/chat/PinnedMessagesPanel';
import { SearchPanel } from '../components/chat/SearchPanel';
import { ShareMessageModal } from '../components/chat/ShareMessageModal';
import { MessageReminderModal } from '../components/chat/MessageReminderModal';
import InviteGroupMembersModal from '../components/chat/InviteGroupMembersModal';
import GroupApprovalsModal from '../components/chat/GroupApprovalsModal';
import { ConversationList } from '../components/chat/ConversationList';
import { SidebarNavigation } from '../components/chat/SidebarNavigation';
import { SidebarHeader } from '../components/chat/SidebarHeader';
import { SidebarSearch } from '../components/chat/SidebarSearch';
import { SidebarTabs } from '../components/chat/SidebarTabs';
import { SidebarFooter } from '../components/chat/SidebarFooter';
import { VoiceConnectedPanel } from '../components/chat/VoiceConnectedPanel';
import { VoiceChannelGrid } from '../components/chat/VoiceChannelGrid';
import { ProfileModal } from '../components/chat/ProfileModal';
import { CreatePollModal } from '../components/chat/CreatePollModal';
import { PollVoterDialogModal } from '../components/chat/PollVoterDialogModal';
import { PinSetupModal } from '../components/chat/PinSetupModal';
import { MediaViewerModal } from '../components/chat/MediaViewerModal';
import { SearchProfileModal } from '../components/chat/SearchProfileModal';
import ChannelSettingsModal from '../components/chat/ChannelSettingsModal';
import CreateChannelModal from '../components/chat/CreateChannelModal';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageInput } from '../components/chat/MessageInput';
import { MessageList } from '../components/chat/MessageList';
import { ConversationInfoPanel } from '../components/chat/ConversationInfoPanel';
import { ThemeSettingsModal } from '../components/chat/ThemeSettingsModal';
import { QrScannerModal } from '../components/chat/QrScannerModal';
import type { CreatePollData } from '../components/chat/CreatePollModal';
import { useChatModals } from '../hooks/useChatModals';
import { useConversationActions } from '../hooks/useConversationActions';
import { stripHtml } from '../utils/text';
import { useChatSearch } from '../hooks/useChatSearch';
import { useMessageActions } from '../hooks/useMessageActions';

type MessageReminder = {
  id: string;
  messageId: string;
  conversationId: string;
  senderUsername: string;
  messagePreview: string;
  remindAt: string;
  note: string;
  createdAt: string;
  fired?: boolean;
  deletedAt?: string;
  status?: 'PENDING' | 'FIRED' | 'DELETED';
};

type PendingAiReply = {
  id: string;
  conversationId: string;
  createdAt: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [pendingHideId, setPendingHideId] = useState<string | null>(null);
  const { toggleHideConversation } = useChatStore();

  const {
    conversations,
    activeConversation,
    messages,
    lastMessages,
    isConnected,
    isConnecting,
    isLoading,
    hasMoreMessages,
    fetchConversations,
    selectConversation,
    loadMoreMessages,
    sendStompMessage,
    sendTypingIndicator,
    connectWebSocket,
    disconnectWebSocket,
    replyTo,
    pinnedMessages,
    conversationSummaries,
    typingUsersByConversation,
    messageDrafts,
    unreadMarkersByConversation,
    fetchPinnedMessages,
    setReplyTo,
    editMessage,
    recallMessage,
    deleteMessage,
    togglePinMessage,
    reactToMessage,
    shareMessage,
    clearMessageDraft,
    reloadMessageDrafts,
    clearUnreadMarker,
  } = useChatStore();
  const {
    incoming: incomingChatRequests,
    isLoadingIncoming: isLoadingChatRequests,
    fetchIncoming: fetchIncomingChatRequests,
    createRequest: createChatRequest,
  } = useChatRequestStore();

  const [isPinnedPanelOpen, setIsPinnedPanelOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isInviteMembersOpen, setIsInviteMembersOpen] = useState(false);
  const [isGroupApprovalsModalOpen, setIsGroupApprovalsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [searchProfileUser, setSearchProfileUser] = useState<AuthUser | null>(null);

  const [isConversationInfoOpen, setIsConversationInfoOpen] = useState(false);
  const [conversationArchiveMessages, setConversationArchiveMessages] = useState<MessageResponse[]>([]);
  const [isLoadingConversationArchive, setIsLoadingConversationArchive] = useState(false);

  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);

  const { groups, fetchGroups, updateGroup, removeMember: removeGroupMember, updateMemberRole, pendingInvitations, fetchPendingInvitations } = useGroupStore();
  const { fetchPacks: fetchStickers } = useStickerStore();
  const { friends, pending, fetchFriends, fetchPending, sendFriendRequest, removeFriend } = useFriendStore();
  const { initiateCall, joinVoiceChannel, activeVoiceChannelId } = useCallStore();

  const {
    notifications,
    fetchNotifications,
  } = useNotificationStore();

  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  useEffect(() => {
    reloadMessageDrafts();
  }, [user?.id, reloadMessageDrafts]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [channelSettingsData, setChannelSettingsData] = useState<{ groupId: string; channel: ChannelResponse } | null>(null);
  const [createChannelGroupId, setCreateChannelGroupId] = useState<string | null>(null);

  const toggleGroupExpand = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const getGroupConversationId = (group: GroupResponse) =>
    group.conversationId
    ?? group.channels?.find((channel) => channel.name === 'Chung')?.conversationId
    ?? group.channels?.find((channel) => channel.type === 'TEXT' && !channel.isPrivate)?.conversationId
    ?? group.channels?.[0]?.conversationId
    ?? null;

  const [conversationTab, setConversationTab] = useState<'chats' | 'requests'>('chats');
  const [selectedChatRequest, setSelectedChatRequest] = useState<ChatRequestResponse | null>(null);
  const [isSendingBlockedChatRequest, setIsSendingBlockedChatRequest] = useState(false);
  const [friendRequestActionId, setFriendRequestActionId] = useState<string | null>(null);
  const [sentFriendRequestIds, setSentFriendRequestIds] = useState<string[]>([]);
  const [sentChatRequestIds, setSentChatRequestIds] = useState<string[]>([]);
  const [profileChatActionId, setProfileChatActionId] = useState<string | null>(null);
  const [profileActionLoading, setProfileActionLoading] = useState(false);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const [isUpdatingSelfDestruct] = useState(false);
  const [groupMemberActionId, setGroupMemberActionId] = useState<string | null>(null);
  const [isUpdatingGroupAvatar, setIsUpdatingGroupAvatar] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [isTogglingApproval, setIsTogglingApproval] = useState(false);
  const [isRefreshingInviteCode, setIsRefreshingInviteCode] = useState(false);
  const [messagePriority, setMessagePriority] = useState<string | null>(null);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [speechInputError, setSpeechInputError] = useState<string | null>(null);

  const [isFormattingOpen, setIsFormattingOpen] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
  const [isEmojiStickerOpen, setIsEmojiStickerOpen] = useState(false);
  const [emojiStickerTab, setEmojiStickerTab] = useState<'emoji' | 'sticker'>('emoji');
  const [expandedCallLogId, setExpandedCallLogId] = useState<string | null>(null);
  const [messageExpiryNow, setMessageExpiryNow] = useState(Date.now());
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [reminderTargetMessage, setReminderTargetMessage] = useState<MessageResponse | null>(null);
  const [messageReminders, setMessageReminders] = useState<MessageReminder[]>([]);
  const [triggeredReminder, setTriggeredReminder] = useState<MessageReminder | null>(null);
  const [pendingAiReplies, setPendingAiReplies] = useState<PendingAiReply[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);


  const [inputMessage, setInputMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevFirstMessageIdRef = useRef<string | undefined>(undefined);
  const lastScrollDistanceFromBottomRef = useRef(0);

  type PendingAttachment = {
    id: string;
    url: string | null;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
    name: string;
    size?: number;
    previewUrl: string | null;
    progress: number;
    isUploading: boolean;
  };

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const quillEditorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceRecorderStreamRef = useRef<MediaStream | null>(null);
  const voiceRecorderChunksRef = useRef<BlobPart[]>([]);
  const voiceRecordingStartedAtRef = useRef(0);
  const speechFinalTranscriptRef = useRef('');
  const speechManuallyStoppedRef = useRef(false);
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const isTypingSentRef = useRef(false);
  const typingConversationIdRef = useRef<string | null>(null);
  const isRestoringDraftRef = useRef(false);
  const lastRestoredDraftConversationRef = useRef<string | null>(null);

  const {
    isInviteMembersOpen: _, setIsInviteMembersOpen: __,
    isProfileModalOpen, setIsProfileModalOpen,
    isCreatePollOpen, setIsCreatePollOpen,
    pollVoterDialog, setPollVoterDialog,
    activeMedia, setActiveMedia,
    sharingMessage, setSharingMessage,
    isPinModalOpen, setIsPinModalOpen,
    searchProfileUser: ___, setSearchProfileUser: ____,
    confirmDialog, setConfirmDialog,
  } = useChatModals();

  const showAlertDialog = (description: string, title = 'Thông báo', variant: 'primary' | 'danger' = 'primary') => {
    setConfirmDialog({
      title,
      description,
      confirmLabel: 'OK',
      variant,
      showCancel: false,
      onConfirm: () => setConfirmDialog(null),
    });
  };

  const {
    conversationActionId, setConversationActionId,
    openConversationMenuId, setOpenConversationMenuId,
    chatRequestActionId,
    handleHideClick,
    handleToggleConversationPin,
    handleDeleteConversation,
    handleUpdateSelfDestruct,
    handleAcceptChatRequest,
    handleBlockChatRequest,
    handleReportChatRequest,
  } = useConversationActions({
    setPendingHideId,
    setIsPinModalOpen,
    setIsConversationInfoOpen,
    setIsPinnedPanelOpen,
    setIsSearchPanelOpen,
    fetchIncomingChatRequests,
    setSelectedChatRequest,
    setConversationTab,
    showAlertDialog,
  });

  const handleSaveTheme = async (themeColor?: string, wallpaperUrl?: string) => {
    if (!activeConversation) return;
    setIsUpdatingTheme(true);
    try {
      const response = await conversationService.updateTheme(activeConversation.id, themeColor, wallpaperUrl);
      if (response.success && response.data) {
        const updatedConversation = response.data;
        useChatStore.setState((state) => ({
          activeConversation: state.activeConversation?.id === updatedConversation.id
            ? updatedConversation
            : state.activeConversation,
          conversations: state.conversations.map((conversation) =>
            conversation.id === updatedConversation.id ? updatedConversation : conversation
          ),
        }));
      }
      await fetchConversations();
      setIsThemeModalOpen(false);
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const {
    editingMessageId, setEditingMessageId,
    editInputText, setEditInputText,
    isSharingMessage,
    isSummarizingConversation,
    pollActionMessageId, setPollActionMessageId,
    pollNewOptionText, setPollNewOptionText,
    updateMessageInChat,
    handleSaveEdit,
    handleJumpToMessage,
    handleJumpToMessageFromSearch,
    handleShareMessage,
    handleSummarizeConversation,
    handlePollVote,
    handleAddPollOption,
    handleLockPoll,
    handleDeletePoll,
  } = useMessageActions({
    sharingMessage,
    setSharingMessage,
    selectConversation,
    editMessage,
    shareMessage,
    showAlertDialog,
  });

  const {
    searchQuery, setSearchQuery,
    globalUserResults,
    globalMessageResults,
    globalConversationResults,
    isGlobalSearching,
    globalSearchError,
    groupMemberSearchQuery, setGroupMemberSearchQuery,
    normalizeSearchTerm,
    handleOpenSearchMessage
  } = useChatSearch({
    handleJumpToMessage
  });

  const mapReminderResponse = (reminder: import('../services/reminderService').MessageReminderResponse): MessageReminder => ({
    id: reminder.id,
    messageId: reminder.messageId,
    conversationId: reminder.conversationId,
    senderUsername: reminder.senderUsername,
    messagePreview: reminder.messagePreview,
    remindAt: reminder.remindAt,
    note: reminder.note ?? '',
    createdAt: reminder.createdAt,
    fired: reminder.status === 'FIRED',
    deletedAt: reminder.deletedAt ?? undefined,
    status: reminder.status,
  });

  useEffect(() => {
    if (!user?.id) {
      setMessageReminders([]);
      return;
    }

    reminderService.getMyReminders()
      .then((response) => setMessageReminders((response.data ?? []).map(mapReminderResponse)))
      .catch(() => setMessageReminders([]));
  }, [user?.id]);

  const fireMessageReminder = (reminder: MessageReminder) => {
    setMessageReminders((current) => {
      const next = current.map((item) => (
        item.id === reminder.id ? { ...item, fired: true, status: 'FIRED' as const } : item
      ));
      return next;
    });
    reminderService.markReminderFired(reminder.id).catch(() => {});

    const title = 'NexTalk nhắc hẹn';
    const body = reminder.note || `${reminder.senderUsername}: ${reminder.messagePreview}`;
    setTriggeredReminder(reminder);

    if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        tag: reminder.id,
      });

      notification.onclick = () => {
        window.focus();
        selectConversation(reminder.conversationId);
        window.setTimeout(() => handleJumpToMessage(reminder.messageId), 450);
        notification.close();
      };
      return;
    }

  };

  useEffect(() => {
    const nextReminder = messageReminders
      .filter((reminder) => !reminder.fired && !reminder.deletedAt)
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())[0];

    if (!nextReminder) return;

    const delay = Math.max(0, new Date(nextReminder.remindAt).getTime() - Date.now());
    const timer = window.setTimeout(() => fireMessageReminder(nextReminder), delay);
    return () => window.clearTimeout(timer);
  }, [messageReminders]);

  const handleSaveMessageReminder = async ({ remindAt, note }: { remindAt: string; note: string }) => {
    if (!reminderTargetMessage || !activeConversation?.id) return;

    const response = await reminderService.createReminder({
      messageId: reminderTargetMessage.id,
      remindAt,
      note,
    });
    const nextReminder = mapReminderResponse(response.data);

    setMessageReminders((current) => {
      const next = [...current, nextReminder].sort(
        (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
      );
      return next;
    });

    setReminderTargetMessage(null);

    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const processedAiReminderMessageIdsRef = useRef<Set<string>>(new Set());

  const createReminderFromAiMessage = async (message: MessageResponse) => {
    const metadata = message.metadata ?? {};
    if (metadata.action !== 'CREATE_MESSAGE_REMINDER' || metadata.requestedByUserId !== user?.id) return;
    if (processedAiReminderMessageIdsRef.current.has(message.id)) return;

    processedAiReminderMessageIdsRef.current.add(message.id);
    const remindAt = typeof metadata.remindAt === 'string' ? metadata.remindAt : '';
    const remindAtDate = new Date(remindAt);
    if (!remindAt || Number.isNaN(remindAtDate.getTime()) || remindAtDate.getTime() <= Date.now()) return;

    const targetMessageId = typeof metadata.messageId === 'string' ? metadata.messageId : (message.parentId ?? message.id);
    const targetMessage = messages.find((item) => item.id === targetMessageId);
    if (!targetMessage && !metadata.messageId) return;

    const response = await reminderService.createReminder({
      messageId: targetMessageId,
      remindAt,
      note: typeof metadata.note === 'string' ? metadata.note : '',
    });
    const nextReminder = mapReminderResponse(response.data);

    setMessageReminders((current) => {
      if (current.some((reminder) => reminder.id === nextReminder.id || (
        reminder.messageId === nextReminder.messageId
        && reminder.remindAt === nextReminder.remindAt
        && reminder.note === nextReminder.note
      ))) return current;
      const next = [...current, nextReminder].sort(
        (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
      );
      return next;
    });

    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const aiReminderMessages = [
      ...messages,
      ...Object.values(lastMessages),
    ].filter((message, index, source) => (
      message?.metadata?.action === 'CREATE_MESSAGE_REMINDER'
      && source.findIndex((item) => item.id === message.id) === index
    ));

    aiReminderMessages.forEach((message) => {
      createReminderFromAiMessage(message).catch(() => {});
    });
  }, [messages, lastMessages, user?.id]);

  useEffect(() => {
    const aiReplies = messages.filter((message) => (
      message.messageType === 'SYSTEM' && message.metadata?.systemType === 'AI_BOT_REPLY'
    ));

    if (aiReplies.length === 0) return;
    setPendingAiReplies((current) => current.filter((pending) => {
      const pendingTime = new Date(pending.createdAt).getTime();
      return !aiReplies.some((reply) => (
        reply.conversationId === pending.conversationId
        && new Date(reply.createdAt).getTime() >= pendingTime
      ));
    }));
  }, [messages]);

  useEffect(() => {
    if (pendingAiReplies.length === 0) return;

    const timer = window.setTimeout(() => {
      const cutoff = Date.now() - 90_000;
      setPendingAiReplies((current) => current.filter((pending) => new Date(pending.createdAt).getTime() > cutoff));
    }, 10_000);

    return () => window.clearTimeout(timer);
  }, [pendingAiReplies]);

  const handleDeleteMessageReminder = async (reminderId: string) => {
    const response = await reminderService.deleteReminder(reminderId);
    const deletedReminder = mapReminderResponse(response.data);

    setMessageReminders((current) => {
      const next = current.map((reminder) => (
        reminder.id === reminderId
          ? { ...reminder, ...deletedReminder, deletedAt: deletedReminder.deletedAt ?? new Date().toISOString(), fired: true }
          : reminder
      ));
      return next;
    });
  };

  const handleRecreateMessageReminder = (messageId: string) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    if (targetMessage) {
      setReminderTargetMessage(targetMessage);
      return;
    }

    handleJumpToMessage(messageId);
  };

  const handleOpenTriggeredReminderMessage = () => {
    if (!triggeredReminder) return;

    const reminder = triggeredReminder;
    setTriggeredReminder(null);
    selectConversation(reminder.conversationId);
    window.setTimeout(() => handleJumpToMessage(reminder.messageId), 450);
  };



  const resetUploadState = () => {
    setPendingAttachments((attachments) => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
      return [];
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!openConversationMenuId) return;

    const closeConversationMenu = () => setOpenConversationMenuId(null);
    document.addEventListener('click', closeConversationMenu);
    return () => document.removeEventListener('click', closeConversationMenu);
  }, [openConversationMenuId]);

  useEffect(() => {
    if (!isProfileModalOpen) {
      setGroupMemberSearchQuery('');
    }
  }, [isProfileModalOpen]);

  useEffect(() => {
    return () => {
      pendingAttachments.forEach((attachment) => {
        if (attachment.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [pendingAttachments]);

  const createAttachmentId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((attachments) => {
      const removed = attachments.find((attachment) => attachment.id === id);
      if (removed?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return attachments.filter((attachment) => attachment.id !== id);
    });
  };

  const getFileMessageType = (file: File): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' => {
    const fileName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.heic', '.heif'].some(ext => fileName.endsWith(ext));
    const isVideo = file.type.startsWith('video/') ||
      ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].some(ext => fileName.endsWith(ext));
    const isAudio = file.type.startsWith('audio/') ||
      ['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.webm'].some(ext => fileName.endsWith(ext));
    if (isImage) return 'IMAGE';
    if (isVideo) return 'VIDEO';
    if (isAudio) return 'AUDIO';
    return 'FILE';
  };

  const addUrlAttachment = (url: string, type: 'IMAGE' | 'VIDEO') => {
    setPendingAttachments((attachments) => [
      ...attachments,
      {
        id: createAttachmentId(),
        url,
        type,
        name: url.split('/').pop() || 'attachment',
        size: 0,
        previewUrl: url,
        progress: 100,
        isUploading: false,
      },
    ]);
  };

  const addUploadedFile = async (file: File) => {
    const type = getFileMessageType(file);
    const maxSizeMB = 50; 

    if (file.size > maxSizeMB * 1024 * 1024) {
      showAlertDialog(`Dung lượng ${type === 'IMAGE' ? 'ảnh' : type === 'VIDEO' ? 'video' : 'tệp tin'} "${file.name}" vượt quá giới hạn cho phép là ${maxSizeMB}MB.`, 'Thông báo', 'danger');
      return;
    }

    const id = createAttachmentId();
    const previewUrl = type === 'IMAGE' ? URL.createObjectURL(file) : null;

    setPendingAttachments((attachments) => [
      ...attachments,
      {
        id,
        url: null,
        type,
        name: file.name,
        size: file.size,
        previewUrl,
        progress: 0,
        isUploading: true,
      },
    ]);

    try {
      const response = await fileService.uploadFile(file, (progress) => {
        setPendingAttachments((attachments) =>
          attachments.map((attachment) =>
            attachment.id === id ? { ...attachment, progress } : attachment
          )
        );
      });

      if (response.success && response.data) {
        setPendingAttachments((attachments) =>
          attachments.map((attachment) =>
            attachment.id === id
              ? { ...attachment, url: response.data.url, progress: 100, isUploading: false }
              : attachment
          )
        );
      } else {
        removePendingAttachment(id);
        showAlertDialog('Failed to upload file: ' + response.message, 'Thông báo', 'danger');
      }
    } catch (err: any) {
      removePendingAttachment(id);
      showAlertDialog('Error uploading file: ' + (err.response?.data?.message || err.message), 'Thông báo', 'danger');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canSendInActiveConversation) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      addUploadedFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopVoiceRecorderStream = () => {
    voiceRecorderStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceRecorderStreamRef.current = null;
  };

  const cancelVoiceRecording = () => {
    voiceRecorderChunksRef.current = [];
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      voiceRecorderRef.current.ondataavailable = null;
      voiceRecorderRef.current.onstop = null;
      voiceRecorderRef.current.stop();
    }
    voiceRecorderRef.current = null;
    stopVoiceRecorderStream();
    setIsRecordingVoice(false);
    setVoiceRecordingSeconds(0);
  };

  const startVoiceRecording = async () => {
    if (!canSendInActiveConversation || isRecordingVoice || isUploadingVoice) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showAlertDialog('Trình duyệt hiện tại chưa hỗ trợ ghi âm.', 'Thông báo', 'danger');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      voiceRecorderChunksRef.current = [];
      voiceRecorderStreamRef.current = stream;
      voiceRecorderRef.current = recorder;
      voiceRecordingStartedAtRef.current = Date.now();
      setVoiceRecordingSeconds(0);
      setIsRecordingVoice(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceRecorderChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = voiceRecorderChunksRef.current;
        voiceRecorderChunksRef.current = [];
        voiceRecorderRef.current = null;
        stopVoiceRecorderStream();
        setIsRecordingVoice(false);
        setVoiceRecordingSeconds(0);

        if (chunks.length === 0) return;

        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 1024) {
          showAlertDialog('Bản ghi âm quá ngắn hoặc không có âm thanh.', 'Thông báo', 'danger');
          return;
        }

        const extension = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${extension}`, {
          type: audioBlob.type || 'audio/webm',
        });

        setIsUploadingVoice(true);
        try {
          const response = await fileService.uploadFile(audioFile);
          if (response.success && response.data?.url) {
            sendTypingStopped();
            sendStompMessage('', 'AUDIO', replyTo?.id ?? undefined, [{
              url: response.data.url,
              type: 'AUDIO',
              name: audioFile.name,
              size: audioFile.size,
            }], undefined);
            if (replyTo) {
              setReplyTo(null);
            }
            setIsEmojiStickerOpen(false);
          } else {
            showAlertDialog(response.message || 'Không thể tải bản ghi âm lên.', 'Thông báo', 'danger');
          }
        } catch (err: any) {
          showAlertDialog(err.response?.data?.message || err.message || 'Không thể gửi tin nhắn thoại.', 'Thông báo', 'danger');
        } finally {
          setIsUploadingVoice(false);
        }
      };

      recorder.start();
    } catch (err: any) {
      stopVoiceRecorderStream();
      setIsRecordingVoice(false);
      setVoiceRecordingSeconds(0);
      const message = err?.name === 'NotAllowedError'
        ? 'Bạn cần cấp quyền micro để ghi tin nhắn thoại.'
        : 'Không thể bắt đầu ghi âm.';
      showAlertDialog(message, 'Thông báo', 'danger');
    }
  };

  const stopVoiceRecording = () => {
    if (!voiceRecorderRef.current || voiceRecorderRef.current.state === 'inactive') return;
    voiceRecorderRef.current.stop();
  };

  useEffect(() => {
    if (!isRecordingVoice) return;
    const interval = window.setInterval(() => {
      setVoiceRecordingSeconds(Math.floor((Date.now() - voiceRecordingStartedAtRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, [isRecordingVoice]);

  useEffect(() => {
    return () => {
      cancelVoiceRecording();
    };
  }, []);

  const handleTakeScreenshot = async () => {
    if (!canSendInActiveConversation || isTakingScreenshot) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showAlertDialog('Trình duyệt hiện tại chưa hỗ trợ chụp màn hình.', 'Thông báo', 'danger');
      return;
    }

    setIsTakingScreenshot(true);
    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Không thể đọc màn hình đã chọn.'));
        video.play().catch(reject);
      });

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        throw new Error('Không lấy được kích thước ảnh chụp.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Không thể tạo ảnh chụp.');
      }

      context.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error('Không thể xuất ảnh chụp.');
      }

      const file = new File(
        [blob],
        `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
        { type: 'image/png' }
      );
      await addUploadedFile(file);
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        showAlertDialog(err?.message || 'Không thể chụp màn hình.', 'Thông báo', 'danger');
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setIsTakingScreenshot(false);
    }
  };

  // Initialize
  useEffect(() => {
    let cancelled = false;
    let lastResumeSyncAt = 0;
    let lastConversationResyncAt = 0;

    const reloadChatData = async (reselectActiveConversation = false) => {
      const accessToken = await ensureFreshAccessToken(120);
      if (!accessToken || cancelled) return;

      await Promise.allSettled([
        fetchConversations(),
        fetchGroups(),
        fetchFriends(),
        fetchPending(),
        fetchPendingInvitations(),
        fetchNotifications(),
        fetchIncomingChatRequests(),
      ]);

      if (cancelled) return;

      if (reselectActiveConversation && Date.now() - lastConversationResyncAt > 60000) {
        const currentActiveConversationId = useChatStore.getState().activeConversation?.id;
        if (currentActiveConversationId) {
          lastConversationResyncAt = Date.now();
          await useChatStore.getState().selectConversation(currentActiveConversationId);
        }
      }

      const { isConnected: currentlyConnected, isConnecting: currentlyConnecting } = useChatStore.getState();
      if (!currentlyConnected && !currentlyConnecting) {
        connectWebSocket();
      }
    };

    reloadChatData();

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastResumeSyncAt < 2000) return;
      lastResumeSyncAt = now;

      reloadChatData(true);
    };

    const handleOnline = () => {
      reloadChatData(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [connectWebSocket, fetchConversations, fetchFriends, fetchGroups, fetchIncomingChatRequests, fetchNotifications, fetchPending, fetchPendingInvitations]);


  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    setShowScrollToLatest(false);
    lastScrollDistanceFromBottomRef.current = 0;
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const scrollToUnreadMarker = (behavior: ScrollBehavior = 'smooth') => {
    const markerId = activeConversation ? unreadMarkersByConversation[activeConversation.id]?.messageId : null;
    if (!markerId) return;
    document.getElementById(`message-${markerId}`)?.scrollIntoView({ behavior, block: 'center' });
  };

  const getDistanceFromChatBottom = (container: HTMLDivElement) => {
    const normalDistance = container.scrollHeight - container.clientHeight - container.scrollTop;
    return Math.max(0, Math.min(Math.abs(container.scrollTop), normalDistance));
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom = getDistanceFromChatBottom(container);
    const previousDistance = lastScrollDistanceFromBottomRef.current;
    const isMovingAwayFromLatest = distanceFromBottom > previousDistance + 8;
    const isMovingTowardLatest = distanceFromBottom < previousDistance - 8;
    const isFarFromBottom = distanceFromBottom > 260;

    if (!isFarFromBottom || isMovingTowardLatest) {
      setShowScrollToLatest(false);
    } else if (isMovingAwayFromLatest) {
      setShowScrollToLatest(true);
    }

    if (activeConversation?.id && distanceFromBottom < 80) {
      clearUnreadMarker(activeConversation.id);
    }

    lastScrollDistanceFromBottomRef.current = distanceFromBottom;
  };

  useEffect(() => {
    if (activeConversation) {
      setSelectedChatRequest(null);
      setIsProfileModalOpen(false);
      setIsConversationInfoOpen(false);
      setConversationArchiveMessages([]);
      setShowScrollToLatest(false);
      lastScrollDistanceFromBottomRef.current = 0;
      const timer = setTimeout(() => scrollToBottom('auto'), 50);
      return () => clearTimeout(timer);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    const marker = activeConversation ? unreadMarkersByConversation[activeConversation.id] : null;
    if (!marker) return;
    const timer = window.setTimeout(() => scrollToUnreadMarker('auto'), 120);
    return () => window.clearTimeout(timer);
  }, [activeConversation?.id, unreadMarkersByConversation]);

  useEffect(() => {
    if (!selectedChatRequest) return;
    const stillPending = incomingChatRequests.some((request) => request.id === selectedChatRequest.id);
    if (!stillPending) {
      setSelectedChatRequest(null);
    }
  }, [incomingChatRequests, selectedChatRequest]);

  useEffect(() => {
    if (!isConversationInfoOpen || !activeConversation?.id) return;

    let cancelled = false;
    const loadConversationArchive = async () => {
      setIsLoadingConversationArchive(true);
      try {
        const pageSize = 50;
        const maxPages = 5;
        const archive: MessageResponse[] = [];

        for (let page = 0; page < maxPages; page += 1) {
          const response = await messageService.getConversationMessages(activeConversation.id, page, pageSize);
          if (!response.success || !response.data || cancelled) break;

          archive.push(...response.data);
          if (response.data.length < pageSize) break;
        }

        if (!cancelled) {
          setConversationArchiveMessages(archive);
        }
      } catch (err) {
        console.error('Failed to load conversation archive:', err);
        if (!cancelled) {
          setConversationArchiveMessages(messages);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConversationArchive(false);
        }
      }
    };

    loadConversationArchive();

    return () => {
      cancelled = true;
    };
  }, [activeConversation?.id, isConversationInfoOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      const firstMsgId = messages[0]?.id;
      const prevFirstMsgId = prevFirstMessageIdRef.current;
      prevFirstMessageIdRef.current = firstMsgId;

      // Only scroll to bottom if a new message is added at the top (which means firstMsgId !== prevFirstMsgId)
      // And we don't scroll if it's the initial load (which is already handled by the activeConversation useEffect)
      if (prevFirstMsgId && firstMsgId !== prevFirstMsgId) {
        scrollToBottom('smooth');
      }
    } else {
      prevFirstMessageIdRef.current = undefined;
    }
  }, [messages, user?.id]);

  useEffect(() => {
    if (!messages.some((message) => Boolean(message.expiresAt))) return;
    const timer = window.setInterval(() => setMessageExpiryNow(Date.now()), 10000);
    return () => window.clearTimeout(timer);
  }, [messages]);

  // Infinite scroll: Observe the sentinel element at the top of the message list
  useEffect(() => {
    if (!hasMoreMessages || isLoading || !activeConversation) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMessages();
        }
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '100px 0px 0px 0px', // Trigger when sentinel is within 100px of container viewport top
        threshold: 0,
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMoreMessages, isLoading, loadMoreMessages, activeConversation?.id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('nextalk_refreshToken');
      if (refreshToken) await authService.logout(refreshToken);
    } catch (err: any) {
      console.error('Failed to log out from server:', err);
    } finally {
      disconnectWebSocket();
      logout();
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  const getActivePrivateFriendId = () => {
    if (activeConversation?.type !== 'PRIVATE') {
      return null;
    }
    return activeConversation.members.find((member) => member.id !== user?.id)?.id ?? null;
  };

  const activePrivateFriendId = getActivePrivateFriendId();
  const activePrivateChatBlockedByMe = activeConversation?.type === 'PRIVATE' && activeConversation.blockedByMe === true;
  const activePrivateChatBlockedMe = activeConversation?.type === 'PRIVATE' && activeConversation.blockedMe === true;
  const activePrivateChatBlocked = activePrivateChatBlockedByMe || activePrivateChatBlockedMe;
  const canSendInActiveConversation = !activeConversation ||
    (
      activeConversation.type === 'PRIVATE'
        ? !activePrivateChatBlocked && (
          activeConversation.canSendMessages === true ||
          (
            activeConversation.canSendMessages === undefined &&
            (!activePrivateFriendId || friends.some((friend) => friend.id === activePrivateFriendId))
          )
        )
        : true
    );
  const messagePlaceholder = activePrivateChatBlockedByMe
    ? 'Bạn đã chặn người này. Bỏ chặn để tiếp tục nhắn tin.'
    : activePrivateChatBlockedMe
      ? 'Người này đã chặn bạn. Bạn không thể gửi tin nhắn.'
      : !canSendInActiveConversation
        ? 'Nhập lời nhắn để gửi tin nhắn chờ...'
        : activeConversation?.type === 'GROUP'
          ? `Nhập @, tin nhắn tới #${groups.find(group => getGroupConversationId(group) === activeConversation.id)?.name || 'group'}...`
          : `Nhập @, tin nhắn tới @${activeConversation?.members.find(member => member.id !== user?.id)?.username || 'friend'}`;



  const getCurrentInputMessage = () => {
    const quill = quillRef.current;
    if (!quill) return inputMessage;
    let html = quill.root.innerHTML;
    if (html === '<p><br></p>') html = '';
    return html;
  };

  const insertTextToInput = (value: string) => {
    const quill = quillRef.current;
    if (quill) {
      quill.focus();
      const range = quill.getSelection(true);
      const insertAt = range?.index ?? Math.max(0, quill.getLength() - 1);
      quill.insertText(insertAt, value, 'user');
      quill.setSelection(insertAt + value.length, 0);
      return;
    }
    setInputMessage((current) => `${current}${value}`);
  };

  const handleSelectEmoji = (emoji: string) => {
    insertTextToInput(emoji);
  };

  const stopSpeechRecognition = () => {
    speechManuallyStoppedRef.current = true;
    speechRecognitionRef.current?.stop();
    setIsSpeechListening(false);
  };

  const handleToggleSpeechInput = () => {
    if (!canSendInActiveConversation) return;

    if (isSpeechListening) {
      stopSpeechRecognition();
      return;
    }

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      setSpeechInputError('Trình duyệt hiện tại chưa hỗ trợ nhập bằng giọng nói.');
      return;
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.abort();
      speechRecognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionApi();
    speechFinalTranscriptRef.current = '';
    speechManuallyStoppedRef.current = false;
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setSpeechInputError(null);
      setIsSpeechListening(true);
      setIsEmojiStickerOpen(false);
      quillRef.current?.focus();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      const cleanTranscript = finalTranscript.replace(/\s+/g, ' ').trim();
      if (!cleanTranscript) return;

      const prefix = getCurrentInputMessage().trim() ? ' ' : '';
      insertTextToInput(`${prefix}${cleanTranscript}`);
      speechFinalTranscriptRef.current += `${prefix}${cleanTranscript}`;
    };

    recognition.onerror = (event) => {
      setIsSpeechListening(false);
      speechRecognitionRef.current = null;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechInputError('Vui lòng cấp quyền microphone để nhập bằng giọng nói.');
      } else if (event.error === 'no-speech') {
        setSpeechInputError('Chưa nghe thấy giọng nói. Hãy thử lại.');
      } else if (event.error !== 'aborted') {
        setSpeechInputError('Không thể nhận diện giọng nói lúc này.');
      }
    };

    recognition.onend = () => {
      setIsSpeechListening(false);
      speechRecognitionRef.current = null;

      if (!speechManuallyStoppedRef.current && !speechFinalTranscriptRef.current) {
        setSpeechInputError((current) => current ?? 'Không nghe thấy nội dung nào.');
      }
    };

    speechRecognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      speechRecognitionRef.current = null;
      setIsSpeechListening(false);
      setSpeechInputError('Không thể bắt đầu nhận diện giọng nói.');
    }
  };

  const handleSendSticker = (sticker: string) => {
    if (!canSendInActiveConversation) return;
    sendTypingStopped();
    sendStompMessage(sticker, 'STICKER', replyTo?.id ?? undefined);
    if (replyTo) {
      setReplyTo(null);
    }
    setIsEmojiStickerOpen(false);
  };

  const clearQuillInput = () => {
    isRestoringDraftRef.current = true;
    const quill = quillRef.current;
    if (quill) {
      quill.setText('');
    }
    setInputMessage('');
    if (activeConversation?.id) {
      clearMessageDraft(activeConversation.id);
    }
    window.setTimeout(() => {
      isRestoringDraftRef.current = false;
    }, 0);
  };

  const sendTypingStopped = () => {
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }

    if (isTypingSentRef.current) {
      sendTypingIndicator(false, typingConversationIdRef.current ?? undefined);
      isTypingSentRef.current = false;
      typingConversationIdRef.current = null;
    }
  };

  useEffect(() => {
    const hasTypedText = stripHtml(inputMessage).trim().length > 0;

    if (!activeConversation || !canSendInActiveConversation || !hasTypedText) {
      sendTypingStopped();
      return;
    }

    const now = Date.now();
    if (!isTypingSentRef.current || now - lastTypingSentAtRef.current > 1500) {
      sendTypingIndicator(true, activeConversation.id);
      isTypingSentRef.current = true;
      typingConversationIdRef.current = activeConversation.id;
      lastTypingSentAtRef.current = now;
    }

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = setTimeout(() => {
      sendTypingStopped();
    }, 2500);
  }, [inputMessage, activeConversation?.id, canSendInActiveConversation]);

  useEffect(() => {
    return () => {
      sendTypingStopped();
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    return () => {
      speechManuallyStoppedRef.current = true;
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
    };
  }, [activeConversation?.id]);

  const focusQuill = () => {
    window.setTimeout(() => quillRef.current?.focus(), 0);
  };

  const applyQuillInlineFormat = (format: string, value: unknown = true) => {
    const quill = quillRef.current;
    if (!quill) return;

    let range = quill.getSelection();
    if (!range) {
      quill.focus();
      range = quill.getSelection(true);
    }

    const currentValue = range ? quill.getFormat(range)[format] : false;
    quill.format(format, currentValue ? false : value);

    const newRange = quill.getSelection();
    if (newRange) setActiveFormats(quill.getFormat(newRange));
  };

  const applyInlineFormat = (prefix: string, _suffix = prefix, _placeholder?: string) => {
    if (prefix === '**') applyQuillInlineFormat('bold');
    else if (prefix === '_') applyQuillInlineFormat('italic');
    else if (prefix === '<u>') applyQuillInlineFormat('underline');
    else if (prefix === '~~') applyQuillInlineFormat('strike');
    else if (prefix === '<mark>') applyQuillInlineFormat('background', '#fde68a');
    else if (prefix === '`') applyQuillInlineFormat('code');
    else if (prefix === '[') {
      const url = window.prompt('Nhập liên kết', 'https://');
      if (url) applyQuillInlineFormat('link', url);
      else focusQuill();
    }
  };

  const applyLineFormat = (prefix: string) => {
    const quill = quillRef.current;
    if (!quill) return;

    let range = quill.getSelection();
    if (!range) {
      quill.focus();
      range = quill.getSelection(true);
    }

    const format = prefix.trim() === '>' ? 'blockquote' : 'list';
    const value = prefix.trim() === '>' ? true : 'bullet';
    const currentFormat = range ? quill.getFormat(range)[format] : false;
    quill.format(format, currentFormat === value ? false : value);

    const newRange = quill.getSelection();
    if (newRange) setActiveFormats(quill.getFormat(newRange));
  };

  const applyNumberedList = () => {
    const quill = quillRef.current;
    if (!quill) return;

    let range = quill.getSelection();
    if (!range) {
      quill.focus();
      range = quill.getSelection(true);
    }

    const currentValue = range ? quill.getFormat(range).list : false;
    quill.format('list', currentValue === 'ordered' ? false : 'ordered');

    const newRange = quill.getSelection();
    if (newRange) setActiveFormats(quill.getFormat(newRange));
  };

  const applyAlignment = (align: 'left' | 'center' | 'right') => {
    const quill = quillRef.current;
    if (!quill) return;

    let range = quill.getSelection();
    if (!range) {
      quill.focus();
      range = quill.getSelection(true);
    }

    quill.format('align', align === 'left' ? false : align);

    const newRange = quill.getSelection();
    if (newRange) setActiveFormats(quill.getFormat(newRange));
  };

  const clearFormatting = () => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.focus();
    const range = quill.getSelection(true);
    if (range) {
      quill.removeFormat(range.index, range.length || quill.getLength());
    }
  };

  const mentionSource = useCallback((searchTerm: string, renderList: (list: any[], term: string) => void) => {
    const currentConversation = useChatStore.getState().activeConversation;
    const currentUser = useAuthStore.getState().user;
    const values: { id: string; value: string; aliases?: string[] }[] = [];

    if (currentConversation) {
      if (currentConversation.type === 'GROUP') {
        values.push({ id: 'bot', value: 'NexTalk AI', aliases: ['ai', 'bot', 'meta ai', 'nextalk'] });
        values.push({ id: 'all', value: 'all' });
      }

      currentConversation.members.forEach((member) => {
        if (member.id !== currentUser?.id) {
          values.push({ id: member.id, value: member.username });
        }
      });
    }

    if (searchTerm.length === 0) {
      renderList(values, searchTerm);
      return;
    }

    const termLower = searchTerm.toLowerCase();
    const matches = values.filter((item) => {
      const aliases = item.aliases ?? [];
      return item.value.toLowerCase().includes(termLower)
        || aliases.some((alias) => alias.includes(termLower));
    });
    renderList(matches, searchTerm);
  }, []);

  useEffect(() => {
    if (!quillEditorRef.current) {
      quillRef.current = null;
      return;
    }
    if (quillRef.current) return;

    const quill = new Quill(quillEditorRef.current, {
      theme: 'snow',
      placeholder: messagePlaceholder,
      modules: {
        toolbar: false,
        mention: {
          allowedChars: /^[A-Za-z0-9_\s]*$/,
          mentionDenotationChars: ['@'],
          positioningStrategy: 'fixed',
          source: function (searchTerm: string, renderList: (list: any[], term: string) => void) {
            mentionSource(searchTerm, renderList);
            return;
            const currentConversation = useChatStore.getState().activeConversation!;
            const currentUser = useAuthStore.getState().user;
            const values: { id: string, value: string }[] = [];

            if (currentConversation) {
              if (currentConversation.type === 'GROUP') {
                values.push({ id: 'all', value: 'Mọi người' });
              }

              if (currentConversation.type === 'GROUP') {
                values.push({ id: 'bot', value: 'NexTalk AI' });
              }

              const allMention = values.find((item) => item.id === 'all')!;
              if (allMention) {
                allMention.value = 'all';
              }

              currentConversation.members.forEach((member) => {
                if (member.id !== currentUser?.id) {
                  values.push({ id: member.id, value: member.username });
                }
              });
            }

            if (searchTerm.length === 0) {
              renderList(values, searchTerm);
            } else {
              const termLower = searchTerm.toLowerCase();
              const matches = values.filter((item) => item.value.toLowerCase().includes(termLower));
              renderList(matches, searchTerm);
            }
          },
        },
      },
      formats: [
        'mention',
        'bold',
        'italic',
        'underline',
        'strike',
        'background',
        'code',
        'link',
        'blockquote',
        'list',
        'align',
      ],
    });

    quillRef.current = quill;
    quill.on('text-change', () => {
      let html = quill.root.innerHTML;
      if (html === '<p><br></p>') html = '';
      setInputMessage(html);
      const conversationId = useChatStore.getState().activeConversation?.id;
      if (conversationId && !isRestoringDraftRef.current) {
        useChatStore.getState().setMessageDraft(conversationId, html);
      }
    });
    quill.on('editor-change', () => {
      const range = quill.getSelection();
      if (range) {
        setActiveFormats(quill.getFormat(range));
      } else {
        setActiveFormats({});
      }
    });

  }, [activeConversation?.id]);

  useEffect(() => {
    const mentionModule = quillRef.current?.getModule?.('mention') as any;
    if (mentionModule?.options) {
      mentionModule.options.source = mentionSource;
    }
  }, [mentionSource, activeConversation?.id, user?.id]);

  useEffect(() => {
    const editor = quillEditorRef.current?.querySelector<HTMLElement>('.ql-editor');
    if (editor) {
      editor.dataset.placeholder = messagePlaceholder;
    }
  }, [messagePlaceholder]);

  useEffect(() => {
    const quill = quillRef.current;
    const conversationId = activeConversation?.id ?? null;
    if (!quill || !conversationId) {
      setInputMessage('');
      lastRestoredDraftConversationRef.current = null;
      return;
    }

    if (lastRestoredDraftConversationRef.current === conversationId) return;

    const draft = messageDrafts[conversationId] ?? '';
    isRestoringDraftRef.current = true;
    quill.setContents([]);
    if (draft) {
      quill.clipboard.dangerouslyPasteHTML(draft);
    }
    quill.setSelection(Math.max(0, quill.getLength() - 1), 0);
    setInputMessage(draft);
    lastRestoredDraftConversationRef.current = conversationId;

    window.setTimeout(() => {
      isRestoringDraftRef.current = false;
    }, 0);
  }, [activeConversation?.id, messageDrafts]);

  const renderInlineFormatting = (text: string) => {
    const nodes: ReactNode[] = [];
    const pattern = /(\[([^\]]+)]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|_([^_]+)_|~~([^~]+)~~|`([^`]+)`|<u>(.*?)<\/u>|<mark>(.*?)<\/mark>)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }

      const key = `${match.index}-${match[0]}`;
      if (match[2] && match[3]) {
        nodes.push(
          <a key={key} href={match[3]} target="_blank" rel="noopener noreferrer" className="underline font-semibold break-all">
            {renderInlineFormatting(match[2])}
          </a>
        );
      } else if (match[4]) {
        nodes.push(<strong key={key}>{renderInlineFormatting(match[4])}</strong>);
      } else if (match[5]) {
        nodes.push(<em key={key}>{renderInlineFormatting(match[5])}</em>);
      } else if (match[6]) {
        nodes.push(<span key={key} className="line-through">{renderInlineFormatting(match[6])}</span>);
      } else if (match[7]) {
        nodes.push(<code key={key} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[0.92em]">{match[7]}</code>);
      } else if (match[8]) {
        nodes.push(<span key={key} className="underline underline-offset-2">{renderInlineFormatting(match[8])}</span>);
      } else if (match[9]) {
        nodes.push(<mark key={key} className="rounded bg-yellow-200/80 px-0.5 text-inherit dark:bg-yellow-400/30">{renderInlineFormatting(match[9])}</mark>);
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes.length > 0 ? nodes : text;
  };

  const renderFormattedMessage = (content: string) => {
    // Check if the content is an HTML string generated by Quill (always wraps in block elements like <p>)
    if (/^\s*<(p|div|ul|ol|h[1-6]|blockquote)/i.test(content)) {
      return (
        <div
          className="m-0 whitespace-pre-wrap break-words ql-editor !p-0 !min-h-0"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content, { ADD_ATTR: ['target'] }) }}
        />
      );
    }

    let text = content;
    let alignClass = 'text-left';
    const alignMatch = text.match(/^\[(left|center|right)]([\s\S]*)\[\/\1]$/);
    if (alignMatch) {
      alignClass = alignMatch[1] === 'center' ? 'text-center' : alignMatch[1] === 'right' ? 'text-right' : 'text-left';
      text = alignMatch[2];
    }

    return (
      <div className={`m-0 whitespace-pre-wrap break-words ${alignClass}`}>
        {text.split('\n').map((line, index) => {
          const key = `${index}-${line}`;
          const quoteMatch = line.match(/^>\s?(.*)$/);
          const bulletMatch = line.match(/^[-*]\s+(.*)$/);
          const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);

          if (line === '') {
            return <br key={key} />;
          }

          if (quoteMatch) {
            return (
              <div key={key} className="my-1 border-l-2 border-current/35 pl-2 opacity-90">
                {renderInlineFormatting(quoteMatch[1])}
              </div>
            );
          }

          if (bulletMatch) {
            return (
              <div key={key} className="flex gap-2">
                <span className="mt-[0.05rem]">•</span>
                <span className="min-w-0">{renderInlineFormatting(bulletMatch[1])}</span>
              </div>
            );
          }

          if (numberedMatch) {
            return (
              <div key={key} className="flex gap-2">
                <span className="tabular-nums opacity-75">{numberedMatch[1]}.</span>
                <span className="min-w-0">{renderInlineFormatting(numberedMatch[2])}</span>
              </div>
            );
          }

          return <div key={key}>{renderInlineFormatting(line)}</div>;
        })}
      </div>
    );
  };

  const detectPastedMediaType = (value: string): 'IMAGE' | 'VIDEO' | null => {
    const trimmed = value.trim();
    if (!/^https?:\/\/\S+$/i.test(trimmed)) return null;

    try {
      const url = new URL(trimmed);
      const cleanPath = decodeURIComponent(url.pathname).toLowerCase();

      if (/\.(png|jpe?g|gif|webp|svg|bmp|heic|heif)$/i.test(cleanPath)) {
        return 'IMAGE';
      }

      if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(cleanPath)) {
        return 'VIDEO';
      }

      if (
        url.hostname.includes('res.cloudinary.com') &&
        cleanPath.includes('/image/upload/')
      ) {
        return 'IMAGE';
      }

      if (
        url.hostname.includes('res.cloudinary.com') &&
        cleanPath.includes('/video/upload/')
      ) {
        return 'VIDEO';
      }
    } catch {
      return null;
    }

    return null;
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLElement>) => {
    if (!canSendInActiveConversation) {
      return;
    }

    const files = Array.from(e.clipboardData.files || []);
    const mediaFiles = files.filter((file) => {
      const type = getFileMessageType(file);
      return type === 'IMAGE' || type === 'VIDEO';
    });

    if (mediaFiles.length > 0) {
      e.preventDefault();
      mediaFiles.forEach((file) => addUploadedFile(file));
      return;
    }

    const pastedText = e.clipboardData.getData('text/plain').trim();
    const mediaType = detectPastedMediaType(pastedText);
    if (mediaType) {
      e.preventDefault();
      addUrlAttachment(pastedText, mediaType);
    }
  };

  const isAiBotMentionMessage = (content: string) => {
    if (!content) return false;
    if (/data-id=["']bot["']/i.test(content)) return true;

    const plainText = stripHtml(content)
      .replace(/\s+/g, ' ')
      .trim();
    return /(^|\s)@(bot|nextalk\s+ai|meta\s+ai)\b/i.test(plainText);
  };

  const addPendingAiReply = (conversationId?: string | null) => {
    if (!conversationId) return;

    setPendingAiReplies((current) => [
      ...current,
      {
        id: `ai-pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conversationId,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSendInActiveConversation) {
      return;
    }

    const currentMessage = getCurrentInputMessage();
    const readyAttachments = pendingAttachments.filter((attachment) => attachment.url && !attachment.isUploading);
    if (readyAttachments.length !== pendingAttachments.length) {
      return;
    }

    if (readyAttachments.length > 0) {
      const attachments: MessageAttachment[] = readyAttachments
        .filter((attachment): attachment is PendingAttachment & { url: string } => Boolean(attachment.url))
        .map((attachment) => ({
          url: attachment.url,
          type: attachment.type,
          name: attachment.name,
          size: attachment.size,
      }));
      const caption = currentMessage.trim();
      const messageType = attachments.length > 1 ? 'ALBUM' : attachments[0]?.type ?? 'ALBUM';
      sendTypingStopped();
      sendStompMessage(caption, messageType, replyTo?.id ?? undefined, attachments, messagePriority || undefined);
      resetUploadState();
      clearQuillInput();
      setMessagePriority(null);
    } else if (currentMessage.trim()) {
      // Send text if typed without attachments
      const trimmedMessage = currentMessage.trim();
      const pastedMediaType = detectPastedMediaType(trimmedMessage);
      sendTypingStopped();
      if (pastedMediaType) {
        sendStompMessage('', pastedMediaType, replyTo?.id ?? undefined, [{
          url: trimmedMessage,
          type: pastedMediaType,
          name: pastedMediaType === 'IMAGE' ? 'Ảnh từ liên kết' : 'Video từ liên kết',
        }]);
      } else {
        sendStompMessage(trimmedMessage, 'TEXT', replyTo?.id ?? undefined, undefined, messagePriority || undefined);
        if (isAiBotMentionMessage(trimmedMessage)) {
          addPendingAiReply(activeConversation?.id);
        }
      }
      clearQuillInput();
      setMessagePriority(null);
    }

    if (replyTo) {
      setReplyTo(null);
    }
    setIsEmojiStickerOpen(false);
  };

  const handleSendThumbsUp = () => {
    if (!canSendInActiveConversation) {
      return;
    }

    sendStompMessage('👍', 'TEXT', replyTo?.id ?? undefined);
    sendTypingStopped();
    if (replyTo) {
      setReplyTo(null);
    }
  };

  const handleSendBlockedChatRequest = async () => {
    const receiverId = getActivePrivateFriendId();
    const message = getCurrentInputMessage().trim();
    if (activePrivateChatBlocked) {
      showAlertDialog(
        activePrivateChatBlockedByMe
          ? 'B?n c?n b? ch?n ng??i n?y tr??c khi nh?n tin.'
          : 'Bạn không thể nhắn tin vì người này đã chặn bạn.',
        'Không thể nhắn tin',
        'danger'
      );
      return;
    }
    if (!receiverId || !message || isSendingBlockedChatRequest) {
      return;
    }

    setIsSendingBlockedChatRequest(true);
    try {
      const created = await createChatRequest({ receiverId, message });
      if (created) {
        clearQuillInput();
        resetUploadState();
        if (replyTo) {
          setReplyTo(null);
        }
      } else {
        showAlertDialog('Không thể gửi tin nhắn chờ', 'Tin nhắn chờ', 'danger');
      }
    } catch (err: any) {
      showAlertDialog(err.response?.data?.message || 'Không thể gửi tin nhắn chờ', 'Tin nhắn chờ', 'danger');
    } finally {
      setIsSendingBlockedChatRequest(false);
    }
  };

  const handleGroupCreated = (group: GroupResponse) => {
    setShowCreateGroupModal(false);
    // Open the group conversation immediately
    const groupConversationId = getGroupConversationId(group);
    if (groupConversationId) {
      selectConversation(groupConversationId);
    }
  };

  const handleOpenGroup = (group: GroupResponse) => {
    const groupConversationId = getGroupConversationId(group);
    if (groupConversationId) {
      selectConversation(groupConversationId);
    }
  };

  const handleGroupAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeGroup || !currentUserIsGroupOwner || isUpdatingGroupAvatar) return;
    if (!file.type.startsWith('image/')) {
      showAlertDialog('Vui lòng chọn một tệp hình ảnh.', 'Thông báo', 'danger');
      event.target.value = '';
      return;
    }

    setIsUpdatingGroupAvatar(true);
    try {
      const uploadResponse = await fileService.uploadFile(file);
      if (uploadResponse.success && uploadResponse.data?.url) {
        const updatedGroup = await updateGroup(activeGroup.id, { avatarUrl: uploadResponse.data.url });
        if (!updatedGroup) {
          throw new Error('Khong the luu anh nhom.');
        }
      } else {
        throw new Error(uploadResponse.message || 'Upload anh that bai.');
      }
    } catch (err: any) {
      showAlertDialog(err.response?.data?.message || err.message || 'Không thể cập nhật ảnh nhóm.', 'Thông báo', 'danger');
    } finally {
      setIsUpdatingGroupAvatar(false);
      event.target.value = '';
    }
  };

  const handleRenameGroup = async () => {
    const newName = editingGroupName.trim();
    if (!activeGroup || !newName || isRenamingGroup) return;
    if (newName === activeGroup.name) {
      setIsEditingGroupName(false);
      return;
    }
    setIsRenamingGroup(true);
    try {
      const updatedGroup = await updateGroup(activeGroup.id, { name: newName });
      if (updatedGroup) {
        setIsEditingGroupName(false);
      } else {
        showAlertDialog('Không thể đổi tên nhóm. Vui lòng thử lại.', 'Thông báo', 'danger');
      }
    } catch (err: any) {
      showAlertDialog(err?.response?.data?.message || err?.message || 'Không thể đổi tên nhóm.', 'Thông báo', 'danger');
    } finally {
      setIsRenamingGroup(false);
    }
  };

  // Helper to extract display info for a PRIVATE conversation
  const getFriendInfo = (conversation: ConversationResponse) => {
    if (conversation.type === 'PRIVATE') {
      return conversation.members.find(m => m.id !== user?.id) || {
        username: 'Unknown User',
        avatarUrl: null,
        email: '',
        bio: null,
        status: 'OFFLINE',
        lastSeen: undefined
      };
    }
    return {
      username: conversation.name || 'Group Chat',
      avatarUrl: null,
      email: '',
      bio: null,
      status: 'ONLINE',
      lastSeen: undefined
    };
  };

  const isExistingFriend = (userId: string) => friends.some((friend) => friend.id === userId);
  const currentChatUser = activeConversation?.type === 'PRIVATE'
    ? activeConversation.members.find((member) => member.id !== user?.id)
    : null;
  const activeFriendIsFriend = currentChatUser ? isExistingFriend(currentChatUser?.id ?? '') : false;
  const activeFriendRequestSent = currentChatUser ? sentFriendRequestIds.includes(currentChatUser?.id ?? '') : false;
  const handleSendFriendRequestFromSearch = async (targetUserId: string) => {
    setFriendRequestActionId(targetUserId);
    const success = await sendFriendRequest(targetUserId);
    if (success) {
      setSentFriendRequestIds((prev) => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
    }
    setFriendRequestActionId(null);
  };

  const handleStartChatFromSearch = async (targetUserId: string) => {
    setFriendRequestActionId(targetUserId);
    const conversation = await useChatStore.getState().getOrCreatePrivateConversation(targetUserId);
    setFriendRequestActionId(null);
    if (conversation) {
      setSearchQuery('');
    }
  };

  const openSearchProfile = (targetUser: AuthUser) => {
    setSearchProfileUser(targetUser);
  };

  const handleSendChatRequestFromProfile = async (message?: string) => {
    if (!searchProfileUser || profileChatActionId) return;

    if (isExistingFriend(searchProfileUser.id)) {
      await handleStartChatFromSearch(searchProfileUser.id);
      setSearchProfileUser(null);
      return;
    }

    const trimmedMessage = message?.trim();
    if (!trimmedMessage) return;

    setProfileChatActionId(searchProfileUser.id);
    try {
      const created = await createChatRequest({
        receiverId: searchProfileUser.id,
        message: trimmedMessage,
      });
      if (created) {
        setSentChatRequestIds((prev) => prev.includes(searchProfileUser.id) ? prev : [...prev, searchProfileUser.id]);
      } else {
        showAlertDialog('Không thể gửi tin nhắn chờ.', 'Tin nhắn chờ', 'danger');
      }
    } catch (err: any) {
      showAlertDialog(err.response?.data?.message || err.message || 'Không thể gửi tin nhắn chờ.', 'Tin nhắn chờ', 'danger');
    } finally {
      setProfileChatActionId(null);
    }
  };

  const handleProfileFriendAction = async () => {
    if (!currentChatUser || profileActionLoading) return;
    if (activeFriendIsFriend) {
      setConfirmDialog({
        title: 'H\u1ee7y k\u1ebft b\u1ea1n',
        description: `B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n h\u1ee7y k\u1ebft b\u1ea1n v\u1edbi ${currentChatUser?.username ?? ''}? Hai b\u1ea1n v\u1eabn c\u00f3 th\u1ec3 xem l\u1ea1i l\u1ecbch s\u1eed tr\u00f2 chuy\u1ec7n.`,
        confirmLabel: 'H\u1ee7y b\u1ea1n b\u00e8',
        variant: 'danger',
        onConfirm: async () => {
          setProfileActionLoading(true);
          try {
            const ok = await removeFriend(currentChatUser?.id ?? '');
            if (ok) {
              await fetchFriends();
            }
          } finally {
            setProfileActionLoading(false);
            setConfirmDialog(null);
          }
        },
      });
      return;
    }
    setProfileActionLoading(true);
    try {
      if (activeFriendIsFriend) {
        if (!window.confirm(`Hủy kết bạn với ${currentChatUser?.username ?? ''}?`)) return;
        const ok = await removeFriend(currentChatUser?.id ?? '');
        if (ok) {
          await fetchFriends();
        }
      } else {
        const ok = await sendFriendRequest(currentChatUser?.id ?? '');
        if (ok) {
          setSentFriendRequestIds((prev) => prev.includes(currentChatUser?.id ?? '') ? prev : [...prev, currentChatUser?.id ?? '']);
        }
      }
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleToggleBlockUser = async () => {
    if (!currentChatUser || blockActionLoading) return;
    setConfirmDialog({
      title: activeConversation?.blockedByMe === true ? 'B\u1ecf ch\u1eb7n ng\u01b0\u1eddi d\u00f9ng' : 'Ch\u1eb7n ng\u01b0\u1eddi d\u00f9ng',
      description: activeConversation?.blockedByMe === true
        ? `B\u1ea1n mu\u1ed1n b\u1ecf ch\u1eb7n ${currentChatUser?.username ?? ''}? Sau khi b\u1ecf ch\u1eb7n, hai b\u1ea1n c\u00f3 th\u1ec3 ti\u1ebfp t\u1ee5c nh\u1eafn tin n\u1ebfu \u0111\u1ee7 \u0111i\u1ec1u ki\u1ec7n.`
        : `Ch\u1eb7n ${currentChatUser?.username ?? ''}? Ng\u01b0\u1eddi n\u00e0y s\u1ebd kh\u00f4ng th\u1ec3 nh\u1eafn tin v\u1edbi b\u1ea1n v\u00e0 b\u1ea1n c\u0169ng kh\u00f4ng th\u1ec3 g\u1eedi tin nh\u1eafn cho h\u1ecd.`,
      confirmLabel: activeConversation?.blockedByMe === true ? 'B\u1ecf ch\u1eb7n' : 'Ch\u1eb7n',
      variant: 'danger',
      onConfirm: async () => {
        const isBlockedByMe = activeConversation?.blockedByMe === true;
        setBlockActionLoading(true);
        try {
          const response = isBlockedByMe
            ? await blockService.unblockUser(currentChatUser?.id ?? '')
            : await blockService.blockUser(currentChatUser?.id ?? '');

          if (response.success) {
            await fetchConversations();
            if (activeConversation?.id) {
              await selectConversation(activeConversation?.id ?? null);
            }
          }
        } catch (err: any) {
          showAlertDialog(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái chặn.', 'Thông báo', 'danger');
        } finally {
          setBlockActionLoading(false);
          setConfirmDialog(null);
        }
      },
    });
    return;
    if (!currentChatUser || !activeConversation) return;
    const isBlockedByMe = activeConversation?.blockedByMe === true;
    const confirmed = window.confirm(
      isBlockedByMe
        ? `Bỏ chặn ${currentChatUser?.username ?? ''}?`
        : `Chặn ${currentChatUser?.username ?? ''}? Người này sẽ không thể nhắn tin với bạn.`
    );
    if (!confirmed) return;

    setBlockActionLoading(true);
    try {
      const response = isBlockedByMe
        ? await blockService.unblockUser(currentChatUser?.id ?? '')
        : await blockService.blockUser(currentChatUser?.id ?? '');

      if (response.success) {
        await fetchConversations();
        if (activeConversation?.id) {
          await selectConversation(activeConversation?.id ?? null);
        }
      }
    } catch (err: any) {
      showAlertDialog(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái chặn.', 'Thông báo', 'danger');
    } finally {
      setBlockActionLoading(false);
    }
  };

  const handleLeaveActiveGroup = async () => {
    if (!activeGroup || !user?.id || profileActionLoading || currentUserIsGroupOwner) return;
    if (!window.confirm(`Thoát khỏi nhóm ${activeGroup.name}?`)) return;

    setProfileActionLoading(true);
    try {
      const ok = await removeGroupMember(activeGroup.id, user.id);
      if (ok) {
        setIsProfileModalOpen(false);
        await fetchGroups();
        await fetchConversations();
        await selectConversation(null);
      }
    } finally {
      setProfileActionLoading(false);
    }
  };

  const groupLeaderRoles: GroupRole[] = ['OWNER', 'LEADER', 'ADMIN'];
  const groupModeratorRoles: GroupRole[] = ['OWNER', 'LEADER', 'ADMIN', 'DEPUTY'];
  const roleLabels: Record<GroupRole, string> = {
    OWNER: 'Trưởng nhóm',
    LEADER: 'Trưởng nhóm',
    DEPUTY: 'Phó nhóm',
    ADMIN: 'Trưởng nhóm',
    MEMBER: 'Thành viên',
  };

  const isGroupLeaderRole = (role?: GroupRole | null) => Boolean(role && groupLeaderRoles.includes(role));
  const isGroupModeratorRole = (role?: GroupRole | null) => Boolean(role && groupModeratorRoles.includes(role));

  const canSetGroupMemberRole = (member: GroupResponse['members'][number], role: GroupRole) => {
    if (!activeGroup || !currentGroupMembership || member.userId === user?.id || member.role === role) {
      return false;
    }
    return isGroupLeaderRole(currentGroupMembership.role)
      && !isGroupLeaderRole(member.role)
      && (role === 'DEPUTY' || role === 'MEMBER');
  };

  const canKickGroupMember = (member: GroupResponse['members'][number]) => {
    if (!activeGroup || !currentGroupMembership || member.userId === user?.id || isGroupLeaderRole(member.role)) {
      return false;
    }
    if (isGroupLeaderRole(currentGroupMembership.role)) {
      return true;
    }
    return currentGroupMembership.role === 'DEPUTY' && member.role === 'MEMBER';
  };

  const handleUpdateGroupMemberRole = async (member: GroupResponse['members'][number], role: GroupRole) => {
    if (!activeGroup || !canSetGroupMemberRole(member, role) || groupMemberActionId) return;
    const groupId = activeGroup.id;
    const actionId = `${member.userId}:${role}`;

    setConfirmDialog({
      title: 'Cập nhật vai trò',
      description: `Bạn có chắc muốn cập nhật ${member.username} thành ${roleLabels[role]}?`,
      confirmLabel: 'Cập nhật',
      variant: 'primary',
      onConfirm: async () => {
        setGroupMemberActionId(actionId);
        try {
          const ok = await updateMemberRole(groupId, member.userId, role);
          if (ok) {
            await fetchGroups();
          }
        } finally {
          setGroupMemberActionId(null);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleKickGroupMember = async (member: GroupResponse['members'][number]) => {
    if (!activeGroup || !canKickGroupMember(member) || groupMemberActionId) return;

    setConfirmDialog({
      title: 'Mời khỏi nhóm',
      description: `Kick ${member.username} khỏi nhóm ${activeGroup.name}?`,
      confirmLabel: 'Đồng ý',
      variant: 'danger',
      onConfirm: async () => {
        setGroupMemberActionId(member.userId);
        try {
          const ok = await removeGroupMember(activeGroup.id, member.userId);
          if (ok) {
            await fetchGroups();
            await fetchConversations();
          }
        } finally {
          setGroupMemberActionId(null);
          setConfirmDialog(null);
        }
      },
    });
  };

  const getConversationTitle = (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return 'Cuộc trò chuyện';
    if (conversation.type === 'GROUP') {
      return groups.find((group) => getGroupConversationId(group) === conversation.id)?.name || conversation.name || 'Nhóm chat';
    }
    return getFriendInfo(conversation).username;
  };

  const stripMessageMarkup = (value: string) => {
    let result = value;
    // Strip HTML tags if any (replace with space to preserve separation between tags like <p>a</p><p>b</p>)
    if (/<[a-z][\s\S]*>/i.test(result)) {
      result = result.replace(/<br\s*\/?>/gi, '\n');
      result = result.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return result
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/<u>(.*?)<\/u>/g, '$1')
      .replace(/<mark>(.*?)<\/mark>/g, '$1')
      .replace(/\[(left|center|right)]([\s\S]*?)\[\/\1]/g, '$2')
      .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '$1');
  };

  const messageHasSharedLink = (message: MessageResponse) => /https?:\/\/\S+/i.test(message.content);
  const isAudioFileName = (value?: string | null) => Boolean(value && /\.(webm|mp3|wav|ogg|oga|m4a|aac)$/i.test(value.split('?')[0]));
  const messageHasSearchableAttachment = (message: MessageResponse) =>
    Boolean(message.attachments?.length) || ['IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'ALBUM'].includes(message.messageType);

  const getSearchMessagePreview = (message: MessageResponse) => {
    if (message.attachments?.length) {
      const first = message.attachments[0];
      if (first.type === 'AUDIO' || isAudioFileName(first.name) || isAudioFileName(first.url)) {
        return 'Tin nhắn thoại';
      }
      const label = first.type === 'IMAGE' ? 'Hình ảnh' : first.type === 'VIDEO' ? 'Video' : (first.name || getFileName(first.url));
      return message.attachments.length > 1 ? `${message.attachments.length} tệp đã chia sẻ` : label;
    }
    if (message.messageType === 'IMAGE') return 'Hình ảnh đã chia sẻ';
    if (message.messageType === 'VIDEO') return 'Video đã chia sẻ';
    if (message.messageType === 'AUDIO') return 'Tin nhắn thoại';
    if (message.messageType === 'FILE') return getFileName(message.content);
    return stripMessageMarkup(message.content);
  };

  // Active conversation: find matching group for header enrichment
  const activeGroup = activeConversation?.type === 'GROUP'
    ? groups.find(g => getGroupConversationId(g) === activeConversation.id || g.channels?.some(ch => ch.conversationId === activeConversation.id)) || null
    : null;
  const activeChannel = activeGroup?.channels?.find(ch => ch.conversationId === activeConversation?.id) || null;
  const canInviteToActiveGroup = Boolean(
    activeGroup?.members.some((member) => member.userId === user?.id)
  );
  const currentGroupMembership = activeGroup?.members.find((member) => member.userId === user?.id) ?? null;
  const currentUserIsGroupOwner = isGroupLeaderRole(currentGroupMembership?.role);
  const canModerateActiveGroup = isGroupModeratorRole(currentGroupMembership?.role);
  const canPinMessageInActiveConversation = activeConversation?.type !== 'GROUP' || canModerateActiveGroup;
  const canPinMessage = (message: MessageResponse) =>
    Boolean(canPinMessageInActiveConversation && !message.isRecalled && message.messageType !== 'SYSTEM');
  const canRecallMessageInActiveConversation = (message: MessageResponse) => {
    if (message.senderId === user?.id) {
      return true;
    }
    if (activeConversation?.type !== 'GROUP' || !currentGroupMembership) {
      return false;
    }
    if (isGroupLeaderRole(currentGroupMembership.role)) {
      return true;
    }
    return currentGroupMembership.role === 'DEPUTY';
  };
  const normalizedGroupMemberSearch = groupMemberSearchQuery.trim().toLowerCase();
  const filteredGroupMembers = (activeGroup?.members ?? []).filter((member) => {
    if (!normalizedGroupMemberSearch) return true;
    return [member.username, member.role.toLowerCase()]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedGroupMemberSearch));
  });

  const formatConversationTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getTime() === 0) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatProfileDate = (dateString?: string | null) => {
    if (!dateString) return 'Không rõ';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Không rõ';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const selfDestructOptions = [
    { value: 0, label: 'Tắt' },
    { value: 300, label: '5 phút' },
    { value: 3600, label: '1 giờ' },
    { value: 86400, label: '24 giờ' },
  ];

  const getSelfDestructLabel = (seconds?: number | null) =>
    selfDestructOptions.find((option) => option.value === (seconds ?? 0))?.label ?? 'Tắt';

  const isMessageExpired = (message: MessageResponse) =>
    Boolean(message.expiresAt && new Date(message.expiresAt).getTime() <= messageExpiryNow);



  const formatDividerDate = (dateString: string) => {
    if (!dateString) return 'Today';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getTime() === 0) return 'Today';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getTime() === 0) {
      return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getMessageStatus = (msg: MessageResponse) => {
    if (!msg.statuses || msg.statuses.length === 0) {
      return 'SENT';
    }
    const otherStatuses = msg.statuses.filter(s => s.userId !== user?.id);
    if (otherStatuses.length === 0) {
      return 'SENT';
    }
    if (otherStatuses.some(s => s.status === 'SEEN')) {
      return 'SEEN';
    }
    if (otherStatuses.some(s => s.status === 'DELIVERED')) {
      return 'DELIVERED';
    }
    return 'SENT';
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'Attachment';
    }
  };

  const conversationArchiveSource = conversationArchiveMessages.length > 0
    ? conversationArchiveMessages
    : messages;
  const activeConversationAttachments = conversationArchiveSource.flatMap((message) =>
    (message.attachments ?? []).map((attachment) => ({ ...attachment, message }))
  );
  const activeConversationMedia = activeConversationAttachments
    .filter((item) => item.type === 'IMAGE' || item.type === 'VIDEO')
    .slice(0, 8);
  const activeConversationFiles = activeConversationAttachments
    .filter((item) => item.type === 'FILE')
    .slice(0, 8);
  const activeConversationLinks = conversationArchiveSource.flatMap((message) => {
    const matches = message.content.match(/https?:\/\/[^\s)]+/gi) ?? [];
    return matches.map((url) => ({ url, message }));
  }).slice(0, 8);

  const conversationInfoOffsetClass = isConversationInfoOpen
    ? 'md:mr-[360px] xl:mr-[25vw]'
    : '';

  const getConversationInfoSubtitle = () => {
    if (!activeConversation) return '';
    if (isGroupConversation) {
      const memberCount = activeGroup?.memberCount ?? activeConversation.members.length;
      return `${memberCount} thành viên`;
    }
    return activeFriendIsFriend ? 'Bạn bè' : 'Chưa là bạn bè';
  };

  const isCallHistoryMessage = (msg: MessageResponse) =>
    msg.messageType === 'SYSTEM' && msg.metadata?.systemType === 'CALL_HISTORY';

  const getCallHistoryMetadata = (msg: MessageResponse): CallHistoryMetadata =>
    (msg.metadata ?? {}) as CallHistoryMetadata;

  const formatCallDuration = (seconds?: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds ?? 0));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    if (minutes <= 0) return `${remainingSeconds} giây`;
    return `${minutes} phút ${remainingSeconds.toString().padStart(2, '0')} giây`;
  };

  const formatCallLogTime = (value?: string) => {
    if (!value) return 'Không rõ';
    return new Date(value).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCallHistorySummary = (msg: MessageResponse) => {
    const metadata = getCallHistoryMetadata(msg);
    const isGroupCallLog = metadata?.callScope === 'GROUP';
    const callKind = metadata?.callType === 'VIDEO' ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
    const scopeText = isGroupCallLog ? ' nhóm' : '';
    if (metadata?.status === 'MISSED') return `${callKind}${scopeText} bị lỡ`;
    if (metadata?.status === 'REJECTED') return `${callKind}${scopeText} bị từ chối`;
    if (metadata?.status === 'CANCELED') return `${callKind}${scopeText} đã huỷ`;
    return `${callKind}${scopeText} - ${formatCallDuration(metadata?.durationSeconds)}`;
  };

  const getCallHistoryDetailStatus = (metadata?: CallHistoryMetadata) => {
    if (metadata?.status === 'MISSED') return 'Không ai bắt máy';
    if (metadata?.status === 'REJECTED') return 'Người nhận đã từ chối';
    if (metadata?.status === 'CANCELED') return 'Người gọi đã huỷ';
    return formatCallDuration(metadata?.durationSeconds);
  };

  const getPollMetadata = (msg: MessageResponse): PollMetadata => (msg.metadata ?? {}) as PollMetadata;


  const handleToggleRequiresApproval = async () => {
    if (!activeGroup || isTogglingApproval) return;
    setIsTogglingApproval(true);
    try {
      const updatedGroup = await updateGroup(activeGroup.id, { requiresApproval: !activeGroup.requiresApproval });
      if (!updatedGroup) {
        showAlertDialog('Không thể thay đổi cài đặt nhóm. Vui lòng thử lại.', 'Thông báo', 'danger');
      } else {
        await fetchGroups();
      }
    } catch (err: any) {
      showAlertDialog(err.message || 'Lỗi khi cập nhật nhóm', 'Thông báo', 'danger');
    } finally {
      setIsTogglingApproval(false);
    }
  };

  const handleRefreshInviteCode = async () => {
    if (!activeGroup || isRefreshingInviteCode) return;
    setIsRefreshingInviteCode(true);
    try {
      const response = await groupService.refreshInviteCode(activeGroup.id);
      if (response.success && response.data) {
        await fetchGroups();
      } else {
        showAlertDialog('Không thể làm mới liên kết. Vui lòng thử lại.', 'Thông báo', 'danger');
      }
    } catch (err: any) {
      showAlertDialog(err.message || 'Lỗi khi làm mới liên kết', 'Thông báo', 'danger');
    } finally {
      setIsRefreshingInviteCode(false);
    }
  };

  const submitCreatePoll = async (data: CreatePollData) => {
    if (!activeConversation || activeConversation.type !== 'GROUP') return;
    const options = data.options.map((option) => option.trim()).filter(Boolean);
    if (!data.question.trim() || options.length < 2) {
      showAlertDialog('Vui lòng nhập câu hỏi và ít nhất 2 lựa chọn.', 'Thông báo', 'danger');
      return;
    }

    setPollActionMessageId('creating');
    try {
      const response = await messageService.createPoll({
        conversationId: activeConversation.id,
        question: data.question.trim(),
        options,
        allowMultiple: data.allowMultiple,
        allowAddOptions: data.allowAddOptions,
        anonymous: data.anonymous,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null
      });
      if (response.success && response.data) {
        updateMessageInChat(response.data);
        setIsCreatePollOpen(false);
      }
    } catch (err: any) {
      showAlertDialog(err.response?.data?.message || err.message || 'Không thể tạo bình chọn.', 'Thông báo', 'danger');
    } finally {
      setPollActionMessageId(null);
    }
  };

  const formatLastMessage = (msg: MessageResponse, isGroup: boolean) => {
    const isMe = msg.senderId === user?.id;
    let prefix = '';
    if (isMe) {
      prefix = 'Bạn: ';
    } else if (isGroup) {
      prefix = `${msg.senderUsername || 'Người dùng'}: `;
    }

    if (msg.messageType === 'SYSTEM') {
      if (isCallHistoryMessage(msg)) {
        return getCallHistorySummary(msg);
      }
      return `${msg.senderId === user?.id ? 'Bạn' : msg.senderUsername} ${msg.content}`;
    }

    if (msg.messageType === 'POLL') {
      const metadata = getPollMetadata(msg);
      return `${prefix}[Bình chọn] ${metadata.question || msg.content}`;
    }

    if (msg.attachments && msg.attachments.length > 0) {
      const caption = msg.content ? ` ${msg.content}` : '';
      if (msg.attachments.length > 1) {
        return `${prefix}[${msg.attachments.length} ảnh/tệp]${caption}`;
      }
      const attachment = msg.attachments[0];
      if (attachment.type === 'IMAGE') return `${prefix}[Hình ảnh]${caption}`;
      if (attachment.type === 'VIDEO') return `${prefix}[Video]${caption}`;
      return `${prefix}[Tệp tin]${caption}`;
    }

    switch (msg.messageType) {
      case 'IMAGE':
        return `${prefix}[Hình ảnh]`;
      case 'VIDEO':
        return `${prefix}[Video]`;
      case 'FILE':
        return `${prefix}[Tệp tin]`;
      case 'STICKER':
        return `${prefix}[Nhãn dán]`;
      case 'TEXT':
      default:
        return `${prefix}${stripHtml(msg.content)}`;
    }
  };



  // Build unified conversation list (private + group), sorted by updatedAt desc
  const groupConversationIds = new Set(
    groups
      .flatMap((group) => [
        getGroupConversationId(group),
        ...(group.channels ?? []).map((channel) => channel.conversationId),
      ])
      .filter((conversationId): conversationId is string => Boolean(conversationId))
  );

  const privateConversations = conversations.filter(c =>
    c.type === 'PRIVATE' && !groupConversationIds.has(c.id)
  );

  // Deduplicate private conversations by the other member's ID
  const uniquePrivateConversations: typeof privateConversations = [];
  const seenFriendIds = new Set<string>();
  for (const c of privateConversations) {
    const friend = c.members.find(m => m.id !== user?.id);
    if (friend) {
      if (!seenFriendIds.has(friend.id)) {
        seenFriendIds.add(friend.id);
        uniquePrivateConversations.push(c);
      }
    } else {
      uniquePrivateConversations.push(c);
    }
  }

  // Create unified list items combining private conversations and groups
  type UnifiedItem =
    | { kind: 'dm'; conv: typeof conversations[number] }
    | { kind: 'group'; group: typeof groups[number] };

  const visibleGroups = groups.filter((group) => {
    const groupConversationId = getGroupConversationId(group);
    return !groupConversationId || conversations.some((conversation) => conversation.id === groupConversationId);
  });

  const unifiedItems: UnifiedItem[] = [
    ...uniquePrivateConversations.map(c => ({ kind: 'dm' as const, conv: c })),
    ...visibleGroups.map(g => ({ kind: 'group' as const, group: g })),
  ];

  const getUnifiedConversation = (item: UnifiedItem) =>
    item.kind === 'dm'
      ? item.conv
      : getGroupConversationId(item.group)
        ? conversations.find((conversation) => conversation.id === getGroupConversationId(item.group)) ?? null
        : null;

  const isUnifiedPinned = (item: UnifiedItem) => getUnifiedConversation(item)?.pinned === true;

  const getUnifiedTime = (item: UnifiedItem): number => {
    if (item.kind === 'dm') {
      const lm = lastMessages[item.conv.id];
      return lm ? new Date(lm.createdAt).getTime() : new Date(item.conv.updatedAt).getTime();
    }
    const groupConversationId = getGroupConversationId(item.group);
    const lm = groupConversationId ? lastMessages[groupConversationId] : undefined;
    return lm ? new Date(lm.createdAt).getTime() : 0;
  };

  const filteredUnified = unifiedItems
    .filter(item => {
      const query = normalizeSearchTerm(searchQuery);
      if (item.kind === 'dm') {
        const friend = getFriendInfo(item.conv);
        return friend.username.toLowerCase().includes(query) || friend.email?.toLowerCase().includes(query);
      }
      return item.group.name.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      const pinnedDiff = Number(isUnifiedPinned(b)) - Number(isUnifiedPinned(a));
      return pinnedDiff || getUnifiedTime(b) - getUnifiedTime(a);
    });

  const isSearchActive = searchQuery.trim().length > 0;
  const textMessageResults = globalMessageResults
    .filter((message) => !messageHasSearchableAttachment(message) && !messageHasSharedLink(message))
    .slice(0, 8);
  const sharedDataResults = globalMessageResults
    .filter((message) => messageHasSearchableAttachment(message) || messageHasSharedLink(message))
  const formatReminderNoticeTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const activeReminderSystemMessages = activeConversation
    ? messageReminders
      .filter((reminder) => reminder.conversationId === activeConversation.id)
      .flatMap((reminder) => {
        const createNotice = {
          id: `reminder-created-${reminder.id}`,
          conversationId: reminder.conversationId,
          senderId: user?.id ?? 'system',
          senderUsername: user?.username ?? 'Bạn',
          content: `Bạn tạo nhắc hẹn mới ${formatReminderNoticeTime(reminder.remindAt)}${reminder.note ? ` ${reminder.note}` : ''}`,
          messageType: 'SYSTEM' as const,
          createdAt: reminder.createdAt,
          metadata: {
            systemType: 'MESSAGE_REMINDER',
            reminderStatus: 'CREATED',
            reminderId: reminder.id,
            messageId: reminder.messageId,
            remindAt: reminder.remindAt,
            note: reminder.note,
            preview: reminder.messagePreview,
            isDeleted: Boolean(reminder.deletedAt),
          },
        };

        if (!reminder.deletedAt) {
          return [createNotice];
        }

        return [
          createNotice,
          {
            id: `reminder-deleted-${reminder.id}`,
            conversationId: reminder.conversationId,
            senderId: user?.id ?? 'system',
            senderUsername: user?.username ?? 'Bạn',
            content: `Bạn xóa nhắc hẹn ${formatReminderNoticeTime(reminder.remindAt)}`,
            messageType: 'SYSTEM' as const,
            createdAt: reminder.deletedAt,
            metadata: {
              systemType: 'MESSAGE_REMINDER',
              reminderStatus: 'DELETED',
              reminderId: reminder.id,
              messageId: reminder.messageId,
              remindAt: reminder.remindAt,
              note: reminder.note,
              preview: reminder.messagePreview,
            },
          },
        ];
      })
    : [];

  const activeAiPendingSystemMessages = activeConversation
    ? pendingAiReplies
      .filter((pending) => pending.conversationId === activeConversation.id)
      .map((pending) => ({
        id: pending.id,
        conversationId: pending.conversationId,
        senderId: 'system',
        senderUsername: 'NexTalk AI',
        content: 'NexTalk AI đang trả lời...',
        messageType: 'SYSTEM' as const,
        createdAt: pending.createdAt,
        metadata: {
          systemType: 'AI_BOT_PENDING',
          botName: 'NexTalk AI',
        },
      }))
    : [];

  const visibleMessages = [
    ...messages.filter((message) => !isMessageExpired(message)),
    ...activeReminderSystemMessages,
    ...activeAiPendingSystemMessages,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getSenderAvatar = (msg: MessageResponse): string | null => {
    if (!activeConversation) return null;
    const member = activeConversation.members.find(m => m.id === msg.senderId);
    return member?.avatarUrl ?? null;
  };

  const getSenderUsername = (msg: any) => {
    if (!activeConversation) return 'Unknown';
    const member = activeConversation.members.find(m => m.id === msg.senderId);
    return (member as any)?.nickname || member?.username || msg.senderUsername || 'Unknown';
  };
  const isGroupConversation = activeConversation?.type === 'GROUP';
  const activeFriend = activeConversation && !isGroupConversation ? getFriendInfo(activeConversation) : null;
  const activeCallTarget = isGroupConversation ? {
    ...activeGroup,
    isGroupCall: true,
    username: activeGroup?.name,
    memberCount: activeGroup?.members?.length || 0,
  } : activeFriend;
  const activeConversationSummary = activeConversation ? conversationSummaries[activeConversation.id] : null;
  const activeTypingUsers = activeConversation ? typingUsersByConversation[activeConversation.id] ?? [] : [];
  const activeUnreadMarker = activeConversation ? unreadMarkersByConversation[activeConversation.id] ?? null : null;

  return (
    <div 
      className="nextalk-chat-shell h-dvh w-screen bg-gray-100 dark:bg-discord-black flex overflow-hidden text-gray-900 dark:text-discord-text transition-colors duration-300"
      style={activeConversation?.themeColor ? { '--theme-color': activeConversation.themeColor } as React.CSSProperties : {}}
    >

      {/* Column 1: Sidebar Navigation */}
      <SidebarNavigation
        pendingCount={pending.length + pendingInvitations.length}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Column 2: Conversations Sidebar — Zalo style */}
      <section className={`${(activeConversation || selectedChatRequest) ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white dark:bg-discord-mid flex-col border-r border-gray-200 dark:border-zinc-800/60 shrink-0 pb-16 md:pb-0`}>

        {/* Header */}
        <SidebarHeader
          isConnecting={isConnecting}
          isConnected={isConnected}
          connectWebSocket={connectWebSocket}
          setShowCreateGroupModal={setShowCreateGroupModal}
        />

        {/* Search bar */}
        <SidebarSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <SidebarTabs
          conversationTab={conversationTab}
          setConversationTab={setConversationTab}
          fetchIncomingChatRequests={fetchIncomingChatRequests}
          incomingRequestsCount={incomingChatRequests.length}
        />
        <ConversationList
          conversationTab={conversationTab}
          isLoadingChatRequests={isLoadingChatRequests}
          incomingChatRequests={incomingChatRequests}
          selectedChatRequest={selectedChatRequest}
          setSelectedChatRequest={setSelectedChatRequest}
          formatConversationTime={formatConversationTime}
          isSearchActive={isSearchActive}
          isGlobalSearching={isGlobalSearching}
          globalSearchError={globalSearchError}
          globalUserResults={globalUserResults}
          isExistingFriend={isExistingFriend}
          sentFriendRequestIds={sentFriendRequestIds}
          openSearchProfile={openSearchProfile}
          sentChatRequestIds={sentChatRequestIds}
          textMessageResults={textMessageResults}
          sharedDataResults={sharedDataResults}
          activeConversation={activeConversation}
          selectConversation={selectConversation}
          user={user}
          notifications={notifications}
          setChannelSettingsData={setChannelSettingsData}
          setCreateChannelGroupId={setCreateChannelGroupId}
          handleDeleteConversation={handleDeleteConversation}
          conversationActionId={conversationActionId}
          handleStartChatFromSearch={handleStartChatFromSearch}
          handleSendFriendRequestFromSearch={handleSendFriendRequestFromSearch}
          friendRequestActionId={friendRequestActionId}
          globalConversationResults={globalConversationResults}
          handleOpenSearchMessage={handleOpenSearchMessage}
          getConversationTitle={getConversationTitle}
          getSearchMessagePreview={getSearchMessagePreview}
          messageHasSharedLink={messageHasSharedLink}
          filteredUnified={filteredUnified}
          getFriendInfo={getFriendInfo}
          lastMessages={lastMessages}
          setOpenConversationMenuId={setOpenConversationMenuId}
          openConversationMenuId={openConversationMenuId}
          handleToggleConversationPin={handleToggleConversationPin}
          handleHideClick={handleHideClick}
          getGroupConversationId={getGroupConversationId}
          expandedGroups={expandedGroups}
          handleOpenGroup={handleOpenGroup}
          toggleGroupExpand={toggleGroupExpand}
          formatLastMessage={formatLastMessage}
          conversations={conversations}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          messageDrafts={messageDrafts}
          stripMessageMarkup={stripMessageMarkup}
        />

        {/* Voice Connected Panel */}
        <VoiceConnectedPanel />

        {/* User Card */}
        <SidebarFooter user={user} onOpenQrScanner={() => setIsQrScannerOpen(true)} />
      </section>

      {/* Column 3: Chat Window */}
      <main 
        className={`${(activeConversation || selectedChatRequest) ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-100 dark:bg-discord-dark overflow-hidden relative`}
      >
        {activeConversation && (activeFriend || isGroupConversation) ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              selectConversation={selectConversation}
              setIsProfileModalOpen={setIsProfileModalOpen}
              isGroupConversation={isGroupConversation}
              activeGroup={activeGroup}
              activeFriend={activeFriend}
              activeConversation={activeConversation}
              activeCallTarget={activeCallTarget}
              initiateCall={initiateCall}
              handleSummarizeConversation={handleSummarizeConversation}
              isSummarizingConversation={isSummarizingConversation}
              isSearchPanelOpen={isSearchPanelOpen}
              setIsSearchPanelOpen={setIsSearchPanelOpen}
              isPinnedPanelOpen={isPinnedPanelOpen}
              setIsPinnedPanelOpen={setIsPinnedPanelOpen}
              isConversationInfoOpen={isConversationInfoOpen}
              setIsConversationInfoOpen={setIsConversationInfoOpen}
              fetchPinnedMessages={fetchPinnedMessages}
              canInviteToActiveGroup={canInviteToActiveGroup}
              setIsInviteMembersOpen={setIsInviteMembersOpen}
              activeChannel={activeChannel}
              isGroupModerator={canModerateActiveGroup}
            />

            {activeChannel?.type === 'VOICE' ? (
              <div className="flex flex-col items-center justify-center flex-1 h-full bg-gray-100 dark:bg-discord-dark">
                {activeVoiceChannelId === activeChannel.id ? (
                  <VoiceChannelGrid />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 space-y-6 max-w-md px-4 text-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Mic className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-gray-100 dark:ring-discord-dark text-[10px] font-black text-white">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {activeChannel.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-500 dark:text-zinc-400 mb-6">
                        Kết nối âm thanh để trò chuyện với mọi người trong kênh này.
                      </p>
                      <button
                        onClick={() => joinVoiceChannel(activeChannel.id, activeChannel.name, activeConversation.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow transition"
                      >
                        <Headphones className="w-4 h-4" />
                        <span>Tham gia Kênh Thoại</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div
                  className="min-h-0 flex-1 overflow-hidden bg-cover bg-center flex flex-col"
                  style={activeConversation?.wallpaperUrl ? { backgroundImage: `url(${activeConversation.wallpaperUrl})` } : {}}
                >
                  <MessageList
                    pinnedMessages={pinnedMessages}
                    handleJumpToMessage={handleJumpToMessage}
                    canPinMessage={canPinMessage}
                    togglePinMessage={togglePinMessage}
                    activeConversationSummary={activeConversationSummary}
                    typingUsers={activeTypingUsers}
                    unreadMarker={activeUnreadMarker}
                    onDismissUnreadMarker={() => {
                      if (activeConversation?.id) {
                        clearUnreadMarker(activeConversation.id);
                      }
                    }}
                    onJumpToUnreadMarker={scrollToUnreadMarker}
                    conversationInfoOffsetClass={conversationInfoOffsetClass}
                    messagesContainerRef={messagesContainerRef}
                    handleMessagesScroll={handleMessagesScroll}
                    messagesEndRef={messagesEndRef}
                    visibleMessages={visibleMessages}
                    user={user}
                    isGroupConversation={isGroupConversation}
                    activeFriend={activeFriend}
                    getSenderAvatar={getSenderAvatar}
                    getSenderUsername={getSenderUsername}
                    hoveredMessageId={hoveredMessageId}
                    setHoveredMessageId={setHoveredMessageId}
                    activeMenuMessageId={activeMenuMessageId}
                    setActiveMenuMessageId={setActiveMenuMessageId}
                    reactToMessage={reactToMessage}
                    setReplyTo={setReplyTo}
                    setEditingMessageId={setEditingMessageId}
                    setEditInputText={setEditInputText}
                    recallMessage={recallMessage}
                    deleteMessage={deleteMessage}
                    setSharingMessage={setSharingMessage}
                    setReminderTargetMessage={setReminderTargetMessage}
                    onDeleteMessageReminder={handleDeleteMessageReminder}
                    onRecreateMessageReminder={handleRecreateMessageReminder}
                    canRecallMessageInActiveConversation={canRecallMessageInActiveConversation}
                    getFileName={getFileName}
                    setActiveMedia={setActiveMedia}
                    renderFormattedMessage={renderFormattedMessage}
                    stripMessageMarkup={stripMessageMarkup}
                    formatMessageTime={formatMessageTime}
                    getMessageStatus={getMessageStatus}
                    formatDividerDate={formatDividerDate}
                    isCallHistoryMessage={isCallHistoryMessage}
                    getCallHistorySummary={getCallHistorySummary}
                    getCallHistoryDetailStatus={getCallHistoryDetailStatus}
                    formatCallLogTime={formatCallLogTime}
                    expandedCallLogId={expandedCallLogId}
                    setExpandedCallLogId={setExpandedCallLogId}
                    activeCallTarget={activeCallTarget}
                    initiateCall={initiateCall}
                    activeConversation={activeConversation}
                    getPollMetadata={getPollMetadata}
                    handlePollVote={handlePollVote}
                    pollActionMessageId={pollActionMessageId}
                    setPollVoterDialog={setPollVoterDialog}
                    pollNewOptionText={pollNewOptionText}
                    setPollNewOptionText={setPollNewOptionText}
                    handleAddPollOption={handleAddPollOption}
                    handleLockPoll={handleLockPoll}
                    handleDeletePoll={handleDeletePoll}
                    hasMoreMessages={hasMoreMessages}
                    sentinelRef={sentinelRef}
                    showScrollToLatest={showScrollToLatest}
                    scrollToBottom={scrollToBottom}
                    isGroupModeratorRole={isGroupModeratorRole}
                    currentGroupMembership={currentGroupMembership}
                    editingMessageId={editingMessageId}
                    editInputText={editInputText}
                    handleSaveEdit={handleSaveEdit}
                  />
                </div>

                {selectedChatRequest && (
                  <div className={`px-4 pt-3 bg-gray-100 dark:bg-discord-dark shrink-0 transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-discord-mid">
                      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                        <div className="flex items-start gap-2">
                          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Tin nhắn từ người chưa kết bạn. Chỉ trả lời khi bạn nhận ra người gửi.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {selectedChatRequest.sender.avatarUrl ? (
                          <img
                            src={selectedChatRequest.sender.avatarUrl}
                            alt={selectedChatRequest.sender.username}
                            className="h-12 w-12 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                            {selectedChatRequest.sender.username.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="m-0 truncate text-sm font-bold text-gray-950 dark:text-white">
                                {selectedChatRequest.sender.username}
                              </h3>
                              <p className="m-0 mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">
                                {selectedChatRequest.sender.email}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">
                              {formatConversationTime(selectedChatRequest.createdAt)}
                            </span>
                          </div>

                          <div className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 dark:bg-zinc-900/60 dark:text-zinc-100">
                            {stripHtml(selectedChatRequest.message)}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendFriendRequestFromSearch(selectedChatRequest.sender.id)}
                              disabled={friendRequestActionId === selectedChatRequest.sender.id || sentFriendRequestIds.includes(selectedChatRequest.sender.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {friendRequestActionId === selectedChatRequest.sender.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                              {sentFriendRequestIds.includes(selectedChatRequest.sender.id) ? 'Đã gửi' : 'Kết bạn'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptChatRequest(selectedChatRequest.id)}
                              disabled={chatRequestActionId === selectedChatRequest.id}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {chatRequestActionId === selectedChatRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                              Nhắn tin
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReportChatRequest(selectedChatRequest)}
                              disabled={chatRequestActionId === selectedChatRequest.id}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                            >
                              <Shield className="h-4 w-4" />
                              Báo xấu
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlockChatRequest(selectedChatRequest)}
                              disabled={chatRequestActionId === selectedChatRequest.id}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                              <Lock className="h-4 w-4" />
                              Chặn
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <MessageInput
                  handleSendMessage={handleSendMessage}
                  conversationInfoOffsetClass={conversationInfoOffsetClass}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  activePrivateChatBlocked={activePrivateChatBlocked}
                  activePrivateChatBlockedByMe={activePrivateChatBlockedByMe}
                  canSendInActiveConversation={canSendInActiveConversation}
                  pendingAttachments={pendingAttachments}
                  resetUploadState={resetUploadState}
                  removePendingAttachment={removePendingAttachment}
                  isTakingScreenshot={isTakingScreenshot}
                  handleTakeScreenshot={handleTakeScreenshot}
                  setIsFormattingOpen={setIsFormattingOpen}
                  isFormattingOpen={isFormattingOpen}
                  applyInlineFormat={applyInlineFormat}
                  activeFormats={activeFormats}
                  applyLineFormat={applyLineFormat}
                  applyNumberedList={applyNumberedList}
                  applyAlignment={applyAlignment as any}
                  clearFormatting={clearFormatting}
                  isEmojiStickerOpen={isEmojiStickerOpen}
                  emojiStickerTab={emojiStickerTab}
                  setEmojiStickerTab={setEmojiStickerTab}
                  setIsEmojiStickerOpen={setIsEmojiStickerOpen}
                  handleSelectEmoji={handleSelectEmoji}
                  handleSendSticker={handleSendSticker}
                  fileInputRef={fileInputRef}
                  handleFileChange={handleFileChange}
                  groupAvatarInputRef={groupAvatarInputRef as any}
                  handleGroupAvatarSelected={handleGroupAvatarSelected}
                  handleInputPaste={handleInputPaste}
                  handleSendBlockedChatRequest={handleSendBlockedChatRequest}
                  quillEditorRef={quillEditorRef}
                  handleSendThumbsUp={handleSendThumbsUp}
                  inputMessage={inputMessage}
                  isSendingBlockedChatRequest={isSendingBlockedChatRequest}
                  isGroupConversation={isGroupConversation}
                  canCreatePoll={isGroupModeratorRole(currentGroupMembership?.role)}
                  setIsCreatePollOpen={setIsCreatePollOpen}
                  messagePriority={messagePriority}
                  setMessagePriority={setMessagePriority}
                  isSpeechListening={isSpeechListening}
                  speechInputError={speechInputError}
                  handleToggleSpeechInput={handleToggleSpeechInput}
                  isRecordingVoice={isRecordingVoice}
                  isUploadingVoice={isUploadingVoice}
                  voiceRecordingSeconds={voiceRecordingSeconds}
                  startVoiceRecording={startVoiceRecording}
                  stopVoiceRecording={stopVoiceRecording}
                  cancelVoiceRecording={cancelVoiceRecording}
                />
              </>
            )}

            <ConversationInfoPanel
              isConversationInfoOpen={isConversationInfoOpen}
              setIsConversationInfoOpen={setIsConversationInfoOpen}
              isGroupConversation={isGroupConversation}
              activeGroup={activeGroup}
              activeFriend={activeFriend}
              activeConversation={activeConversation}
              setIsProfileModalOpen={setIsProfileModalOpen}
              getConversationInfoSubtitle={getConversationInfoSubtitle}
              isPinnedPanelOpen={isPinnedPanelOpen}
              setIsPinnedPanelOpen={setIsPinnedPanelOpen}
              fetchPinnedMessages={fetchPinnedMessages}
              canInviteToActiveGroup={canInviteToActiveGroup}
              setIsInviteMembersOpen={setIsInviteMembersOpen}
              setIsGroupApprovalsModalOpen={setIsGroupApprovalsModalOpen}
              isLoadingConversationArchive={isLoadingConversationArchive}
              activeConversationMedia={activeConversationMedia}
              handleJumpToMessage={handleJumpToMessage}
              getFileName={getFileName}
              activeConversationFiles={activeConversationFiles}
              activeConversationLinks={activeConversationLinks}
              handleUpdateSelfDestruct={handleUpdateSelfDestruct}
              isUpdatingSelfDestruct={isUpdatingSelfDestruct}
              getSelfDestructLabel={getSelfDestructLabel}
              selfDestructOptions={selfDestructOptions}
              conversationActionId={conversationActionId}
              setConversationActionId={setConversationActionId}
              toggleHideConversation={toggleHideConversation}
              fetchConversations={fetchConversations}
              handleHideClick={handleHideClick}
              handleToggleConversationPin={handleToggleConversationPin}
              handleDeleteConversation={handleDeleteConversation}
              handleLeaveActiveGroup={handleLeaveActiveGroup}
              profileActionLoading={profileActionLoading}
              currentUserIsGroupOwner={currentUserIsGroupOwner}
              handleToggleBlockUser={handleToggleBlockUser}
              blockActionLoading={blockActionLoading}
              activePrivateChatBlockedByMe={activePrivateChatBlockedByMe}
              isRefreshingInviteCode={isRefreshingInviteCode}
              handleRefreshInviteCode={handleRefreshInviteCode}
              setIsThemeModalOpen={setIsThemeModalOpen}
            />
          </>
        ) : selectedChatRequest ? (
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4 dark:bg-discord-dark">
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center">
              {/* Mobile Back Button */}
              <div className="md:hidden mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedChatRequest(null)}
                  className="p-2 rounded-xl bg-gray-200/65 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition active:scale-95 inline-flex items-center gap-2"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                  <span className="text-xs font-bold">Quay lại</span>
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-zinc-800 dark:bg-discord-mid">
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Tin nhắn từ người chưa kết bạn. Chỉ trả lời khi bạn nhận ra người gửi.</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  {selectedChatRequest.sender.avatarUrl ? (
                    <img
                      src={selectedChatRequest.sender.avatarUrl}
                      alt={selectedChatRequest.sender.username}
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                      {selectedChatRequest.sender.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="m-0 truncate text-base font-bold text-gray-950 dark:text-white">
                          {selectedChatRequest.sender.username}
                        </h3>
                        <p className="m-0 mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">
                          {selectedChatRequest.sender.email}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">
                        {formatConversationTime(selectedChatRequest.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 dark:bg-zinc-900/60 dark:text-zinc-100">
                      {stripHtml(selectedChatRequest.message)}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendFriendRequestFromSearch(selectedChatRequest.sender.id)}
                        disabled={friendRequestActionId === selectedChatRequest.sender.id || sentFriendRequestIds.includes(selectedChatRequest.sender.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {friendRequestActionId === selectedChatRequest.sender.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        {sentFriendRequestIds.includes(selectedChatRequest.sender.id) ? 'Đã gửi' : 'Kết bạn'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptChatRequest(selectedChatRequest.id)}
                        disabled={chatRequestActionId === selectedChatRequest.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {chatRequestActionId === selectedChatRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                        Nhắn tin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReportChatRequest(selectedChatRequest)}
                        disabled={chatRequestActionId === selectedChatRequest.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                      >
                        <Shield className="h-4 w-4" />
                        Báo xấu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBlockChatRequest(selectedChatRequest)}
                        disabled={chatRequestActionId === selectedChatRequest.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <Lock className="h-4 w-4" />
                        Chặn
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Welcome / empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-animate-light dark:bg-gradient-animate">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-discord-blurple/10 flex items-center justify-center text-indigo-650 dark:text-discord-blurple mb-4 border border-indigo-600/20 dark:border-discord-blurple/20 animate-bounce">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-950 dark:text-white m-0">Chưa chọn đoạn hội thoại</h3>
            <p className="text-sm text-gray-500 dark:text-discord-muted max-w-sm mt-2 leading-relaxed">
              Chọn một đoạn hội thoại từ thanh bên, tham gia nhóm, hoặc vào mục Bạn bè để tạo cuộc trò chuyện mới!
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate('/friends')}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-750 dark:bg-discord-blurple dark:hover:bg-indigo-650 transition-all duration-200 shadow-md active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Bạn bè</span>
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-2xl text-xs font-bold text-indigo-700 dark:text-discord-blurple bg-indigo-50 dark:bg-discord-blurple/10 hover:bg-indigo-100 dark:hover:bg-discord-blurple/20 border border-indigo-200 dark:border-discord-blurple/30 transition-all duration-200 shadow active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo nhóm mới</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Pinned Messages Panel */}
      <PinnedMessagesPanel
        isOpen={isPinnedPanelOpen}
        onClose={() => setIsPinnedPanelOpen(false)}
        pinnedMessages={pinnedMessages}
        onUnpin={(msgId) => togglePinMessage(msgId, true)}
        onJumpToMessage={handleJumpToMessage}
        canUnpin={Boolean(canPinMessageInActiveConversation)}
      />

      {/* Search Messages Panel */}
      <SearchPanel
        isOpen={isSearchPanelOpen}
        onClose={() => setIsSearchPanelOpen(false)}
        activeConversationId={activeConversation?.id ?? null}
        onJumpToMessage={handleJumpToMessageFromSearch}
      />

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}

      {sharingMessage && (
        <ShareMessageModal
          message={sharingMessage}
          conversations={conversations}
          groups={groups}
          currentUserId={user?.id}
          isSharing={isSharingMessage}
          onClose={() => setSharingMessage(null)}
          onShare={handleShareMessage}
        />
      )}

      <MessageReminderModal
        message={reminderTargetMessage}
        isOpen={Boolean(reminderTargetMessage)}
        onClose={() => setReminderTargetMessage(null)}
        onSave={handleSaveMessageReminder}
      />

      {isInviteMembersOpen && activeGroup && (
        <InviteGroupMembersModal
          group={activeGroup}
          onClose={() => setIsInviteMembersOpen(false)}
          onInvited={() => fetchGroups()}
        />
      )}

      {channelSettingsData && (
        <ChannelSettingsModal
          groupId={channelSettingsData.groupId}
          channel={channelSettingsData.channel}
          onClose={() => setChannelSettingsData(null)}
        />
      )}

      {createChannelGroupId && (
        <CreateChannelModal
          groupId={createChannelGroupId}
          onClose={() => setCreateChannelGroupId(null)}
        />
      )}

      {isProfileModalOpen && activeConversation && (activeFriend || isGroupConversation) && (
        <ProfileModal
          setIsProfileModalOpen={setIsProfileModalOpen}
          activeConversation={activeConversation}
          activeFriend={activeFriend}
          isUpdatingGroupAvatar={isUpdatingGroupAvatar}
          isGroupConversation={isGroupConversation}
          currentUserIsGroupOwner={currentUserIsGroupOwner}
          groupAvatarInputRef={groupAvatarInputRef as any}
          activeGroup={activeGroup}
          isEditingGroupName={isEditingGroupName}
          editingGroupName={editingGroupName}
          setEditingGroupName={setEditingGroupName}
          setIsEditingGroupName={setIsEditingGroupName}
          isRenamingGroup={isRenamingGroup}
          handleRenameGroup={handleRenameGroup}
          isTogglingApproval={isTogglingApproval}
          handleToggleRequiresApproval={handleToggleRequiresApproval}
          handleLeaveActiveGroup={handleLeaveActiveGroup}
          profileActionLoading={profileActionLoading}
          canInviteToActiveGroup={canInviteToActiveGroup}
          setIsInviteMembersOpen={setIsInviteMembersOpen}
          groupMemberSearchQuery={groupMemberSearchQuery}
          setGroupMemberSearchQuery={setGroupMemberSearchQuery}
          filteredGroupMembers={filteredGroupMembers}
          canKickGroupMember={canKickGroupMember}
          canSetGroupMemberRole={canSetGroupMemberRole as any}
          groupMemberActionId={groupMemberActionId}
          roleLabels={roleLabels}
          handleUpdateGroupMemberRole={handleUpdateGroupMemberRole as any}
          handleKickGroupMember={handleKickGroupMember}
          activeFriendIsFriend={activeFriendIsFriend}
          activeFriendRequestSent={activeFriendRequestSent}
          handleProfileFriendAction={handleProfileFriendAction}
          handleToggleBlockUser={handleToggleBlockUser}
          blockActionLoading={blockActionLoading}
          activePrivateChatBlockedByMe={activePrivateChatBlockedByMe}
          formatProfileDate={formatProfileDate}
          formatRelativeTime={formatRelativeTime}
          user={user}
        />
      )}

      <SearchProfileModal
        searchProfileUser={searchProfileUser}
        setSearchProfileUser={setSearchProfileUser}
        isExistingFriend={isExistingFriend}
        handleSendChatRequestFromProfile={handleSendChatRequestFromProfile}
        profileChatActionId={profileChatActionId}
        sentChatRequestIds={sentChatRequestIds}
      />

      {isCreatePollOpen && activeConversation?.type === 'GROUP' && isGroupModeratorRole(currentGroupMembership?.role) && (
        <CreatePollModal
          onSubmit={submitCreatePoll}
          onClose={() => setIsCreatePollOpen(false)}
        />
      )}

      <PollVoterDialogModal
        pollVoterDialog={pollVoterDialog}
        onClose={() => setPollVoterDialog(null)}
      />

      {activeMedia && (
        <MediaViewerModal
          activeMedia={activeMedia}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {isPinModalOpen && (
        <PinSetupModal
          pendingHideId={pendingHideId}
          onSuccess={() => {
            setIsPinModalOpen(false);
            setPendingHideId(null);
          }}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}

      {isInviteMembersOpen && activeGroup && (
        <InviteGroupMembersModal
          group={activeGroup}
          onClose={() => setIsInviteMembersOpen(false)}
          onInvited={() => {
            fetchGroups();
            fetchConversations();
          }}
        />
      )}

      {isGroupApprovalsModalOpen && activeGroup && (
        <GroupApprovalsModal
          group={activeGroup}
          onClose={() => setIsGroupApprovalsModalOpen(false)}
        />
      )}

      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onSave={handleSaveTheme}
        currentThemeColor={activeConversation?.themeColor}
        currentWallpaperUrl={activeConversation?.wallpaperUrl}
        isLoading={isUpdatingTheme}
      />
      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        isLoading={profileActionLoading || blockActionLoading || Boolean(groupMemberActionId)}
        showCancel={confirmDialog?.showCancel}
        onCancel={() => {
          if (!profileActionLoading && !blockActionLoading && !groupMemberActionId) {
            setConfirmDialog(null);
          }
        }}
        onConfirm={() => {
          confirmDialog?.onConfirm();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(triggeredReminder)}
        title="Đến giờ nhắc hẹn"
        description={
          triggeredReminder
            ? triggeredReminder.note || `${triggeredReminder.senderUsername}: ${triggeredReminder.messagePreview}`
            : ''
        }
        confirmLabel="Xem tin nhắn"
        cancelLabel="Đóng"
        variant="primary"
        icon={<BellRing className="h-5 w-5" />}
        onCancel={() => setTriggeredReminder(null)}
        onConfirm={handleOpenTriggeredReminderMessage}
      />

      <CallOverlay />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
      />

      {!activeConversation && !selectedChatRequest && <MobileBottomNav />}
    </div>
  );
};

export default Chat;
