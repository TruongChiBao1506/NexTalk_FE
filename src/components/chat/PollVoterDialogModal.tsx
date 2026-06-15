import { X } from 'lucide-react';
import type { PollOption } from '../../types/chat';

interface PollVoterDialogModalProps {
  pollVoterDialog: { option: PollOption; anonymous: boolean } | null;
  onClose: () => void;
}

export const PollVoterDialogModal = ({ pollVoterDialog, onClose }: PollVoterDialogModalProps) => {
  if (!pollVoterDialog || pollVoterDialog.anonymous) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 truncate text-base font-bold">{pollVoterDialog.option.text}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {(pollVoterDialog.option.voters ?? []).length > 0 ? (
            (pollVoterDialog.option.voters ?? []).map((voter) => (
              <div key={voter.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                {voter.avatarUrl ? (
                  <img src={voter.avatarUrl} alt={voter.username} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {voter.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="min-w-0 truncate text-sm font-semibold">{voter.username}</span>
              </div>
            ))
          ) : (
            <p className="m-0 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-zinc-900 dark:text-zinc-400">
              Chưa có ai chọn phương án này.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
