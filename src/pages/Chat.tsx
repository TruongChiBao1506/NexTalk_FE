import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import DOMPurify from 'dompurify';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useGroupStore } from '../store/groupStore';
import { useFriendStore } from '../store/friendStore';
import { authService } from '../services/authService';
import { fileService } from '../services/fileService';
import { chatRequestService } from '../services/chatRequestService';
import { userService } from '../services/userService';
import { messageService } from '../services/messageService';
import { blockService } from '../services/blockService';
import { conversationService } from '../services/conversationService';
import { ensureFreshAccessToken } from '../api/apiClient';
import {
  LogOut, User, Settings, MessageSquare, CircleUserRound,
  Send, Paperclip, Smile, Search, Loader2, Users, Plus, Check, CheckCheck,
  X, FileText, Video, Download, ThumbsUp, MoreHorizontal, CreditCard, Crop, Type, Zap, Image, Phone, ArrowLeft, UserPlus, UserMinus, Sparkles, Camera,
  Pin, PinOff, CornerUpLeft, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Code, Link,
  AlignLeft, AlignCenter, AlignRight, Highlighter, Eraser, Info, BellOff, Shield, Lock, Unlock, ExternalLink, ListChecks, Trash2, UserCog, ArrowDown
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CallOverlay from '../components/chat/CallOverlay';
import { useCallStore } from '../store/callStore';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import { useNotificationStore } from '../store/notificationStore';
import { formatRelativeTime } from '../utils/time';
import MobileBottomNav from '../components/common/MobileBottomNav';
import type { CallHistoryMetadata, ConversationResponse, MessageAttachment, MessageResponse, PollMetadata, PollOption } from '../types/chat';
import type { GroupResponse, GroupRole } from '../types/group';
import type { ChatRequestResponse } from '../types/chatRequest';
import type { User as AuthUser } from '../types/auth';

// Phase 10 Components
import { MessageActionsBar, MessageReactionButton } from '../components/chat/MessageContextMenu';
import { MessageReactions } from '../components/chat/MessageReactions';
import { ReplyPreview } from '../components/chat/ReplyPreview';
import { PinnedMessagesPanel } from '../components/chat/PinnedMessagesPanel';
import { SearchPanel } from '../components/chat/SearchPanel';
import { ShareMessageModal } from '../components/chat/ShareMessageModal';
import { InviteGroupMembersModal } from '../components/chat/InviteGroupMembersModal';


export const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pendingHideId, setPendingHideId] = useState<string | null>(null);
  const [pinError, setPinError] = useState('');
  const [globalConversationResults, setGlobalConversationResults] = useState<ConversationResponse[]>([]);

  const { toggleHideConversation } = useChatStore();

  const handleHideClick = async (convId: string) => {
    setOpenConversationMenuId(null);
    const hasPin = user?.hasChatPin;
    if (!hasPin) {
      setPendingHideId(convId);
      setPinValue('');
      setConfirmPinValue('');
      setPinStep('enter');
      setPinError('');
      setIsPinModalOpen(true);
    } else {
      setConversationActionId(`hide-${convId}`);
      try {
        const ok = await toggleHideConversation(convId, true);
        if (ok) {
          await fetchConversations();
        }
      } finally {
        setConversationActionId(null);
      }
    }
  };

  const handlePinSubmit = async () => {
    if (pinStep === 'enter') {
      if (!pinValue.match(/^\d{4}$/)) {
        setPinError('Mã PIN phải gồm đúng 4 chữ số.');
        return;
      }
      setPinStep('confirm');
      setPinError('');
    } else {
      if (pinValue !== confirmPinValue) {
        setPinError('Mã PIN xác nhận không trùng khớp.');
        return;
      }
      setConversationActionId('pin-setup');
      try {
        const response = await userService.setupChatPin(pinValue);
        if (response.success) {
          useAuthStore.getState().updateUser(response.data);
          setIsPinModalOpen(false);
          if (pendingHideId) {
            await toggleHideConversation(pendingHideId, true);
            await fetchConversations();
          }
        } else {
          setPinError(response.message || 'Lỗi khi thiết lập PIN.');
        }
      } catch (err: any) {
        setPinError(err.response?.data?.message || 'Không thể thiết lập PIN.');
      } finally {
        setConversationActionId(null);
        setPendingHideId(null);
      }
    }
  };
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
    connectWebSocket,
    disconnectWebSocket,
    replyTo,
    pinnedMessages,
    conversationSummaries,
    fetchPinnedMessages,
    setReplyTo,
    editMessage,
    recallMessage,
    deleteMessage,
    togglePinMessage,
    reactToMessage,
    shareMessage,
    setConversationSummary,
    togglePinConversation,
    deleteConversation
  } = useChatStore();

  const [isPinnedPanelOpen, setIsPinnedPanelOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [sharingMessage, setSharingMessage] = useState<MessageResponse | null>(null);
  const [isSharingMessage, setIsSharingMessage] = useState(false);
  const [isInviteMembersOpen, setIsInviteMembersOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConversationInfoOpen, setIsConversationInfoOpen] = useState(false);
  const [conversationArchiveMessages, setConversationArchiveMessages] = useState<MessageResponse[]>([]);
  const [isLoadingConversationArchive, setIsLoadingConversationArchive] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO'; name?: string } | null>(null);

  useEffect(() => {
    if (!activeMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMedia]);

  const handleSaveEdit = async (messageId: string) => {
    if (!editInputText.trim()) return;
    await editMessage(messageId, editInputText.trim());
    setEditingMessageId(null);
  };

  const handleJumpToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-discord-blurple/25');
      setTimeout(() => {
        element.classList.remove('bg-discord-blurple/25');
      }, 2000);
    }
  };

  const handleJumpToMessageFromSearch = async (messageId: string, conversationId: string) => {
    if (activeConversation?.id !== conversationId) {
      await selectConversation(conversationId);
    }
    setTimeout(() => {
      handleJumpToMessage(messageId);
    }, 450);
  };

  const handleShareMessage = async (targetConversationIds: string[]) => {
    if (!sharingMessage) return false;
    setIsSharingMessage(true);
    try {
      const ok = await shareMessage(sharingMessage.id, targetConversationIds);
      if (ok) {
        setSharingMessage(null);
      }
      return ok;
    } finally {
      setIsSharingMessage(false);
    }
  };

  const handleSummarizeConversation = async () => {
    if (!activeConversation || isSummarizingConversation) return;

    setIsSummarizingConversation(true);
    try {
      const response = await conversationService.summarizeConversation(activeConversation.id);
      if (response.success && response.data) {
        setConversationSummary(response.data);
      } else {
        window.alert(response.message || 'Không thể tóm tắt cuộc trò chuyện.');
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể tóm tắt cuộc trò chuyện.');
    } finally {
      setIsSummarizingConversation(false);
    }
  };

  const fetchIncomingChatRequests = async () => {
    setIsLoadingChatRequests(true);
    try {
      const response = await chatRequestService.getIncoming();
      if (response.success && response.data) {
        setIncomingChatRequests(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch chat requests:', err);
    } finally {
      setIsLoadingChatRequests(false);
    }
  };

  const handleAcceptChatRequest = async (requestId: string) => {
    setChatRequestActionId(requestId);
    try {
      const response = await chatRequestService.accept(requestId);
      if (response.success && response.data?.conversationId) {
        setSelectedChatRequest(null);
        await fetchIncomingChatRequests();
        await fetchConversations();
        setConversationTab('chats');
        await selectConversation(response.data.conversationId);
      }
    } catch (err) {
      console.error('Failed to accept chat request:', err);
    } finally {
      setChatRequestActionId(null);
    }
  };

  const { groups, fetchGroups, updateGroup, removeMember: removeGroupMember, updateMemberRole } = useGroupStore();
  const { friends, pending, fetchFriends, fetchPending, sendFriendRequest, removeFriend } = useFriendStore();
  const initiateCall = useCallStore((state) => state.initiateCall);

  const {
    notifications,
    fetchNotifications,
  } = useNotificationStore();




  const [searchQuery, setSearchQuery] = useState('');
  const [conversationTab, setConversationTab] = useState<'chats' | 'requests'>('chats');
  const [incomingChatRequests, setIncomingChatRequests] = useState<ChatRequestResponse[]>([]);
  const [selectedChatRequest, setSelectedChatRequest] = useState<ChatRequestResponse | null>(null);
  const [isLoadingChatRequests, setIsLoadingChatRequests] = useState(false);
  const [chatRequestActionId, setChatRequestActionId] = useState<string | null>(null);
  const [isSendingBlockedChatRequest, setIsSendingBlockedChatRequest] = useState(false);
  const [globalUserResults, setGlobalUserResults] = useState<AuthUser[]>([]);
  const [globalMessageResults, setGlobalMessageResults] = useState<MessageResponse[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState<string | null>(null);
  const [friendRequestActionId, setFriendRequestActionId] = useState<string | null>(null);
  const [sentFriendRequestIds, setSentFriendRequestIds] = useState<string[]>([]);
  const [sentChatRequestIds, setSentChatRequestIds] = useState<string[]>([]);
  const [searchProfileUser, setSearchProfileUser] = useState<AuthUser | null>(null);
  const [profileChatMessage, setProfileChatMessage] = useState('');
  const [profileChatActionId, setProfileChatActionId] = useState<string | null>(null);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');
  const [profileActionLoading, setProfileActionLoading] = useState(false);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const [isUpdatingSelfDestruct, setIsUpdatingSelfDestruct] = useState(false);
  const [conversationActionId, setConversationActionId] = useState<string | null>(null);
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);
  const [groupMemberActionId, setGroupMemberActionId] = useState<string | null>(null);
  const [isUpdatingGroupAvatar, setIsUpdatingGroupAvatar] = useState(false);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [isSummarizingConversation, setIsSummarizingConversation] = useState(false);
  const [isFormattingOpen, setIsFormattingOpen] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
  const [isEmojiStickerOpen, setIsEmojiStickerOpen] = useState(false);
  const [emojiStickerTab, setEmojiStickerTab] = useState<'emoji' | 'sticker'>('emoji');
  const [expandedCallLogId, setExpandedCallLogId] = useState<string | null>(null);
  const [messageExpiryNow, setMessageExpiryNow] = useState(Date.now());
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollAllowAddOptions, setPollAllowAddOptions] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(false);
  const [pollExpiresAt, setPollExpiresAt] = useState('');
  const [pollActionMessageId, setPollActionMessageId] = useState<string | null>(null);
  const [pollVoterDialog, setPollVoterDialog] = useState<{ option: PollOption; anonymous: boolean } | null>(null);
  const [pollNewOptionText, setPollNewOptionText] = useState<Record<string, string>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

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
    type: 'IMAGE' | 'VIDEO' | 'FILE';
    name: string;
    previewUrl: string | null;
    progress: number;
    isUploading: boolean;
  };

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const quillEditorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  const normalizeSearchTerm = (value: string) => value.trim().toLowerCase().replace(/^@/, '');

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

  const getFileMessageType = (file: File): 'IMAGE' | 'VIDEO' | 'FILE' => {
    const fileName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.heic', '.heif'].some(ext => fileName.endsWith(ext));
    const isVideo = file.type.startsWith('video/') ||
      ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].some(ext => fileName.endsWith(ext));
    if (isImage) return 'IMAGE';
    if (isVideo) return 'VIDEO';
    return 'FILE';
  };

  const addUrlAttachment = (url: string, type: 'IMAGE' | 'VIDEO') => {
    setPendingAttachments((attachments) => [
      ...attachments,
      {
        id: createAttachmentId(),
        url,
        type,
        name: type === 'IMAGE' ? 'Ảnh từ liên kết' : 'Video từ liên kết',
        previewUrl: type === 'IMAGE' ? url : null,
        progress: 100,
        isUploading: false,
      },
    ]);
  };

  const addUploadedFile = async (file: File) => {
    const type = getFileMessageType(file);
    let maxSizeMB = 20; // default for documents (20MB)
    if (type === 'IMAGE') maxSizeMB = 10; // 10MB limit for images
    if (type === 'VIDEO') maxSizeMB = 50; // 50MB limit for videos

    if (file.size > maxSizeMB * 1024 * 1024) {
      window.alert(`Dung lượng ${type === 'IMAGE' ? 'ảnh' : type === 'VIDEO' ? 'video' : 'tệp tin'} "${file.name}" vượt quá giới hạn cho phép là ${maxSizeMB}MB.`);
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
        alert('Failed to upload file: ' + response.message);
      }
    } catch (err: any) {
      removePendingAttachment(id);
      alert('Error uploading file: ' + (err.response?.data?.message || err.message));
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

  const handleTakeScreenshot = async () => {
    if (!canSendInActiveConversation || isTakingScreenshot) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      window.alert('Trình duyệt hiện tại chưa hỗ trợ chụp màn hình.');
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
        window.alert(err?.message || 'Không thể chụp màn hình.');
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

    const handleResume = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastResumeSyncAt < 2000) return;
      lastResumeSyncAt = now;

      reloadChatData(true);
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [connectWebSocket, fetchConversations, fetchFriends, fetchGroups, fetchNotifications, fetchPending]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setGlobalUserResults([]);
      setGlobalMessageResults([]);
      setGlobalConversationResults([]);
      setGlobalSearchError(null);
      setIsGlobalSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsGlobalSearching(true);
      setGlobalSearchError(null);
      const userLookupQuery = normalizeSearchTerm(query);

      try {
        const [userResponse, messageResponse, conversationResponse] = await Promise.allSettled([
          userService.searchUser(userLookupQuery),
          messageService.searchMessages(query),
          conversationService.searchConversations(query),
        ]);

        if (cancelled) return;

        if (userResponse.status === 'fulfilled' && userResponse.value.success && userResponse.value.data) {
          setGlobalUserResults(userResponse.value.data.filter((result) => result.id !== user?.id));
        } else {
          setGlobalUserResults([]);
        }

        if (messageResponse.status === 'fulfilled' && messageResponse.value.success && messageResponse.value.data) {
          setGlobalMessageResults(messageResponse.value.data);
        } else {
          setGlobalMessageResults([]);
        }

        if (conversationResponse.status === 'fulfilled' && conversationResponse.value.success && conversationResponse.value.data) {
          setGlobalConversationResults(conversationResponse.value.data);
        } else {
          setGlobalConversationResults([]);
        }

        if (userResponse.status === 'rejected' && messageResponse.status === 'rejected' && conversationResponse.status === 'rejected') {
          setGlobalSearchError('Không thể tìm kiếm lúc này.');
        }
      } finally {
        if (!cancelled) {
          setIsGlobalSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, user?.id]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    setShowScrollToLatest(false);
    lastScrollDistanceFromBottomRef.current = 0;
    messagesEndRef.current?.scrollIntoView({ behavior });
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
    return () => window.clearInterval(timer);
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
    ? `Nhập @, tin nhắn tới #${groups.find(group => group.conversationId === activeConversation.id)?.name || 'group'}...`
    : `Nhập @, tin nhắn tới @${activeConversation?.members.find(member => member.id !== user?.id)?.username || 'friend'}`;



  const getCurrentInputMessage = () => {
    const quill = quillRef.current;
    if (!quill) return inputMessage;
    let html = quill.root.innerHTML;
    if (html === '<p><br></p>') html = '';
    return html;
  };

  const emojiOptions = [
    '😀', '😄', '😂', '😊', '😍', '😘', '😎', '🥳',
    '😢', '😭', '😡', '😤', '😴', '🤔', '😅', '🙄',
    '👍', '👎', '👏', '🙏', '💪', '👌', '✌️', '🤝',
    '❤️', '💙', '🔥', '✨', '🎉', '✅', '⭐', '💯',
  ];

  const stickerOptions = [
    { label: 'Cười lớn', value: '😂😂😂' },
    { label: 'Yêu quá', value: '😍💖' },
    { label: 'Đã rõ', value: '👍 OK!' },
    { label: 'Cố lên', value: '💪 Cố lên!' },
    { label: 'Chúc mừng', value: '🎉 Chúc mừng!' },
    { label: 'Ôm một cái', value: '🤗' },
    { label: 'Bất ngờ', value: '😮✨' },
    { label: 'Buồn ngủ', value: '😴 Zzz' },
    { label: 'Xin lỗi', value: '🙏 Xin lỗi nha' },
    { label: 'Cảm ơn', value: '❤️ Cảm ơn!' },
    { label: 'Tuyệt vời', value: '🌟 Tuyệt vời!' },
    { label: 'Đang tới', value: '🏃 Đang tới!' },
  ];

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

  const handleSendSticker = (sticker: string) => {
    if (!canSendInActiveConversation) return;
    sendStompMessage(sticker, 'TEXT', replyTo?.id ?? undefined);
    if (replyTo) {
      setReplyTo(null);
    }
    setIsEmojiStickerOpen(false);
  };

  const clearQuillInput = () => {
    const quill = quillRef.current;
    if (quill) {
      quill.setText('');
    }
    setInputMessage('');
  };

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
      },
      formats: [
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
    const editor = quillEditorRef.current?.querySelector<HTMLElement>('.ql-editor');
    if (editor) {
      editor.dataset.placeholder = messagePlaceholder;
    }
  }, [messagePlaceholder]);

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
          className="m-0 whitespace-pre-wrap break-words ql-editor px-0 py-0"
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
        }));
      const caption = currentMessage.trim();
      const messageType = attachments.length > 1 ? 'ALBUM' : attachments[0]?.type ?? 'ALBUM';
      sendStompMessage(caption, messageType, replyTo?.id ?? undefined, attachments);
      resetUploadState();
      clearQuillInput();
    } else if (currentMessage.trim()) {
      // Send text if typed without attachments
      const trimmedMessage = currentMessage.trim();
      const pastedMediaType = detectPastedMediaType(trimmedMessage);
      if (pastedMediaType) {
        sendStompMessage('', pastedMediaType, replyTo?.id ?? undefined, [{
          url: trimmedMessage,
          type: pastedMediaType,
          name: pastedMediaType === 'IMAGE' ? 'Ảnh từ liên kết' : 'Video từ liên kết',
        }]);
      } else {
        sendStompMessage(trimmedMessage, 'TEXT', replyTo?.id ?? undefined);
      }
      clearQuillInput();
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
    if (replyTo) {
      setReplyTo(null);
    }
  };

  const handleSendBlockedChatRequest = async () => {
    const receiverId = getActivePrivateFriendId();
    const message = getCurrentInputMessage().trim();
    if (activePrivateChatBlocked) {
      window.alert(activePrivateChatBlockedByMe ? 'Bạn cần bỏ chặn người này trước khi nhắn tin.' : 'Bạn không thể nhắn tin vì người này đã chặn bạn.');
      return;
    }
    if (!receiverId || !message || isSendingBlockedChatRequest) {
      return;
    }

    setIsSendingBlockedChatRequest(true);
    try {
      const response = await chatRequestService.create({ receiverId, message });
      if (response.success) {
        clearQuillInput();
        resetUploadState();
        if (replyTo) {
          setReplyTo(null);
        }
      } else {
        alert(response.message || 'Không thể gửi tin nhắn chờ');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể gửi tin nhắn chờ');
    } finally {
      setIsSendingBlockedChatRequest(false);
    }
  };

  const handleGroupCreated = (group: GroupResponse) => {
    setShowCreateGroupModal(false);
    // Open the group conversation immediately
    if (group.conversationId) {
      selectConversation(group.conversationId);
    }
  };

  const handleOpenGroup = (group: GroupResponse) => {
    if (group.conversationId) {
      selectConversation(group.conversationId);
    }
  };

  const handleGroupAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeGroup || !currentUserIsGroupOwner || isUpdatingGroupAvatar) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Vui lòng chọn một tệp hình ảnh.');
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
      window.alert(err.response?.data?.message || err.message || 'Không thể cập nhật ảnh nhóm.');
    } finally {
      setIsUpdatingGroupAvatar(false);
      event.target.value = '';
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
    setProfileChatMessage('');
  };

  const handleSendChatRequestFromProfile = async () => {
    if (!searchProfileUser || profileChatActionId) return;

    if (isExistingFriend(searchProfileUser.id)) {
      await handleStartChatFromSearch(searchProfileUser.id);
      setSearchProfileUser(null);
      return;
    }

    const message = profileChatMessage.trim();
    if (!message) return;

    setProfileChatActionId(searchProfileUser.id);
    try {
      const response = await chatRequestService.create({
        receiverId: searchProfileUser.id,
        message,
      });
      if (response.success) {
        setSentChatRequestIds((prev) => prev.includes(searchProfileUser.id) ? prev : [...prev, searchProfileUser.id]);
        setProfileChatMessage('');
      } else {
        window.alert(response.message || 'Không thể gửi tin nhắn chờ.');
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể gửi tin nhắn chờ.');
    } finally {
      setProfileChatActionId(null);
    }
  };

  const handleBlockChatRequest = async (request: ChatRequestResponse) => {
    setChatRequestActionId(request.id);
    try {
      await blockService.blockUser(request.sender.id);
      await chatRequestService.reject(request.id);
      setSelectedChatRequest((current) => current?.id === request.id ? null : current);
      await fetchIncomingChatRequests();
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể chặn người gửi.');
    } finally {
      setChatRequestActionId(null);
    }
  };

  const handleReportChatRequest = async (request: ChatRequestResponse) => {
    setChatRequestActionId(request.id);
    try {
      const response = await chatRequestService.reject(request.id);
      if (response.success) {
        setSelectedChatRequest((current) => current?.id === request.id ? null : current);
        await fetchIncomingChatRequests();
        window.alert('Đã ghi nhận báo xấu và ẩn tin nhắn chờ này.');
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể báo xấu tin nhắn này.');
    } finally {
      setChatRequestActionId(null);
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
          window.alert(err.response?.data?.message || err.message || 'KhÃ´ng thá»ƒ cáº­p nháº­t tráº¡ng thÃ¡i cháº·n.');
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
      window.alert(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái chặn.');
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
    if (!window.confirm(`Kick ${member.username} khỏi nhóm ${activeGroup.name}?`)) return;

    setGroupMemberActionId(member.userId);
    try {
      const ok = await removeGroupMember(activeGroup.id, member.userId);
      if (ok) {
        await fetchGroups();
        await fetchConversations();
      }
    } finally {
      setGroupMemberActionId(null);
    }
  };

  const getConversationTitle = (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return 'Cuộc trò chuyện';
    if (conversation.type === 'GROUP') {
      return groups.find((group) => group.conversationId === conversation.id)?.name || conversation.name || 'Nhóm chat';
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
  const messageHasSearchableAttachment = (message: MessageResponse) =>
    Boolean(message.attachments?.length) || ['IMAGE', 'VIDEO', 'FILE', 'ALBUM'].includes(message.messageType);

  const getSearchMessagePreview = (message: MessageResponse) => {
    if (message.attachments?.length) {
      const first = message.attachments[0];
      const label = first.type === 'IMAGE' ? 'Hình ảnh' : first.type === 'VIDEO' ? 'Video' : (first.name || getFileName(first.url));
      return message.attachments.length > 1 ? `${message.attachments.length} tệp đã chia sẻ` : label;
    }
    if (message.messageType === 'IMAGE') return 'Hình ảnh đã chia sẻ';
    if (message.messageType === 'VIDEO') return 'Video đã chia sẻ';
    if (message.messageType === 'FILE') return getFileName(message.content);
    return stripMessageMarkup(message.content);
  };

  const handleOpenSearchMessage = async (message: MessageResponse) => {
    await selectConversation(message.conversationId);
    setSearchQuery('');
    window.setTimeout(() => handleJumpToMessage(message.id), 450);
  };

  // Active conversation: find matching group for header enrichment
  const activeGroup = activeConversation?.type === 'GROUP'
    ? groups.find(g => g.conversationId === activeConversation.id) || null
    : null;
  const canInviteToActiveGroup = Boolean(
    activeGroup?.members.some((member) =>
      member.userId === user?.id && isGroupModeratorRole(member.role)
    )
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
      return 'Yesterday';
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

  const handleUpdateSelfDestruct = async (seconds: number) => {
    if (!activeConversation || isUpdatingSelfDestruct) return;
    setIsUpdatingSelfDestruct(true);
    try {
      const response = await conversationService.updateSelfDestruct(activeConversation.id, seconds);
      if (response.success && response.data) {
        const updated = response.data;
        useChatStore.setState((state) => ({
          activeConversation: state.activeConversation?.id === updated.id ? updated : state.activeConversation,
          conversations: state.conversations.map((conversation) =>
            conversation.id === updated.id ? updated : conversation
          ),
        }));
      } else {
        window.alert(response.message || 'Không thể cập nhật chế độ tin nhắn tự xóa.');
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể cập nhật chế độ tin nhắn tự xóa.');
    } finally {
      setIsUpdatingSelfDestruct(false);
    }
  };

  const handleToggleConversationPin = async (conversationId: string, pinned?: boolean) => {
    if (conversationActionId) return;
    setOpenConversationMenuId(null);
    setConversationActionId(`pin-${conversationId}`);
    try {
      const ok = await togglePinConversation(conversationId, Boolean(pinned));
      if (!ok) {
        window.alert('Không thể cập nhật trạng thái ghim hội thoại.');
      }
    } finally {
      setConversationActionId(null);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (conversationActionId) return;
    const confirmed = window.confirm('Xóa cuộc hội thoại này khỏi danh sách của bạn? Tin nhắn mới sau này sẽ làm hội thoại xuất hiện lại.');
    if (!confirmed) return;

    setConversationActionId(`delete-${conversationId}`);
    try {
      const ok = await deleteConversation(conversationId);
      if (ok) {
        setIsConversationInfoOpen(false);
        setIsPinnedPanelOpen(false);
        setIsSearchPanelOpen(false);
      } else {
        window.alert('Không thể xóa hội thoại.');
      }
    } finally {
      setConversationActionId(null);
    }
  };

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

  const updateMessageInChat = (updated: MessageResponse) => {
    useChatStore.setState((state) => ({
      messages: state.messages.map((message) => message.id === updated.id ? updated : message),
      pinnedMessages: state.pinnedMessages.map((message) => message.id === updated.id ? updated : message),
      lastMessages: state.lastMessages[updated.conversationId]?.id === updated.id
        ? { ...state.lastMessages, [updated.conversationId]: updated }
        : state.lastMessages
    }));
  };

  const submitCreatePoll = async () => {
    if (!activeConversation || activeConversation.type !== 'GROUP') return;
    const options = pollOptions.map((option) => option.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2) {
      window.alert('Vui lòng nhập câu hỏi và ít nhất 2 lựa chọn.');
      return;
    }

    setPollActionMessageId('creating');
    try {
      const response = await messageService.createPoll({
        conversationId: activeConversation.id,
        question: pollQuestion.trim(),
        options,
        allowMultiple: pollAllowMultiple,
        allowAddOptions: pollAllowAddOptions,
        anonymous: pollAnonymous,
        expiresAt: pollExpiresAt ? new Date(pollExpiresAt).toISOString() : null
      });
      if (response.success && response.data) {
        updateMessageInChat(response.data);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollAllowMultiple(false);
        setPollAllowAddOptions(false);
        setPollAnonymous(false);
        setPollExpiresAt('');
        setIsCreatePollOpen(false);
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể tạo bình chọn.');
    } finally {
      setPollActionMessageId(null);
    }
  };

  const handlePollVote = async (messageId: string, optionId: string) => {
    setPollActionMessageId(messageId);
    try {
      const response = await messageService.votePoll(messageId, optionId);
      if (response.success && response.data) {
        updateMessageInChat(response.data);
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể cập nhật bình chọn.');
    } finally {
      setPollActionMessageId(null);
    }
  };

  const handleAddPollOption = async (messageId: string) => {
    const text = pollNewOptionText[messageId]?.trim();
    if (!text) return;
    setPollActionMessageId(messageId);
    try {
      const response = await messageService.addPollOption(messageId, text);
      if (response.success && response.data) {
        updateMessageInChat(response.data);
        setPollNewOptionText((values) => ({ ...values, [messageId]: '' }));
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể thêm lựa chọn.');
    } finally {
      setPollActionMessageId(null);
    }
  };

  const handleLockPoll = async (messageId: string) => {
    setPollActionMessageId(messageId);
    try {
      const response = await messageService.lockPoll(messageId);
      if (response.success && response.data) {
        updateMessageInChat(response.data);
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể khóa bình chọn.');
    } finally {
      setPollActionMessageId(null);
    }
  };

  const handleDeletePoll = async (messageId: string) => {
    if (!window.confirm('Xóa bình chọn này?')) return;
    setPollActionMessageId(messageId);
    try {
      const response = await messageService.deletePoll(messageId);
      if (response.success && response.data) {
        updateMessageInChat(response.data);
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể xóa bình chọn.');
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
      case 'TEXT':
      default:
        return `${prefix}${msg.content}`;
    }
  };



  // Build unified conversation list (private + group), sorted by updatedAt desc
  const privateConversations = conversations.filter(c => c.type === 'PRIVATE');

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

  const visibleGroups = groups.filter((group) =>
    !group.conversationId || conversations.some((conversation) => conversation.id === group.conversationId)
  );

  const unifiedItems: UnifiedItem[] = [
    ...uniquePrivateConversations.map(c => ({ kind: 'dm' as const, conv: c })),
    ...visibleGroups.map(g => ({ kind: 'group' as const, group: g })),
  ];

  const getUnifiedConversation = (item: UnifiedItem) =>
    item.kind === 'dm'
      ? item.conv
      : item.group.conversationId
      ? conversations.find((conversation) => conversation.id === item.group.conversationId) ?? null
      : null;

  const isUnifiedPinned = (item: UnifiedItem) => getUnifiedConversation(item)?.pinned === true;

  const getUnifiedTime = (item: UnifiedItem): number => {
    if (item.kind === 'dm') {
      const lm = lastMessages[item.conv.id];
      return lm ? new Date(lm.createdAt).getTime() : new Date(item.conv.updatedAt).getTime();
    }
    const lm = item.group.conversationId ? lastMessages[item.group.conversationId] : undefined;
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
    .slice(0, 8);

  const visibleMessages = messages.filter((message) => !isMessageExpired(message));


  const activeFriend = activeConversation ? getFriendInfo(activeConversation) : null;
  const activeConversationSummary = activeConversation
    ? conversationSummaries[activeConversation.id]
    : null;

  // For group chat: determine if we're in a group conversation
  const isGroupConversation = activeConversation?.type === 'GROUP';
  const activeCallTarget = activeConversation
    ? isGroupConversation
      ? {
          id: activeConversation.id,
          username: activeGroup?.name || activeConversation.name || activeFriend?.username || 'Nhóm chat',
          avatarUrl: activeGroup?.avatarUrl ?? null,
          isGroupCall: true,
          memberCount: activeGroup?.memberCount ?? activeConversation.members.length,
        }
      : activeFriend
    : null;

  // Get sender info in group chat
  const getSenderUsername = (msg: MessageResponse) => msg.senderUsername || 'Unknown';

  // Get sender avatar in group chat — look up from conversation members
  const getSenderAvatar = (msg: MessageResponse): string | null => {
    if (!activeConversation) return null;
    const member = activeConversation.members.find(m => m.id === msg.senderId);
    return member?.avatarUrl ?? null;
  };

  return (
    <div className="h-dvh w-screen bg-gray-100 dark:bg-discord-black flex overflow-hidden text-gray-900 dark:text-discord-text transition-colors duration-300">

      {/* Column 1: Sidebar Navigation */}
      <aside className="hidden md:flex w-16 md:w-18 bg-gray-250 dark:bg-zinc-950 flex-col items-center py-4 border-r border-gray-300 dark:border-zinc-900/50 shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-indigo-650 dark:bg-discord-blurple flex items-center justify-center text-white mb-6 shadow-md transition-all duration-300">
          <MessageSquare className="w-5 h-5" />
        </div>

        <div
          onClick={() => navigate('/friends')}
          className="relative w-11 h-11 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Friends List"
        >
          <User className="w-5 h-5" />
          {pending.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-gray-250 dark:ring-zinc-950">
              {pending.length > 99 ? '99+' : pending.length}
            </span>
          )}
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Hồ sơ"
        >
          <CircleUserRound className="w-5 h-5" />
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-450 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white hover:rounded-xl transition-all duration-300 disabled:opacity-50"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Column 2: Conversations Sidebar — Zalo style */}
      <section className={`${(activeConversation || selectedChatRequest) ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white dark:bg-[#1e1e2e] flex-col border-r border-gray-200 dark:border-zinc-800/60 shrink-0 pb-16 md:pb-0`}>

        {/* Header */}
        <div className="h-[60px] flex items-center justify-between px-4 shrink-0 border-b border-gray-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">Tin nhắn</h1>
            {isConnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            ) : isConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã kết nối" />
            ) : (
              <span
                className="w-2 h-2 rounded-full bg-rose-500 cursor-pointer"
                title="Mất kết nối — Nhấn để kết nối lại"
                onClick={connectWebSocket}
              />
            )}
          </div>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
            title="Tạo nhóm mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm người, nhóm, tin nhắn, file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-zinc-800/80 text-sm px-9 py-2 rounded-full border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
            />
          </div>
        </div>

        <div className="px-3 pb-2 shrink-0">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-zinc-800/70 p-1">
            <button
              type="button"
              onClick={() => setConversationTab('chats')}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                conversationTab === 'chats'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Trò chuyện
            </button>
            <button
              type="button"
              onClick={() => {
                setConversationTab('requests');
                fetchIncomingChatRequests();
              }}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                conversationTab === 'requests'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Tin nhắn chờ
              {incomingChatRequests.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white shadow">
                  {incomingChatRequests.length > 99 ? '99+' : incomingChatRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Unified conversation list (Zalo style) */}
        <div className="flex-1 overflow-y-auto">
          {conversationTab === 'requests' ? (
            isLoadingChatRequests ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-600 dark:text-discord-blurple" />
              </div>
            ) : incomingChatRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
                </div>
                <p className="text-sm text-gray-400 dark:text-zinc-500">Không có tin nhắn chờ.</p>
              </div>
            ) : (
              <div>
                <div className="mx-3 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Tin nhắn từ người chưa kết bạn được ẩn tại đây. Chỉ trả lời khi bạn nhận ra người gửi; bạn có thể kết bạn, trả lời hoặc chặn/báo xấu.</span>
                  </div>
                </div>
                {incomingChatRequests.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  onClick={() => setSelectedChatRequest(request)}
                  className={`block w-full px-3 py-3 text-left border-b border-gray-100 dark:border-zinc-800/60 transition-colors ${
                    selectedChatRequest?.id === request.id
                      ? 'bg-indigo-50 dark:bg-indigo-500/10'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {request.sender.avatarUrl ? (
                      <img src={request.sender.avatarUrl} alt={request.sender.username} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0">
                        {request.sender.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-bold text-gray-900 dark:text-white truncate">
                          {request.sender.username}
                        </span>
                        <span className="text-[11px] shrink-0 text-gray-400 dark:text-zinc-500">
                          {formatConversationTime(request.createdAt)}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                        {request.message}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                        Mở trong khung chat
                      </p>
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )
          ) : isSearchActive ? (
            <div className="px-3 pb-4 space-y-4">
              {isGlobalSearching && (
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tìm kiếm...</span>
                </div>
              )}

              {globalSearchError && (
                <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  {globalSearchError}
                </div>
              )}

              {globalUserResults.length > 0 && (
                <div>
                  <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                    Người dùng & kết nối
                  </div>
                  <div className="space-y-1">
                    {globalUserResults.slice(0, 6).map((result) => {
                      const alreadyFriend = isExistingFriend(result.id);
                      const requestSent = sentFriendRequestIds.includes(result.id);
                      return (
                        <div key={result.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          <button
                            type="button"
                            onClick={() => openSearchProfile(result)}
                            className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="Mở hồ sơ"
                          >
                            {result.avatarUrl ? (
                              <img src={result.avatarUrl} alt={result.username} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                                {result.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </button>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{result.username}</div>
                            <div className="truncate text-[11px] text-gray-400 dark:text-zinc-500">{result.email}</div>
                          </div>
                          {!alreadyFriend && (
                            <button
                              type="button"
                              onClick={() => openSearchProfile(result)}
                              disabled={sentChatRequestIds.includes(result.id)}
                              className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-500/10 disabled:text-indigo-500 disabled:opacity-80 transition"
                            >
                              {sentChatRequestIds.includes(result.id) ? 'Đã nhắn' : 'Nhắn'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => alreadyFriend ? handleStartChatFromSearch(result.id) : handleSendFriendRequestFromSearch(result.id)}
                            disabled={friendRequestActionId === result.id || requestSent}
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                              alreadyFriend
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : requestSent
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200'
                            } disabled:opacity-60`}
                          >
                            {friendRequestActionId === result.id ? '...' : alreadyFriend ? 'Nhắn' : requestSent ? 'Đã gửi' : 'Kết bạn'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {globalConversationResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-1 pb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                      Cuộc trò chuyện & nhóm
                    </span>
                    {searchQuery.match(/^\d{4}$/) && user?.hasChatPin && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                        <Unlock className="h-3 w-3" />
                        Đã mở khóa ẩn
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {globalConversationResults.slice(0, 8).map((c) => {
                      if (c.type === 'PRIVATE') {
                        const friend = getFriendInfo(c);
                        const friendId = c.members.find((member) => member.id !== user?.id)?.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              selectConversation(c.id);
                              setSearchQuery('');
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <div className="relative shrink-0">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
                                  {friend.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {c.hidden && (
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-zinc-900 shadow">
                                  <Lock className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{friend.username}</span>
                                {c.hidden && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                                    Bị ẩn
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
                                {friendId && isExistingFriend(friendId) ? 'Bạn bè' : 'Chưa là bạn bè'}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            selectConversation(c.id);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="relative shrink-0">
                            {(c as any).avatarUrl ? (
                              <img src={(c as any).avatarUrl as string} alt={c.name || ''} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                                {c.name ? c.name.charAt(0).toUpperCase() : 'G'}
                              </div>
                            )}
                            {c.hidden && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-zinc-900 shadow">
                                <Lock className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{c.name || 'Nhóm không tên'}</span>
                              {c.hidden && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                                  Bị ẩn
                                </span>
                              )}
                            </div>
                            <div className="truncate text-[11px] text-gray-400 dark:text-zinc-500">{c.members?.length || 0} thành viên</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {textMessageResults.length > 0 && (
                <div>
                  <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                    Tin nhắn
                  </div>
                  <div className="space-y-1">
                    {textMessageResults.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => handleOpenSearchMessage(message)}
                        className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                      >
                        <MessageSquare className="mt-1 w-4 h-4 shrink-0 text-indigo-500" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-semibold text-gray-700 dark:text-zinc-200">
                            {getConversationTitle(message.conversationId)}
                          </div>
                          <div className="line-clamp-2 text-[12px] text-gray-500 dark:text-zinc-400">
                            {getSearchMessagePreview(message)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sharedDataResults.length > 0 && (
                <div>
                  <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                    File, hình ảnh & liên kết
                  </div>
                  <div className="space-y-1">
                    {sharedDataResults.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => handleOpenSearchMessage(message)}
                        className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                      >
                        {messageHasSharedLink(message) ? (
                          <Link className="mt-1 w-4 h-4 shrink-0 text-sky-500" />
                        ) : message.attachments?.some((attachment) => attachment.type === 'IMAGE') || message.messageType === 'IMAGE' ? (
                          <Image className="mt-1 w-4 h-4 shrink-0 text-emerald-500" />
                        ) : (
                          <FileText className="mt-1 w-4 h-4 shrink-0 text-amber-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-semibold text-gray-700 dark:text-zinc-200">
                            {getConversationTitle(message.conversationId)}
                          </div>
                          <div className="line-clamp-2 text-[12px] text-gray-500 dark:text-zinc-400">
                            {getSearchMessagePreview(message)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isGlobalSearching && !globalSearchError && globalUserResults.length === 0 && globalConversationResults.length === 0 && textMessageResults.length === 0 && sharedDataResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-zinc-500">
                    Không tìm thấy người dùng, nhóm, tin nhắn hoặc dữ liệu đã chia sẻ.
                  </p>
                </div>
              )}
            </div>
          ) : filteredUnified.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm text-gray-400 dark:text-zinc-500">
                {searchQuery ? 'Không tìm thấy cuộc trò chuyện nào.' : 'Chưa có cuộc trò chuyện nào.'}
              </p>
            </div>
          ) : (
            filteredUnified.map((item) => {
              if (item.kind === 'dm') {
                const c = item.conv;
                const friend = getFriendInfo(c);
                const lastMsg = lastMessages[c.id];
                const isSelected = activeConversation?.id === c.id;
                const unreadNotifs = notifications.filter(
                  (n) => n.referenceId === c.id && !n.read && n.type === 'NEW_MESSAGE'
                );
                const unreadCount = unreadNotifs.length;
                const hasUnread = unreadCount > 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setOpenConversationMenuId(null);
                      selectConversation(c.id);
                    }}
                    className={`group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Avatar with status dot */}
                    <div className="relative shrink-0">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1e1e2e] ${
                          friend.status === 'ONLINE' ? 'bg-emerald-500'
                          : friend.status === 'AWAY' ? 'bg-amber-400'
                          : 'bg-gray-400 dark:bg-zinc-600'
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[14px] truncate ${
                          hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-zinc-200'
                        }`}>
                          {friend.username}
                          {c.pinned && <Pin className="ml-1.5 inline h-3 w-3 text-indigo-500" />}
                        </span>
                        {lastMsg && (
                          <span className={`text-[11px] shrink-0 ${
                            hasUnread ? 'text-blue-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 dark:text-zinc-500'
                          }`}>
                            {formatConversationTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-[12px] truncate flex-1 ${
                          hasUnread ? 'font-semibold text-gray-700 dark:text-zinc-200' : 'text-gray-400 dark:text-zinc-500'
                        }`}>
                          {lastMsg ? formatLastMessage(lastMsg, false) : 'Bắt đầu cuộc trò chuyện'}
                        </p>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenConversationMenuId((current) => current === c.id ? null : c.id);
                            }}
                            className={`rounded-md p-1.5 transition ${
                              openConversationMenuId === c.id
                                ? 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                            }`}
                            title="Tùy chọn hội thoại"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openConversationMenuId === c.id && (
                            <div
                              className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleConversationPin(c.id, c.pinned)}
                                disabled={conversationActionId === `pin-${c.id}`}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                {conversationActionId === `pin-${c.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                ) : c.pinned ? (
                                  <PinOff className="h-4 w-4 text-indigo-500" />
                                ) : (
                                  <Pin className="h-4 w-4 text-gray-500" />
                                )}
                                <span>{c.pinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}</span>
                              </button>
                              <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                              <button
                                type="button"
                                onClick={() => handleHideClick(c.id)}
                                disabled={conversationActionId === `hide-${c.id}`}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                {conversationActionId === `hide-${c.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                ) : (
                                  <Lock className="h-4 w-4 text-gray-500" />
                                )}
                                <span>Ẩn trò chuyện</span>
                              </button>
                              <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                              <button
                                type="button"
                                onClick={() => handleDeleteConversation(c.id)}
                                disabled={conversationActionId === `delete-${c.id}`}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                              >
                                {conversationActionId === `delete-${c.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span>Xóa hội thoại</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {hasUnread && (
                          <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 dark:bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Group item
              const g = item.group;
              const isSelected = activeConversation?.id === g.conversationId;
              const groupConversation = g.conversationId ? conversations.find((conversation) => conversation.id === g.conversationId) : null;
              const lastMsg = g.conversationId ? lastMessages[g.conversationId] : undefined;
              const unreadNotifs = notifications.filter(
                (n) => n.referenceId === g.conversationId && !n.read && n.type === 'NEW_MESSAGE'
              );
              const unreadCount = unreadNotifs.length;
              const hasUnread = unreadCount > 0;

              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setOpenConversationMenuId(null);
                    handleOpenGroup(g);
                  }}
                  className={`group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-indigo-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Group Avatar */}
                  <div className="relative shrink-0">
                    {g.avatarUrl ? (
                      <img
                        src={g.avatarUrl}
                        alt={g.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Group badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-[#1e1e2e] rounded-full flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[14px] truncate ${
                        hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-zinc-200'
                      }`}>
                        {g.name}
                        {groupConversation?.pinned && <Pin className="ml-1.5 inline h-3 w-3 text-indigo-500" />}
                      </span>
                      {lastMsg && (
                        <span className={`text-[11px] shrink-0 ${
                          hasUnread ? 'text-blue-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 dark:text-zinc-500'
                        }`}>
                          {formatConversationTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-[12px] truncate flex-1 ${
                          hasUnread ? 'font-semibold text-gray-700 dark:text-zinc-200' : 'text-gray-400 dark:text-zinc-500'
                        }`}>
                          {lastMsg ? formatLastMessage(lastMsg, true) : `${g.memberCount} thành viên`}
                        </p>
                        {g.conversationId && groupConversation && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenConversationMenuId((current) => current === g.conversationId ? null : g.conversationId!);
                              }}
                              className={`rounded-md p-1.5 transition ${
                                openConversationMenuId === g.conversationId
                                  ? 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200'
                                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                              }`}
                              title="Tùy chọn hội thoại"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openConversationMenuId === g.conversationId && (
                              <div
                                className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleConversationPin(g.conversationId!, groupConversation.pinned)}
                                  disabled={conversationActionId === `pin-${g.conversationId}`}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                  {conversationActionId === `pin-${g.conversationId}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                  ) : groupConversation.pinned ? (
                                    <PinOff className="h-4 w-4 text-indigo-500" />
                                  ) : (
                                    <Pin className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span>{groupConversation.pinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}</span>
                                </button>
                                <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                                <button
                                  type="button"
                                  onClick={() => handleHideClick(g.conversationId!)}
                                  disabled={conversationActionId === `hide-${g.conversationId}`}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                  {conversationActionId === `hide-${g.conversationId}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span>Ẩn trò chuyện</span>
                                </button>
                                <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteConversation(g.conversationId!)}
                                  disabled={conversationActionId === `delete-${g.conversationId}`}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                >
                                  {conversationActionId === `delete-${g.conversationId}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  <span>Xóa hội thoại</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      {hasUnread && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 dark:bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-gray-50 dark:bg-zinc-900/60 px-4 py-3 flex items-center gap-3 border-t border-gray-100 dark:border-zinc-800/60 shrink-0 text-left">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[13px] font-bold truncate text-gray-900 dark:text-white m-0">{user.username}</h5>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}
      </section>

      {/* Column 3: Chat Window */}
      <main className={`${(activeConversation || selectedChatRequest) ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-100 dark:bg-discord-dark overflow-hidden relative`}>
        {activeConversation && activeFriend ? (
          <>
            {/* Chat Header */}
            <header className="min-h-14 bg-gray-150 dark:bg-discord-dark border-b border-gray-300 dark:border-zinc-900/50 flex flex-col md:flex-row md:items-center gap-2 px-3 py-2 md:px-4 md:py-0 md:justify-between shrink-0">
              <div className="flex w-full min-w-0 items-center gap-2 text-left md:w-auto md:gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => selectConversation(null)}
                  className="md:hidden p-2 rounded-xl bg-gray-200/65 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition active:scale-95 shrink-0"
                  title="Back to conversations list"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl pr-2 text-left transition hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 md:flex-none"
                  title={isGroupConversation ? 'Xem thông tin nhóm' : 'Xem hồ sơ'}
                >
                  {isGroupConversation ? (
                    activeGroup?.avatarUrl ? (
                      <img src={activeGroup.avatarUrl} alt={activeGroup.name} className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-zinc-800 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/80 dark:bg-discord-blurple/80 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {(activeGroup?.name || activeFriend.username).charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : activeFriend.avatarUrl ? (
                    <img src={activeFriend.avatarUrl} alt={activeFriend.username} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-semibold flex items-center justify-center text-xs shrink-0">
                      {activeFriend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-950 dark:text-white m-0 leading-tight truncate">
                      {isGroupConversation ? (activeGroup?.name || activeFriend.username) : activeFriend.username}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-discord-muted mt-0.5 flex items-center gap-1">
                      {isGroupConversation ? (
                        <>
                          <Users className="w-3 h-3" />
                          <span>{activeGroup?.memberCount ?? '?'} members</span>
                        </>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full ${activeFriend.status === 'AWAY' ? 'bg-amber-500' : activeFriend.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-550'}`} />
                          <span className="capitalize truncate">
                            {activeFriend.status.toLowerCase()}
                            {activeFriend.status === 'OFFLINE' && activeFriend.lastSeen && (
                              <span className="text-[10px] text-gray-400 dark:text-discord-muted ml-1 normal-case font-normal">
                                — Last seen {formatRelativeTime(activeFriend.lastSeen)}
                              </span>
                            )}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 text-gray-500 [-ms-overflow-style:none] [scrollbar-width:none] md:w-auto md:gap-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
                {/* Voice Call Button */}
                {activeConversation && activeCallTarget && (
                  <button
                    onClick={() => initiateCall(activeConversation.id, 'voice', activeCallTarget)}
                    title={isGroupConversation ? 'Cuộc gọi thoại nhóm' : 'Cuộc gọi thoại'}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}

                {/* Video Call Button */}
                {activeConversation && activeCallTarget && (
                  <button
                    onClick={() => initiateCall(activeConversation.id, 'video', activeCallTarget)}
                    title={isGroupConversation ? 'Cuộc gọi video nhóm' : 'Cuộc gọi video'}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                )}

                {activeConversation && (
                  <button
                    onClick={handleSummarizeConversation}
                    disabled={isSummarizingConversation}
                    title="Tóm tắt cuộc trò chuyện"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                  >
                    {isSummarizingConversation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="hidden lg:inline">Tóm tắt</span>
                  </button>
                )}

                {/* Search Message Button */}
                {activeConversation && (
                  <button
                    onClick={() => {
                      setIsSearchPanelOpen(!isSearchPanelOpen);
                      setIsPinnedPanelOpen(false);
                      setIsConversationInfoOpen(false);
                    }}
                    title="Tìm kiếm tin nhắn"
                    className={`shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
                      isSearchPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}

                {isGroupConversation && activeGroup && canInviteToActiveGroup && (
                  <button
                    onClick={() => setIsInviteMembersOpen(true)}
                    title="Mời bạn vào nhóm"
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Pinned Messages Button */}
                {activeConversation && (
                  <button
                    onClick={() => {
                      if (!isPinnedPanelOpen && activeConversation) {
                        fetchPinnedMessages(activeConversation.id).catch((err) => {
                          console.error('Failed to fetch pinned messages when opening panel:', err);
                        });
                      }
                      setIsPinnedPanelOpen(!isPinnedPanelOpen);
                      setIsSearchPanelOpen(false);
                      setIsConversationInfoOpen(false);
                    }}
                    title="Tin nhắn đã ghim"
                    className={`shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
                      isPinnedPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}

                {activeConversation && (
                  <button
                    onClick={() => {
                      setIsConversationInfoOpen((open) => !open);
                      setIsSearchPanelOpen(false);
                      setIsPinnedPanelOpen(false);
                    }}
                    title="Thông tin hội thoại"
                    className={`shrink-0 p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
                      isConversationInfoOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
            </header>

            {/* Pinned Messages Banner */}
            {pinnedMessages && pinnedMessages.length > 0 && (() => {
              const latestPinned = [...pinnedMessages].sort(
                (a, b) => new Date(b.pinnedAt ?? b.createdAt).getTime() - new Date(a.pinnedAt ?? a.createdAt).getTime()
              )[0];
              return (
                <div className={`bg-white dark:bg-discord-dark border-b border-gray-200 dark:border-zinc-800/60 px-3 py-2 flex items-center gap-3 shrink-0 select-none group transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
                  {/* Left accent bar */}
                  <div className="w-0.5 h-8 rounded-full bg-indigo-500 dark:bg-discord-blurple shrink-0" />

                  {/* Pin icon */}
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
                    <Pin className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 fill-current" />
                  </div>

                  {/* Text content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleJumpToMessage(latestPinned.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide shrink-0">
                        Tin nhắn
                      </span>
                      {pinnedMessages.length > 1 && (
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0">
                          ({pinnedMessages.length})
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-800 dark:text-zinc-200 truncate leading-tight mt-0.5">
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">
                        {latestPinned.senderUsername}:
                      </span>{' '}
                      <span className="text-gray-500 dark:text-zinc-400">
                        {latestPinned.isRecalled ? 'Tin nhắn đã bị thu hồi' : latestPinned.content}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {pinnedMessages.length > 1 && (
                      <button
                        onClick={() => setIsPinnedPanelOpen(true)}
                        className="px-2 py-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                        title="Xem tất cả tin nhắn đã ghim"
                      >
                        Xem tất cả
                      </button>
                    )}
                    {canPinMessage(latestPinned) && (
                    <button
                      onClick={() => togglePinMessage(latestPinned.id, true)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                      title="Bỏ ghim"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {activeConversationSummary && (
              <div className={`border-b border-indigo-100 bg-indigo-50/80 px-4 py-3 text-left dark:border-indigo-500/20 dark:bg-indigo-500/10 transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-white p-1.5 text-indigo-600 shadow-sm dark:bg-zinc-900/80 dark:text-indigo-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="m-0 text-sm font-bold text-indigo-700 dark:text-indigo-200">Tóm tắt cuộc trò chuyện</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-500 dark:bg-zinc-900/70 dark:text-indigo-300">
                        {activeConversationSummary.sourceMessageCount} tin nhắn
                      </span>
                    </div>
                    <p className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-zinc-200">
                      {activeConversationSummary.summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className={`flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse transition-[margin] duration-300 ${conversationInfoOffsetClass}`}
            >
              <div ref={messagesEndRef} />

              {visibleMessages.map((msg: MessageResponse, index: number) => {
                const isMe = msg.senderId === user?.id;
                const nextMsg = visibleMessages[index + 1];
                const showDivider = !nextMsg ||
                  new Date(msg.createdAt).toDateString() !== new Date(nextMsg.createdAt).toDateString();

                // In group chat, show sender names above non-self messages
                const prevMsg = visibleMessages[index - 1];
                const showSenderName = isGroupConversation && !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                // Find parent message if replied to
                const parentMessage = msg.parentId ? visibleMessages.find((m) => m.id === msg.parentId) : null;
                const isCallLog = isCallHistoryMessage(msg);
                const callMetadata = msg.metadata as any;

                return (
                  <div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className="relative group flex flex-col space-y-1 py-1.5 px-3 rounded-lg transition-colors hover:bg-gray-150/20 dark:hover:bg-zinc-800/10"
                  >
                    {showDivider && (
                      <div className="flex items-center justify-center my-4 shrink-0 select-none">
                        <div className="flex-1 h-px bg-gray-250 dark:bg-zinc-800/80" />
                        <span className="px-3 text-[10px] font-bold text-gray-500 dark:text-discord-muted bg-gray-100 dark:bg-discord-dark uppercase tracking-wider">
                          {formatDividerDate(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-gray-250 dark:bg-zinc-800/80" />
                      </div>
                    )}

                    {msg.messageType === 'SYSTEM' ? (
                      <div className="flex justify-center py-1.5 select-none">
                        {isCallLog ? (
                          <div className="w-full max-w-[min(86vw,560px)] rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 text-center text-gray-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-300">
                            <button
                              type="button"
                              onClick={() => setExpandedCallLogId(expandedCallLogId === msg.id ? null : msg.id)}
                              className="mx-auto flex max-w-full items-center justify-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-300"
                              title="Xem chi tiết cuộc gọi"
                            >
                              {callMetadata?.callType === 'VIDEO' ? (
                                <Video className="h-4 w-4 text-indigo-500" />
                              ) : (
                                <Phone className="h-4 w-4 text-indigo-500" />
                              )}
                              <span className="truncate">{getCallHistorySummary(msg)}</span>
                            </button>

                            {expandedCallLogId === msg.id && (
                              <div className="mt-3 border-t border-gray-200 pt-3 text-left text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <p className="m-0 font-bold text-gray-700 dark:text-zinc-200">Thời gian gọi</p>
                                    <p className="m-0 mt-0.5">{formatCallLogTime(callMetadata?.startedAt)}</p>
                                  </div>
                                  <div>
                                    <p className="m-0 font-bold text-gray-700 dark:text-zinc-200">Thời lượng</p>
                                    <p className="m-0 mt-0.5">{getCallHistoryDetailStatus(callMetadata)}</p>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <p className="m-0 mb-2 font-bold text-gray-700 dark:text-zinc-200">
                                    Thành viên đã tham gia ({callMetadata?.participantCount ?? callMetadata?.participants?.length ?? 0})
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {(callMetadata?.participants ?? []).map((participant: any) => (
                                      <span
                                        key={participant.id}
                                        className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
                                      >
                                        {participant.avatarUrl ? (
                                          <img src={participant.avatarUrl} alt={participant.username} className="h-5 w-5 rounded-full object-cover" />
                                        ) : (
                                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                                            {(participant.username || '?').charAt(0).toUpperCase()}
                                          </span>
                                        )}
                                        <span className="truncate">{participant.username}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {activeConversation && activeCallTarget && (
                                  <div className="mt-3 flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => initiateCall(
                                        activeConversation.id,
                                        callMetadata?.callType === 'VIDEO' ? 'video' : 'voice',
                                        activeCallTarget
                                      )}
                                      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                                    >
                                      {callMetadata?.callType === 'VIDEO' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                                      <span>Gọi lại</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex max-w-[min(86vw,520px)] items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-gray-600 shadow-sm ring-1 ring-gray-200 dark:bg-zinc-900/95 dark:text-zinc-200 dark:ring-zinc-700">
                            <Pin className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                            <span className="min-w-0 truncate">
                              <span className="font-semibold">
                                {isMe ? 'Bạn' : msg.senderUsername}
                              </span>{' '}
                              {msg.content}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : msg.messageType === 'POLL' ? (
                      <div className="flex justify-center py-2">
                        {(() => {
                          const metadata = getPollMetadata(msg);
                          const options = metadata.options ?? [];
                          const totalVotes = options.reduce((sum, option) => sum + (option.voterIds?.length ?? 0), 0);
                          const isExpired = Boolean(metadata.expiresAt && new Date(metadata.expiresAt).getTime() <= Date.now());
                          const isLocked = Boolean(metadata.locked || isExpired || msg.isRecalled);
                          const canManagePoll = msg.senderId === user?.id ||
                            isGroupModeratorRole(currentGroupMembership?.role);

                          if (msg.isRecalled) {
                            return (
                              <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 text-center text-sm text-gray-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-400">
                                Bình chọn đã bị xóa
                              </div>
                            );
                          }

                          return (
                            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                              <div className="border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                      <ListChecks className="h-3.5 w-3.5" />
                                      <span>Bình chọn</span>
                                      {msg.isPinned && <span>• Đã ghim</span>}
                                    </div>
                                    <h4 className="m-0 text-base font-bold text-gray-950 dark:text-white">{metadata.question || msg.content}</h4>
                                    <p className="m-0 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                                      {metadata.allowMultiple ? 'Có thể chọn nhiều phương án' : 'Chọn một phương án'}
                                      {metadata.anonymous ? ' • Ẩn danh' : ''}
                                      {metadata.expiresAt ? ` • Hạn ${formatCallLogTime(metadata.expiresAt)}` : ''}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    {canPinMessage(msg) && (
                                      <button
                                        type="button"
                                        onClick={() => togglePinMessage(msg.id, !!msg.isPinned)}
                                        className={`rounded-full p-1.5 transition ${
                                          msg.isPinned
                                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                        }`}
                                        title={msg.isPinned ? 'Bo ghim binh chon' : 'Ghim binh chon'}
                                      >
                                        {msg.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                      </button>
                                    )}
                                  {isLocked && (
                                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                                      Đã khóa
                                    </span>
                                  )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 px-4 py-3">
                                {options.map((option) => {
                                  const voteCount = option.voterIds?.length ?? 0;
                                  const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                  const selected = Boolean(user?.id && option.voterIds?.includes(user.id));
                                  return (
                                    <div key={option.id} className="rounded-xl border border-gray-200 bg-gray-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-950/50">
                                      <div className="flex w-full items-center gap-3 text-left">
                                        <button
                                          type="button"
                                          onClick={() => !isLocked && handlePollVote(msg.id, option.id)}
                                          disabled={isLocked || pollActionMessageId === msg.id}
                                          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                                        >
                                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                            selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                                          }`}>
                                            {selected && <Check className="h-3.5 w-3.5" />}
                                          </span>
                                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{option.text}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            if (!metadata.anonymous) {
                                              setPollVoterDialog({ option, anonymous: Boolean(metadata.anonymous) });
                                            }
                                          }}
                                          className={`shrink-0 text-xs font-bold ${metadata.anonymous ? 'cursor-default text-gray-400' : 'text-indigo-600 hover:underline dark:text-indigo-300'}`}
                                          disabled={metadata.anonymous}
                                          title={metadata.anonymous ? 'Bình chọn ẩn danh' : 'Xem người đã chọn'}
                                        >
                                          {voteCount} vote
                                        </button>
                                      </div>
                                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
                                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
                                      </div>
                                      {!metadata.anonymous && (option.voters?.length ?? 0) > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                          <div className="flex -space-x-2">
                                            {(option.voters ?? []).slice(-6).map((voter) => (
                                              voter.avatarUrl ? (
                                                <img
                                                  key={voter.id}
                                                  src={voter.avatarUrl}
                                                  alt={voter.username}
                                                  className="h-6 w-6 rounded-full border-2 border-white object-cover shadow-sm dark:border-zinc-950"
                                                  title={voter.username}
                                                />
                                              ) : (
                                                <div
                                                  key={voter.id}
                                                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-[10px] font-bold text-white shadow-sm dark:border-zinc-950"
                                                  title={voter.username}
                                                >
                                                  {voter.username.charAt(0).toUpperCase()}
                                                </div>
                                              )
                                            ))}
                                          </div>
                                          {(option.voters?.length ?? 0) > 6 && (
                                            <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                                              +{(option.voters?.length ?? 0) - 6}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {metadata.allowAddOptions && !isLocked && (
                                <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
                                  <input
                                    value={pollNewOptionText[msg.id] ?? ''}
                                    onChange={(event) => setPollNewOptionText((values) => ({ ...values, [msg.id]: event.target.value }))}
                                    placeholder="Thêm lựa chọn..."
                                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddPollOption(msg.id)}
                                    disabled={pollActionMessageId === msg.id || !pollNewOptionText[msg.id]?.trim()}
                                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    Thêm
                                  </button>
                                </div>
                              )}

                              {canManagePoll && !isLocked && (
                                <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => handleLockPoll(msg.id)}
                                    disabled={pollActionMessageId === msg.id}
                                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                  >
                                    Khóa bình chọn
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePoll(msg.id)}
                                    disabled={pollActionMessageId === msg.id}
                                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <>
                    {/* Quoted Message / Reply Preview above bubble */}
                    {msg.parentId && (
                      <div className={`flex mb-1 max-w-[min(85vw,26rem)] ${isMe ? 'self-end mr-11' : 'ml-11'}`}>
                        <div 
                          className="flex w-full bg-gray-100 dark:bg-zinc-800/80 rounded-lg border-l-[3px] border-indigo-400 dark:border-indigo-500 overflow-hidden hover:brightness-95 transition cursor-pointer"
                          onClick={() => msg.parentId && handleJumpToMessage(msg.parentId)}
                        >
                          <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-hidden w-full">
                            <CornerUpLeft className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400 shrink-0" />
                            <span className="text-[12.5px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              @{parentMessage ? parentMessage.senderUsername : 'tin nhắn cũ'}
                            </span>
                            <span className="text-[12.5px] text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 min-w-0">
                              {parentMessage ? (
                                parentMessage.isRecalled ? (
                                  <span className="truncate">Tin nhắn đã bị thu hồi</span>
                                ) : (
                                  <>
                                    {parentMessage.content && <span className="truncate">{stripMessageMarkup(parentMessage.content)}</span>}
                                    {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                                      <span className="flex items-center gap-1 opacity-80 font-medium shrink-0">
                                        {parentMessage.attachments[0].type === 'IMAGE' && (
                                          <img src={parentMessage.attachments[0].url} alt="attachment" className="w-4 h-4 object-cover rounded-sm shrink-0" />
                                        )}
                                        <span>
                                          {parentMessage.attachments[0].type === 'IMAGE' ? '[Hình ảnh]' : parentMessage.attachments[0].type === 'VIDEO' ? '[Video]' : '[Tệp đính kèm]'}
                                        </span>
                                      </span>
                                    )}
                                  </>
                                )
                              ) : (
                                <span className="truncate">tin nhắn đã bị xoá hoặc không tìm thấy</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`flex gap-3 max-w-lg sm:max-w-xl md:max-w-2xl ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      {/* Avatar for non-self messages */}
                      {!isMe && (
                        <div className="shrink-0 mt-0.5">
                          {(() => {
                            const avatarUrl = isGroupConversation
                              ? getSenderAvatar(msg)
                              : activeFriend.avatarUrl;
                            const senderName = isGroupConversation
                              ? getSenderUsername(msg)
                              : activeFriend.username;
                            return avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-850"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
                                {senderName.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      <div className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Show sender name in group chat */}
                        {showSenderName && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-discord-blurple mb-1 ml-0.5">
                            {getSenderUsername(msg)}
                          </span>
                        )}

                        {/* Message Content Bubble Wrapper */}
                        <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Context menu actions bar */}
                          {(hoveredMessageId === msg.id || activeMenuMessageId === msg.id) && !msg.isRecalled && (
                            <div
                              className={`absolute z-20 animate-in fade-in zoom-in-95 duration-100 bottom-full mb-1 md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${
                                isMe 
                                  ? 'right-0 md:right-[calc(100%+8px)] md:left-auto' 
                                  : 'left-0 md:left-[calc(100%+8px)] md:right-auto'
                              }`}
                            >
                              <MessageActionsBar
                                message={msg}
                                isMe={isMe}
                                onReply={() => setReplyTo(msg)}
                                onEdit={() => {
                                  setEditingMessageId(msg.id);
                                  setEditInputText(stripMessageMarkup(msg.content));
                                }}
                                onRecall={() => {
                                  if (confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) {
                                    recallMessage(msg.id);
                                  }
                                }}
                                onDelete={() => {
                                  if (confirm('Bạn có muốn xoá tin nhắn này ở phía bạn?')) {
                                    deleteMessage(msg.id);
                                  }
                                }}
                                onPinToggle={() => togglePinMessage(msg.id, !!msg.isPinned)}
                                onShare={() => setSharingMessage(msg)}
                                canPin={canPinMessage(msg)}
                                canRecall={canRecallMessageInActiveConversation(msg)}
                                onMenuOpenChange={(isOpen) => setActiveMenuMessageId(isOpen ? msg.id : null)}
                              />
                            </div>
                          )}

                          {msg.forwardedFromMessageId && (
                            <div className="inline-flex max-w-[180px] sm:max-w-[240px] items-center gap-1.5 text-[11px] text-gray-500 dark:text-discord-muted mb-1">
                              <CornerUpLeft className="w-3 h-3 rotate-180 text-gray-400 dark:text-zinc-550 shrink-0" />
                              <span className="truncate">
                                Tin chuyển tiếp{msg.forwardedFromSenderUsername ? ` từ ${msg.forwardedFromSenderUsername}` : ''}
                              </span>
                            </div>
                          )}

                          {msg.isRecalled ? (
                            <div className={`w-fit max-w-[min(80vw,28rem)] p-3 rounded-2xl text-sm leading-relaxed text-left break-words shadow-sm italic text-gray-550 dark:text-zinc-500 ${
                              isMe
                                ? 'bg-indigo-650/20 dark:bg-discord-blurple/10 text-gray-450 dark:text-zinc-500 rounded-tr-none'
                                : 'bg-gray-200/50 dark:bg-discord-mid/50 text-gray-550 dark:text-zinc-555 rounded-tl-none border border-gray-300/20 dark:border-zinc-850/30'
                            }`}>
                              <span>Tin nhắn đã bị thu hồi</span>
                            </div>
                          ) : msg.attachments && msg.attachments.length > 0 ? (
                            <div className={`w-fit max-w-[min(80vw,28rem)] p-2 rounded-2xl text-sm shadow-sm ${
                              isMe
                                ? 'bg-indigo-600 dark:bg-discord-blurple text-white rounded-tr-none'
                                : 'bg-gray-250 dark:bg-discord-mid text-gray-900 dark:text-discord-text rounded-tl-none border border-gray-300/40 dark:border-zinc-850/60'
                            }`}>
                              <div className={`grid gap-1.5 ${
                                msg.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                              }`}>
                                {msg.attachments.map((attachment, index) => {
                                  if (attachment.type === 'IMAGE' || attachment.type === 'VIDEO') {
                                    const mediaType = attachment.type;
                                    return (
                                      <button
                                        type="button"
                                        key={`${attachment.url}-${index}`}
                                        onClick={() => setActiveMedia({ url: attachment.url, type: mediaType, name: attachment.name ?? undefined })}
                                        className={`block text-left overflow-hidden bg-black/10 w-full cursor-zoom-in ${
                                          msg.attachments!.length === 1 ? 'rounded-xl' : 'rounded-lg'
                                        }`}
                                        title={attachment.name || getFileName(attachment.url)}
                                      >
                                        {attachment.type === 'IMAGE' ? (
                                          <img
                                            src={attachment.url}
                                            alt={attachment.name || 'Shared image'}
                                            className="w-full max-h-72 object-cover"
                                          />
                                        ) : (
                                          <div className="relative group w-full max-h-72 bg-black flex items-center justify-center aspect-video">
                                            <video
                                              src={attachment.url}
                                              className="w-full max-h-72 bg-black"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                                              <Video className="w-10 h-10 text-white drop-shadow-md" />
                                            </div>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <a
                                        key={`${attachment.url}-${index}`}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block overflow-hidden bg-black/10 ${
                                          msg.attachments!.length === 1 ? 'rounded-xl' : 'rounded-lg'
                                        }`}
                                        title={attachment.name || getFileName(attachment.url)}
                                      >
                                        <div className={`flex items-center gap-3 p-3 min-w-[220px] ${
                                          isMe ? 'text-white' : 'text-gray-900 dark:text-white'
                                        }`}>
                                          <FileText className="w-5 h-5 shrink-0" />
                                          <span className="text-xs font-semibold truncate">
                                            {attachment.name || getFileName(attachment.url)}
                                          </span>
                                        </div>
                                      </a>
                                    );
                                  }
                                })}
                              </div>
                              {msg.content && (
                                <div className="mt-2 px-1">
                                  {renderFormattedMessage(msg.content)}
                                </div>
                              )}
                            </div>
                          ) : msg.messageType === 'IMAGE' ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-zinc-800 shadow-sm max-w-[280px] sm:max-w-[360px] bg-black/5 dark:bg-black/25">
                              <button
                                type="button"
                                onClick={() => setActiveMedia({ url: msg.content, type: 'IMAGE' })}
                                className="w-full h-full p-0 border-0 outline-none"
                              >
                                <img
                                  src={msg.content}
                                  alt="Shared Image"
                                  className="max-h-72 w-full object-contain hover:opacity-95 transition-opacity cursor-zoom-in"
                                />
                              </button>
                            </div>
                          ) : msg.messageType === 'VIDEO' ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-zinc-800 shadow-sm max-w-[280px] sm:max-w-[360px] bg-black">
                              <button
                                type="button"
                                onClick={() => setActiveMedia({ url: msg.content, type: 'VIDEO' })}
                                className="relative group w-full p-0 border-0 outline-none flex items-center justify-center aspect-video cursor-zoom-in"
                              >
                                <video
                                  src={msg.content}
                                  className="max-h-72 w-full object-contain"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                                  <Video className="w-10 h-10 text-white drop-shadow-md" />
                                </div>
                              </button>
                            </div>
                          ) : msg.messageType === 'FILE' ? (
                            <div className={`flex items-center gap-3 p-3 rounded-2xl border text-sm max-w-xs sm:max-w-sm ${
                              isMe
                                ? 'bg-indigo-600/90 dark:bg-discord-blurple/95 border-indigo-500/50 dark:border-discord-blurple/50 text-white rounded-tr-none'
                                : 'bg-gray-250 dark:bg-discord-mid border-gray-300/65 dark:border-zinc-850 text-gray-900 dark:text-white rounded-tl-none shadow-sm'
                            }`}>
                              <div className={`p-2.5 rounded-xl shrink-0 ${isMe ? 'bg-indigo-750 dark:bg-discord-blurple/70 text-white' : 'bg-gray-300 dark:bg-zinc-800 text-indigo-600 dark:text-discord-blurple'}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-semibold text-xs truncate m-0" title={getFileName(msg.content)}>
                                  {getFileName(msg.content)}
                                </p>
                                <span className="text-[10px] opacity-75">
                                  Document File
                                </span>
                              </div>
                              <a
                                href={msg.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className={`p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition shrink-0 ${isMe ? 'text-white' : 'text-gray-550 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white'}`}
                                title="Download File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          ) : editingMessageId === msg.id ? (
                            /* Edit Mode: Clean standalone edit panel outside the bubble */
                            <div className="flex flex-col gap-2 min-w-[260px] max-w-full">
                              <textarea
                                value={editInputText}
                                onChange={(e) => {
                                  setEditInputText(e.target.value);
                                  // Auto-resize
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(msg.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessageId(null);
                                  }
                                }}
                                rows={2}
                                className="w-full bg-white dark:bg-zinc-800 border-2 border-indigo-400 dark:border-indigo-500 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 resize-none shadow-sm transition-colors leading-relaxed"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                                >
                                  Huỷ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-lg transition-colors shadow-sm"
                                >
                                  Lưu
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`w-fit max-w-[min(80vw,28rem)] p-3 rounded-2xl text-sm leading-relaxed text-left break-words shadow-sm ${
                              isMe
                                ? 'bg-indigo-600 dark:bg-discord-blurple text-white rounded-tr-none'
                                : 'bg-gray-250 dark:bg-discord-mid text-gray-900 dark:text-discord-text rounded-tl-none border border-gray-300/40 dark:border-zinc-850/60'
                            }`}>
                              <div className="m-0">
                                {renderFormattedMessage(msg.content)}
                                {msg.isEdited && (
                                  <span className="text-[10px] text-gray-400 dark:text-discord-muted ml-1.5" title={msg.editedAt ? `Chỉnh sửa lúc: ${new Date(msg.editedAt).toLocaleString()}` : ''}>
                                    (đã chỉnh sửa)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {(hoveredMessageId === msg.id || activeMenuMessageId === msg.id) && !msg.isRecalled && (
                            <div className="absolute -bottom-3 right-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <MessageReactionButton
                                onReact={(emoji) => reactToMessage(msg.id, emoji)}
                                align={isMe ? 'right' : 'left'}
                                onOpenChange={(isOpen) => setActiveMenuMessageId(isOpen ? msg.id : null)}
                              />
                            </div>
                          )}

                          {/* Reactions list component (Zalo-style corner placement) */}
                          {!msg.isRecalled && msg.reactions && msg.reactions.length > 0 && (
                            <div className="absolute -bottom-2 right-9 z-10">
                              <MessageReactions
                                reactions={msg.reactions}
                                currentUserId={user?.id ?? ''}
                                onReactToggle={(emoji) => reactToMessage(msg.id, emoji)}
                                isMe={isMe}
                              />
                            </div>
                          )}
                        </div>

                        {/* Status block */}
                        <span className={`text-[10px] text-gray-550 dark:text-discord-muted mt-1 ${
                          msg.reactions && msg.reactions.length > 0 ? 'pt-2.5' : ''
                        } ${isMe ? 'text-right' : 'text-left'} flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {msg.isPinned && (
                            <Pin className="w-3 h-3 text-amber-500 fill-current mr-0.5 shrink-0" aria-label="Đã ghim" />
                          )}
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMe && (
                            <span className="inline-flex shrink-0" title={getMessageStatus(msg).toLowerCase()}>
                              {getMessageStatus(msg) === 'SEEN' && (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                              )}
                              {getMessageStatus(msg) === 'DELIVERED' && (
                                <CheckCheck className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                              )}
                              {getMessageStatus(msg) === 'SENT' && (
                                <Check className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-555" />
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                );
              })}

              {hasMoreMessages && (
                <div ref={sentinelRef} className="flex justify-center py-3 shrink-0 w-full select-none">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold py-1.5 px-3 bg-indigo-50/50 dark:bg-zinc-800/50 border border-indigo-100/30 dark:border-zinc-800/40 rounded-full">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tải tin nhắn cũ hơn...</span>
                  </div>
                </div>
              )}
            </div>

            {showScrollToLatest && (
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                className={`absolute bottom-28 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-100 bg-white/95 px-4 py-2 text-sm font-bold text-indigo-600 shadow-lg shadow-indigo-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-indigo-50 active:translate-y-0 dark:border-indigo-500/20 dark:bg-zinc-900/95 dark:text-indigo-300 dark:hover:bg-zinc-800 ${conversationInfoOffsetClass}`}
                title="Cuộn về tin nhắn mới nhất"
              >
                <ArrowDown className="h-4 w-4" />
                <span>Cuộn về tin nhắn mới nhất</span>
              </button>
            )}

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
                        {selectedChatRequest.message}
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
            <form onSubmit={handleSendMessage} className={`p-4 bg-gray-100 dark:bg-discord-dark shrink-0 transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
              {/* Reply Preview */}
              {replyTo && (
                <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
              )}

              {activePrivateChatBlocked && (
                <div className="mb-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
                  <div className="font-semibold">
                    {activePrivateChatBlockedByMe ? 'Bạn đã chặn người này.' : 'Người này đã chặn bạn.'}
                  </div>
                  <div className="mt-0.5 text-xs text-rose-700 dark:text-rose-200/80">
                    {activePrivateChatBlockedByMe
                      ? 'Bạn vẫn xem được lịch sử trò chuyện. Bỏ chặn nếu muốn tiếp tục nhắn tin.'
                      : 'Bạn vẫn xem được lịch sử trò chuyện nhưng không thể gửi tin nhắn.'}
                  </div>
                </div>
              )}

              {!canSendInActiveConversation && !activePrivateChatBlocked && (
                <div className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="font-semibold">Hai bạn không còn là bạn bè.</div>
                  <div className="mt-0.5 text-xs text-amber-700 dark:text-amber-200/80">
                    Bạn vẫn xem được lịch sử trò chuyện. Nhập lời nhắn bên dưới để gửi tin nhắn chờ nếu muốn tiếp tục.
                  </div>
                  {pendingAttachments.length > 0 && (
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-200/80">
                      Tin nhắn chờ hiện chỉ gửi nội dung văn bản.
                    </div>
                  )}
                </div>
              )}

              {/* Attachment Preview Panel */}
              {pendingAttachments.length > 0 && (
                <div className={`bg-white dark:bg-discord-mid border border-gray-300 dark:border-zinc-900/60 p-3 border-b-0 animate-fadeIn ${
                  replyTo ? 'border-t-0' : 'rounded-t-2xl'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {pendingAttachments.filter((attachment) => attachment.type === 'IMAGE').length > 0
                        ? `${pendingAttachments.filter((attachment) => attachment.type === 'IMAGE').length} ảnh`
                        : `${pendingAttachments.length} tệp`}
                    </span>
                    <button
                      type="button"
                      onClick={resetUploadState}
                      className="text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-rose-500 transition"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative w-[90px] h-[90px] rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 overflow-hidden group"
                        title={attachment.name}
                      >
                        {attachment.type === 'IMAGE' && attachment.previewUrl ? (
                          <img src={attachment.previewUrl} alt={attachment.name} className="w-full h-full object-cover" />
                        ) : attachment.type === 'VIDEO' ? (
                          <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-discord-blurple">
                            <Video className="w-7 h-7" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-discord-blurple">
                            <FileText className="w-7 h-7" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removePendingAttachment(attachment.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          title="Xóa"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {attachment.isUploading && (
                          <div className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-black/20 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all"
                              style={{ width: `${attachment.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      disabled={!canSendInActiveConversation}
                      onClick={() => {
                        if (!canSendInActiveConversation) return;
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = 'image/*,video/*';
                          fileInputRef.current.click();
                        }
                      }}
                      className="w-[90px] h-[90px] rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-650 bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400 dark:hover:border-discord-blurple disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:border-gray-300 flex items-center justify-center transition"
                      title="Thêm ảnh hoặc video"
                    >
                      <Plus className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              )}

              {/* Toolbar & Input Box Container */}
              <div className={`bg-white dark:bg-discord-mid border border-gray-300 dark:border-zinc-900/60 flex flex-col ${
                (pendingAttachments.length > 0 || replyTo) ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'
              } overflow-hidden focus-within:border-indigo-600 dark:focus-within:border-discord-blurple focus-within:ring-1 focus-within:ring-indigo-600 dark:focus-within:ring-discord-blurple transition-all`}>
                
                {/* Top Toolbar Row */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200/80 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-0.5">
                    {/* Sticker/Smile */}
                    <button
                      type="button"
                      disabled={!canSendInActiveConversation}
                      onClick={() => {
                        setEmojiStickerTab('sticker');
                        setIsEmojiStickerOpen((open) => !open);
                      }}
                      className={`p-1.5 rounded transition disabled:opacity-45 disabled:hover:bg-transparent ${
                        isEmojiStickerOpen && emojiStickerTab === 'sticker'
                          ? 'bg-indigo-100 text-indigo-650 dark:bg-discord-blurple/20 dark:text-white'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
                      }`}
                      title="Sticker"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Image attachment */}
                    <button
                      type="button"
                      disabled={!canSendInActiveConversation}
                      onClick={() => {
                        if (!canSendInActiveConversation) return;
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/*,video/*";
                          fileInputRef.current.click();
                        }
                      }}
                      className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
                      title="Send Images or Videos"
                    >
                      <Image className="w-4 h-4" />
                    </button>

                    {/* File attachment */}
                    <button
                      type="button"
                      disabled={!canSendInActiveConversation}
                      onClick={() => {
                        if (!canSendInActiveConversation) return;
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = ".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
                          fileInputRef.current.click();
                        }
                      }}
                      className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
                      title="Send Files"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Contact card */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Send Contact Card">
                      <User className="w-4 h-4" />
                    </button>

                    {/* Screenshot */}
                    <button
                      type="button"
                      disabled={!canSendInActiveConversation || isTakingScreenshot}
                      onClick={handleTakeScreenshot}
                      className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
                      title="Chụp màn hình"
                    >
                      {isTakingScreenshot ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Crop className="w-4 h-4" />
                      )}
                    </button>

                    {/* Formatting */}
                    <button
                      type="button"
                      onClick={() => setIsFormattingOpen((open) => !open)}
                      className={`p-1.5 rounded transition ${
                        isFormattingOpen
                          ? 'bg-indigo-100 text-indigo-650 dark:bg-discord-blurple/20 dark:text-white'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
                      }`}
                      title="Text Formatting"
                    >
                      <Type className="w-4 h-4" />
                    </button>

                    {/* Quick message */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Quick Message Templates">
                      <Zap className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={!canSendInActiveConversation || !isGroupConversation || !isGroupModeratorRole(currentGroupMembership?.role)}
                      onClick={() => setIsCreatePollOpen(true)}
                      className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
                      title={isGroupConversation ? 'Tạo bình chọn' : 'Bình chọn chỉ dùng trong nhóm'}
                    >
                      <ListChecks className="w-4 h-4" />
                    </button>

                    {/* Credit card */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Send Gift/Card">
                      <CreditCard className="w-4 h-4" />
                    </button>

                    {/* More */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="More Options">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isFormattingOpen && (
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-discord-mid overflow-x-auto">
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('**', '**', 'đậm'); }} className={`p-1.5 rounded transition ${activeFormats.bold ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Đậm">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('_', '_', 'nghiêng'); }} className={`p-1.5 rounded transition ${activeFormats.italic ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Nghiêng">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('<u>', '</u>', 'gạch chân'); }} className={`p-1.5 rounded transition ${activeFormats.underline ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Gạch chân">
                      <Underline className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('~~', '~~', 'gạch ngang'); }} className={`p-1.5 rounded transition ${activeFormats.strike ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Gạch ngang">
                      <Strikethrough className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('<mark>', '</mark>', 'đánh dấu'); }} className={`p-1.5 rounded transition ${activeFormats.background ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Đánh dấu">
                      <Highlighter className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('`', '`', 'code'); }} className={`p-1.5 rounded transition ${activeFormats.code ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Code">
                      <Code className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('[', '](https://)', 'liên kết'); }} className={`p-1.5 rounded transition ${activeFormats.link ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Liên kết">
                      <Link className="w-4 h-4" />
                    </button>
                    <span className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyLineFormat('> '); }} className={`p-1.5 rounded transition ${activeFormats.blockquote ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Trích dẫn">
                      <Quote className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyLineFormat('- '); }} className={`p-1.5 rounded transition ${activeFormats.list === 'bullet' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Danh sách">
                      <List className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyNumberedList(); }} className={`p-1.5 rounded transition ${activeFormats.list === 'ordered' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Danh sách số">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <span className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyAlignment('left'); }} className={`p-1.5 rounded transition ${!activeFormats.align || activeFormats.align === 'left' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Căn trái">
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyAlignment('center'); }} className={`p-1.5 rounded transition ${activeFormats.align === 'center' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Căn giữa">
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyAlignment('right'); }} className={`p-1.5 rounded transition ${activeFormats.align === 'right' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Căn phải">
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <span className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} className="p-1.5 rounded text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Xóa định dạng">
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isEmojiStickerOpen && (
                  <div className="border-b border-gray-200/80 bg-white px-3 py-3 dark:border-zinc-800/80 dark:bg-discord-mid">
                    <div className="mb-3 inline-flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-900">
                      <button
                        type="button"
                        onClick={() => setEmojiStickerTab('emoji')}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                          emojiStickerTab === 'emoji'
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                      >
                        Emoji
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmojiStickerTab('sticker')}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                          emojiStickerTab === 'sticker'
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                      >
                        Sticker
                      </button>
                    </div>

                    {emojiStickerTab === 'emoji' ? (
                      <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleSelectEmoji(emoji)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-gray-100 dark:hover:bg-zinc-800"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {stickerOptions.map((sticker) => (
                          <button
                            key={sticker.label}
                            type="button"
                            onClick={() => handleSendSticker(sticker.value)}
                            className="min-h-16 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                            title={`Gửi ${sticker.label}`}
                          >
                            <span className="block text-xl">{sticker.value}</span>
                            <span className="mt-1 block truncate text-[11px] font-semibold text-gray-500 dark:text-zinc-400">{sticker.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Input Text Area Row */}
                <div className="flex items-end gap-2 p-2 bg-white dark:bg-discord-mid">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={groupAvatarInputRef}
                    onChange={handleGroupAvatarSelected}
                    accept="image/*"
                    className="hidden"
                  />

                  <div
                    className="min-w-0 flex-1"
                    onPasteCapture={handleInputPaste}
                    onKeyDownCapture={(e) => {
                      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
                        e.preventDefault();
                        setIsFormattingOpen((open) => !open);
                        return;
                      }

                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (canSendInActiveConversation) {
                          handleSendMessage(e);
                        } else if (activePrivateChatBlocked) {
                          return;
                        } else {
                          handleSendBlockedChatRequest();
                        }
                      }
                    }}
                  >
                    <div ref={quillEditorRef} className="nextalk-quill-input" />
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pb-1">
                    {/* Emoji smile face */}
                    <button
                      type="button"
                      disabled={!canSendInActiveConversation}
                      onClick={() => {
                        setEmojiStickerTab('emoji');
                        setIsEmojiStickerOpen((open) => !open);
                      }}
                      className={`p-1.5 rounded-lg transition disabled:opacity-45 disabled:hover:bg-transparent ${
                        isEmojiStickerOpen && emojiStickerTab === 'emoji'
                          ? 'bg-indigo-100 text-indigo-650 dark:bg-discord-blurple/20 dark:text-white'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
                      }`}
                      title="Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    {/* ThumbsUp or Send */}
                    {(!inputMessage.trim() && pendingAttachments.length === 0) ? (
                      <button
                        type="button"
                        onClick={handleSendThumbsUp}
                        disabled={!canSendInActiveConversation}
                        className="p-1.5 text-amber-500 hover:text-amber-600 dark:hover:text-amber-450 rounded-lg hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:bg-transparent transition active:scale-90"
                        title="Send Like"
                      >
                        <ThumbsUp className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type={canSendInActiveConversation ? 'submit' : 'button'}
                        onClick={!canSendInActiveConversation ? handleSendBlockedChatRequest : undefined}
                        disabled={
                          canSendInActiveConversation
                            ? pendingAttachments.some((attachment) => attachment.isUploading)
                            : activePrivateChatBlocked || !inputMessage.trim() || isSendingBlockedChatRequest
                        }
                        className="p-2 bg-indigo-600 dark:bg-discord-blurple hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-xl active:scale-95 disabled:opacity-50 disabled:scale-100 transition shadow"
                        title={canSendInActiveConversation ? 'Send Message' : 'Gửi tin nhắn chờ'}
                      >
                        {isSendingBlockedChatRequest ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <aside
              className={`absolute bottom-0 right-0 top-14 z-30 w-full border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-zinc-800 dark:bg-discord-mid md:w-[360px] xl:w-[25vw] ${
                isConversationInfoOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
              }`}
              aria-hidden={!isConversationInfoOpen}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
                  <h3 className="m-0 text-sm font-bold text-gray-950 dark:text-white">Thông tin hội thoại</h3>
                  <button
                    type="button"
                    onClick={() => setIsConversationInfoOpen(false)}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                    title="Đóng"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                  <section className="flex flex-col items-center text-center">
                    {isGroupConversation ? (
                      activeGroup?.avatarUrl ? (
                        <img
                          src={activeGroup.avatarUrl}
                          alt={activeGroup.name}
                          className="h-20 w-20 rounded-2xl object-cover shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-sm">
                          {(activeGroup?.name || activeFriend.username).charAt(0).toUpperCase()}
                        </div>
                      )
                    ) : activeFriend.avatarUrl ? (
                      <img
                        src={activeFriend.avatarUrl}
                        alt={activeFriend.username}
                        className="h-20 w-20 rounded-full object-cover shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shadow-sm">
                        {activeFriend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="mt-3 max-w-full rounded-lg px-2 py-1 text-lg font-bold text-gray-950 transition hover:bg-gray-100 dark:text-white dark:hover:bg-zinc-800"
                      title={isGroupConversation ? 'Xem hồ sơ nhóm' : 'Xem hồ sơ'}
                    >
                      <span className="block truncate">
                        {isGroupConversation ? (activeGroup?.name || activeConversation.name || activeFriend.username) : activeFriend.username}
                      </span>
                    </button>
                    <p className="m-0 text-xs font-medium text-gray-500 dark:text-zinc-400">{getConversationInfoSubtitle()}</p>
                  </section>

                  <section className="mt-6">
                    <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Lối tắt nhanh</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPinnedPanelOpen && activeConversation) {
                            fetchPinnedMessages(activeConversation.id).catch((err) => console.error('Failed to fetch pinned messages:', err));
                          }
                          setIsPinnedPanelOpen(true);
                          setIsConversationInfoOpen(false);
                        }}
                        className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Pin className="h-4 w-4" />
                        <span>Ghim</span>
                      </button>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <BellOff className="h-4 w-4" />
                        <span>Tắt báo</span>
                      </button>
                      <button
                        type="button"
                        disabled={!isGroupConversation || !canInviteToActiveGroup}
                        onClick={() => setIsInviteMembersOpen(true)}
                        className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Thêm</span>
                      </button>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Cài đặt</span>
                      </button>
                    </div>
                  </section>

                  <section className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="m-0 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Kho lưu trữ</h4>
                      {isLoadingConversationArchive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Đang tải
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                            <Image className="h-4 w-4 text-indigo-600" />
                            Ảnh & video
                          </span>
                          <span className="text-xs text-gray-400">{activeConversationMedia.length}</span>
                        </div>
                        {activeConversationMedia.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {activeConversationMedia.map((item, index) => (
                              <button
                                type="button"
                                key={`${item.url}-${index}`}
                                onClick={() => handleJumpToMessage(item.message.id)}
                                className="aspect-square overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 transition hover:ring-indigo-500 dark:bg-zinc-900 dark:ring-zinc-800"
                                title={item.name || getFileName(item.url)}
                              >
                                {item.type === 'IMAGE' ? (
                                  <img src={item.url} alt={item.name || 'Shared image'} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Video className="h-5 w-5" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có ảnh hoặc video.</p>
                        )}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            File tài liệu
                          </span>
                          <span className="text-xs text-gray-400">{activeConversationFiles.length}</span>
                        </div>
                        <div className="space-y-2">
                          {activeConversationFiles.length > 0 ? activeConversationFiles.map((item, index) => (
                            <button
                              type="button"
                              key={`${item.url}-${index}`}
                              onClick={() => handleJumpToMessage(item.message.id)}
                              className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-left transition hover:bg-indigo-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                            >
                              <FileText className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">
                                {item.name || getFileName(item.url)}
                              </span>
                              <Download className="h-4 w-4 shrink-0 text-gray-400" />
                            </button>
                          )) : (
                            <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có file tài liệu.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                            <Link className="h-4 w-4 text-indigo-600" />
                            Link đã chia sẻ
                          </span>
                          <span className="text-xs text-gray-400">{activeConversationLinks.length}</span>
                        </div>
                        <div className="space-y-2">
                          {activeConversationLinks.length > 0 ? activeConversationLinks.map((item, index) => (
                            <div
                              key={`${item.url}-${index}`}
                              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-900/50"
                            >
                              <button
                                type="button"
                                onClick={() => handleJumpToMessage(item.message.id)}
                                className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-gray-800 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                                title={item.url}
                              >
                                {item.url}
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800"
                                title="Mở link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )) : (
                            <p className="m-0 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900/50 dark:text-zinc-400">Chưa có link đã chia sẻ.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mt-6">
                    <h4 className="mb-2 text-[11px] font-bold uppercase text-gray-400 dark:text-zinc-500">Bảo mật & cài đặt</h4>
                    <div className="space-y-2">
                      <div className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 text-left text-sm font-semibold text-gray-700 dark:bg-zinc-900/50 dark:text-zinc-200">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <span className="block">Tin nhắn tự xóa</span>
                          <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-zinc-400">
                            Áp dụng cho tin nhắn mới
                          </span>
                        </div>
                        <select
                          value={activeConversation.selfDestructSeconds ?? 0}
                          onChange={(event) => handleUpdateSelfDestruct(Number(event.target.value))}
                          disabled={isUpdatingSelfDestruct}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none transition focus:border-indigo-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                          title={`Đang đặt: ${getSelfDestructLabel(activeConversation.selfDestructSeconds)}`}
                        >
                          {selfDestructOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {activeConversation.hidden ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setConversationActionId(`unhide-${activeConversation.id}`);
                            try {
                              const ok = await toggleHideConversation(activeConversation.id, false);
                              if (ok) {
                                await fetchConversations();
                              }
                            } finally {
                              setConversationActionId(null);
                            }
                          }}
                          disabled={conversationActionId === `unhide-${activeConversation.id}`}
                          className="flex w-full items-center gap-3 rounded-lg bg-emerald-50 px-3 py-3 text-left text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                        >
                          {conversationActionId === `unhide-${activeConversation.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-emerald-550" />
                          )}
                          <span className="min-w-0 flex-1">Bỏ ẩn trò chuyện</span>
                          <span className="text-xs text-emerald-500 font-bold">Đang ẩn</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleHideClick(activeConversation.id)}
                          disabled={conversationActionId === `hide-${activeConversation.id}`}
                          className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {conversationActionId === `hide-${activeConversation.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="min-w-0 flex-1">Ẩn trò chuyện bằng PIN</span>
                          <span className="text-xs text-gray-400">Tắt</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleConversationPin(activeConversation.id, activeConversation.pinned)}
                        disabled={conversationActionId === `pin-${activeConversation.id}`}
                        className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        {conversationActionId === `pin-${activeConversation.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        ) : activeConversation.pinned ? (
                          <PinOff className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <Pin className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="min-w-0 flex-1">
                          {activeConversation.pinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {activeConversation.pinned ? 'Đang ghim' : 'Tắt'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConversation(activeConversation.id)}
                        disabled={conversationActionId === `delete-${activeConversation.id}`}
                        className="flex w-full items-center gap-3 rounded-lg bg-rose-50 px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                      >
                        {conversationActionId === `delete-${activeConversation.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="min-w-0 flex-1">Xóa hội thoại</span>
                        <span className="text-xs font-semibold text-rose-400">Ẩn khỏi danh sách</span>
                      </button>
                      {isGroupConversation ? (
                        <button
                          type="button"
                          onClick={handleLeaveActiveGroup}
                          disabled={profileActionLoading || currentUserIsGroupOwner}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          title={currentUserIsGroupOwner ? 'Chủ nhóm cần chuyển quyền trước khi rời nhóm' : 'Thoát nhóm'}
                        >
                          {profileActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                          <span>{currentUserIsGroupOwner ? 'Chủ nhóm không thể rời' : 'Thoát nhóm'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleToggleBlockUser}
                          disabled={blockActionLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                        >
                          {blockActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                          <span>{activePrivateChatBlockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</span>
                        </button>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </aside>
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
                      {selectedChatRequest.message}
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
            <h3 className="text-xl font-bold text-gray-950 dark:text-white m-0">No Conversation Open</h3>
            <p className="text-sm text-gray-500 dark:text-discord-muted max-w-sm mt-2 leading-relaxed">
              Pick a conversation from the sidebar, join a group chat, or head to Friends to start a new DM!
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate('/friends')}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-750 dark:bg-discord-blurple dark:hover:bg-indigo-650 transition-all duration-200 shadow-md active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Friends</span>
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-2xl text-xs font-bold text-indigo-700 dark:text-discord-blurple bg-indigo-50 dark:bg-discord-blurple/10 hover:bg-indigo-100 dark:hover:bg-discord-blurple/20 border border-indigo-200 dark:border-discord-blurple/30 transition-all duration-200 shadow active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Group</span>
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

      {isInviteMembersOpen && activeGroup && (
        <InviteGroupMembersModal
          group={activeGroup}
          onClose={() => setIsInviteMembersOpen(false)}
          onInvited={() => fetchGroups()}
        />
      )}

      {isProfileModalOpen && activeConversation && activeFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => !isUpdatingGroupAvatar && setIsProfileModalOpen(false)}>
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => !isUpdatingGroupAvatar && setIsProfileModalOpen(false)}
                disabled={isUpdatingGroupAvatar}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGroupConversation ? (
              <div className="px-5 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => currentUserIsGroupOwner && groupAvatarInputRef.current?.click()}
                    disabled={!currentUserIsGroupOwner || isUpdatingGroupAvatar}
                    className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow disabled:cursor-default"
                    title={currentUserIsGroupOwner ? 'Đổi ảnh nhóm' : 'Chỉ trưởng nhóm được đổi ảnh nhóm'}
                  >
                    {activeGroup?.avatarUrl ? (
                      <img src={activeGroup.avatarUrl} alt={activeGroup.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{(activeGroup?.name || activeFriend.username).charAt(0).toUpperCase()}</span>
                    )}
                    {currentUserIsGroupOwner && (
                      <span className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white transition ${isUpdatingGroupAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isUpdatingGroupAvatar ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6" />
                        )}
                      </span>
                    )}
                  </button>
                  <div className="min-w-0 pb-1 text-left">
                    <h3 className="m-0 truncate text-xl font-bold">{activeGroup?.name || activeConversation.name || 'Nhóm chat'}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-discord-muted">
                      <Users className="h-3.5 w-3.5" />
                      <span>{activeGroup?.memberCount ?? activeConversation.members.length} thành viên</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 p-3 text-left dark:bg-discord-black/35">
                  <div>
                    <p className="m-0 text-sm font-semibold">
                      {currentUserIsGroupOwner ? 'Bạn là chủ nhóm' : 'Bạn là thành viên nhóm'}
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">
                      {currentUserIsGroupOwner ? 'Chủ nhóm không thể thoát nhóm. Hãy chuyển quyền hoặc xoá nhóm nếu cần.' : 'Bạn có thể rời nhóm này bất cứ lúc nào.'}
                    </p>
                  </div>
                  {!currentUserIsGroupOwner && (
                    <button
                      type="button"
                      onClick={handleLeaveActiveGroup}
                      disabled={profileActionLoading}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                      {profileActionLoading ? 'Đang xử lý...' : 'Thoát nhóm'}
                    </button>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                    <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Chủ nhóm</p>
                    <p className="mt-1 truncate text-sm font-semibold">{activeGroup?.ownerUsername || 'Không rõ'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                    <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Ngày tạo</p>
                    <p className="mt-1 truncate text-sm font-semibold">{formatProfileDate(activeGroup?.createdAt || activeConversation.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-5 text-left">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="m-0 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Thành viên</p>
                    {activeGroup && canInviteToActiveGroup && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isUpdatingGroupAvatar) return;
                          setIsProfileModalOpen(false);
                          setIsInviteMembersOpen(true);
                        }}
                        disabled={isUpdatingGroupAvatar}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                      >
                        Mời thêm
                      </button>
                    )}
                  </div>
                  {activeGroup && (
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        value={groupMemberSearchQuery}
                        onChange={(event) => setGroupMemberSearchQuery(event.target.value)}
                        placeholder="Tìm thành viên..."
                        className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:bg-zinc-950"
                      />
                    </div>
                  )}
                  <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                    {filteredGroupMembers.map((member) => {
                      const canKick = canKickGroupMember(member);
                      const canMakeDeputy = canSetGroupMemberRole(member, 'DEPUTY');
                      const canMakeMember = canSetGroupMemberRole(member, 'MEMBER') && member.role !== 'MEMBER';
                      const roleActionLoading = groupMemberActionId?.startsWith(`${member.userId}:`);
                      return (
                        <div key={member.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.username} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                              {member.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="m-0 truncate text-sm font-semibold">{member.username}</p>
                            <p className="m-0 text-[11px] text-gray-400 dark:text-zinc-500">{roleLabels[member.role]}</p>
                          </div>
                          {(canMakeDeputy || canMakeMember) && (
                            <div className="flex shrink-0 items-center gap-1">
                              {canMakeDeputy && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGroupMemberRole(member, 'DEPUTY')}
                                  disabled={Boolean(groupMemberActionId)}
                                  className="rounded-lg p-2 text-sky-500 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-60 dark:hover:bg-sky-500/10"
                                  title="Đặt làm phó nhóm"
                                >
                                  {roleActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                                </button>
                              )}
                              {canMakeMember && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGroupMemberRole(member, 'MEMBER')}
                                  disabled={Boolean(groupMemberActionId)}
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 dark:hover:bg-zinc-800"
                                  title="Hạ xuống thành viên"
                                >
                                  {roleActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          )}
                          {canKick && (
                            <button
                              type="button"
                              onClick={() => handleKickGroupMember(member)}
                              disabled={Boolean(groupMemberActionId)}
                              className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 dark:hover:bg-rose-500/10"
                              title="Kick khỏi nhóm"
                            >
                              {groupMemberActionId === member.userId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {activeGroup && filteredGroupMembers.length === 0 && (
                      <p className="m-0 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-discord-black/35 dark:text-discord-muted">
                        Không tìm thấy thành viên phù hợp.
                      </p>
                    )}
                    {!activeGroup && (
                      <p className="m-0 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-discord-black/35 dark:text-discord-muted">
                        Chưa tải được thông tin nhóm.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5">
                <div className="flex items-center gap-4">
                  {activeFriend.avatarUrl ? (
                    <img
                      src={activeFriend.avatarUrl}
                      alt={activeFriend.username}
                      className="h-20 w-20 shrink-0 rounded-full object-cover shadow"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white shadow">
                      {activeFriend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 pb-1 text-left">
                    <h3 className="m-0 truncate text-xl font-bold">{activeFriend.username}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-discord-muted">
                      <span className={`h-2 w-2 rounded-full ${activeFriend.status === 'AWAY' ? 'bg-amber-500' : activeFriend.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                      <span className="capitalize">{activeFriend.status.toLowerCase()}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                    <div>
                      <p className="m-0 text-sm font-semibold">
                        {activeFriendIsFriend ? 'Đã là bạn bè' : activeFriendRequestSent ? 'Đã gửi lời mời kết bạn' : 'Chưa là bạn bè'}
                      </p>
                      <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">
                        {activeFriendIsFriend ? 'Bạn có thể nhắn tin trực tiếp với người này.' : 'Gửi lời mời để kết nối với người này.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleProfileFriendAction}
                      disabled={profileActionLoading || activeFriendRequestSent}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                        activeFriendIsFriend
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {profileActionLoading ? 'Đang xử lý...' : activeFriendIsFriend ? 'Hủy bạn bè' : activeFriendRequestSent ? 'Đã gửi lời mời' : 'Thêm bạn'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleBlockUser}
                      disabled={blockActionLoading}
                      className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    >
                      {blockActionLoading ? 'Đang xử lý...' : activePrivateChatBlockedByMe ? 'Bỏ chặn' : 'Chặn'}
                    </button>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                    <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Email</p>
                    <p className="mt-1 break-all text-sm font-semibold">{activeFriend.email || 'Không có email'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                    <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Giới thiệu</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-zinc-200">{activeFriend.bio || 'Chưa có giới thiệu.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                      <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Tham gia</p>
                      <p className="mt-1 text-sm font-semibold">{formatProfileDate(activeConversation.members.find((member) => member.id !== user?.id)?.createdAt)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                      <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Lần cuối</p>
                      <p className="mt-1 text-sm font-semibold">
                        {activeFriend.status === 'OFFLINE' && activeFriend.lastSeen ? formatRelativeTime(activeFriend.lastSeen) : activeFriend.status.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => !isUpdatingGroupAvatar && setIsProfileModalOpen(false)}
                    disabled={isUpdatingGroupAvatar}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {searchProfileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => setSearchProfileUser(null)}>
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => setSearchProfileUser(null)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-center gap-4">
                {searchProfileUser.avatarUrl ? (
                  <img src={searchProfileUser.avatarUrl} alt={searchProfileUser.username} className="h-20 w-20 shrink-0 rounded-full object-cover shadow" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white shadow">
                    {searchProfileUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 pb-1 text-left">
                  <h3 className="m-0 truncate text-xl font-bold">{searchProfileUser.username}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-discord-muted">
                    <span className={`h-2 w-2 rounded-full ${searchProfileUser.status === 'AWAY' ? 'bg-amber-500' : searchProfileUser.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                    <span className="capitalize">{searchProfileUser.status.toLowerCase()}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-left">
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Email</p>
                  <p className="mt-1 break-all text-sm font-semibold">{searchProfileUser.email || 'Không có email'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Giới thiệu</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-zinc-200">{searchProfileUser.bio || 'Chưa có giới thiệu.'}</p>
                </div>

                {isExistingFriend(searchProfileUser.id) ? (
                  <button
                    type="button"
                    onClick={handleSendChatRequestFromProfile}
                    disabled={profileChatActionId === searchProfileUser.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {profileChatActionId === searchProfileUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Nhắn tin
                  </button>
                ) : sentChatRequestIds.includes(searchProfileUser.id) ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                    Tin nhắn đã được gửi vào mục Tin nhắn chờ của người nhận.
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-discord-black/35">
                    <p className="m-0 text-sm font-semibold">Nhắn tin với người chưa kết bạn</p>
                    <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-discord-muted">
                      Tin đầu tiên sẽ nằm trong Tin nhắn chờ cho đến khi người nhận trả lời.
                    </p>
                    <textarea
                      value={profileChatMessage}
                      onChange={(event) => setProfileChatMessage(event.target.value)}
                      placeholder={`Nhập lời nhắn tới ${searchProfileUser.username}...`}
                      rows={3}
                      maxLength={500}
                      className="mt-3 w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSendChatRequestFromProfile}
                      disabled={!profileChatMessage.trim() || profileChatActionId === searchProfileUser.id}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {profileChatActionId === searchProfileUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Nhắn tin
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatePollOpen && activeConversation?.type === 'GROUP' && isGroupModeratorRole(currentGroupMembership?.role) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => setIsCreatePollOpen(false)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-2 text-lg font-bold">
                <ListChecks className="h-5 w-5 text-indigo-600" />
                Tạo bình chọn
              </h3>
              <button type="button" onClick={() => setIsCreatePollOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={pollQuestion}
                onChange={(event) => setPollQuestion(event.target.value)}
                placeholder="Câu hỏi bình chọn"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />

              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={option}
                      onChange={(event) => setPollOptions((options) => options.map((item, i) => i === index ? event.target.value : item))}
                      placeholder={`Lựa chọn ${index + 1}`}
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions((options) => options.filter((_, i) => i !== index))}
                        className="rounded-xl px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPollOptions((options) => [...options, ''])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm lựa chọn
                </button>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
                  <input type="checkbox" checked={pollAllowMultiple} onChange={(event) => setPollAllowMultiple(event.target.checked)} />
                  <span>Chọn nhiều phương án</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
                  <input type="checkbox" checked={pollAllowAddOptions} onChange={(event) => setPollAllowAddOptions(event.target.checked)} />
                  <span>Cho thêm lựa chọn</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
                  <input type="checkbox" checked={pollAnonymous} onChange={(event) => setPollAnonymous(event.target.checked)} />
                  <span>Ẩn người bình chọn</span>
                </label>
                <label className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
                  <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-zinc-400">Thời hạn khóa</span>
                  <input
                    type="datetime-local"
                    value={pollExpiresAt}
                    onChange={(event) => setPollExpiresAt(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatePollOpen(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitCreatePoll}
                disabled={pollActionMessageId === 'creating'}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {pollActionMessageId === 'creating' ? 'Đang tạo...' : 'Tạo bình chọn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pollVoterDialog && !pollVoterDialog.anonymous && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => setPollVoterDialog(null)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 truncate text-base font-bold">{pollVoterDialog.option.text}</h3>
              <button type="button" onClick={() => setPollVoterDialog(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {(pollVoterDialog.option.voters ?? []).length > 0 ? (
                (pollVoterDialog.option.voters ?? []).map((voter) => (
                  <div key={voter.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                    {voter.avatarUrl ? (
                      <img src={voter.avatarUrl} alt={voter.username} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                        {voter.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="min-w-0 truncate text-sm font-semibold">{voter.username}</span>
                  </div>
                ))
              ) : (
                <p className="m-0 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900 dark:text-zinc-400">
                  Chưa có ai chọn phương án này.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeMedia && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveMedia(null)}
        >
          {/* Top bar with buttons */}
          <div className="absolute top-4 right-4 z-[110] flex items-center gap-3">
            <a
              href={activeMedia.url}
              download={activeMedia.name || 'download'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105"
              title="Tải xuống tệp gốc"
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={() => setActiveMedia(null)}
              className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105"
              title="Đóng (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Media container */}
          <div
            className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia.type === 'IMAGE' ? (
              <img
                src={activeMedia.url}
                alt={activeMedia.name || 'Shared Media'}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl select-none"
              />
            ) : (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
              />
            )}
          </div>

          {/* Optional Caption/Name at the bottom */}
          {activeMedia.name && (
            <p className="mt-4 max-w-[80vw] truncate text-sm font-semibold text-white/80 backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full">
              {activeMedia.name}
            </p>
          )}
        </div>
      )}

      {isPinModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPinModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Thiết lập mã PIN
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 text-center">
              {pinStep === 'enter'
                ? 'Nhập mã PIN gồm 4 chữ số để ẩn cuộc trò chuyện này. Mã PIN này sẽ dùng chung cho tất cả cuộc trò chuyện bị ẩn.'
                : 'Vui lòng nhập lại mã PIN để xác nhận.'}
            </p>

            <div className="flex justify-center mb-6">
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((index) => {
                  const currentValue = pinStep === 'enter' ? pinValue : confirmPinValue;
                  const setFn = pinStep === 'enter' ? setPinValue : setConfirmPinValue;
                  const inputId = `setup-pin-${pinStep}-${index}`;
                  return (
                    <input
                      key={index}
                      id={inputId}
                      type="password"
                      maxLength={1}
                      autoFocus={index === 0 && !currentValue}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={currentValue[index] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val) {
                          const newVal = currentValue.substring(0, index) + val + currentValue.substring(index + 1);
                          setFn(newVal.slice(0, 4));
                          setPinError('');
                          if (index < 3) {
                            document.getElementById(`setup-pin-${pinStep}-${index + 1}`)?.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (!currentValue[index] && index > 0) {
                            const newVal = currentValue.substring(0, index - 1) + currentValue.substring(index);
                            setFn(newVal);
                            document.getElementById(`setup-pin-${pinStep}-${index - 1}`)?.focus();
                          } else {
                            const newVal = currentValue.substring(0, index) + currentValue.substring(index + 1);
                            setFn(newVal);
                          }
                          setPinError('');
                        } else if (e.key === 'Enter' && currentValue.length === 4) {
                          handlePinSubmit();
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {pinError && (
              <p className="text-sm text-rose-500 text-center mt-2 mb-4 font-medium">{pinError}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handlePinSubmit}
                disabled={conversationActionId === 'pin-setup' || (pinStep === 'enter' ? pinValue.length !== 4 : confirmPinValue.length !== 4)}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {conversationActionId === 'pin-setup' && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                {pinStep === 'enter' ? 'Tiếp tục' : 'Xác nhận'}
              </button>

              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl text-gray-700 dark:text-zinc-300 font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
              >
                Hủy
              </button>
            </div>

            <button
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        isLoading={profileActionLoading || blockActionLoading || Boolean(groupMemberActionId)}
        onCancel={() => {
          if (!profileActionLoading && !blockActionLoading && !groupMemberActionId) {
            setConfirmDialog(null);
          }
        }}
        onConfirm={() => {
          confirmDialog?.onConfirm();
        }}
      />

      {/* Call Overlay */}
      <CallOverlay />

      {/* Mobile Bottom Navigation */}
      {!activeConversation && !selectedChatRequest && <MobileBottomNav />}
    </div>
  );
};

export default Chat;

