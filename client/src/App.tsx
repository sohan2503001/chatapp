// client/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'; // 1. Import 'Navigate'
import useAuthStore from './store/useAuthStore';
import RegisterPage from './pages/register/RegisterPage';
import LoginPage from './pages/login/LoginPage';
import HomePage from './pages/home/HomePage';
import ChatPage from './pages/chat/ChatPage';
import ProtectedRoute from './auth/ProtectedRoute';
import ForgotPasswordPage from './pages/forgot-password/ForgotPasswordPage';
import ResetPasswordPage from './pages/reset-password/ResetPasswordPage';
import VerifyEmailPage from './pages/verify-email/VerifyEmailPage';
import useOnlineStatus from './hooks/useOnlineStatus';
import CallHistoryPage from './pages/call-history/CallHistoryPage';

function App() {
  const { authUser } = useAuthStore();
  useOnlineStatus();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
        
        {/* 2. Move this route inside and simplify it */}
        <Route path="/call-history" element={<CallHistoryPage />} />
        
        {/* You can add more protected routes here later */}
      </Route>

      {/* Fallback for any other route - you might want this */}
      <Route path="*" element={<Navigate to={authUser ? "/chat" : "/login"} />} />
    </Routes>
  );
}

export default App;