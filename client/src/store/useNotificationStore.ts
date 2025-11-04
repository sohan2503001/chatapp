import { create } from 'zustand';

interface NotificationStore {
  isOpen: boolean;
  toggle: () => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default useNotificationStore;