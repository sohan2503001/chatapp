// client/src/pages/call-history/CallHistoryPage.tsx
import { useNavigate } from 'react-router-dom';
import useGetCallHistory from '../../hooks/useGetCallHistory';
import useAuthStore from '../../store/useAuthStore';
import type { CallHistory } from '../../types/CallHistory';

// Helper component for call status icons
const CallStatusIcon = ({ status, fromMe }: { status: string, fromMe: boolean }) => {
  if (status === 'completed') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
        className={`w-6 h-6 ${fromMe ? 'text-green-500' : 'text-gray-500'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d={fromMe ? "M4.5 19.5l7.5-7.5L4.5 4.5M12.75 19.5l7.5-7.5L12.75 4.5" : "M19.5 4.5l-7.5 7.5-7.5-7.5M19.5 12l-7.5 7.5-7.5-7.5"} />
      </svg>
    );
  }
  if (status === 'missed') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-7.5 7.5-7.5-7.5M19.5 12l-7.5 7.5-7.5-7.5" />
      </svg>
    );
  }
  if (status === 'declined') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-7.5 7.5-7.5-7.5M19.5 12l-7.5 7.5-7.5-7.5" />
      </svg>
    );
  }
  return null;
};

// Helper function to format duration
const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 1) return null;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
};

const CallHistoryPage = () => {
  const navigate = useNavigate();
  const { callLogs, loading } = useGetCallHistory();
  const { authUser } = useAuthStore();

  const renderCallLog = (log: CallHistory) => {
    if (!authUser) return null;

    const fromMe = log.initiator._id === authUser._id;
    const otherUser = fromMe ? log.receiver : log.initiator;
    const callStatusText = 
      log.status === 'completed' ? (fromMe ? 'Outgoing' : 'Incoming') :
      log.status === 'missed' ? (fromMe ? 'Cancelled' : 'Missed') : 'Declined';

    return (
      <li key={log._id} className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <CallStatusIcon status={log.status} fromMe={fromMe} />
          <div>
            <h3 className="text-lg font-semibold">{otherUser.username}</h3>
            <p className="text-sm text-gray-500">
              {callStatusText} {log.callType} call
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date(log.startTime).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {formatDuration(log.duration)}
          </p>
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-lg">
      <header className="p-4 bg-gray-800 text-white flex items-center">
        <button 
          onClick={() => navigate('/chat')} // Go back to chat
          className="p-2 rounded-full hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-4">Call History</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading && <p className="text-center p-4">Loading call history...</p>}
        {!loading && callLogs.length === 0 && (
          <p className="text-center p-4 text-gray-500">No call history found.</p>
        )}
        {!loading && callLogs.length > 0 && (
          <ul>{callLogs.map(renderCallLog)}</ul>
        )}
      </main>
    </div>
  );
};

export default CallHistoryPage;