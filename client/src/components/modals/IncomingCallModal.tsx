// client/src/components/modals/IncomingCallModal.tsx
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import useCallStore from '../../store/useCallStore';

const IncomingCallModal = () => {
  const { incomingCallData, setIncomingCall, setCallInProgress, setRoomName } = useCallStore();

  if (!incomingCallData) return null;

  const { callerName, receiverId, roomName } = incomingCallData; // Destructure roomName

  const handleAccept = async () => {
    // 1. Update the call doc status to 'accepted'
    const callDocRef = doc(db, 'calls', receiverId);
    await updateDoc(callDocRef, { status: 'accepted' });
    
    // --- 2. Update the store to join the call ---
    setRoomName(roomName); // Set the room name from the call data
    setCallInProgress(true);
    
    console.log('Call accepted');
    setIncomingCall(null); // Close the modal
  };

  const handleDecline = async () => {
    // 1. Delete the call document from Firebase
    const callDocRef = doc(db, 'calls', receiverId);
    await deleteDoc(callDocRef);
    
    console.log('Call declined');
    setIncomingCall(null); // Close the modal
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Incoming Call...</h2>
        <p className="mb-6 text-gray-700">{callerName} is calling you.</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;