// import React from 'react';
import { useEffect, useRef } from 'react';
import useNotificationStore, { type Notification } from '../../store/useNotificationStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const NotificationDropdown = () => {
  // --- THIS IS THE FIX ---
  // You need to get 'close' from the store
  const { isOpen, notifications, close } = useNotificationStore();
  // --- END OF FIX ---
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return; // Only run if the dropdown is open

    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was on the bell button
      const isBellClick = (event.target as HTMLElement).closest('button[aria-label="Toggle Notifications"]');
      
      // Check if the click was inside the dropdown
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target as Node);

      // If the click was *not* on the bell and *not* inside the dropdown, close it.
      if (!isBellClick && !isInsideDropdown) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to remove the listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  const handleMarkAsRead = async (notificationId: string) => {
    // Mark the notification as read in Firebase
    const notifRef = doc(db, 'notifications', notificationId);
    try {
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
    // We don't need to close the dropdown, the listener will update the UI
  };

  const getNotificationText = (notification: Notification) => {
    if (notification.type === 'NEW_MESSAGE') {
      return (
        <p className="text-sm text-gray-700">
          <span className="font-bold">{notification.senderName}</span> sent you a message.
        </p>
      );
    }
    // You can add more types like 'CALL_REQUEST' here later
    return <p className="text-sm text-gray-700">New notification</p>;
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute top-14 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        {/* We can add a "Mark All Read" button here later */}
      </div>

      <ul className="flex flex-col max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="p-4 text-center text-sm text-gray-500">
            You have no new notifications.
          </li>
        ) : (
          notifications.map((notif) => (
            <li
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
              className={`p-4 border-b cursor-pointer ${
                notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 font-bold hover:bg-blue-100'
              }`}
            >
              {getNotificationText(notif)}
              {/* We can add a relative time (e.g., "2 minutes ago") later */}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default NotificationDropdown;