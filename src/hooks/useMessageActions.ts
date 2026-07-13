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
  showAlertDialog: (description: string, title?: string, variant?: 'primary' | 'danger') => void;
}

import { conversationService } from '../services/conversationService';
import { chatRequestService } from '../services/chatRequestService';
import { stripHtml } from '../utils/text';

export const useMessageActions = ({
  sharingMessage,
  setSharingMessage,
  selectConversation,
  editMessage,
  shareMessage,
  showAlertDialog,
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
    const scrollToElement = () => {
      const element = document.getElementById(`message-${messageId}`);
      if (!element) return false;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-discord-blurple/25');
      setTimeout(() => element.classList.remove('bg-discord-blurple/25'), 2000);
      return true;
    };

    if (scrollToElement()) return;

    // Pinned messages can be older than the currently loaded history page.
    // Insert the full pinned response into the rendered timeline, then retry.
    const state = useChatStore.getState();
    const pinnedMessage = state.pinnedMessages.find((message) => message.id === messageId);
    if (!pinnedMessage) return;
    useChatStore.setState((current) => {
      const withoutDuplicate = current.messages.filter((message) => message.id !== pinnedMessage.id);
      const messages = [...withoutDuplicate, pinnedMessage].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        messages,
        messagesCache: current.activeConversation
          ? { ...current.messagesCache, [current.activeConversation.id]: messages }
          : current.messagesCache
      };
    });

    window.setTimeout(scrollToElement, 80);
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

  const handleShareMessage = async (targetConversationIds: string[], strangerUserIds: string[] = []) => {
    if (!sharingMessage) return false;
    setIsSharingMessage(true);
    try {
      const results = await Promise.allSettled([
        ...(targetConversationIds.length > 0
          ? [shareMessage(sharingMessage.id, targetConversationIds)]
          : []),
        ...strangerUserIds.map((receiverId) =>
          chatRequestService.create({
            receiverId,
            message: stripHtml(sharingMessage.content) || 'Tin nhắn được chia sẻ',
            sharedMessageId: sharingMessage.id,
          }).then((response) => response.success),
        ),
      ]);
      const ok = results.length > 0 && results.every(
        (result) => result.status === 'fulfilled' && result.value,
      );
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
        showAlertDialog('Kh?ng th? t?m t?t h?i tho?i.', 'Kh?ng th? t?m t?t', 'danger');
      }
    } catch (err: any) {
      showAlertDialog(err.response?.data?.message || err.message || 'Kh?ng th? t?m t?t h?i tho?i.', 'Kh?ng th? t?m t?t', 'danger');
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
      showAlertDialog(err.response?.data?.message || err.message || 'Kh?ng th? c?p nh?t b?nh ch?n.', 'B?nh ch?n', 'danger');
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
      showAlertDialog(err.response?.data?.message || err.message || 'Kh?ng th? th?m l?a ch?n.', 'B?nh ch?n', 'danger');
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
      showAlertDialog(err.response?.data?.message || err.message || 'Kh?ng th? kh?a b?nh ch?n.', 'B?nh ch?n', 'danger');
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
      showAlertDialog(err.response?.data?.message || err.message || 'Kh?ng th? x?a b?nh ch?n.', 'B?nh ch?n', 'danger');
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
