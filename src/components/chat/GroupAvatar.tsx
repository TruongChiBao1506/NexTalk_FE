import React from 'react';
interface GroupAvatarProps {
  conversation: GroupAvatarSource;
  className?: string;
  size?: number;
}

interface GroupAvatarSource {
  name?: string | null;
  avatarUrl?: string | null;
  members?: Array<{
    id?: string;
    userId?: string;
    username: string;
    avatarUrl?: string | null;
  }>;
}

export const GroupAvatar: React.FC<GroupAvatarProps> = ({ conversation, className = '', size = 48 }) => {
  // If the group has a custom avatar URL, show it
  if (conversation.avatarUrl) {
    return (
      <img
        src={conversation.avatarUrl}
        alt={conversation.name || 'Group Avatar'}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Otherwise, construct a composite avatar from the members
  const members = conversation.members || [];
  
  if (members.length === 0) {
    // Fallback if no members are somehow present
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {conversation.name ? conversation.name.charAt(0).toUpperCase() : 'G'}
      </div>
    );
  }

  if (members.length === 1) {
    // 1 member
    const member = members[0];
    if (member.avatarUrl) {
      return (
        <img
          src={member.avatarUrl}
          alt={member.username}
          className={`rounded-full object-cover shrink-0 ${className}`}
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {member.username.charAt(0).toUpperCase()}
      </div>
    );
  }

  // For 2 or more members, we create a circle with overflow hidden containing a grid
  const displayMembers = members.slice(0, 4);
  const remainingCount = members.length - 3;
  const isGrid2x2 = members.length >= 3;

  return (
    <div
      className={`rounded-full overflow-hidden bg-gray-200 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className={`w-full h-full grid ${isGrid2x2 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2'} gap-[1px] bg-white`}>
        {displayMembers.map((member, index) => {
          // If 4 or more members and this is the 4th slot
          if (members.length > 4 && index === 3) {
            return (
              <div
                key="remaining"
                className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
                style={{ fontSize: size * 0.25 }}
              >
                +{remainingCount}
              </div>
            );
          }

          if (member.avatarUrl) {
            return (
              <img
                key={member.id || member.userId || index}
                src={member.avatarUrl}
                alt={member.username}
                className="w-full h-full object-cover"
              />
            );
          }

          // Fallback for individual member in grid
          return (
            <div
              key={member.id || member.userId || index}
              className="w-full h-full bg-gradient-to-br from-indigo-400 to-blue-500 text-white flex items-center justify-center font-bold"
              style={{ fontSize: size * (isGrid2x2 ? 0.25 : 0.3) }}
            >
              {member.username ? member.username.charAt(0).toUpperCase() : '?'}
            </div>
          );
        })}
      </div>
    </div>
  );
};
