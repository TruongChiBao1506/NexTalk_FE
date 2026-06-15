import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { messageService } from '../services/messageService';
import type { MessageResponse } from '../types/chat';

interface UseMessageActionsProps {
  sharingMessage: MessageResponse | null;
  setSharingMessage: (msg: MessageResponse | null) => void;
  selectConversation: (id: string) => Promise<void>;
  editMessage: (id: string, content: string) => Promise<void>;
  shareMessage: (messageId: string, targetIds: string[]) => Promise<boolean>;
}

import { conversationService } from '../services/conversationService';

export const useMessageActions = ({
  sharingMessage,
  setSharingMessage,
  selectConversation,
  editMessage,
  shareMessage,
}: UseMessageActionsProps) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [isSharingMessage, setIsSharingMessage] = useState(false);
  const [isSummarizingConversation, setIsSummarizingConversation] = useState(false);
  
  const [pollActionMessageId, setPollActionMessageId] = useState<string | null>(null);
  const [pollNewOptionText, setPollNewOptionText] = useState<Record<string, string>>({});

  const updateMessageInChat = (updated: MessageResponse) => {
    useChatStore.setState((state) => ({
      messages: state.messages.map((message) => message.id === updated.id ? updated : message),
      pinnedMessages: state.pinnedMessages.map((message) => message.id === updated.id ? updated : message),
      lastMessages: state.lastMessages[updated.conversationId]?.id === updated.id
        ? { ...state.lastMessages, [updated.conversationId]: updated }
        : state.lastMessages
    }));
  };

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
    const activeConversationId = useChatStore.getState().activeConversation?.id;
    if (activeConversationId !== conversationId) {
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
    const activeConversationId = useChatStore.getState().activeConversation?.id;
    if (!activeConversationId || isSummarizingConversation) return;
    setIsSummarizingConversation(true);
    try {
      const response = await conversationService.summarizeConversation(activeConversationId);
      if (response.success && response.data) {
        const { setConversationSummary } = useChatStore.getState();
        setConversationSummary(response.data);
      } else {
        window.alert('Không thể tóm tắt hội thoại.');
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể tóm tắt hội thoại.');
    } finally {
      setIsSummarizingConversation(false);
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

  return {
    editingMessageId, setEditingMessageId,
    editInputText, setEditInputText,
    isSharingMessage, setIsSharingMessage,
    isSummarizingConversation, setIsSummarizingConversation,
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
  };
};
