// client/src/store/useTypingStore.ts
import { create } from 'zustand';

interface TypingState {
  isOpponentTyping: boolean;
  setIsOpponentTyping: (isTyping: boolean) => void;
}

const useTypingStore = create<TypingState>((set) => ({
  isOpponentTyping: false,
  setIsOpponentTyping: (isTyping) => set({ isOpponentTyping: isTyping }),
}));

export default useTypingStore;