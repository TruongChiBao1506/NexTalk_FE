import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, X } from 'lucide-react';
import { authService } from '../../services/authService';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal = ({ onClose }: ForgotPasswordModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.forgotPassword(data.email);
      setSuccess(true);
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
            <h3 className="m-0 text-xl font-bold">Quên mật khẩu?</h3>
            <p className="m-0 mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Nhập email đăng ký tài khoản của bạn để nhận liên kết khôi phục.
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

        <div className="px-5 py-5 space-y-4">
          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                Nếu email của bạn có trong hệ thống, chúng tôi đã gửi một đường dẫn khôi phục mật khẩu. Hãy kiểm tra hộp thư đến (và thư mục rác).
              </div>
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
              >
                Trở lại đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    disabled={isSubmitting}
                    placeholder="name@example.com"
                    {...register('email')}
                    className={`h-11 w-full rounded-xl border bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white disabled:opacity-60 dark:bg-zinc-900/70 dark:text-white dark:focus:bg-zinc-950 ${
                      errors.email
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-gray-200 focus:border-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-500'
                    }`}
                  />
                </div>
                {errors.email && <p className="m-0 text-xs font-medium text-rose-500">{errors.email.message}</p>}
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
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi mã khôi phục'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
