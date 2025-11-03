// client/src/api/api.ts

import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Create a new axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend base URL
  withCredentials: true, // This is crucial for sending cookies (like our refresh token)
});

// Request Interceptor: Adds the access token to every request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token; // Get token from Zustand
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles expired access tokens
api.interceptors.response.use(
  (response) => response, // If response is good, just return it
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    // Check if the error is 401 (Unauthorized) and we haven't already retried
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we've retried

      // Don't try to refresh if the refresh request itself failed
      if (originalRequest.url.endsWith('/auth/refresh')) {
        authStore.setAuthUser(null);
        authStore.setToken(null);
        return Promise.reject(error);
      }

      try {
        // Call the /refresh endpoint (cookies are sent automatically)
        const res = await api.post('/auth/refresh');
        const { token, user } = res.data;

        // Update the token and user in our auth store
        authStore.setAuthUser(user);
        authStore.setToken(token);

        // Update the header of the original failed request
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // If refreshing fails, log the user out
        authStore.setAuthUser(null);
        authStore.setToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;