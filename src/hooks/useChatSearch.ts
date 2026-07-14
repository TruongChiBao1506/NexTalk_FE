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
  const [pinUnlockStatus, setPinUnlockStatus] = useState<'idle' | 'verifying' | 'unlocked' | 'invalid'>('idle');

  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');

  const normalizeSearchTerm = (value: string) => value.trim().toLowerCase().replace(/^@/, '');

  useEffect(() => {
    const query = searchQuery.trim();
    const isChatPinEntry = Boolean(user?.hasChatPin && /^\d{1,4}$/.test(query));

    if (isChatPinEntry) {
      setGlobalUserResults([]);
      setGlobalMessageResults([]);
      setGlobalSearchError(null);

      if (query.length < 4) {
        setPinUnlockStatus('idle');
        setGlobalConversationResults([]);
        setIsGlobalSearching(false);
        return;
      }

      let cancelled = false;
      setPinUnlockStatus('verifying');
      const timer = window.setTimeout(async () => {
        setIsGlobalSearching(true);
        try {
          const response = await conversationService.searchConversations(query);
          if (!cancelled) {
            setGlobalConversationResults(response.success && response.data ? response.data : []);
            setPinUnlockStatus('unlocked');
          }
        } catch {
          if (!cancelled) {
            setGlobalConversationResults([]);
            setPinUnlockStatus('invalid');
            setGlobalSearchError('Mã PIN không chính xác hoặc bạn đã thử quá nhiều lần.');
          }
        } finally {
          if (!cancelled) setIsGlobalSearching(false);
        }
      }, 500);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    if (query.length < 2) {
      setPinUnlockStatus('idle');
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
  }, [searchQuery, user?.hasChatPin, user?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        setSearchQuery('');
        setGlobalConversationResults([]);
        setGlobalSearchError(null);
        setPinUnlockStatus('idle');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
    pinUnlockStatus,
    groupMemberSearchQuery, setGroupMemberSearchQuery,
    normalizeSearchTerm,
    handleOpenSearchMessage
  };
};
