// client/src/store/useConversation.ts
import { create } from 'zustand';
import type { Conversation } from '../types/Conversation'; // Import our new type

interface ConversationState {
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;
}

const useConversation = create<ConversationState>((set) => ({
  selectedConversation: null,
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
}));

export default useConversation;