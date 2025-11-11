// client/src/components/sidebar/DefaultAvatar.tsx

// This component will show a default user or group icon
export const DefaultUserAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  </div>
);

export const DefaultGroupAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A9.06 9.06 0 0 1 6 18.719m12 0a9.06 9.06 0 0 0-6-2.185m0 0a9.06 9.06 0 0 0-6 2.185m0 0A9.06 9.06 0 0 1 6 18.719m0 0A9.06 9.06 0 0 1 6 18.719M6 21a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21m0 0a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21m0 0a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21M6 21a9.06 9.06 0 0 0 6-2.185M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  </div>
);