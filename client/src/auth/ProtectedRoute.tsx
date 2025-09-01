// client/src/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check for the token in localStorage
  const token = localStorage.getItem('token');

  // If a token exists, allow access to the nested routes (Outlet)
  // Otherwise, redirect to the login page
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;