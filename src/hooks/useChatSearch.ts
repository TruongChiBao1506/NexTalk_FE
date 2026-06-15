import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { userService } from '../services/userService';
import { messageService } from '../services/messageService';
import { conversationService } from '../services/conversationService';
import type { User as AuthUser } from '../types/auth';
import type { MessageResponse, ConversationResponse } from '../types/chat';

interface UseChatSearchProps {
  handleJumpToMessage: (messageId: string) => void;
}

export const useChatSearch = ({ handleJumpToMessage }: UseChatSearchProps) => {
  const { user } = useAuthStore();
  const { selectConversation } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [globalUserResults, setGlobalUserResults] = useState<AuthUser[]>([]);
  const [globalMessageResults, setGlobalMessageResults] = useState<MessageResponse[]>([]);
  const [globalConversationResults, setGlobalConversationResults] = useState<ConversationResponse[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState<string | null>(null);

  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');

  const normalizeSearchTerm = (value: string) => value.trim().toLowerCase().replace(/^@/, '');

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

      } catch (err) {
        if (!cancelled) {
          console.error('Lỗi khi tìm kiếm toàn cục:', err);
          setGlobalSearchError('Có lỗi xảy ra khi tìm kiếm.');
          setGlobalUserResults([]);
          setGlobalMessageResults([]);
          setGlobalConversationResults([]);
        }
      } finally {
        if (!cancelled) setIsGlobalSearching(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, user?.id]);

  const handleOpenSearchMessage = async (message: MessageResponse) => {
    await selectConversation(message.conversationId);
    setSearchQuery('');
    window.setTimeout(() => handleJumpToMessage(message.id), 450);
  };

  return {
    searchQuery, setSearchQuery,
    globalUserResults, setGlobalUserResults,
    globalMessageResults, setGlobalMessageResults,
    globalConversationResults, setGlobalConversationResults,
    isGlobalSearching,
    globalSearchError, setGlobalSearchError,
    groupMemberSearchQuery, setGroupMemberSearchQuery,
    normalizeSearchTerm,
    handleOpenSearchMessage
  };
};
