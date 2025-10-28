// client/src/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = () => {
  // Check for the token in localStorage
  // const token = localStorage.getItem('token');
  const { token } = useAuthStore();

  // If a token exists, allow access to the nested routes (Outlet)
  // Otherwise, redirect to the login page
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;