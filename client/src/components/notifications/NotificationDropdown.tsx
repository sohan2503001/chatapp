//import React from 'react';
import useNotificationStore from '../../store/useNotificationStore';

const NotificationDropdown = () => {
  const { isOpen } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
      </div>
      <ul className="flex flex-col max-h-96 overflow-y-auto">
        {/* Placeholder Notification */}
        <li className="p-4 hover:bg-gray-50 border-b cursor-pointer">
          <p className="text-sm text-gray-700">
            <span className="font-bold">user1</span> sent you a message.
          </p>
          <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
        </li>
        {/* Placeholder Notification */}
        <li className="p-4 hover:bg-gray-50 border-b cursor-pointer">
          <p className="text-sm text-gray-700">
            You have a new call request from <span className="font-bold">user2</span>.
          </p>
          <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
        </li>
        {/* Placeholder Notification */}
        <li className="p-4 hover:bg-gray-50 cursor-pointer">
          <p className="text-sm text-gray-500">
            Welcome to the app!
          </p>
        </li>
      </ul>
    </div>
  );
};

export default NotificationDropdown;