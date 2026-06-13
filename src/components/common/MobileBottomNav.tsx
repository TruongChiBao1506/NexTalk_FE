import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MessageSquare, Users, CircleUserRound } from 'lucide-react';
import { useFriendStore } from '../../store/friendStore';
import { useChatStore } from '../../store/chatStore';

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { selectConversation } = useChatStore();
  const { pending, fetchPending } = useFriendStore();

  const currentPath = location.pathname;

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleChatTabClick = () => {
    // Navigate to chat and clear active conversation to show list
    selectConversation(null);
    navigate('/chat');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-zinc-900/60 flex items-center justify-around z-40 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)] transition-colors duration-300">
      
      {/* Chats Tab */}
      <button
        onClick={handleChatTabClick}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
          currentPath === '/chat'
            ? 'text-indigo-650 dark:text-discord-blurple scale-105'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'
        }`}
      >
        <MessageSquare className="w-5.5 h-5.5" />
        <span className="text-[10px] font-bold mt-1 tracking-wide">Chats</span>
      </button>

      {/* Friends Tab */}
      <button
        onClick={() => navigate('/friends')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
          currentPath === '/friends'
            ? 'text-indigo-650 dark:text-discord-blurple scale-105'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'
        }`}
      >
        <Users className="w-5.5 h-5.5" />
        <span className="text-[10px] font-bold mt-1 tracking-wide">Friends</span>
        {pending.length > 0 && (
          <span className="absolute top-2 right-1/2 translate-x-5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-zinc-950 animate-pulse">
            {pending.length > 99 ? '99+' : pending.length}
          </span>
        )}
      </button>

      {/* Profile/Settings Tab */}
      <button
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
          currentPath === '/profile'
            ? 'text-indigo-650 dark:text-discord-blurple scale-105'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'
        }`}
      >
        <CircleUserRound className="w-5.5 h-5.5" />
        <span className="text-[10px] font-bold mt-1 tracking-wide">Profile</span>
      </button>

    </nav>
  );
};

export default MobileBottomNav;
