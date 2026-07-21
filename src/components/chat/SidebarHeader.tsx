import { Loader2, Plus, Cloud } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

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
          onClick={() => void getOrCreateCloudConversation()}
          className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all duration-200"
          title="Cloud của tôi"
        >
          <Cloud className="w-4 h-4" />
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
