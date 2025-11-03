// client/src/store/useOnlineStore.ts
import { create } from 'zustand';

interface OnlineStore {
  onlineUsers: string[]; // An array of user IDs
  setOnlineUsers: (users: string[]) => void;
}

const useOnlineStore = create<OnlineStore>((set) => ({
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));

export default useOnlineStore;