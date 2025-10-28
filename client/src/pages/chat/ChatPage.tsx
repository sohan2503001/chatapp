// client/src/pages/chat/ChatPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../store/useConversation";
import useAuthStore from '../../store/useAuthStore';

// Define the structure of a message object
interface Message {
  id?: string;
  text: string;
  sender: string;
  createdAt: Timestamp;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { users, loading } = useGetUsers();
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { setToken, setAuthUser } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesCollectionRef = collection(db, 'messages');

  // Listen for real-time updates from Firestore
  useEffect(() => {
    const q = query(messagesCollectionRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    // Clear all state on logout
    setToken(null);
    setAuthUser(null);
    setSelectedConversation(null);
    navigate('/login');
    // localStorage.removeItem('token');
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      text: newMessage,
      sender: 'You',
      createdAt: Timestamp.now(),
    };

    // Log the object right before sending
    console.log("Attempting to send this data:", messageData);

    try {
      await addDoc(messagesCollectionRef, messageData);
      setNewMessage('');
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
          {loading ? (
            <p>Loading users...</p>
          ) : (
            users.map((user) => (
              <li
                key={user._id}
                // 3. Set the selected conversation on click
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
        <button onClick={handleLogout} className="w-full mt-6 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
        {selectedConversation ? (
          <>
            {/* Header */}
            <header className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-xl font-bold">{selectedConversation.username}</h2>
            </header>
            
            {/* Message Display Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-4 ${msg.sender === 'You' ? 'text-right' : ''}`}>
                  <div className="font-bold">{msg.sender}</div>
                  <div className={`p-2 rounded-lg inline-block ${msg.sender === 'You' ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-black'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input Form */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="px-6 py-2 text-white bg-indigo-600 rounded-r-md hover:bg-indigo-700">
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