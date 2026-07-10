import { X, MessageSquare, Loader2 } from 'lucide-react';
import type { User as AuthUser } from '../../types/auth';

interface SearchProfileModalProps {
  searchProfileUser: AuthUser | null;
  setSearchProfileUser: (user: AuthUser | null) => void;
  handleStartChatFromProfile: () => void;
  profileChatActionId: string | null;
}

export const SearchProfileModal = ({
  searchProfileUser,
  setSearchProfileUser,
  handleStartChatFromProfile,
  profileChatActionId,
}: SearchProfileModalProps) => {

  if (!searchProfileUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => setSearchProfileUser(null)}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={() => setSearchProfileUser(null)}
            className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center gap-4">
            {searchProfileUser.avatarUrl ? (
              <img src={searchProfileUser.avatarUrl} alt={searchProfileUser.username} className="h-20 w-20 shrink-0 rounded-full object-cover shadow" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white shadow">
                {searchProfileUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 pb-1 text-left">
              <h3 className="m-0 truncate text-xl font-bold">{searchProfileUser.username}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-discord-muted">
                <span className={`h-2 w-2 rounded-full ${searchProfileUser.status === 'AWAY' ? 'bg-amber-500' : searchProfileUser.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                <span className="capitalize">{searchProfileUser.status.toLowerCase()}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-left">
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Email</p>
              <p className="mt-1 break-all text-sm font-semibold">{searchProfileUser.email || 'Không có email'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-discord-black/35">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Giới thiệu</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-zinc-200">{searchProfileUser.bio || 'Chưa có giới thiệu.'}</p>
            </div>

            <button
              type="button"
              onClick={handleStartChatFromProfile}
              disabled={profileChatActionId === searchProfileUser.id}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {profileChatActionId === searchProfileUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              Nhắn tin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
