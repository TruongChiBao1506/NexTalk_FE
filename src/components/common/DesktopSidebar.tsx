import { useEffect } from 'react';
import { CircleUserRound, LogOut, MessageSquare, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useFriendStore } from '../../store/friendStore';
import { useGroupStore } from '../../store/groupStore';
import ThemeToggle from './ThemeToggle';

type DesktopPage = 'chat' | 'friends' | 'profile';

interface DesktopSidebarProps {
  activePage: DesktopPage;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const navButtonClass = (active: boolean) =>
  `relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200 ${
    active
      ? 'bg-indigo-600 text-white shadow-sm dark:bg-discord-blurple'
      : 'bg-white/60 text-slate-600 hover:bg-white hover:text-indigo-600 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
  }`;

export const DesktopSidebar = ({ activePage, onLogout, isLoggingOut }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const { selectConversation } = useChatStore();
  const { pending, fetchPending } = useFriendStore();
  const { pendingInvitations, fetchPendingInvitations } = useGroupStore();

  useEffect(() => {
    void fetchPending();
    void fetchPendingInvitations();
  }, [fetchPending, fetchPendingInvitations]);

  const pendingCount = pending.length + pendingInvitations.length;

  const openChat = () => {
    if (activePage !== 'chat') {
      selectConversation(null);
      navigate('/chat');
    }
  };

  return (
    <aside className="hidden h-dvh w-20 shrink-0 flex-col items-center border-r border-[#cbdcff] bg-gradient-to-b from-[#dce9ff] to-[#eef4ff] py-4 md:flex dark:border-[#24304a] dark:from-[#101827] dark:to-[#121a2b]">
      <button type="button" onClick={openChat} className={navButtonClass(activePage === 'chat')} aria-label="Tin nhắn" title="Tin nhắn">
        <MessageSquare className="h-5 w-5" />
      </button>

      <button type="button" onClick={() => navigate('/friends')} className={`${navButtonClass(activePage === 'friends')} mt-3`} aria-label="Bạn bè" title="Bạn bè">
        <Users className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-[#dce9ff] dark:ring-[#101827]">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      <button type="button" onClick={() => navigate('/profile')} className={`${navButtonClass(activePage === 'profile')} mt-3`} aria-label="Hồ sơ" title="Hồ sơ">
        <CircleUserRound className="h-5 w-5" />
      </button>

      <div className="mt-auto flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center">
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-rose-500 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50 dark:bg-zinc-900/60 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
