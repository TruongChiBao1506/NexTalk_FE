import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  showCancel?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  isLoading = false,
  showCancel = true,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const confirmClass = variant === 'danger'
    ? 'bg-rose-600 text-white hover:bg-rose-700'
    : 'bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-gray-950 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            variant === 'danger'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
          }`}>
            {icon ?? <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="m-0 text-base font-bold">{title}</h3>
            <p className="m-0 mt-1 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${confirmClass}`}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
