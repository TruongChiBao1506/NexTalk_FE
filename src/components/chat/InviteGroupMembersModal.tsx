import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, UserPlus, X } from 'lucide-react';
import { friendService } from '../../services/friendService';
import { useGroupStore } from '../../store/groupStore';
import type { FriendResponse } from '../../types/friend';
import type { GroupResponse } from '../../types/group';

interface InviteGroupMembersModalProps {
  group: GroupResponse;
  onClose: () => void;
  onInvited: (group: GroupResponse) => void;
}

export const InviteGroupMembersModal = ({ group, onClose, onInvited }: InviteGroupMembersModalProps) => {
  const addMember = useGroupStore((state) => state.addMember);
  const groups = useGroupStore((state) => state.groups);
  const currentGroup = groups.find((item) => item.id === group.id) || group;

  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingFriends(true);
    friendService.getFriends()
      .then((response) => {
        if (response.success && response.data) {
          setFriends(response.data);
        }
      })
      .catch(() => setError('Không thể tải danh sách bạn bè.'))
      .finally(() => setIsLoadingFriends(false));
  }, []);

  const memberIds = useMemo(
    () => new Set(currentGroup.members.map((member) => member.userId)),
    [currentGroup.members]
  );

  const inviteCandidates = friends.filter((friend) => !memberIds.has(friend.id));
  const filteredFriends = inviteCandidates.filter((friend) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return (
      friend.username.toLowerCase().includes(keyword) ||
      friend.email.toLowerCase().includes(keyword)
    );
  });

  const toggleFriend = (id: string) => {
    setError(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selectedIds.size === 0) {
      setError('Chọn ít nhất một bạn bè để mời vào nhóm.');
      return;
    }

    setIsInviting(true);
    setError(null);
    let latestGroup: GroupResponse | null = null;

    for (const userId of Array.from(selectedIds)) {
      const ok = await addMember(group.id, userId);
      if (!ok) {
        setError('Có thành viên chưa được mời thành công. Vui lòng thử lại.');
        setIsInviting(false);
        return;
      }
      latestGroup = useGroupStore.getState().groups.find((item) => item.id === group.id) || latestGroup;
    }

    setIsInviting(false);
    if (latestGroup) onInvited(latestGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-discord-blurple/10 flex items-center justify-center text-indigo-600 dark:text-discord-blurple shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white m-0">Mời bạn vào nhóm</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{currentGroup.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm bạn bè"
              className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm placeholder-gray-400 dark:placeholder-zinc-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-discord-blurple transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {isLoadingFriends ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
              {inviteCandidates.length === 0 ? 'Tất cả bạn bè đã ở trong nhóm.' : 'Không tìm thấy bạn bè phù hợp.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFriends.map((friend) => {
                const isSelected = selectedIds.has(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/10 dark:bg-discord-blurple/10 border-indigo-500/30 dark:border-discord-blurple/30'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border-transparent'
                    }`}
                  >
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt={friend.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center shrink-0">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate m-0">{friend.username}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate m-0">{friend.email}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 dark:bg-discord-blurple border-indigo-600 dark:border-discord-blurple'
                        : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-zinc-800 shrink-0">
          {error && (
            <p className="text-sm text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 px-3 py-2 rounded-xl mb-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={isInviting || selectedIds.size === 0}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition flex items-center gap-2 shadow"
            >
              {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Mời vào nhóm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteGroupMembersModal;
