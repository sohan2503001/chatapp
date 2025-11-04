// client/src/pages/chat/ChatPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { isAxiosError } from 'axios';
import { collection, query, orderBy, onSnapshot, Timestamp, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../store/useConversation";
import useAuthStore from '../../store/useAuthStore';
import useGetMessages from "../../hooks/useGetMessages";
import useListenOnlineStatus from '../../hooks/useListenOnlineStatus'; 
import useOnlineStore from '../../store/useOnlineStore'; 
import useCallListener from '../../hooks/useCallListener';
import useCallStore from '../../store/useCallStore'; // Import the call store
import IncomingCallModal from '../../components/modals/IncomingCallModal'; // Import the modal
import VideoCall from '../../components/video/VideoCall'; // For video call UI
import NotificationBell from '../../components/notifications/NotificationBell'; //Import the NotificationBell component
import NotificationDropdown from '../../components/notifications/NotificationDropdown'; // Import the NotificationDropdown component
import useNotificationListener from '../../hooks/useNotificationListener'; // Import the hook to listen for notifications

// This is the type we get from MongoDB
interface MongoMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

// This is the type we get from Firebase
interface FirebaseMessage {
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: Timestamp; // Firebase uses a specific Timestamp object
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useGetUsers();
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { authUser, setToken, setAuthUser } = useAuthStore();
  const { onlineUsers } = useOnlineStore(); // To access online users
  useListenOnlineStatus(); // Start listening to online status changes
  useCallListener(); // Start listening for incoming calls
  useNotificationListener(); // Start listening for notifications
  const { isReceivingCall, callInProgress, setCallInProgress, setRoomName } = useCallStore(); // Get the state to check if receiving a call
  
  // This loads the history from MongoDB
  const { messages, loading: messagesLoading, setMessages } = useGetMessages();
  const [newMessage, setNewMessage] = useState('');

  // This hook listens for NEW real-time messages
  useEffect(() => {
    if (!selectedConversation || !authUser) return;
    const listenerStartTime = new Date();

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      where("createdAt", ">", listenerStartTime)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMsgs: MongoMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseMessage;
        
        if (
          (data.senderId === authUser._id && data.receiverId === selectedConversation._id) ||
          (data.senderId === selectedConversation._id && data.receiverId === authUser._id)
        ) {
          newMsgs.push({
            ...data,
            _id: doc.id,
            createdAt: data.createdAt.toDate().toISOString(),
          });
        }
      });

      if (newMsgs.length > 0) {
        // --- THIS IS THE FIX ---
        // We must check for duplicates before adding.
        setMessages((prevMessages: MongoMessage[]) => {
          // Create a Set of existing message IDs for quick lookup
          const existingIds = new Set(prevMessages.map(msg => msg._id));
          
          // Filter out any new messages that are already in our state
          const uniqueNewMsgs = newMsgs.filter(msg => !existingIds.has(msg._id));

          // If there are any truly new messages, add them
          if (uniqueNewMsgs.length > 0) {
            return [...prevMessages, ...uniqueNewMsgs];
          } else {
            // Otherwise, return the old state to prevent a re-render
            return prevMessages;
          }
        });
        // --- END OF FIX ---
      }
    });

    return () => unsubscribe();
    
  }, [selectedConversation, authUser, setMessages]);

  const handleVideoCall = async () => {
    if (!selectedConversation || !authUser) return;

    try {
      const roomName = Math.random().toString(36).substring(2, 15);
      const callDocRef = doc(db, 'calls', selectedConversation._id);
      
      // Set the initial call document
      await setDoc(callDocRef, {
        callerId: authUser._id,
        callerName: authUser.username,
        receiverId: selectedConversation._id,
        status: 'ringing',
        createdAt: Timestamp.now(),
        roomName: roomName,
      });
      
      // --- 2. This is the new logic for the caller ---
      // Listen for changes to the call document
      const unsubscribe = onSnapshot(callDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const callData = docSnapshot.data();
          
          if (callData.status === 'accepted') {
            // Call was accepted! Join the room.
            setRoomName(callData.roomName); // Room name is the doc ID
            setCallInProgress(true);
            unsubscribe(); // Stop listening
          }
        } else {
          // Document was deleted (call was declined)
          alert(`${selectedConversation.username} declined the call.`);
          unsubscribe(); // Stop listening
        }
      });
      
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Call the backend to clear the httpOnly cookie
      await api.post('/auth/logout');
      
      // 2. Clear all local state
      setToken(null);
      setAuthUser(null);
      setSelectedConversation(null);
      
      // 3. Navigate to login (this is now handled by the store,
      //    but we can keep it for an immediate redirect)
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // This sends the message to our Express/Mongo backend
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation) return;

    try {
      // 1. Use the 'api' instance
      // 2. Use the relative path
      // 3. No headers/token needed, the interceptor adds it
      await api.post(
        `/messages/send/${selectedConversation._id}`,
        { message: newMessage }
      );
      
      setNewMessage('');
      // The server saves to Mongo and pushes to Firebase.
      // Our listener will pick it up automatically.
    } catch (error) {
      // 4. Add improved error handling
      if (isAxiosError(error) && error.response) {
        console.error("Error sending message:", error.response.data.message);
      } else {
        console.error("Error sending message:", (error as Error).message);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Render the modal if a call is ringing */}
      {isReceivingCall && <IncomingCallModal />}

      {/* Show the Jitsi meeting if a call is in progress */}
      {callInProgress && <VideoCall />}

      {/* Sidebar */}
      {/* 2. Add 'flex flex-col' to the aside */}
      <aside className={`w-1/4 bg-gray-800 text-white p-4 flex flex-col ${callInProgress ? 'blur-sm' : ''}`}>
        
        {/* 3. Create a header for the sidebar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Users</h2>
          <div className="relative">
            <NotificationBell />
            <NotificationDropdown />
          </div>
        </div>

        {/* 4. Make the user list scrollable */}
        <ul className="flex-1 overflow-y-auto">
          {usersLoading ? (
            <p>Loading users...</p>
          ) : (
            users.map((user) => {
              // Check if this user is in the online list
              const isOnline = onlineUsers.includes(user._id);

              // --- THIS IS THE FIX ---
              // We must explicitly 'return' the JSX
              return (
                <li
                  key={user._id}
                  onClick={() => setSelectedConversation(user)}
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 ${
                    selectedConversation?._id === user._id ? "bg-gray-600" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    ></div>
                    <span>{user.username}</span>
                  </div>
                </li>
              );
              // --- END OF FIX ---
            })
          )}
        </ul>

        {/* 5. The logout button is pushed to the bottom */}
        <button onClick={handleLogout} className="w-full mt-6 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
        {selectedConversation ? (
          <>
            {/* --- THIS IS THE UPDATED HEADER --- */}
            <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedConversation.username}</h2>
              <button
                onClick={handleVideoCall}
                className="p-2 rounded-full hover:bg-gray-200"
                title="Start video call"
              >
                {/* A simple video camera icon using SVG */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-6 h-6 text-gray-700"
                >
                  <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-12Z" />
                  <path d="M18 7.5a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3ZM21.75 9a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 .75-.75Z" />
                </svg>
              </button>
            </header>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {messagesLoading && <p className="text-center">Loading messages...</p>}
              
              {!messagesLoading && messages.length === 0 && (
                <p className="text-center text-gray-500">
                  Send a message to start the conversation!
                </p>
              )}

              {!messagesLoading && messages.map((msg) => {
                const fromMe = msg.senderId === authUser?._id;
                return (
                  <div key={msg._id} className={`mb-4 ${fromMe ? 'text-right' : 'text-left'}`}>
                    <div className={`p-2 rounded-lg inline-block ${fromMe ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-black'}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-500">Select a user to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;