import React from 'react';
import type { MessageReaction } from '../../types/chat';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onReactToggle: (emoji: string) => void;
  isMe?: boolean;
}

interface ReactionGroup {
  emoji: string;
  users: MessageReaction[];
  reactedByCurrentUser: boolean;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  currentUserId,
  onReactToggle,
  isMe = false,
}) => {
  if (!reactions || reactions.length === 0) return null;

  const groups = reactions.reduce<ReactionGroup[]>((acc, reaction) => {
    const existing = acc.find((group) => group.emoji === reaction.emoji);
    if (existing) {
      existing.users.push(reaction);
      existing.reactedByCurrentUser = existing.reactedByCurrentUser || reaction.userId === currentUserId;
      return acc;
    }

    acc.push({
      emoji: reaction.emoji,
      users: [reaction],
      reactedByCurrentUser: reaction.userId === currentUserId,
    });
    return acc;
  }, []);

  const getUserLabel = (reaction: MessageReaction) =>
    reaction.userId === currentUserId ? 'Bạn' : reaction.username;

  return (
    <div className={`flex max-w-[min(72vw,360px)] flex-wrap items-center gap-1 select-none ${isMe ? 'justify-end' : 'justify-start'}`}>
      {groups.map((group) => {
        const sortedUsers = [...group.users].sort((a, b) => {
          if (a.userId === currentUserId) return -1;
          if (b.userId === currentUserId) return 1;
          return a.username.localeCompare(b.username);
        });
        const tooltipText = sortedUsers.map(getUserLabel).join(', ');

        return (
          <button
            key={group.emoji}
            type="button"
            onClick={() => onReactToggle(group.emoji)}
            className={`group relative inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
              group.reactedByCurrentUser
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 dark:border-indigo-500/60 dark:bg-indigo-500/20 dark:text-indigo-100 dark:ring-indigo-400/25 dark:hover:bg-indigo-500/30'
                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/70 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-zinc-700'
            }`}
            aria-label={`${group.emoji}: ${tooltipText}`}
          >
            <span className="text-sm leading-none">{group.emoji}</span>
            <span className="min-w-2 text-[10px] leading-none">{group.users.length}</span>

            <span
              className={`pointer-events-none absolute top-full z-40 mt-2 hidden w-max max-w-[230px] flex-col rounded-xl border border-indigo-100 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-slate-700 shadow-lg shadow-indigo-950/10 backdrop-blur-md group-hover:flex group-focus-visible:flex dark:border-zinc-700 dark:bg-[#242938]/95 dark:text-zinc-100 dark:shadow-black/25 ${
                isMe ? 'right-0 text-right' : 'left-0 text-left'
              }`}
            >
              <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                {group.emoji} {group.users.length}
              </span>
              <span className="whitespace-normal break-words">{tooltipText}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
