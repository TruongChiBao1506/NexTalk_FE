import { Loader2, Plus, Cloud, Inbox } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useActionInboxStore } from '../../store/actionInboxStore';
import { useEffect, useState } from 'react';

interface SidebarHeaderProps {
  isConnecting: boolean;
  isConnected: boolean;
  connectWebSocket: () => void;
  setShowCreateGroupModal: (val: boolean) => void;
}

export const SidebarHeader = ({
  isConnecting,
  isConnected,
  connectWebSocket,
  setShowCreateGroupModal,
}: SidebarHeaderProps) => {
  const getOrCreateCloudConversation = useChatStore(state => state.getOrCreateCloudConversation);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const pendingActionCount = useActionInboxStore((state) => state.pendingCount);
  const toggleActionInbox = useActionInboxStore((state) => state.togglePanel);
  const fetchPendingActionCount = useActionInboxStore((state) => state.fetchPendingCount);

  useEffect(() => {
    void fetchPendingActionCount();
  }, [fetchPendingActionCount]);
  const handleCloudClick = async () => {
    try {
      setIsCloudLoading(true);
      await getOrCreateCloudConversation();
    } finally {
      setIsCloudLoading(false);
    }
  };

  return (
    <div className="h-[60px] flex items-center justify-between px-4 shrink-0 border-b border-indigo-100/70 dark:border-zinc-800/60">
      <div className="flex items-center gap-2">
        <h1 className="text-[17px] font-bold text-slate-950 dark:text-white tracking-tight">Tin nhắn</h1>
        {isConnecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
        ) : isConnected ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã kết nối" />
        ) : (
          <span
            className="w-2 h-2 rounded-full bg-rose-500 cursor-pointer"
            title="Mất kết nối - Nhấn để kết nối lại"
            onClick={connectWebSocket}
          />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleActionInbox}
          className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 transition-all duration-200 hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500"
          title="Hộp Cần xử lý"
          aria-label={`Hộp Cần xử lý${pendingActionCount > 0 ? `, ${pendingActionCount} mục` : ''}`}
        >
          <Inbox className="h-4 w-4" />
          {pendingActionCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-black leading-4 text-white">
              {pendingActionCount > 99 ? '99+' : pendingActionCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleCloudClick}
          disabled={isCloudLoading}
          className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-500/10 flex items-center justify-center text-discord-blurple dark:text-indigo-300 hover:bg-discord-blurple hover:text-white dark:hover:bg-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
          title="Cloud của tôi"
        >
          {isCloudLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={() => setShowCreateGroupModal(true)}
          className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all duration-200"
          title="Tạo nhóm mới"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
