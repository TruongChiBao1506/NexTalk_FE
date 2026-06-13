import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, X } from 'lucide-react';
import { userService } from '../../services/userService';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới cần ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  onClose: () => void;
}

export const ChangePasswordModal = ({ onClose }: ChangePasswordModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left text-gray-900 shadow-2xl dark:border-zinc-800 dark:bg-discord-mid dark:text-white">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="m-0 text-xl font-bold">Đổi mật khẩu</h3>
            <p className="m-0 mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Hãy đặt một mật khẩu mạnh và an toàn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
          
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
              Đổi mật khẩu thành công!
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Mật khẩu hiện tại</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                disabled={isSubmitting}
                placeholder="Nhập mật khẩu hiện tại"
                {...register('currentPassword')}
                className={`h-11 w-full rounded-xl border bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white disabled:opacity-60 dark:bg-zinc-900/70 dark:text-white dark:focus:bg-zinc-950 ${
                  errors.currentPassword
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-gray-200 focus:border-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-500'
                }`}
              />
            </div>
            {errors.currentPassword && <p className="m-0 text-xs font-medium text-rose-500">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                disabled={isSubmitting}
                placeholder="Nhập mật khẩu mới"
                {...register('newPassword')}
                className={`h-11 w-full rounded-xl border bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white disabled:opacity-60 dark:bg-zinc-900/70 dark:text-white dark:focus:bg-zinc-950 ${
                  errors.newPassword
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-gray-200 focus:border-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-500'
                }`}
              />
            </div>
            {errors.newPassword && <p className="m-0 text-xs font-medium text-rose-500">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                disabled={isSubmitting}
                placeholder="Nhập lại mật khẩu mới"
                {...register('confirmPassword')}
                className={`h-11 w-full rounded-xl border bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white disabled:opacity-60 dark:bg-zinc-900/70 dark:text-white dark:focus:bg-zinc-950 ${
                  errors.confirmPassword
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-gray-200 focus:border-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-500'
                }`}
              />
            </div>
            {errors.confirmPassword && <p className="m-0 text-xs font-medium text-rose-500">{errors.confirmPassword.message}</p>}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
