import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Monitor, XCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/common/ThemeToggle';
import logo from '../assets/logo_notext.png';

export const QrLoginConfirm = () => {
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token');
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const confirmLogin = async () => {
    if (!isAuthenticated) {
      setStatus('error');
      setMessage('Bạn cần đăng nhập trên thiết bị này trước khi xác nhận mã QR.');
      return;
    }

    if (!qrToken) {
      setStatus('error');
      setMessage('Không tìm thấy mã QR trong đường dẫn.');
      return;
    }

    setStatus('loading');
    setMessage(null);
    try {
      const response = await authService.confirmQrLogin(qrToken);
      if (response.success) {
        setStatus('success');
        setMessage('Đã xác nhận đăng nhập trên thiết bị khác.');
      } else {
        setStatus('error');
        setMessage(response.message || 'Không thể xác nhận mã QR.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.response?.data?.message || 'Mã QR không hợp lệ hoặc đã hết hạn.');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-animate-light p-4 dark:bg-gradient-animate">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center">
            <img src={logo} alt="NexTalk Logo" className="h-full w-full rounded-2xl border border-gray-200/50 object-cover drop-shadow-xl dark:border-zinc-700/50" />
          </div>
          <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Xác nhận đăng nhập
          </h1>
        </div>

        <div className="glass rounded-3xl border border-white/20 p-8 text-center shadow-2xl transition-all duration-300 dark:border-zinc-800/80 dark:shadow-black/50">
          {!isAuthenticated ? (
            <div className="space-y-5 py-5">
              <Monitor className="mx-auto h-16 w-16 text-indigo-600 dark:text-discord-blurple" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cần đăng nhập trước</h2>
                <p className="text-sm text-gray-600 dark:text-discord-text/90">
                  Hãy đăng nhập NexTalk trên điện thoại này, sau đó quét lại mã QR trên máy tính.
                </p>
              </div>
              <Link to="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 dark:bg-discord-blurple">
                Đăng nhập
              </Link>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-5 py-5">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Đã xác nhận</h2>
                <p className="text-sm text-gray-600 dark:text-discord-text/90">{message}</p>
              </div>
              <Link to="/chat" className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 dark:bg-discord-blurple">
                Quay lại chat
              </Link>
            </div>
          ) : (
            <div className="space-y-5 py-5">
              {status === 'error' ? (
                <XCircle className="mx-auto h-16 w-16 text-rose-500" />
              ) : (
                <Monitor className="mx-auto h-16 w-16 text-indigo-600 dark:text-discord-blurple" />
              )}

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Đăng nhập trên thiết bị khác?
                </h2>
                <p className="text-sm text-gray-600 dark:text-discord-text/90">
                  Bạn đang đăng nhập với tài khoản {user?.username || user?.email}. Chỉ xác nhận nếu mã QR do chính bạn quét.
                </p>
                {message && <p className="text-sm text-rose-500">{message}</p>}
              </div>

              <button
                type="button"
                onClick={confirmLogin}
                disabled={status === 'loading' || !qrToken}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-discord-blurple"
              >
                {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
                Xác nhận đăng nhập
              </button>

              <Link to="/chat" className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white dark:border-zinc-800 dark:bg-discord-black/40 dark:text-discord-text">
                Hủy
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrLoginConfirm;
