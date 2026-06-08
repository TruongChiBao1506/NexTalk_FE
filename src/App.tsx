import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import { useAuthStore } from './store/authStore';
import { refreshAccessToken } from './api/apiClient';

function isTokenExpired(token: string, offsetSeconds = 60): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const exp = decodedPayload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp - now < offsetSeconds;
  } catch (e) {
    return true;
  }
}

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

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately on mount/auth change
    const checkAndRefresh = async () => {
      const currentToken = localStorage.getItem('nextalk_accessToken');
      if (currentToken && isTokenExpired(currentToken, 120)) { // 2 minutes buffer
        console.log('[Auth] Token close to expiry or expired, refreshing...');
        await refreshAccessToken();
      }
    };

    checkAndRefresh();

    // Check every 60 seconds
    const interval = setInterval(checkAndRefresh, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
