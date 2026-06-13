import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import ThemeToggle from '../components/common/ThemeToggle';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Mật khẩu mới cần ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setApiError('Không tìm thấy mã khôi phục hợp lệ trong đường dẫn.');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      await authService.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi. Token có thể đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-discord-black">
        <div className="max-w-md w-full bg-white dark:bg-discord-mid rounded-3xl p-8 text-center shadow-xl border border-gray-100 dark:border-zinc-800">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đường dẫn không hợp lệ</h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-6">Liên kết khôi phục mật khẩu không có mã token xác nhận.</p>
          <Link
            to="/login"
            className="inline-flex justify-center items-center w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gradient-animate-light dark:bg-gradient-animate">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="glass rounded-3xl p-8 shadow-2xl dark:shadow-black/50 border border-white/20 dark:border-zinc-800/80 transition-all duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-discord-blurple text-white mb-4">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">Đặt lại mật khẩu</h2>
            <p className="text-gray-500 dark:text-discord-muted mt-2 text-sm">
              Nhập mật khẩu mới của bạn bên dưới
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-5">
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Đổi mật khẩu thành công!</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-sm text-left">
                  {apiError}
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">Mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="password"
                    disabled={isLoading}
                    placeholder="••••••••"
                    {...register('newPassword')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      errors.newPassword ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-zinc-800 focus:border-indigo-600'
                    }`}
                  />
                </div>
                {errors.newPassword && <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.newPassword.message}</p>}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">Xác nhận mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="password"
                    disabled={isLoading}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      errors.confirmPassword ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 dark:border-zinc-800 focus:border-indigo-600'
                    }`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Lưu mật khẩu mới'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
