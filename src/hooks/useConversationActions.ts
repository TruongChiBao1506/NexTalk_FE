import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useGroupStore } from '../store/groupStore';
import { blockService } from '../services/blockService';
import { chatRequestService } from '../services/chatRequestService';
import { conversationService } from '../services/conversationService';
import type { ChatRequestResponse } from '../types/chatRequest';

interface UseConversationActionsProps {
  setPendingHideId: (id: string | null) => void;
  setIsPinModalOpen: (isOpen: boolean) => void;
  setIsConversationInfoOpen: (isOpen: boolean) => void;
  setIsPinnedPanelOpen: (isOpen: boolean) => void;
  setIsSearchPanelOpen: (isOpen: boolean) => void;
  setExpandedGroups: (updater: (prev: Set<string>) => Set<string>) => void;
  fetchIncomingChatRequests: () => Promise<void>;
  setSelectedChatRequest: (req: ChatRequestResponse | null) => void;
  setConversationTab: (tab: 'chats' | 'requests') => void;
}

export const useConversationActions = ({
  setPendingHideId,
  setIsPinModalOpen,
  setIsConversationInfoOpen,
  setIsPinnedPanelOpen,
  setIsSearchPanelOpen,
  setExpandedGroups,
  fetchIncomingChatRequests,
  setSelectedChatRequest,
  setConversationTab,
}: UseConversationActionsProps) => {
  const { user } = useAuthStore();
  const {
    toggleHideConversation,
    fetchConversations,
    togglePinConversation,
    deleteConversation,
    selectConversation,
  } = useChatStore();
  const { createChannel } = useGroupStore();

  const [conversationActionId, setConversationActionId] = useState<string | null>(null);
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);

  const [createChannelGroupId, setCreateChannelGroupId] = useState<string | null>(null);
  const [createChannelName, setCreateChannelName] = useState('');
  const [createChannelType, setCreateChannelType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const [chatRequestActionId, setChatRequestActionId] = useState<string | null>(null);

  const handleHideClick = async (convId: string) => {
    setOpenConversationMenuId(null);
    const hasPin = user?.hasChatPin;
    if (!hasPin) {
      setPendingHideId(convId);
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

  const handleUpdateSelfDestruct = async (seconds: number) => {
    const activeConversation = useChatStore.getState().activeConversation;
    if (!activeConversation) return;
    setConversationActionId('self-destruct');
    try {
      const response = await conversationService.updateSelfDestruct(activeConversation.id, seconds);
      if (response.success && response.data) {
        useChatStore.setState((state) => ({
          activeConversation: state.activeConversation?.id === response.data.id ? response.data : state.activeConversation,
          conversations: state.conversations.map((c) => c.id === response.data.id ? response.data : c)
        }));
      } else {
        window.alert('Lỗi cập nhật thời gian tự hủy tin nhắn.');
      }
    } catch (err) {
      window.alert('Lỗi cập nhật thời gian tự hủy tin nhắn.');
    } finally {
      setConversationActionId(null);
    }
  };

  const handleCreateChannel = async () => {
    if (!createChannelGroupId || !createChannelName.trim() || isCreatingChannel) return;
    setIsCreatingChannel(true);
    try {
      const ok = await createChannel(createChannelGroupId, {
        name: createChannelName.trim(),
        type: createChannelType,
        isPrivate: false,
      });
      if (ok) {
        setExpandedGroups((prev) => new Set([...prev, createChannelGroupId]));
        setCreateChannelGroupId(null);
        setCreateChannelName('');
        setCreateChannelType('TEXT');
      } else {
        window.alert('Không thể tạo kênh. Vui lòng thử lại.');
      }
    } catch (err: any) {
      window.alert(err?.response?.data?.message || err?.message || 'Không thể tạo kênh.');
    } finally {
      setIsCreatingChannel(false);
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

  const handleRejectChatRequest = async (requestId: string) => {
    setChatRequestActionId(requestId);
    try {
      await chatRequestService.reject(requestId);
      setSelectedChatRequest(null);
      await fetchIncomingChatRequests();
    } catch (err) {
      console.error('Failed to reject chat request:', err);
    } finally {
      setChatRequestActionId(null);
    }
  };

  const handleBlockChatRequest = async (request: ChatRequestResponse) => {
    const confirm = window.confirm(`Chặn tin nhắn từ ${request.sender.username}?`);
    if (!confirm) return;
    setChatRequestActionId(request.id);
    try {
      await blockService.blockUser(request.sender.id);
      await chatRequestService.reject(request.id);
      setSelectedChatRequest(null);
      await fetchIncomingChatRequests();
    } catch (err) {
      console.error('Failed to block chat request:', err);
    } finally {
      setChatRequestActionId(null);
    }
  };

  const handleReportChatRequest = async (request: ChatRequestResponse) => {
    const confirm = window.confirm(`Báo cáo tin nhắn rác/quấy rối từ ${request.sender.username}? Hành động này sẽ tự động chặn họ.`);
    if (!confirm) return;
    setChatRequestActionId(request.id);
    try {
      await blockService.blockUser(request.sender.id);
      await chatRequestService.reject(request.id);
      setSelectedChatRequest(null);
      await fetchIncomingChatRequests();
      window.alert('Đã báo cáo và chặn người dùng.');
    } catch (err) {
      console.error('Failed to report chat request:', err);
    } finally {
      setChatRequestActionId(null);
    }
  };

  return {
    conversationActionId, setConversationActionId,
    openConversationMenuId, setOpenConversationMenuId,
    createChannelGroupId, setCreateChannelGroupId,
    createChannelName, setCreateChannelName,
    createChannelType, setCreateChannelType,
    isCreatingChannel,
    chatRequestActionId,
    handleHideClick,
    handleToggleConversationPin,
    handleDeleteConversation,
    handleUpdateSelfDestruct,
    handleCreateChannel,
    handleAcceptChatRequest,
    handleRejectChatRequest,
    handleBlockChatRequest,
    handleReportChatRequest,
  };
};
