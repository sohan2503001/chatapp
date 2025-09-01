// client/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/register/RegisterPage';
import LoginPage from './pages/login/LoginPage';
import HomePage from './pages/home/HomePage';
import ChatPage from './pages/chat/ChatPage'; // Import ChatPage
import ProtectedRoute from './auth/ProtectedRoute'; // Import ProtectedRoute
import ForgotPasswordPage from './pages/forgot-password/ForgotPasswordPage';
import ResetPasswordPage from './pages/reset-password/ResetPasswordPage';
import VerifyEmailPage from './pages/verify-email/VerifyEmailPage';

function App() {
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
        {/* You can add more protected routes here later */}
      </Route>
    </Routes>
  );
}

export default App;