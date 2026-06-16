import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Loader2, ShieldAlert } from 'lucide-react';
import { groupService } from '../services/groupService';
import { useGroupStore } from '../store/groupStore';
import type { PublicGroupInfoResponse } from '../types/group';

export const JoinGroup = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const fetchGroups = useGroupStore((state) => state.fetchGroups);

  const [groupInfo, setGroupInfo] = useState<PublicGroupInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Mã mời không hợp lệ.');
      setIsLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        const response = await groupService.getPublicGroupInfoByInviteCode(code);
        if (response.success && response.data) {
          setGroupInfo(response.data);
        } else {
          setError('Không tìm thấy nhóm hoặc liên kết đã hết hạn.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không tìm thấy nhóm hoặc liên kết đã hết hạn.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setIsJoining(true);
    setError(null);
    try {
      const response = await groupService.joinGroupByInviteCode(code);
      if (response.success) {
        setJoinSuccess(true);
        if (!groupInfo?.requiresApproval) {
          await fetchGroups();
          setTimeout(() => {
            navigate('/chat');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tham gia nhóm.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-discord-black">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-discord-blurple" />
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-discord-black">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-discord-mid">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Không thể tham gia nhóm</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">{error}</p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-500"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-discord-black">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-discord-mid">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-discord-blurple dark:to-indigo-600"></div>
        <div className="px-6 pb-6 text-center">
          <div className="mx-auto -mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md dark:border-discord-mid dark:bg-zinc-800">
            {groupInfo.avatarUrl ? (
              <img src={groupInfo.avatarUrl} alt={groupInfo.name} className="h-full w-full object-cover" />
            ) : (
              <Users className="h-10 w-10 text-indigo-500 dark:text-discord-blurple" />
            )}
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{groupInfo.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Được tạo bởi {groupInfo.ownerUsername}</p>
          
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Users className="h-4 w-4" />
            {groupInfo.memberCount} thành viên
          </div>

          {groupInfo.requiresApproval && (
            <p className="mt-4 text-xs font-semibold text-amber-600 dark:text-amber-500">
              Nhóm này yêu cầu phê duyệt từ quản trị viên.
            </p>
          )}

          <div className="mt-6">
            {joinSuccess ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                {groupInfo.requiresApproval 
                  ? 'Yêu cầu tham gia đã được gửi đi. Vui lòng chờ phê duyệt.' 
                  : 'Bạn đã tham gia nhóm thành công! Đang chuyển hướng...'}
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-discord-blurple dark:hover:bg-indigo-500"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  groupInfo.requiresApproval ? 'Xin tham gia nhóm' : 'Tham gia nhóm'
                )}
              </button>
            )}
            
            {!joinSuccess && (
              <button
                onClick={() => navigate('/chat')}
                disabled={isJoining}
                className="mt-3 w-full rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Huỷ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;
