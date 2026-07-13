import { AlertCircle, Loader2 } from 'lucide-react';

interface StrangerWarningBannerProps {
  onAddFriend: () => void;
  onBlock: () => void;
  onReport: () => void;
  isAddFriendLoading: boolean;
  isAddFriendSent: boolean;
  isBlockLoading: boolean;
  messagingRestricted?: boolean;
}

export const StrangerWarningBanner = ({
  onAddFriend,
  onBlock,
  onReport,
  isAddFriendLoading,
  isAddFriendSent,
  isBlockLoading,
  messagingRestricted = false,
}: StrangerWarningBannerProps) => {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between gap-4 shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{messagingRestricted ? 'Cần kết bạn để nhắn tin' : 'Cảnh giác lừa đảo'}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{messagingRestricted ? 'Người này chỉ nhận tin nhắn từ bạn bè.' : 'Cẩn thận khi chia sẻ thông tin với người lạ'}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onAddFriend}
          disabled={isAddFriendLoading || isAddFriendSent}
          className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {isAddFriendLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          {isAddFriendSent ? 'Đã gửi' : 'Gửi kết bạn'}
        </button>
        <button
          onClick={onBlock}
          disabled={isBlockLoading}
          className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {isBlockLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          Chặn
        </button>
        <button
          onClick={onReport}
          className="px-3 py-1.5 rounded-md bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition flex items-center gap-1.5"
        >
          Báo xấu
        </button>
      </div>
    </div>
  );
};
