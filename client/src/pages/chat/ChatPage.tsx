// client/src/pages/chat/ChatPage.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Import the db instance from your firebase.ts file

// Define the structure of a message object
interface Message {
  id?: string;
  text: string;
  sender: string;
  createdAt: Timestamp;
}

const ChatPage = () => {
  const navigate = useNavigate();
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
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      // Add a new document to the "messages" collection
      await addDoc(messagesCollectionRef, {
        text: newMessage,
        sender: 'You', // In a real app, this would come from an auth context
        createdAt: Timestamp.now(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Chat App</h2>
        <button onClick={handleLogout} className="w-full mt-6 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
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
      </main>
    </div>
  );
};

export default ChatPage;