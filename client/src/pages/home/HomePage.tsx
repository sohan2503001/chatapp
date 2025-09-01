// client/src/pages/home/HomePage.tsx

import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <div className="p-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
          Welcome to the Chat App
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Connect and communicate in real-time.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/register"
            className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 text-lg font-semibold text-indigo-600 bg-white border border-indigo-600 rounded-md shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;