import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useGroupStore } from '../store/groupStore';
import { authService } from '../services/authService';
import { fileService } from '../services/fileService';
import {
  LogOut, User, Settings, MessageSquare, Bell, BellOff,
  Send, Paperclip, Smile, Search, Loader2, Users, ArrowUp, Hash, Plus, ChevronDown, ChevronRight, Check, CheckCheck,
  X, FileText, Video, Download, ThumbsUp, MoreHorizontal, CreditCard, Crop, Type, Zap, Image, Phone
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import CallOverlay from '../components/chat/CallOverlay';
import { useCallStore } from '../store/callStore';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import { useNotificationStore } from '../store/notificationStore';
import { formatRelativeTime } from '../utils/time';
import type { ConversationResponse, MessageResponse } from '../types/chat';
import type { GroupResponse } from '../types/group';

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
    disconnectWebSocket
  } = useChatStore();

  const { groups, fetchGroups } = useGroupStore();
  const initiateCall = useCallStore((state) => state.initiateCall);

  const {
    notifications,
    unreadCount,
    isOpen: isNotificationPanelOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    togglePanel: toggleNotificationPanel,
    closePanel: closeNotificationPanel,
    ringTrigger,
    setRingTrigger
  } = useNotificationStore();

  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const [animateBell, setAnimateBell] = useState(false);

  // Trigger bell animation on ringTrigger
  useEffect(() => {
    if (ringTrigger) {
      setAnimateBell(true);
      const timer = setTimeout(() => {
        setAnimateBell(false);
        setRingTrigger(false);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [ringTrigger, setRingTrigger]);

  // Click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationPanelOpen &&
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        closeNotificationPanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationPanelOpen, closeNotificationPanel]);


  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupsSection, setShowGroupsSection] = useState(true);
  const [showDmsSection, setShowDmsSection] = useState(true);
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
      sendStompMessage(uploadedFileUrl, uploadedFileType);
      resetUploadState();
    }

    // Also send text if typed
    if (inputMessage.trim()) {
      sendStompMessage(inputMessage.trim(), 'TEXT');
      setInputMessage('');
    }
  };

  const handleSendThumbsUp = () => {
    sendStompMessage('👍', 'TEXT');
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



  // Only show PRIVATE conversations in the DM section
  const privateConversations = conversations.filter(c => c.type === 'PRIVATE');
  const filteredPrivate = privateConversations.filter(c => {
    const friend = getFriendInfo(c);
    return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFriend = activeConversation ? getFriendInfo(activeConversation) : null;

  // For group chat: determine if we're in a group conversation
  const isGroupConversation = activeConversation?.type === 'GROUP';

  // Get sender info in group chat
  const getSenderUsername = (msg: MessageResponse) => msg.senderUsername || 'Unknown';

  return (
    <div className="h-screen bg-gray-100 dark:bg-discord-black flex overflow-hidden text-gray-900 dark:text-discord-text transition-colors duration-300">

      {/* Column 1: Sidebar Navigation */}
      <aside className="w-16 md:w-20 bg-gray-250 dark:bg-zinc-950 flex flex-col items-center py-4 border-r border-gray-300 dark:border-zinc-900/50 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-indigo-650 dark:bg-discord-blurple flex items-center justify-center text-white mb-6 shadow-md transition-all duration-300">
          <MessageSquare className="w-6 h-6" />
        </div>

        <div
          onClick={() => navigate('/friends')}
          className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Friends List"
        >
          <User className="w-5 h-5" />
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 mb-4 cursor-pointer hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl transition-all duration-300"
          title="Profile Settings"
        >
          <Settings className="w-5 h-5" />
        </div>

        {/* Notification Bell with Badge & Panel */}
        <div className="relative mb-4" ref={notificationPanelRef}>
          <button
            onClick={toggleNotificationPanel}
            className={`w-12 h-12 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              isNotificationPanelOpen
                ? 'bg-indigo-600 dark:bg-discord-blurple text-white rounded-xl'
                : 'bg-gray-300 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white hover:rounded-xl'
            } ${animateBell ? 'animate-bell-ring' : ''}`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-600 dark:bg-discord-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-gray-250 dark:border-zinc-950 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isNotificationPanelOpen && (
            <div className="absolute left-16 md:left-20 top-0 w-80 md:w-96 rounded-2xl glass shadow-2xl border border-gray-200 dark:border-zinc-800 z-50 overflow-hidden flex flex-col max-h-[500px] animate-[fadeInScale_0.2s_ease-out]">
              
              {/* Panel Header */}
              <div className="p-4 border-b border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wide text-gray-805 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-450 font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-650 dark:text-indigo-450 hover:underline font-medium transition duration-200"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1 divide-y divide-gray-150/40 dark:divide-zinc-800/40 max-h-[400px]">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-gray-500 dark:text-zinc-500">
                    <BellOff className="w-8 h-8 mb-3 opacity-60 text-gray-400 dark:text-zinc-650" />
                    <p className="text-sm font-medium">All quiet here</p>
                    <p className="text-xs mt-1 text-gray-400 dark:text-zinc-650">No notifications to display</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    // Custom formatting for different types
                    let typeIcon = <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
                    let actionButton = null;

                    if (n.type === 'FRIEND_REQUEST') {
                      typeIcon = <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
                      actionButton = (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                            navigate('/friends');
                            closeNotificationPanel();
                          }}
                          className="mt-2 text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition duration-200 shadow-sm"
                        >
                          View Request
                        </button>
                      );
                    } else if (n.type === 'GROUP_INVITE') {
                      typeIcon = <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
                      actionButton = (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                            if (n.referenceId) {
                              selectConversation(n.referenceId);
                            }
                            closeNotificationPanel();
                          }}
                          className="mt-2 text-xs px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition duration-200 shadow-sm"
                        >
                          Join Chat
                        </button>
                      );
                    } else if (n.type === 'NEW_MESSAGE') {
                      typeIcon = <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
                      actionButton = (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                            if (n.referenceId) {
                              selectConversation(n.referenceId);
                            }
                            closeNotificationPanel();
                          }}
                          className="mt-2 text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 shadow-sm"
                        >
                          Open Chat
                        </button>
                      );
                    }

                    return (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 hover:bg-white/20 dark:hover:bg-zinc-800/40 cursor-pointer flex gap-3 transition duration-250 ${
                          !n.read
                            ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-l-4 border-indigo-600 dark:border-discord-blurple'
                            : 'border-l-4 border-transparent'
                        }`}
                      >
                        {/* Type Icon Container */}
                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-200/50 dark:border-zinc-700/50 shadow-sm">
                          {typeIcon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs text-gray-750 dark:text-zinc-250 leading-relaxed break-words ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}>
                            {n.content}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-discord-blurple shadow-md shadow-indigo-600/30" />
                            )}
                          </div>
                          {actionButton}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-450 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white hover:rounded-xl transition-all duration-300 disabled:opacity-50"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Column 2: Conversations Sidebar */}
      <section className="w-60 md:w-72 bg-gray-200 dark:bg-discord-mid flex flex-col border-r border-gray-300 dark:border-zinc-900/40 shrink-0">

        {/* Header */}
        <div className="h-14 border-b border-gray-300 dark:border-zinc-900/50 flex items-center justify-between px-4 shrink-0">
          <h1 className="text-base font-bold text-gray-950 dark:text-white">NexTalk</h1>
          <div className="flex items-center gap-2">
            {isConnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            ) : isConnected ? (
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 dark:bg-green-500 border border-green-400" title="Connected" />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400 cursor-pointer"
                title="Disconnected - Click to Reconnect"
                onClick={connectWebSocket}
              />
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-300 dark:bg-discord-black text-xs px-9 py-2 rounded-lg border border-transparent focus:border-indigo-500 dark:focus:border-discord-blurple focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-discord-muted"
            />
          </div>
        </div>

        {/* Scrollable conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">

          {/* ── GROUPS SECTION ── */}
          <div className="mb-1">
            <button
              onClick={() => setShowGroupsSection(v => !v)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-discord-muted hover:text-gray-700 dark:hover:text-white transition rounded-lg group"
            >
              <span className="flex items-center gap-1.5">
                {showGroupsSection ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Groups — {filteredGroups.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowCreateGroupModal(true); }}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-discord-blurple hover:text-white text-gray-500 dark:text-discord-muted transition opacity-0 group-hover:opacity-100"
                title="Create Group"
              >
                <Plus className="w-3 h-3" />
              </button>
            </button>

            {showGroupsSection && (
              <div className="space-y-0.5 mt-0.5">
                {filteredGroups.length === 0 ? (
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 dark:text-discord-muted hover:bg-gray-300/60 dark:hover:bg-zinc-800/40 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create your first group</span>
                  </button>
                ) : (
                  filteredGroups.map((g) => {
                    const isSelected = activeConversation?.id === g.conversationId;
                    const lastMsg = g.conversationId ? lastMessages[g.conversationId] : undefined;
                    const groupUnreadNotifications = notifications.filter(
                      (n) => n.referenceId === g.conversationId && !n.read && n.type === 'NEW_MESSAGE'
                    );
                    const groupUnreadCount = groupUnreadNotifications.length;
                    const hasUnread = groupUnreadCount > 0;

                    return (
                      <div
                        key={g.id}
                        onClick={() => handleOpenGroup(g)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-indigo-600/10 dark:bg-zinc-800 text-indigo-750 dark:text-white'
                            : 'hover:bg-gray-300/60 dark:hover:bg-zinc-800/40 text-gray-700 dark:text-discord-text'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/80 dark:bg-discord-blurple/80 text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {g.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-baseline gap-1">
                            <p className={`text-sm truncate m-0 ${hasUnread ? 'font-bold text-gray-950 dark:text-white' : 'font-medium'}`}>{g.name}</p>
                            {lastMsg && (
                              <span className={`text-[10px] shrink-0 ${hasUnread ? 'font-semibold text-indigo-650 dark:text-indigo-400' : 'text-gray-400 dark:text-discord-muted'}`}>
                                {formatConversationTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-semibold text-gray-950 dark:text-white' : 'text-gray-500 dark:text-discord-muted'}`}>
                              {lastMsg
                                ? formatLastMessage(lastMsg, true)
                                : `${g.memberCount} thành viên`}
                            </p>
                            {hasUnread && (
                              <span className="ml-2 w-4 h-4 bg-indigo-600 dark:bg-discord-blurple text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                {groupUnreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-gray-300 dark:bg-zinc-800/60 mx-1 my-2" />

          {/* ── DIRECT MESSAGES SECTION ── */}
          <div>
            <button
              onClick={() => setShowDmsSection(v => !v)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-discord-muted hover:text-gray-700 dark:hover:text-white transition rounded-lg"
            >
              {showDmsSection ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Direct Messages — {filteredPrivate.length}
            </button>

            {showDmsSection && (
              <div className="space-y-0.5 mt-0.5">
                {filteredPrivate.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500 dark:text-discord-muted">
                    {searchQuery ? 'No matches found.' : 'No DMs yet. Chat with friends!'}
                  </div>
                ) : (
                  filteredPrivate.map((c) => {
                    const friend = getFriendInfo(c);
                    const lastMsg = lastMessages[c.id];
                    const isSelected = activeConversation?.id === c.id;
                    const convUnreadNotifications = notifications.filter(
                      (n) => n.referenceId === c.id && !n.read && n.type === 'NEW_MESSAGE'
                    );
                    const convUnreadCount = convUnreadNotifications.length;
                    const hasUnread = convUnreadCount > 0;

                    return (
                      <div
                        key={c.id}
                        onClick={() => selectConversation(c.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-indigo-600/10 dark:bg-zinc-800 text-indigo-750 dark:text-white'
                            : 'hover:bg-gray-300/60 dark:hover:bg-zinc-800/40 text-gray-700 dark:text-discord-text'
                        }`}
                      >
                        <div className="relative shrink-0">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.username} className="w-10 h-10 rounded-full object-cover border border-gray-350 dark:border-zinc-800" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-semibold flex items-center justify-center text-sm">
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-200 dark:border-discord-mid ${
                            friend.status === 'AWAY' ? 'bg-amber-500' : friend.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-baseline gap-1">
                            <h4 className={`text-sm truncate m-0 ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium'}`}>{friend.username}</h4>
                            {lastMsg && (
                              <span className={`text-[10px] shrink-0 ${hasUnread ? 'font-semibold text-indigo-650 dark:text-indigo-400' : 'text-gray-400 dark:text-discord-muted'}`}>
                                {formatConversationTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-semibold text-gray-950 dark:text-white' : 'text-gray-500 dark:text-discord-muted'}`}>
                              {lastMsg
                                ? formatLastMessage(lastMsg, false)
                                : 'Bắt đầu cuộc trò chuyện'}
                            </p>
                            {hasUnread && (
                              <span className="ml-2 w-4 h-4 bg-indigo-600 dark:bg-discord-blurple text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                {convUnreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-gray-250 dark:bg-zinc-950 p-3 flex items-center gap-3 border-t border-gray-300 dark:border-zinc-900/60 shrink-0 text-left">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover border border-indigo-100 dark:border-zinc-800" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-zinc-950" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold truncate text-gray-900 dark:text-white m-0">{user.username}</h5>
              <p className="text-[10px] text-gray-500 dark:text-discord-muted truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}
      </section>

      {/* Column 3: Chat Window */}
      <main className="flex-1 flex flex-col bg-gray-100 dark:bg-discord-dark overflow-hidden relative">
        {activeConversation && activeFriend ? (
          <>
            {/* Chat Header */}
            <header className="h-14 bg-gray-150 dark:bg-discord-dark border-b border-gray-300 dark:border-zinc-900/50 flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-3 text-left">
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

                return (
                  <div key={msg.id} className="flex flex-col space-y-1">
                    {showDivider && (
                      <div className="flex items-center justify-center my-4 shrink-0 select-none">
                        <div className="flex-1 h-px bg-gray-250 dark:bg-zinc-800/80" />
                        <span className="px-3 text-[10px] font-bold text-gray-500 dark:text-discord-muted bg-gray-100 dark:bg-discord-dark uppercase tracking-wider">
                          {formatDividerDate(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-gray-250 dark:bg-zinc-800/80" />
                      </div>
                    )}

                    <div className={`flex gap-3 max-w-lg sm:max-w-xl md:max-w-2xl ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      {/* Avatar for non-self messages */}
                      {!isMe && (
                        <div className="shrink-0 mt-0.5">
                          {!isGroupConversation && activeFriend.avatarUrl ? (
                            <img src={activeFriend.avatarUrl} alt={activeFriend.username} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-850" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-650 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-xs">
                              {getSenderUsername(msg).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col">
                        {/* Show sender name in group chat */}
                        {showSenderName && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-discord-blurple mb-1 ml-0.5">
                            {getSenderUsername(msg)}
                          </span>
                        )}
                        {msg.messageType === 'IMAGE' ? (
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
                            <p className="m-0 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                        <span className={`text-[10px] text-gray-500 dark:text-discord-muted mt-1 ${isMe ? 'text-right' : 'text-left'} flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
              {/* File Upload Preview Panel */}
              {(uploadingFile || uploadedFileUrl || selectedFileName) && (
                <div className="bg-gray-200/80 dark:bg-discord-mid/80 backdrop-blur-sm border border-gray-300 dark:border-zinc-900/60 rounded-t-2xl p-3 flex items-center gap-3 relative border-b-0 animate-fadeIn">
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
                (uploadingFile || uploadedFileUrl || selectedFileName) ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'
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

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}

      {/* Call Overlay */}
      <CallOverlay />
    </div>
  );
};

export default Chat;
