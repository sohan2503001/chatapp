// client/src/components/notifications/NotificationBell.tsx
// import React from 'react';
import useNotificationStore from '../../store/useNotificationStore';

const NotificationBell = () => {
  // We'll make this dynamic with a store later
  const notificationCount = 0; 
  const { toggle } = useNotificationStore();

  const handleClick = () => {
    // This will open the notification dropdown later
    toggle();
  };

  return (
    <button onClick={handleClick} className="relative p-2 rounded-full hover:bg-gray-700 focus:outline-none">
      {/* Bell Icon SVG */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-6 h-6"
      >
        <path 
          fillRule="evenodd" 
          d="M12 2.25c-2.49 0-4.5 2.01-4.5 4.5v.75c0 1.12-.39 2.16-.9 3.06-1.31 2.3-1.6 4.89-1.16 7.4.45 2.5 2.11 4.6 4.3 5.68.21.1.43.19.66.28.23.09.46.16.7.21a.75.75 0 0 0 .7 0c.24-.05.47-.12.7-.21.23-.09.45-.18.66-.28 2.19-1.08 3.85-3.18 4.3-5.68.44-2.51.15-5.1-1.16-7.4-.51-.9-.9-1.94-.9-3.06v-.75c0-2.49-2.01-4.5-4.5-4.5Zm0 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75s.75-.336.75-.75v-.008a.75.75 0 0 0-.75-.75Z" 
          clipRule="evenodd" 
        />
      </svg>

      {/* Notification Counter Badge */}
      {notificationCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {notificationCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;