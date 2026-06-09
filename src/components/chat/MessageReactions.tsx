import React from 'react';
import type { MessageReaction } from '../../types/chat';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onReactToggle: (emoji: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  currentUserId,
  onReactToggle,
}) => {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const { emoji, userId, username } = reaction;
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        users: [],
        hasReacted: false,
      };
    }
    acc[emoji].users.push(username);
    if (userId === currentUserId) {
      acc[emoji].hasReacted = true;
    }
    return acc;
  }, {} as Record<string, { emoji: string; users: string[]; hasReacted: boolean }>);

  return (
    <div className="flex flex-wrap gap-1 mt-1 select-none">
      {Object.values(groupedReactions).map(({ emoji, users, hasReacted }) => {
        const tooltipText = users.join(', ');
        return (
          <button
            key={emoji}
            onClick={() => onReactToggle(emoji)}
            className={`group relative flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs border transition-all duration-150 ${
              hasReacted
                ? 'bg-discord-blurple/15 border-discord-blurple text-discord-blurple-light'
                : 'bg-discord-dark-secondary border-discord-gray-600 hover:border-discord-gray-400 text-discord-gray-300 hover:text-discord-gray-100'
            }`}
            title={tooltipText}
          >
            <span className="text-sm">{emoji}</span>
            <span className="font-semibold">{users.length}</span>

            {/* Custom Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 w-max max-w-[200px] bg-discord-dark-tertiary border border-discord-gray-600 text-discord-gray-100 text-[10px] px-2 py-1 rounded shadow-md pointer-events-none whitespace-normal break-words">
              {tooltipText}
            </div>
          </button>
        );
      })}
    </div>
  );
};
