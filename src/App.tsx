import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import { ensureFreshAccessToken, apiClient } from './api/apiClient';
import { requestFirebaseToken, onMessageListener } from './firebase';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const QrLoginConfirm = lazy(() => import('./pages/QrLoginConfirm'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const Friends = lazy(() => import('./pages/Friends'));
const JoinGroup = lazy(() => import('./pages/JoinGroup'));
const AdminStickers = lazy(() => import('./pages/AdminStickers'));
const VoiceChannelMiniPlayer = lazy(() =>
  import('./components/chat/VoiceChannelMiniPlayer').then((module) => ({
    default: module.VoiceChannelMiniPlayer,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const persistedUser = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      if (persistedUser && !useAuthStore.getState().accessToken) {
        await ensureFreshAccessToken(0);
      }
      if (active) setSessionReady(true);
    };
    void restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const baseTitle = 'NexTalk';
    if (!isAuthenticated) {
      document.title = baseTitle;
      return;
    }

    const unreadMessages = notifications
      .filter((notification) => (notification.type === 'NEW_MESSAGE' || notification.type === 'MENTION') && !notification.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (unreadMessages.length === 0) {
      document.title = baseTitle;
      return;
    }

    const latestContent = unreadMessages[0]?.content?.trim() || 'Bạn có tin nhắn mới';
    const compactContent = latestContent.length > 42 ? `${latestContent.slice(0, 39)}...` : latestContent;
    document.title = `(${unreadMessages.length}) ${compactContent} - ${baseTitle}`;

    return () => {
      document.title = baseTitle;
    };
  }, [isAuthenticated, notifications]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately on mount/auth change
    const checkAndRefresh = async () => {
      await ensureFreshAccessToken(120);
    };

    checkAndRefresh();

    // Check every 60 seconds
    const interval = setInterval(checkAndRefresh, 60000);
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const setupFCM = async () => {
        try {
          const token = await requestFirebaseToken();
          if (token) {
            await apiClient.post('/fcm/token', { token });
          }
        } catch (err: any) {
          console.error('Failed to setup FCM', err);
        }
      };

      setupFCM();

      onMessageListener().catch(err => console.log('failed to receive foreground message: ', err));
    }
  }, [isAuthenticated]);

  if (!sessionReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-label="Đang tải" />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="/qr-login/confirm" element={<QrLoginConfirm />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/g/:code" element={<JoinGroup />} />
              <Route path="/admin/stickers" element={<AdminStickers />} />
            </Route>

            {/* Fallback Redirects */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to="/chat" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
          {isAuthenticated && <VoiceChannelMiniPlayer />}
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
