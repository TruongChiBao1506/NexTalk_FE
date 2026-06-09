import React from 'react';
import type { MessageReaction } from '../../types/chat';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onReactToggle: (emoji: string) => void;
  isMe?: boolean;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  currentUserId,
  onReactToggle,
  isMe = false,
}) => {
  if (!reactions || reactions.length === 0) return null;

  // Extract all unique emojis reacted to the message
  const uniqueEmojis = Array.from(new Set(reactions.map((r) => r.emoji)));

  // Identify the most recently added reaction emoji (last in array)
  const mostRecentReaction = reactions[reactions.length - 1];
  const mostRecentEmoji = mostRecentReaction ? mostRecentReaction.emoji : '👍';

  // Check if current user has reacted with the most recent emoji type
  const hasReactedMostRecent = reactions.some(
    (r) => r.userId === currentUserId && r.emoji === mostRecentEmoji
  );

  // Generate tooltip text with distinct usernames, prioritizing "Bạn" first if current user reacted
  const distinctUsers = Array.from(
    new Set(reactions.map((r) => (r.userId === currentUserId ? 'Bạn' : r.username)))
  );
  const sortedUsers = distinctUsers.includes('Bạn')
    ? ['Bạn', ...distinctUsers.filter((u) => u !== 'Bạn')]
    : distinctUsers;
  const tooltipText = sortedUsers.join(', ');

  return (
    <div className="flex items-center gap-1 select-none">
      {/* Left Pill: Emojis Summary & Total Count */}
      <button
        onClick={() => onReactToggle(mostRecentEmoji)}
        className="group relative flex items-center px-2.5 py-0.5 rounded-full text-xs border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 shadow-sm transition-all duration-150"
      >
        <div className="flex items-center space-x-0.5">
          {uniqueEmojis.map((emoji) => (
            <span key={emoji} className="text-sm leading-none">{emoji}</span>
          ))}
        </div>
        <span className="font-semibold text-[10px] ml-1.5">{reactions.length}</span>

        {/* Custom Tooltip - Displayed Below */}
        <div className={`absolute top-full mt-2.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none w-max max-w-[220px] ${
          isMe 
            ? 'right-0 origin-top-right' 
            : 'left-0 origin-top-left'
        }`}>
          {/* Arrow pointing UP */}
          <div className={`w-2 h-2 bg-gray-950/90 dark:bg-zinc-900/95 border-l border-t border-gray-800 dark:border-zinc-800/80 rotate-45 -mb-1 z-10 ${
            isMe ? 'mr-3.5 self-end' : 'ml-3.5 self-start'
          }`} />
          <div className="bg-gray-950/90 dark:bg-zinc-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg border border-gray-800 dark:border-zinc-800/80 whitespace-normal break-words leading-tight text-center">
            {tooltipText}
          </div>
        </div>
      </button>

      {/* Right Pill: Most Recent Reaction Toggle Button */}
      <button
        onClick={() => onReactToggle(mostRecentEmoji)}
        className={`flex items-center justify-center w-[26px] h-[26px] rounded-full border shadow-sm transition-all duration-150 active:scale-90 ${
          hasReactedMostRecent
            ? 'bg-blue-50 dark:bg-indigo-950/45 border-blue-300 dark:border-indigo-800/80 text-blue-600 dark:text-indigo-305'
            : 'bg-white dark:bg-zinc-800 border-gray-250 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-350'
        }`}
        title={`Bày tỏ cảm xúc bằng ${mostRecentEmoji}`}
      >
        <span className="text-sm leading-none">{mostRecentEmoji}</span>
      </button>
    </div>
  );
};
