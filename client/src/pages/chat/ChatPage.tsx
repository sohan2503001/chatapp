// client/src/pages/chat/ChatPage.tsx
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Socket.IO logic to send message will go here
    console.log('Message sent!');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for Users */}
      <aside className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Online Users</h2>
        <ul>
          {/* Hardcoded user list for now */}
          <li className="p-2 rounded-md hover:bg-gray-700 cursor-pointer">User One</li>
          <li className="p-2 rounded-md hover:bg-gray-700 cursor-pointer">User Two</li>
          <li className="p-2 rounded-md hover:bg-gray-700 cursor-pointer">User Three</li>
        </ul>
        <button
          onClick={handleLogout}
          className="w-full mt-6 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
        >
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
        {/* Message Display Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Hardcoded messages for now */}
          <div className="mb-4">
            <div className="font-bold">User One</div>
            <div className="bg-blue-500 text-white p-2 rounded-lg inline-block">
              Hello there!
            </div>
          </div>
          <div className="mb-4 text-right">
            <div className="font-bold">You</div>
            <div className="bg-gray-300 text-black p-2 rounded-lg inline-block">
              Hi! How are you?
            </div>
          </div>
        </div>

        {/* Message Input Form */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-6 py-2 text-white bg-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;