import { useState, useEffect } from 'react';
import { X, Plus, Search, Users, Loader2, Check } from 'lucide-react';
import { useGroupStore } from '../../store/groupStore';
import { friendService } from '../../services/friendService';
import type { FriendResponse } from '../../types/friend';
import type { GroupResponse } from '../../types/group';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: (group: GroupResponse) => void;
}

export const CreateGroupModal = ({ onClose, onCreated }: CreateGroupModalProps) => {
  const { createGroup, isLoading } = useGroupStore();

  const [groupName, setGroupName] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingFriends(true);
    friendService.getFriends().then((res) => {
      if (res.success && res.data) setFriends(res.data);
    }).finally(() => setLoadingFriends(false));
  }, []);

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
    f.email.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    if (groupName.trim().length < 2) {
      setError('Group name must be at least 2 characters.');
      return;
    }

    const group = await createGroup({
      name: groupName.trim(),
      memberIds: Array.from(selectedIds),
    });

    if (group) {
      onCreated(group);
    } else {
      setError('Failed to create group. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-[fadeInScale_0.2s_ease-out]"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-discord-blurple/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600 dark:text-discord-blurple" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white m-0">Create Group</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Add friends to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Group Name */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Group Name
              </label>
              <input
                id="group-name-input"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Study Squad, Project Team..."
                maxLength={50}
                className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-discord-blurple transition"
              />
            </div>

            {/* Members */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Add Members
                {selectedIds.size > 0 && (
                  <span className="ml-2 normal-case font-semibold text-indigo-600 dark:text-discord-blurple">
                    {selectedIds.size} selected
                  </span>
                )}
              </label>

              {/* Search within friends */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm placeholder-gray-400 dark:placeholder-zinc-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-discord-blurple transition"
                />
              </div>

              {loadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 dark:text-zinc-500">
                  {friends.length === 0 ? 'You have no friends to add yet.' : 'No matches found.'}
                </div>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {filteredFriends.map((f) => {
                    const isSelected = selectedIds.has(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFriend(f.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/10 dark:bg-discord-blurple/10 border border-indigo-500/30 dark:border-discord-blurple/30'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {f.avatarUrl ? (
                            <img src={f.avatarUrl} alt={f.username} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center text-sm">
                              {f.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate m-0">{f.username}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{f.email}</p>
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

            {error && (
              <p className="text-sm text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 px-4 py-2 rounded-xl">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !groupName.trim()}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition flex items-center gap-2 shadow"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
