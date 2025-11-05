// client/src/components/modals/IncomingCallModal.tsx
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import useCallStore from "../../store/useCallStore"; // 1. Using the correct store

const IncomingCallModal = () => {
  // 2. Get the correct state and functions from the store
  const { callData, setCallData } = useCallStore();

  const handleAccept = async () => {
    if (!callData) return;

    try {
      // 3. The doc ID is stored in callData.docId
      const callDocRef = doc(db, "calls", callData.docId);
      
      // 4. Just update the status. The listener will handle the rest.
      await updateDoc(callDocRef, {
        status: "accepted",
      });
      
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const handleDecline = async () => {
    if (!callData) return;

    try {
      const callDocRef = doc(db, "calls", callData.docId);
      
      // 5. Delete the doc. The listener will see this.
      await deleteDoc(callDocRef);
      
    } catch (error) {
      console.error("Error declining call:", error);
    }

    setCallData(null); // Also close the modal immediately
  };

  if (!callData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Incoming Call</h2>
        <p className="mb-6">
          <span className="font-semibold">{callData.callerName}</span> is calling...
        </p>
        <div className="flex justify-around">
          <button
            onClick={handleDecline} // handleDecline is read here
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Decline
          </button>
          <button
            onClick={handleAccept} // handleAccept is read here
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;