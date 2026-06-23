import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useChatRequestStore } from '../store/chatRequestStore';
import { conversationService } from '../services/conversationService';
import type { ChatRequestResponse } from '../types/chatRequest';

interface UseConversationActionsProps {
  setPendingHideId: (id: string | null) => void;
  setIsPinModalOpen: (isOpen: boolean) => void;
  setIsConversationInfoOpen: (isOpen: boolean) => void;
  setIsPinnedPanelOpen: (isOpen: boolean) => void;
  setIsSearchPanelOpen: (isOpen: boolean) => void;
  fetchIncomingChatRequests: () => Promise<void>;
  setSelectedChatRequest: (req: ChatRequestResponse | null) => void;
  setConversationTab: (tab: 'chats' | 'requests') => void;
  showAlertDialog: (description: string, title?: string, variant?: 'primary' | 'danger') => void;
}

export const useConversationActions = ({
  setPendingHideId,
  setIsPinModalOpen,
  setIsConversationInfoOpen,
  setIsPinnedPanelOpen,
  setIsSearchPanelOpen,
  fetchIncomingChatRequests,
  setSelectedChatRequest,
  setConversationTab,
  showAlertDialog,
}: UseConversationActionsProps) => {
  const { user } = useAuthStore();
  const {
    toggleHideConversation,
    fetchConversations,
    togglePinConversation,
    deleteConversation,
    selectConversation,
  } = useChatStore();
  const {
    acceptRequest: acceptChatRequest,
    rejectRequest: rejectChatRequest,
    blockRequestSender,
    reportRequestSender,
  } = useChatRequestStore();

  const [conversationActionId, setConversationActionId] = useState<string | null>(null);
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);

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
        showAlertDialog('Không thể cập nhật trạng thái ghim hội thoại.', 'Không thể cập nhật', 'danger');
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
        showAlertDialog('Không thể xóa hội thoại.', 'Không thể xóa', 'danger');
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
        showAlertDialog('Lỗi cập nhật thời gian tự hủy tin nhắn.', 'Không thể cập nhật', 'danger');
      }
    } catch (err) {
      showAlertDialog('Lỗi cập nhật thời gian tự hủy tin nhắn.', 'Không thể cập nhật', 'danger');
    } finally {
      setConversationActionId(null);
    }
  };

  const handleAcceptChatRequest = async (requestId: string) => {
    setChatRequestActionId(requestId);
    try {
      const accepted = await acceptChatRequest(requestId);
      if (accepted?.conversationId) {
        setSelectedChatRequest(null);
        await fetchIncomingChatRequests();
        await fetchConversations();
        setConversationTab('chats');
        await selectConversation(accepted.conversationId);
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
      const rejected = await rejectChatRequest(requestId);
      if (rejected) {
        setSelectedChatRequest(null);
        await fetchIncomingChatRequests();
      }
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
      const blocked = await blockRequestSender(request);
      if (blocked) {
        setSelectedChatRequest(null);
        await fetchIncomingChatRequests();
      }
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
      const reported = await reportRequestSender(request);
      if (reported) {
        setSelectedChatRequest(null);
        await fetchIncomingChatRequests();
        showAlertDialog('Đã báo cáo và chặn người dùng.', 'Đã báo cáo', 'primary');
      }
    } catch (err) {
      console.error('Failed to report chat request:', err);
    } finally {
      setChatRequestActionId(null);
    }
  };

  return {
    conversationActionId, setConversationActionId,
    openConversationMenuId, setOpenConversationMenuId,
    chatRequestActionId,
    handleHideClick,
    handleToggleConversationPin,
    handleDeleteConversation,
    handleUpdateSelfDestruct,
    handleAcceptChatRequest,
    handleRejectChatRequest,
    handleBlockChatRequest,
    handleReportChatRequest,
  };
};
