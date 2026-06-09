import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useGroupStore } from '../store/groupStore';
import { authService } from '../services/authService';
import { fileService } from '../services/fileService';
import {
  LogOut, User, Settings, MessageSquare,
  Send, Paperclip, Smile, Search, Loader2, Users, ArrowUp, Hash, Plus, Check, CheckCheck,
  X, FileText, Video, Download, ThumbsUp, MoreHorizontal, CreditCard, Crop, Type, Zap, Image, Phone, ArrowLeft,
  Pin, CornerUpLeft
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import CallOverlay from '../components/chat/CallOverlay';
import { useCallStore } from '../store/callStore';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import { useNotificationStore } from '../store/notificationStore';
import { formatRelativeTime } from '../utils/time';
import MobileBottomNav from '../components/common/MobileBottomNav';
import type { ConversationResponse, MessageResponse } from '../types/chat';
import type { GroupResponse } from '../types/group';

// Phase 10 Components
import { MessageActionsBar } from '../components/chat/MessageContextMenu';
import { MessageReactions } from '../components/chat/MessageReactions';
import { ReplyPreview } from '../components/chat/ReplyPreview';
import { PinnedMessagesPanel } from '../components/chat/PinnedMessagesPanel';
import { SearchPanel } from '../components/chat/SearchPanel';


export const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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
    setReplyTo,
    editMessage,
    recallMessage,
    deleteMessage,
    togglePinMessage,
    reactToMessage
  } = useChatStore();

  const [isPinnedPanelOpen, setIsPinnedPanelOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);

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


  const { groups, fetchGroups } = useGroupStore();
  const initiateCall = useCallStore((state) => state.initiateCall);

  const {
    notifications,
    fetchNotifications,
  } = useNotificationStore();




  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<'IMAGE' | 'VIDEO' | 'FILE' | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = () => {
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }
    setUploadingFile(false);
    setUploadProgress(0);
    setUploadedFileUrl(null);
    setUploadedFileType(null);
    setSelectedFileName(null);
    setSelectedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFileName(file.name);

    // Classify file type based on MIME or file extension fallback
    const fileName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || 
                    ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.heic', '.heif'].some(ext => fileName.endsWith(ext));
    const isVideo = file.type.startsWith('video/') || 
                    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].some(ext => fileName.endsWith(ext));

    let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
    if (isImage) {
      type = 'IMAGE';
      const previewUrl = URL.createObjectURL(file);
      setSelectedFilePreview(previewUrl);
    } else if (isVideo) {
      type = 'VIDEO';
      setSelectedFilePreview(null);
    } else {
      type = 'FILE';
      setSelectedFilePreview(null);
    }

    setUploadedFileType(type);
    setUploadingFile(true);
    setUploadProgress(0);
    setUploadedFileUrl(null);

    try {
      const response = await fileService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success && response.data) {
        setUploadedFileUrl(response.data.url);
      } else {
        console.error('Upload failed:', response.message);
        resetUploadState();
        alert('Failed to upload file: ' + response.message);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      resetUploadState();
      alert('Error uploading file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingFile(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchConversations();
    fetchGroups();
    fetchNotifications();
    connectWebSocket();
  }, [connectWebSocket, fetchConversations, fetchGroups, fetchNotifications]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeConversation) {
      const timer = setTimeout(() => scrollToBottom('auto'), 50);
      return () => clearTimeout(timer);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages.length, user?.id]);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we have an attachment to send
    if (uploadedFileUrl && uploadedFileType) {
      sendStompMessage(uploadedFileUrl, uploadedFileType, replyTo?.id ?? undefined);
      resetUploadState();
    }

    // Also send text if typed
    if (inputMessage.trim()) {
      sendStompMessage(inputMessage.trim(), 'TEXT', replyTo?.id ?? undefined);
      setInputMessage('');
    }

    if (replyTo) {
      setReplyTo(null);
    }
  };

  const handleSendThumbsUp = () => {
    sendStompMessage('👍', 'TEXT', replyTo?.id ?? undefined);
    if (replyTo) {
      setReplyTo(null);
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

  // Active conversation: find matching group for header enrichment
  const activeGroup = activeConversation?.type === 'GROUP'
    ? groups.find(g => g.conversationId === activeConversation.id) || null
    : null;

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

  const formatLastMessage = (msg: MessageResponse, isGroup: boolean) => {
    const isMe = msg.senderId === user?.id;
    let prefix = '';
    if (isMe) {
      prefix = 'Bạn: ';
    } else if (isGroup) {
      prefix = `${msg.senderUsername || 'Người dùng'}: `;
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

  const unifiedItems: UnifiedItem[] = [
    ...uniquePrivateConversations.map(c => ({ kind: 'dm' as const, conv: c })),
    ...groups.map(g => ({ kind: 'group' as const, group: g })),
  ];

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
      if (item.kind === 'dm') {
        const friend = getFriendInfo(item.conv);
        return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return item.group.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => getUnifiedTime(b) - getUnifiedTime(a));



  const activeFriend = activeConversation ? getFriendInfo(activeConversation) : null;

  // For group chat: determine if we're in a group conversation
  const isGroupConversation = activeConversation?.type === 'GROUP';

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
          className="w-11 h-11 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Friends List"
        >
          <User className="w-5 h-5" />
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-650 dark:text-zinc-400 mb-3 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Profile Settings"
        >
          <Settings className="w-5 h-5" />
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
      <section className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white dark:bg-[#1e1e2e] flex-col border-r border-gray-200 dark:border-zinc-800/60 shrink-0 pb-16 md:pb-0`}>

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
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-zinc-800/80 text-sm px-9 py-2 rounded-full border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Unified conversation list (Zalo style) */}
        <div className="flex-1 overflow-y-auto">
          {filteredUnified.length === 0 ? (
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
                    onClick={() => selectConversation(c.id)}
                    className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150 ${
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
              const lastMsg = g.conversationId ? lastMessages[g.conversationId] : undefined;
              const unreadNotifs = notifications.filter(
                (n) => n.referenceId === g.conversationId && !n.read && n.type === 'NEW_MESSAGE'
              );
              const unreadCount = unreadNotifs.length;
              const hasUnread = unreadCount > 0;

              return (
                <div
                  key={g.id}
                  onClick={() => handleOpenGroup(g)}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-indigo-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Group Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
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
      <main className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-100 dark:bg-discord-dark overflow-hidden relative`}>
        {activeConversation && activeFriend ? (
          <>
            {/* Chat Header */}
            <header className="h-14 bg-gray-150 dark:bg-discord-dark border-b border-gray-300 dark:border-zinc-900/50 flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-3 text-left">
                {/* Mobile Back Button */}
                <button
                  onClick={() => selectConversation(null)}
                  className="md:hidden p-1.5 mr-1 rounded-xl bg-gray-200/65 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition active:scale-95 shrink-0"
                  title="Back to conversations list"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                {isGroupConversation ? (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/80 dark:bg-discord-blurple/80 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {(activeGroup?.name || activeFriend.username).charAt(0).toUpperCase()}
                  </div>
                ) : activeFriend.avatarUrl ? (
                  <img src={activeFriend.avatarUrl} alt={activeFriend.username} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-800" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-semibold flex items-center justify-center text-xs">
                    {activeFriend.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white m-0 leading-tight">
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
                        <span className="capitalize">
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
              </div>

              <div className="flex items-center gap-3 text-gray-500">
                {/* Voice Call Button */}
                {!isGroupConversation && activeConversation && activeFriend && (
                  <button
                    onClick={() => initiateCall(activeConversation.id, 'voice', activeFriend)}
                    title="Cuộc gọi thoại"
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}

                {/* Video Call Button */}
                {!isGroupConversation && activeConversation && activeFriend && (
                  <button
                    onClick={() => initiateCall(activeConversation.id, 'video', activeFriend)}
                    title="Cuộc gọi video"
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                )}

                {/* Search Message Button */}
                {activeConversation && (
                  <button
                    onClick={() => {
                      setIsSearchPanelOpen(!isSearchPanelOpen);
                      setIsPinnedPanelOpen(false);
                    }}
                    title="Tìm kiếm tin nhắn"
                    className={`p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
                      isSearchPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}

                {/* Pinned Messages Button */}
                {activeConversation && (
                  <button
                    onClick={() => {
                      setIsPinnedPanelOpen(!isPinnedPanelOpen);
                      setIsSearchPanelOpen(false);
                    }}
                    title="Tin nhắn đã ghim"
                    className={`p-2 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
                      isPinnedPanelOpen ? 'text-indigo-600 dark:text-indigo-400 bg-gray-200 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}

                {isGroupConversation ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold select-none hidden sm:inline">
                  {isGroupConversation ? 'Group Channel' : 'Private Channel'}
                </span>
              </div>
            </header>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse"
            >
              <div ref={messagesEndRef} />

              {messages.map((msg: MessageResponse, index: number) => {
                const isMe = msg.senderId === user?.id;
                const nextMsg = messages[index + 1];
                const showDivider = !nextMsg ||
                  new Date(msg.createdAt).toDateString() !== new Date(nextMsg.createdAt).toDateString();

                // In group chat, show sender names above non-self messages
                const prevMsg = messages[index - 1];
                const showSenderName = isGroupConversation && !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                // Find parent message if replied to
                const parentMessage = msg.parentId ? messages.find((m) => m.id === msg.parentId) : null;

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

                    {/* Quoted Message / Reply Preview above bubble */}
                    {msg.parentId && (
                      <div className={`flex items-center space-x-1.5 text-[11px] text-gray-500 dark:text-discord-muted italic mb-0.5 ${isMe ? 'self-end mr-11' : 'ml-11'}`}>
                        <CornerUpLeft className="w-3 h-3 text-gray-400 dark:text-zinc-550 shrink-0" />
                        <span>Trả lời</span>
                        <span className="font-semibold text-gray-700 dark:text-zinc-300">
                          @{parentMessage ? parentMessage.senderUsername : 'tin nhắn cũ'}
                        </span>
                        <span className="truncate max-w-[180px]">
                          : {parentMessage ? (parentMessage.isRecalled ? 'Tin nhắn đã bị thu hồi' : parentMessage.content) : 'tin nhắn đã bị xoá hoặc không tìm thấy'}
                        </span>
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

                      <div className="flex flex-col relative">
                        {/* Context menu actions bar */}
                        {(hoveredMessageId === msg.id || activeMenuMessageId === msg.id) && !msg.isRecalled && (
                          <div
                            className="absolute z-20 animate-in fade-in zoom-in-95 duration-100"
                            style={{
                              top: '-28px',
                              right: isMe ? '0px' : 'auto',
                              left: isMe ? 'auto' : '0px',
                            }}
                          >
                            <MessageActionsBar
                              message={msg}
                              isMe={isMe}
                              onReply={() => setReplyTo(msg)}
                              onEdit={() => {
                                setEditingMessageId(msg.id);
                                setEditInputText(msg.content);
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
                              onReact={(emoji) => reactToMessage(msg.id, emoji)}
                              onMenuOpenChange={(isOpen) => setActiveMenuMessageId(isOpen ? msg.id : null)}
                            />
                          </div>
                        )}

                        {/* Show sender name in group chat */}
                        {showSenderName && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-discord-blurple mb-1 ml-0.5">
                            {getSenderUsername(msg)}
                          </span>
                        )}

                        {/* Message Content Bubble */}
                        {msg.isRecalled ? (
                          <div className={`p-3 rounded-2xl text-sm leading-relaxed text-left break-words shadow-sm italic text-gray-550 dark:text-zinc-500 ${
                            isMe
                              ? 'bg-indigo-650/20 dark:bg-discord-blurple/10 text-gray-450 dark:text-zinc-500 rounded-tr-none'
                              : 'bg-gray-200/50 dark:bg-discord-mid/50 text-gray-500 dark:text-zinc-555 rounded-tl-none border border-gray-300/20 dark:border-zinc-850/30'
                          }`}>
                            <span>Tin nhắn đã bị thu hồi</span>
                          </div>
                        ) : msg.messageType === 'IMAGE' ? (
                          <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-zinc-800 shadow-sm max-w-[280px] sm:max-w-[360px] bg-black/5 dark:bg-black/25">
                            <a href={msg.content} target="_blank" rel="noopener noreferrer">
                              <img
                                src={msg.content}
                                alt="Shared Image"
                                className="max-h-72 w-full object-contain hover:opacity-95 transition-opacity cursor-zoom-in"
                              />
                            </a>
                          </div>
                        ) : msg.messageType === 'VIDEO' ? (
                          <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-zinc-800 shadow-sm max-w-[280px] sm:max-w-[360px] bg-black">
                            <video
                              src={msg.content}
                              controls
                              className="max-h-72 w-full"
                            />
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
                              className={`p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition shrink-0 ${isMe ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-2xl text-sm leading-relaxed text-left break-words shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 dark:bg-discord-blurple text-white rounded-tr-none'
                              : 'bg-gray-250 dark:bg-discord-mid text-gray-900 dark:text-discord-text rounded-tl-none border border-gray-300/40 dark:border-zinc-850/60'
                          }`}>
                            {editingMessageId === msg.id ? (
                              <div className="flex flex-col space-y-1.5 min-w-[200px] text-left">
                                <textarea
                                  value={editInputText}
                                  onChange={(e) => setEditInputText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEdit(msg.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingMessageId(null);
                                    }
                                  }}
                                  rows={2}
                                  className="w-full bg-discord-dark-secondary border border-discord-gray-600 rounded p-1.5 text-xs focus:outline-none focus:border-discord-blurple resize-none text-discord-gray-200"
                                  autoFocus
                                />
                                <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-discord-muted select-none">
                                  <span>nhấn <strong className="text-discord-blurple cursor-pointer" onClick={() => handleSaveEdit(msg.id)}>Enter</strong> để lưu</span>
                                  <span>•</span>
                                  <span>nhấn <strong className="text-red-400 cursor-pointer" onClick={() => setEditingMessageId(null)}>Esc</strong> để huỷ</span>
                                </div>
                              </div>
                            ) : (
                              <p className="m-0 whitespace-pre-wrap">
                                {msg.content}
                                {msg.isEdited && (
                                  <span className="text-[10px] text-gray-400 dark:text-discord-muted ml-1.5" title={msg.editedAt ? `Chỉnh sửa lúc: ${new Date(msg.editedAt).toLocaleString()}` : ''}>
                                    (đã chỉnh sửa)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Reactions list component */}
                        {!msg.isRecalled && msg.reactions && msg.reactions.length > 0 && (
                          <MessageReactions
                            reactions={msg.reactions}
                            currentUserId={user?.id ?? ''}
                            onReactToggle={(emoji) => reactToMessage(msg.id, emoji)}
                          />
                        )}

                        {/* Status block */}
                        <span className={`text-[10px] text-gray-500 dark:text-discord-muted mt-1 ${isMe ? 'text-right' : 'text-left'} flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                                <Check className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-550" />
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMoreMessages && (
                <div className="flex justify-center py-2 shrink-0">
                  <button
                    onClick={loadMoreMessages}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-discord-text hover:bg-indigo-100 dark:hover:bg-zinc-750 transition-all border border-indigo-150/40 dark:border-zinc-850/60 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" />}
                    <span>Load Older Messages</span>
                  </button>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-100 dark:bg-discord-dark shrink-0">
              {/* Reply Preview */}
              {replyTo && (
                <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
              )}

              {/* File Upload Preview Panel */}
              {(uploadingFile || uploadedFileUrl || selectedFileName) && (
                <div className={`bg-gray-200/80 dark:bg-discord-mid/80 backdrop-blur-sm border border-gray-300 dark:border-zinc-900/60 p-3 flex items-center gap-3 relative border-b-0 animate-fadeIn ${
                  replyTo ? 'border-t-0' : 'rounded-t-2xl'
                }`}>
                  <button
                    type="button"
                    onClick={resetUploadState}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-300 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white text-gray-500 dark:text-zinc-400 transition"
                    title="Remove Attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-12 h-12 rounded-xl bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-discord-blurple shrink-0 overflow-hidden border border-gray-350 dark:border-zinc-750">
                    {uploadedFileType === 'IMAGE' && (selectedFilePreview || uploadedFileUrl) ? (
                      <img src={selectedFilePreview || uploadedFileUrl || undefined} alt="Preview" className="w-full h-full object-cover" />
                    ) : uploadedFileType === 'VIDEO' ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate pr-6 m-0">
                      {selectedFileName || 'Uploading file...'}
                    </p>
                    {uploadingFile ? (
                      <div className="w-full mt-1.5">
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-discord-muted mb-0.5">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-discord-blurple h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 inline-block">
                        Ready to send
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Toolbar & Input Box Container */}
              <div className={`bg-white dark:bg-discord-mid border border-gray-300 dark:border-zinc-900/60 flex flex-col ${
                (uploadingFile || uploadedFileUrl || selectedFileName || replyTo) ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'
              } overflow-hidden focus-within:border-indigo-600 dark:focus-within:border-discord-blurple focus-within:ring-1 focus-within:ring-indigo-600 dark:focus-within:ring-discord-blurple transition-all`}>
                
                {/* Top Toolbar Row */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200/80 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-0.5">
                    {/* Sticker/Smile */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Stickers">
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Image attachment */}
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/*,video/*";
                          fileInputRef.current.click();
                        }
                      }}
                      className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition"
                      title="Send Images or Videos"
                    >
                      <Image className="w-4 h-4" />
                    </button>

                    {/* File attachment */}
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = ".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
                          fileInputRef.current.click();
                        }
                      }}
                      className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition"
                      title="Send Files"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Contact card */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Send Contact Card">
                      <User className="w-4 h-4" />
                    </button>

                    {/* Screenshot */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Screenshot">
                      <Crop className="w-4 h-4" />
                    </button>

                    {/* Formatting */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Text Formatting">
                      <Type className="w-4 h-4" />
                    </button>

                    {/* Quick message */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Quick Message Templates">
                      <Zap className="w-4 h-4" />
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

                {/* Input Text Area Row */}
                <div className="flex items-end gap-2 p-2 bg-white dark:bg-discord-mid">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    rows={1}
                    placeholder={isGroupConversation
                      ? `Nhập @, tin nhắn tới #${activeGroup?.name || 'group'}...`
                      : `Nhập @, tin nhắn tới @${activeFriend.username}`}
                    className="flex-1 bg-transparent border-0 py-1.5 max-h-32 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-discord-muted focus:outline-none focus:ring-0 resize-none font-sans"
                  />

                  <div className="flex items-center gap-1 shrink-0 pb-1">
                    {/* Emoji smile face */}
                    <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded-lg hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Emoji">
                      <Smile className="w-5 h-5" />
                    </button>

                    {/* ThumbsUp or Send */}
                    {(!inputMessage.trim() && !uploadedFileUrl) ? (
                      <button
                        type="button"
                        onClick={handleSendThumbsUp}
                        className="p-1.5 text-amber-500 hover:text-amber-600 dark:hover:text-amber-450 rounded-lg hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition active:scale-90"
                        title="Send Like"
                      >
                        <ThumbsUp className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={uploadingFile}
                        className="p-2 bg-indigo-600 dark:bg-discord-blurple hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-xl active:scale-95 disabled:opacity-50 disabled:scale-100 transition shadow"
                        title="Send Message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </>
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

      {/* Call Overlay */}
      <CallOverlay />

      {/* Mobile Bottom Navigation */}
      {!activeConversation && <MobileBottomNav />}
    </div>
  );
};

export default Chat;
