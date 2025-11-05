// client/src/hooks/useTypingListener.ts
import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import useConversation from '../store/useConversation';
import useTypingStore from '../store/useTypingStore';

const useTypingListener = () => {
  const { authUser } = useAuthStore();
  const { selectedConversation } = useConversation();
  const { setIsOpponentTyping } = useTypingStore();

  useEffect(() => {
    if (!authUser) return;

    // Listen to the document named after *our* user ID
    const typingDocRef = doc(db, 'typingStatus', authUser._id);

    const unsubscribe = onSnapshot(typingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if the typing notification is from the person we're talking to
        if (selectedConversation && data.senderId === selectedConversation._id) {
          setIsOpponentTyping(true);
        } else {
          setIsOpponentTyping(false);
        }
      } else {
        // Document doesn't exist, so no one is typing to us
        setIsOpponentTyping(false);
      }
    });

    return () => {
      unsubscribe();
      // Clean up when component unmounts
      setIsOpponentTyping(false);
    };
  }, [authUser, selectedConversation, setIsOpponentTyping]);
};

export default useTypingListener;