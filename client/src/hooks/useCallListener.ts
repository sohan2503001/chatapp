// client/src/hooks/useCallListener.ts
import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import useCallStore, { type CallData } from '../store/useCallStore'; // 1. Import CallData

const useCallListener = () => {
  const { authUser } = useAuthStore();
  // 2. Get the correct functions from the store
  const { setCallData, setCallInProgress, setCallDetails } = useCallStore();

  useEffect(() => {
    if (!authUser) return;

    // 3. This listener is correct: it listens to the doc where this user is the receiver.
    const callDocRef = doc(db, 'calls', authUser._id);

    const unsubscribe = onSnapshot(callDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const callData = docSnapshot.data() as CallData;
        callData.docId = docSnapshot.id; // Store the doc ID

        // 4. Handle different call statuses
        switch (callData.status) {
          case 'ringing':
            setCallData(callData);
            break;

          case 'accepted':
            // --- 5. THIS IS THE CRITICAL LOGIC YOU WERE MISSING ---
            setCallData(null);
            setCallDetails({
              initiator: callData.callerId,
              receiver: authUser._id,
              callType: 'video', // Hardcoding for now
              startTime: callData.createdAt.toDate(), // Get start time from doc
              isInitiator: false, // This user is the receiver
              roomName: callData.roomName,
              callerName: callData.callerName,
            });
            setCallInProgress(true);
            break;
          
          default:
            // e.g., 'declined', 'ended'
            setCallData(null);
            break;
        }

      } else {
        // Document was deleted (call ended/declined), close all modals
        setCallData(null);
      }
    });

    // 6. Clean up the listener
    return () => unsubscribe();

    // 7. Update dependencies
  }, [authUser, setCallData, setCallInProgress, setCallDetails]);
};

export default useCallListener;