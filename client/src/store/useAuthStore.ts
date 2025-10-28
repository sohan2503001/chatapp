// client/src/store/useAuthStore.ts
import { create } from 'zustand';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthState {
  authUser: User | null;
  token: string | null;
  setAuthUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  authUser: null,
  token: localStorage.getItem('token'),
  setAuthUser: (user) => set({ authUser: user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
}));

export default useAuthStore;