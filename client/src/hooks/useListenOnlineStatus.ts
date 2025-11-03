// client/src/hooks/useListenOnlineStatus.ts
import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebaseRTDB';
import useOnlineStore from '../store/useOnlineStore';

const useListenOnlineStatus = () => {
  const { setOnlineUsers } = useOnlineStore();

  useEffect(() => {
    // Listen to the main /status path which contains all users
    const statusRef = ref(rtdb, '/status');

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const statuses = snapshot.val();
      const onlineUserIds: string[] = [];

      if (statuses) {
        // Loop through all user IDs at the /status path
        Object.keys(statuses).forEach((userId) => {
          if (statuses[userId].isOnline) {
            onlineUserIds.push(userId);
          }
        });
      }

      // Update our global store with the list of online users
      setOnlineUsers(onlineUserIds);
    });

    // Clean up the listener
    return () => unsubscribe();
  }, [setOnlineUsers]);
};

export default useListenOnlineStatus;