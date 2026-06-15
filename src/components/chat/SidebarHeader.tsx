import { Loader2, Plus } from 'lucide-react';

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
  return (
    <div className="h-[60px] flex items-center justify-between px-4 shrink-0 border-b border-gray-100 dark:border-zinc-800/60">
      <div className="flex items-center gap-2">
        <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">Tin nhắn</h1>
        {isConnecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
        ) : isConnected ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã kết nối" />
        ) : (
          <span
            className="w-2 h-2 rounded-full bg-rose-500 cursor-pointer"
            title="Mất kết nối — Nhấn để kết nối lại"
            onClick={connectWebSocket}
          />
        )}
      </div>
      <button
        onClick={() => setShowCreateGroupModal(true)}
        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
        title="Tạo nhóm mới"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
