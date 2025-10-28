// client/src/store/useConversation.ts
import { create } from 'zustand';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface ConversationState {
  selectedConversation: User | null;
  setSelectedConversation: (conversation: User | null) => void;
}

const useConversation = create<ConversationState>((set) => ({
  selectedConversation: null,
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
}));

export default useConversation;