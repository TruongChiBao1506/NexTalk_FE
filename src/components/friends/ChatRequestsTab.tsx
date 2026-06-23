import { Ban, CheckCircle2, Clock3, Flag, Loader2, MessageSquare, UserPlus, X } from 'lucide-react';
import type { ChatRequestResponse } from '../../types/chatRequest';
import type { FriendRelationStatus } from '../../types/friend';
import { formatRelativeTime } from '../../utils/time';
import { stripHtml } from '../../utils/text';

interface ChatRequestsTabProps {
  incoming: ChatRequestResponse[];
  outgoing: ChatRequestResponse[];
  isLoading: boolean;
  actionLoadingId: string | null;
  relationStatuses: Record<string, FriendRelationStatus>;
  onAccept: (request: ChatRequestResponse) => void;
  onReject: (request: ChatRequestResponse) => void;
  onCancel: (request: ChatRequestResponse) => void;
  onBlock: (request: ChatRequestResponse) => void;
  onReport: (request: ChatRequestResponse) => void;
  onAddFriend: (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') => void;
  onAcceptFriend: (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') => void;
  onOpenChat: (request: ChatRequestResponse, direction: 'incoming' | 'outgoing') => void;
}

const Avatar = ({ username, avatarUrl, muted = false }: { username: string; avatarUrl?: string | null; muted?: boolean }) => {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className="h-12 w-12 shrink-0 rounded-full border border-gray-200 object-cover dark:border-zinc-800" />;
  }

  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${muted ? 'bg-zinc-700' : 'bg-indigo-650 dark:bg-discord-blurple'}`}>
      {username?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
};

const PendingBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
    <Clock3 className="h-3 w-3" />
    Pending
  </span>
);

export const ChatRequestsTab = ({
  incoming,
  outgoing,
  isLoading,
  actionLoadingId,
  relationStatuses,
  onAccept,
  onReject,
  onCancel,
  onBlock,
  onReport,
  onAddFriend,
  onAcceptFriend,
  onOpenChat,
}: ChatRequestsTabProps) => {
  const total = incoming.length + outgoing.length;

  const renderFriendAction = (request: ChatRequestResponse, direction: 'incoming' | 'outgoing', peerId: string) => {
    const status = relationStatuses[peerId] ?? 'NONE';
    const isFriendBusy = actionLoadingId === `friend-${request.id}`;

    if (status === 'FRIENDS') {
      return (
        <button disabled className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 disabled:opacity-80 dark:bg-emerald-500/10 dark:text-emerald-300" title="Đã là bạn bè">
          <CheckCircle2 className="h-4 w-4" />
          Bạn bè
        </button>
      );
    }

    if (status === 'OUTGOING_PENDING') {
      return (
        <button disabled className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-80 dark:bg-amber-500/10 dark:text-amber-300" title="Lời mời kết bạn đã được gửi">
          <Clock3 className="h-4 w-4" />
          Đã gửi
        </button>
      );
    }

    if (status === 'INCOMING_PENDING') {
      return (
        <button onClick={() => onAcceptFriend(request, direction)} disabled={isFriendBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50" title="Chấp nhận lời mời kết bạn">
          {isFriendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Đồng ý kết bạn
        </button>
      );
    }

    if (status === 'BLOCKED') {
      return (
        <button disabled className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500 disabled:opacity-80 dark:bg-zinc-800 dark:text-zinc-400" title="Đã chặn">
          <Ban className="h-4 w-4" />
          Đã chặn
        </button>
      );
    }

    return (
      <button onClick={() => onAddFriend(request, direction)} disabled={isFriendBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-300" title="Kết bạn">
        {isFriendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Kết bạn
      </button>
    );
  };

  if (isLoading && total === 0) {
    return (
      <div className="flex flex-col items-center py-16 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-discord-blurple" />
        <p className="text-sm text-gray-500 dark:text-discord-muted">Đang tải tin nhắn chờ...</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-gray-150 bg-white p-6 py-16 text-center dark:border-zinc-850 dark:bg-discord-mid">
        <p className="m-0 text-gray-500 dark:text-discord-muted">Không có tin nhắn chờ nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Tin nhắn từ người chưa kết bạn sẽ ở trạng thái pending đến khi được chấp nhận hoặc từ chối.</span>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="m-0 text-lg font-bold text-gray-950 dark:text-white">Tin nhắn chờ đến</h3>
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">{incoming.length}</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
        </div>

        {incoming.length === 0 ? (
          <div className="rounded-2xl border border-gray-150 bg-white p-5 text-sm text-gray-500 dark:border-zinc-850 dark:bg-discord-mid dark:text-discord-muted">
            Không có tin nhắn chờ đến.
          </div>
        ) : (
          incoming.map((request) => {
            const isBusy = actionLoadingId === request.id || actionLoadingId === `friend-${request.id}`;
            return (
              <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-gray-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-discord-mid sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <Avatar username={request.sender.username} avatarUrl={request.sender.avatarUrl} />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="m-0 truncate font-bold text-gray-950 dark:text-white">{request.sender.username}</h4>
                      <PendingBadge />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-discord-muted">{formatRelativeTime(request.createdAt)}</p>
                    <p className="mt-2 line-clamp-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                      {stripHtml(request.message) || 'Không có nội dung xem trước.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {renderFriendAction(request, 'incoming', request.sender.id)}
                  <button onClick={() => onAccept(request)} disabled={isBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50" title="Chấp nhận và mở chat">
                    {actionLoadingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Chấp nhận
                  </button>
                  <button onClick={() => onReject(request)} disabled={isBusy} className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700" title="Từ chối">
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={() => onBlock(request)} disabled={isBusy} className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-300" title="Chặn">
                    <Ban className="h-4 w-4" />
                  </button>
                  <button onClick={() => onReport(request)} disabled={isBusy} className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-300" title="Báo xấu">
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="m-0 text-lg font-bold text-gray-950 dark:text-white">Tin nhắn chờ đã gửi</h3>
          <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-bold text-white dark:bg-zinc-700">{outgoing.length}</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
        </div>

        {outgoing.length === 0 ? (
          <div className="rounded-2xl border border-gray-150 bg-white p-5 text-sm text-gray-500 dark:border-zinc-850 dark:bg-discord-mid dark:text-discord-muted">
            Bạn chưa gửi tin nhắn chờ nào.
          </div>
        ) : (
          outgoing.map((request) => {
            const isBusy = actionLoadingId === request.id || actionLoadingId === `friend-${request.id}`;
            return (
              <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-gray-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-discord-mid sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <Avatar username={request.receiver.username} avatarUrl={request.receiver.avatarUrl} muted />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="m-0 truncate font-bold text-gray-950 dark:text-white">{request.receiver.username}</h4>
                      <PendingBadge />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-discord-muted">Đã gửi {formatRelativeTime(request.createdAt)}</p>
                    <p className="mt-2 line-clamp-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                      {stripHtml(request.message) || 'Không có nội dung xem trước.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {renderFriendAction(request, 'outgoing', request.receiver.id)}
                  <button onClick={() => onCancel(request)} disabled={isBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-300" title="Hủy tin nhắn chờ">
                    {actionLoadingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Hủy
                  </button>
                  {request.status === 'ACCEPTED' && (
                    <button onClick={() => onOpenChat(request, 'outgoing')} disabled={isBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50" title="Mở chat">
                      <MessageSquare className="h-4 w-4" />
                      Mở chat
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
