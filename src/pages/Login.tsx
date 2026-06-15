import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { loginSchema } from '../types/authRequests';
import type { LoginRequest } from '../types/authRequests';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/common/ThemeToggle';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import logo from '../assets/logo_notext.png';

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await authService.googleLogin(credentialResponse.credential);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        login(user, accessToken, refreshToken);
        navigate('/chat');
      } else {
        setApiError(response.message || 'Google Login failed');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Lỗi khi đăng nhập bằng Google';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await authService.login(data);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        login(user, accessToken, refreshToken);
        navigate('/chat');
      } else {
        setApiError(response.message || 'Login failed');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'An error occurred during login. Please try again.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gradient-animate-light dark:bg-gradient-animate">
      
      {/* Background glow ornaments */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {isForgotModalOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotModalOpen(false)} />
      )}

      <div className="w-full max-w-md z-10">
        {/* Brand logo / header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 mb-3 animate-bounce">
            <img src={logo} alt="NexTalk Logo" className="w-full h-full object-cover rounded-2xl drop-shadow-xl border border-gray-200/50 dark:border-zinc-700/50" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white m-0">
            Chào mừng trở lại!
          </h1>
          <p className="text-gray-500 dark:text-discord-muted mt-1.5 text-sm">
            Rất vui được gặp lại bạn!
          </p>
        </div>

        {/* Form Container */}
        <div className="glass rounded-3xl p-8 shadow-2xl dark:shadow-black/50 border border-white/20 dark:border-zinc-800/80 transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-sm text-left">
                {apiError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">
                Địa chỉ Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-discord-blurple transition-colors duration-200">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  disabled={isLoading}
                  placeholder="name@example.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.email
                      ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-gray-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 focus:border-indigo-600 dark:focus:border-discord-blurple'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">
                  Mật khẩu
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-indigo-600 dark:text-discord-blurple hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgotModalOpen(true);
                  }}
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-discord-blurple transition-colors duration-200">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLoading}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password
                      ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-gray-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 focus:border-indigo-600 dark:focus:border-discord-blurple'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10 dark:shadow-discord-blurple/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase">Hoặc</span>
              <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
            </div>

            <div className="flex justify-center w-full [&>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setApiError('Đăng nhập Google thất bại');
                }}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="pill"
                width="100%"
              />
            </div>
          </form>

          {/* Form Footer */}
          <div className="mt-6 pt-5 border-t border-gray-150 dark:border-zinc-800/60 text-center">
            <p className="text-sm text-gray-500 dark:text-discord-muted">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-600 dark:text-discord-blurple hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
