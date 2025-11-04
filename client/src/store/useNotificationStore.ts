import { create } from 'zustand';

export interface Notification {
  id: string; // Document ID
  senderId: string;
  senderName: string;
  type: 'NEW_MESSAGE' | 'CALL_REQUEST';
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
}

interface NotificationStore {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
}));

export default useNotificationStore;