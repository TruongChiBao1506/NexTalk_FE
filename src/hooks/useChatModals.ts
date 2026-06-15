import { useState, useEffect } from 'react';
import type { User as AuthUser } from '../types/auth';
import type { MessageResponse, PollOption } from '../types/chat';

export const useChatModals = () => {
  const [isInviteMembersOpen, setIsInviteMembersOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollVoterDialog, setPollVoterDialog] = useState<{ option: PollOption; anonymous: boolean } | null>(null);
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO'; name?: string } | null>(null);
  const [sharingMessage, setSharingMessage] = useState<MessageResponse | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [searchProfileUser, setSearchProfileUser] = useState<AuthUser | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const closeConfirmDialog = () => setConfirmDialog(null);
  const closeAllModals = () => {
    setIsInviteMembersOpen(false);
    setIsProfileModalOpen(false);
    setIsCreatePollOpen(false);
    setPollVoterDialog(null);
    setActiveMedia(null);
    setSharingMessage(null);
    setIsPinModalOpen(false);
    setSearchProfileUser(null);
    closeConfirmDialog();
  };

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


  return {
    isInviteMembersOpen, setIsInviteMembersOpen,
    isProfileModalOpen, setIsProfileModalOpen,
    isCreatePollOpen, setIsCreatePollOpen,
    pollVoterDialog, setPollVoterDialog,
    activeMedia, setActiveMedia,
    sharingMessage, setSharingMessage,
    isPinModalOpen, setIsPinModalOpen,
    searchProfileUser, setSearchProfileUser,
    confirmDialog, setConfirmDialog,
    closeConfirmDialog,
    closeAllModals
  };
};
