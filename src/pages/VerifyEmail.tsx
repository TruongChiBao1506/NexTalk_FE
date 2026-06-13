import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, MessageSquareCode } from 'lucide-react';
import { authService } from '../services/authService';
import ThemeToggle from '../components/common/ThemeToggle';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Đang xác thực địa chỉ email...');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Xác thực thất bại. Không tìm thấy token trong đường dẫn.');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Xác thực email thành công! Bây giờ bạn có thể đăng nhập.');
        } else {
          setStatus('error');
          setMessage(response.message || 'Xác thực thất bại. Đường link có thể đã hết hạn hoặc không hợp lệ.');
        }
      } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.message || 'Xác thực thất bại. Token không hợp lệ hoặc đã được sử dụng.';
        setStatus('error');
        setMessage(msg);
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gradient-animate-light dark:bg-gradient-animate">
      
      {/* Background glow ornaments */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand logo / header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-discord-blurple text-white shadow-lg shadow-indigo-500/30 dark:shadow-discord-blurple/30 mb-3">
            <MessageSquareCode className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white m-0">
            Xác thực Email
          </h1>
        </div>

        {/* Verification Status Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl dark:shadow-black/50 border border-white/20 dark:border-zinc-800/80 text-center transition-all duration-300">
          
          {status === 'loading' && (
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-discord-blurple" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-zinc-200">
                Đang kiểm tra
              </h3>
              <p className="text-sm text-gray-500 dark:text-discord-muted">
                {message}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 space-y-5">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 dark:text-emerald-400 animate-scale-up" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Xác thực thành công!
                </h3>
                <p className="text-sm text-gray-600 dark:text-discord-text/90">
                  {message}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center py-2.5 px-4 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-600 transition-all duration-200"
                >
                  Tiến hành đăng nhập
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 space-y-5">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-rose-500 dark:text-rose-400 animate-scale-up" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Xác thực thất bại
                </h3>
                <p className="text-sm text-gray-650 dark:text-rose-350 px-2">
                  {message}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/register"
                  className="flex w-full items-center justify-center py-2.5 px-4 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-600 transition-all duration-200"
                >
                  Tạo tài khoản mới
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-medium text-indigo-600 dark:text-discord-blurple hover:underline mt-2"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
