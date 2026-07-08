interface SidebarTabsProps {
  conversationTab: 'chats' | 'requests';
  setConversationTab: (val: 'chats' | 'requests') => void;
  fetchIncomingChatRequests: () => void;
  incomingRequestsCount: number;
}

export const SidebarTabs = ({
  conversationTab,
  setConversationTab,
  fetchIncomingChatRequests,
  incomingRequestsCount,
}: SidebarTabsProps) => {
  return (
    <div className="px-3 pb-2 shrink-0">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/55 p-1 ring-1 ring-indigo-100/80 dark:bg-zinc-900/55 dark:ring-zinc-800">
        <button
          type="button"
          onClick={() => setConversationTab('chats')}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            conversationTab === 'chats'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Trò chuyện
        </button>
        <button
          type="button"
          onClick={() => {
            setConversationTab('requests');
            fetchIncomingChatRequests();
          }}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            conversationTab === 'requests'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Tin nhắn chờ
          {incomingRequestsCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white shadow">
              {incomingRequestsCount > 99 ? '99+' : incomingRequestsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
