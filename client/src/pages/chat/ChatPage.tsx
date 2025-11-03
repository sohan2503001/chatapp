// client/src/pages/chat/ChatPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { isAxiosError } from 'axios';
import { collection, query, orderBy, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../store/useConversation";
import useAuthStore from '../../store/useAuthStore';
import useGetMessages from "../../hooks/useGetMessages";
import useListenOnlineStatus from '../../hooks/useListenOnlineStatus'; 
import useOnlineStore from '../../store/useOnlineStore'; 

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <ul>
          {usersLoading ? (
            <p>Loading users...</p>
          ) : (
            users.map((user) => {
              // 5. Check if this user is in the online list
              const isOnline = onlineUsers.includes(user._id);

              return (
                <li
                  key={user._id}
                  onClick={() => setSelectedConversation(user)}
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 ${
                    selectedConversation?._id === user._id ? "bg-gray-600" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {/* 6. The Green Dot */}
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    ></div>
                    <span>{user.username}</span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
        <button onClick={handleLogout} className="w-full mt-6 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-7Check">
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
        {selectedConversation ? (
          <>
            <header className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-xl font-bold">{selectedConversation.username}</h2>
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