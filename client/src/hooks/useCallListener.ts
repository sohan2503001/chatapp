import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import useCallStore from '../store/useCallStore';

const useCallListener = () => {
  const { authUser } = useAuthStore();
  const { setIncomingCall } = useCallStore();

  useEffect(() => {
    if (!authUser) return;

    // We listen to the doc in the 'calls' collection
    // that has our OWN user ID as the document ID.
    const callDocRef = doc(db, 'calls', authUser._id);

    const unsubscribe = onSnapshot(callDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const callData = docSnapshot.data();

        // If there's a call and it's 'ringing', show the modal
        if (callData.status === 'ringing') {
          setIncomingCall(callData as any);
        } else {
          // If status is 'accepted' or 'declined', close the modal
          setIncomingCall(null);
        }
      } else {
        // Document was deleted (call ended/declined), close modal
        setIncomingCall(null);
      }
    });

    // Clean up the listener
    return () => unsubscribe();

  }, [authUser, setIncomingCall]);
};

export default useCallListener;