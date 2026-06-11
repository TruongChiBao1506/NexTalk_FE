import { useMemo, useState } from 'react';
import { Check, FileText, Forward, Image, Loader2, Search, Users, Video, X } from 'lucide-react';
import type { ConversationResponse, MessageResponse } from '../../types/chat';
import type { GroupResponse } from '../../types/group';

interface ShareMessageModalProps {
  message: MessageResponse;
  conversations: ConversationResponse[];
  groups: GroupResponse[];
  currentUserId?: string;
  isSharing: boolean;
  onClose: () => void;
  onShare: (targetConversationIds: string[]) => Promise<boolean>;
}

type ShareTarget = {
  id: string;
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  kind: 'dm' | 'group';
};

const getMessagePreview = (message: MessageResponse) => {
  switch (message.messageType) {
    case 'IMAGE':
      return 'Hình ảnh';
    case 'VIDEO':
      return 'Video';
    case 'FILE':
      return 'Tệp đính kèm';
    case 'TEXT':
    default:
      return message.content;
  }
};

const MessageTypeIcon = ({ type }: { type: MessageResponse['messageType'] }) => {
  if (type === 'IMAGE') return <Image className="w-4 h-4" />;
  if (type === 'VIDEO') return <Video className="w-4 h-4" />;
  if (type === 'FILE') return <FileText className="w-4 h-4" />;
  return <Forward className="w-4 h-4" />;
};

export const ShareMessageModal = ({
  message,
  conversations,
  groups,
  currentUserId,
  isSharing,
  onClose,
  onShare,
}: ShareMessageModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const targets = useMemo<ShareTarget[]>(() => {
    const targetMap = new Map<string, ShareTarget>();

    for (const conversation of conversations) {
      if (conversation.type === 'PRIVATE') {
        const friend = conversation.members.find((member) => member.id !== currentUserId);
        targetMap.set(conversation.id, {
          id: conversation.id,
          title: friend?.username || 'Người dùng',
          subtitle: friend?.email || 'Tin nhắn riêng',
          avatarUrl: friend?.avatarUrl || null,
          kind: 'dm',
        });
      } else {
        targetMap.set(conversation.id, {
          id: conversation.id,
          title: conversation.name || 'Nhóm chat',
          subtitle: `${conversation.members.length} thành viên`,
          avatarUrl: null,
          kind: 'group',
        });
      }
    }

    for (const group of groups) {
      if (!group.conversationId || targetMap.has(group.conversationId)) continue;
      targetMap.set(group.conversationId, {
        id: group.conversationId,
        title: group.name,
        subtitle: `${group.memberCount} thành viên`,
        avatarUrl: null,
        kind: 'group',
      });
    }

    return Array.from(targetMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [conversations, currentUserId, groups]);

  const filteredTargets = targets.filter((target) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return (
      target.title.toLowerCase().includes(keyword) ||
      target.subtitle.toLowerCase().includes(keyword)
    );
  });

  const toggleTarget = (conversationId: string) => {
    setError(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conversationId)) next.delete(conversationId);
      else next.add(conversationId);
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedIds.size === 0) {
      setError('Chọn ít nhất một cuộc trò chuyện để chia sẻ.');
      return;
    }

    setError(null);
    const ok = await onShare(Array.from(selectedIds));
    if (!ok) {
      setError('Không thể chia sẻ tin nhắn. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-[fadeInScale_0.2s_ease-out] max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-discord-blurple/10 flex items-center justify-center text-indigo-600 dark:text-discord-blurple shrink-0">
              <Forward className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white m-0">Chia sẻ tin nhắn</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                {selectedIds.size > 0 ? `${selectedIds.size} nơi nhận đã chọn` : 'Chọn nơi nhận'}
              </p>
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

        <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-discord-blurple/10 text-indigo-600 dark:text-discord-blurple flex items-center justify-center shrink-0 mt-0.5">
              <MessageTypeIcon type={message.messageType} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 m-0">
                Từ {message.senderUsername}
              </p>
              <p className="text-sm text-gray-900 dark:text-white m-0 mt-0.5 line-clamp-2 break-words">
                {getMessagePreview(message)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm placeholder-gray-400 dark:placeholder-zinc-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-discord-blurple transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {filteredTargets.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
              Không tìm thấy cuộc trò chuyện phù hợp.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTargets.map((target) => {
                const selected = selectedIds.has(target.id);
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => toggleTarget(target.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
                      selected
                        ? 'bg-indigo-600/10 dark:bg-discord-blurple/10 border-indigo-500/30 dark:border-discord-blurple/30'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border-transparent'
                    }`}
                  >
                    {target.avatarUrl ? (
                      <img src={target.avatarUrl} alt={target.title} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center shrink-0 ${
                        target.kind === 'group' ? 'bg-emerald-600' : 'bg-indigo-600 dark:bg-discord-blurple'
                      }`}>
                        {target.kind === 'group' ? <Users className="w-5 h-5" /> : target.title.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate m-0">{target.title}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate m-0">{target.subtitle}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected
                        ? 'bg-indigo-600 dark:bg-discord-blurple border-indigo-600 dark:border-discord-blurple'
                        : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
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
              onClick={handleShare}
              disabled={isSharing || selectedIds.size === 0}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 dark:bg-discord-blurple hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition flex items-center gap-2 shadow"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Forward className="w-4 h-4" />}
              Chia sẻ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareMessageModal;
