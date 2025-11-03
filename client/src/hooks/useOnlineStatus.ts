// client/src/hooks/useOnlineStatus.ts
import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseRTDB';
import useAuthStore from '../store/useAuthStore';

const useOnlineStatus = () => {
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!authUser) return;

    // Path to this user's status in the RTDB
    const userStatusRef = ref(rtdb, `/status/${authUser._id}`);

    // Path to check connection status
    const isConnectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(isConnectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      // We're connected. Set our status to online.
      // onDisconnect hook ensures we go offline if we disconnect
      onDisconnect(userStatusRef).set({
        isOnline: false,
        last_changed: serverTimestamp(),
      }).then(() => {
        // Now that the disconnect hook is set, mark us as online
        set(userStatusRef, {
          isOnline: true,
          last_changed: serverTimestamp(),
        });
      });
    });

    return () => unsubscribe();
  }, [authUser]);
};

export default useOnlineStatus;