// client/src/pages/chat/ChatPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { collection, query, orderBy, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../store/useConversation";
import useAuthStore from '../../store/useAuthStore';
import useGetMessages from "../../hooks/useGetMessages";

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
  const { token, authUser, setToken, setAuthUser } = useAuthStore();
  
  // This loads the history from MongoDB
  const { messages, loading: messagesLoading, setMessages } = useGetMessages();
  
  const [newMessage, setNewMessage] = useState('');

  // This hook listens for NEW real-time messages
  useEffect(() => {
    // Don't listen until a chat is selected
    if (!selectedConversation || !authUser) return;

    // We record the time the component mounts.
    // We'll only listen for messages created AFTER this time.
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
        
        // Filter messages to make sure they belong to the open conversation
        if (
          (data.senderId === authUser._id && data.receiverId === selectedConversation._id) ||
          (data.senderId === selectedConversation._id && data.receiverId === authUser._id)
        ) {
          // Convert the Firebase data to our app's standard format
          newMsgs.push({
            ...data,
            _id: doc.id,
            createdAt: data.createdAt.toDate().toISOString(),
          });
        }
      });

      if (newMsgs.length > 0) {
        // Add the new messages to the existing list
        setMessages((prevMessages: MongoMessage[]) => [...prevMessages, ...newMsgs]);
      }
    });

    // The cleanup function
    return () => unsubscribe();
    
  // --- THIS IS THE FIX ---
  // The dependency array only includes things that define the conversation.
  // It no longer includes 'messages' or 'messagesLoading'.
  }, [selectedConversation, authUser, setMessages]);

  const handleLogout = () => {
    setToken(null);
    setAuthUser(null);
    setSelectedConversation(null);
    navigate('/login');
  };

  // This sends the message to our Express/Mongo backend
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation) return;

    try {
      await axios.post(
        `http://localhost:5000/api/messages/send/${selectedConversation._id}`,
        { message: newMessage },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setNewMessage('');
      // The server saves to Mongo and pushes to Firebase.
      // Our listener will pick it up automatically.
    } catch (error) {
      console.error("Error sending message: ", error);
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
            users.map((user) => (
              <li
                key={user._id}
                onClick={() => setSelectedConversation(user)}
                className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 ${
                  selectedConversation?._id === user._id ? "bg-gray-600" : ""
                }`}
              >
                {user.username}
              </li>
            ))
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