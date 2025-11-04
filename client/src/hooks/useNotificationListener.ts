import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import useNotificationStore, { type Notification } from '../store/useNotificationStore';

const useNotificationListener = () => {
  const { authUser } = useAuthStore();
  const { setNotifications } = useNotificationStore();

  useEffect(() => {
    if (!authUser) return;

    // Query for notifications where we are the receiver
    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', authUser._id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [authUser, setNotifications]);
};

export default useNotificationListener;