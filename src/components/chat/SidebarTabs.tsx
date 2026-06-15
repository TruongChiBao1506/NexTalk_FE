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
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-zinc-800/70 p-1">
        <button
          type="button"
          onClick={() => setConversationTab('chats')}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            conversationTab === 'chats'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
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
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
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
