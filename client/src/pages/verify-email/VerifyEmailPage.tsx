// client/src/pages/verify-email/VerifyEmailPage.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmailPage = () => {
  const [status, setStatus] = useState('Verifying your email...');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('No verification token found.');
        return;
      }

      try {
        // Make the API call to the backend to verify the token
        await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
        
        // If successful, update status and redirect to login
        setStatus('Email successfully verified! Redirecting to login...');
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000); // Wait 3 seconds before redirecting

      } catch (error) {
        setStatus('Verification failed. The link may be invalid or expired.');
        console.error('Verification error:', error);
      }
    };

    verifyToken();
  }, [token, navigate]); // Dependencies for the effect

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">{status}</h1>
    </div>
  );
};

export default VerifyEmailPage;