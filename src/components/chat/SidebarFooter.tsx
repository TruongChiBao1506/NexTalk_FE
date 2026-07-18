import { ScanQrCode, QrCode } from 'lucide-react';
import type { User as AuthUser } from '../../types/auth';

interface SidebarFooterProps {
  user: AuthUser | null;
  onOpenQrScanner?: () => void;
  onOpenMyQr?: () => void;
  onOpenProfile?: () => void;
}

export const SidebarFooter = ({ user, onOpenQrScanner, onOpenMyQr, onOpenProfile }: SidebarFooterProps) => {
  if (!user) return null;

  return (
    <div className="bg-white/45 dark:bg-zinc-900/45 px-4 py-3 flex items-center gap-3 border-t border-indigo-100/70 dark:border-zinc-800/60 shrink-0 text-left">
      <button type="button" onClick={onOpenProfile} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:hover:bg-zinc-800/70" title="Mở trang cá nhân">
        <div className="relative shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[13px] font-bold truncate text-slate-950 dark:text-white m-0">{user.username}</h5>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5">Đang hoạt động</p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {onOpenMyQr && (
          <button
            type="button"
            onClick={onOpenMyQr}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-300"
            title="Mã QR của tôi"
            aria-label="Mã QR của tôi"
          >
            <QrCode className="h-4.5 w-4.5" />
          </button>
        )}
        {onOpenQrScanner && (
          <button
            type="button"
            onClick={onOpenQrScanner}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-300"
            title="Quét QR"
            aria-label="Quét QR"
          >
            <ScanQrCode className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
};
