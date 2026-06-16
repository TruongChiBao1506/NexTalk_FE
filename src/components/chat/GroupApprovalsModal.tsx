import { useEffect, useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { useGroupStore } from '../../store/groupStore';
import type { GroupInvitationResponse, GroupResponse } from '../../types/group';

interface GroupApprovalsModalProps {
  group: GroupResponse;
  onClose: () => void;
}

export const GroupApprovalsModal = ({ group, onClose }: GroupApprovalsModalProps) => {
  const [waitingApprovals, setWaitingApprovals] = useState<GroupInvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitingApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await groupService.getWaitingApprovals(group.id);
      if (response.success && response.data) {
        setWaitingApprovals(response.data);
      }
    } catch (err: any) {
      setError('Không thể tải danh sách chờ duyệt.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingApprovals();
  }, [group.id]);

  const handleApprove = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    try {
      const response = await groupService.approveMember(inviteId);
      if (response.success) {
        setWaitingApprovals((prev) => prev.filter((inv) => inv.id !== inviteId));
        useGroupStore.getState().fetchGroups(); // refresh groups to show new member
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể duyệt.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    try {
      const response = await groupService.declineMember(inviteId);
      if (response.success) {
        setWaitingApprovals((prev) => prev.filter((inv) => inv.id !== inviteId));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể từ chối.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-discord-blurple/10 flex items-center justify-center text-indigo-600 dark:text-discord-blurple shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white m-0">Danh sách chờ duyệt</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{group.name}</p>
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

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {error && (
            <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl mb-3">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            </div>
          ) : waitingApprovals.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-zinc-400">
              Không có thành viên nào đang chờ duyệt.
            </div>
          ) : (
            waitingApprovals.map((invite) => (
              <div
                key={invite.id}
                className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-zinc-800"
              >
                {invite.inviteeAvatarUrl ? (
                  <img src={invite.inviteeAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-gray-100 dark:ring-zinc-800" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-discord-blurple text-white font-bold flex items-center justify-center shrink-0">
                    {invite.inviteeUsername.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate m-0">{invite.inviteeUsername}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate m-0">
                    {invite.inviterId === invite.inviteeId ? 'Tham gia qua liên kết' : `Được mời bởi: ${invite.inviterUsername}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecline(invite.id)}
                    disabled={actionLoadingId === invite.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {actionLoadingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Từ chối'}
                  </button>
                  <button
                    onClick={() => handleApprove(invite.id)}
                    disabled={actionLoadingId === invite.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 dark:bg-discord-blurple dark:hover:bg-indigo-500"
                  >
                    {actionLoadingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đồng ý'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupApprovalsModal;
