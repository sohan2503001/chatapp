// client/src/components/video/VideoCall.tsx
import { JitsiMeeting } from '@jitsi/react-sdk';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import useCallStore from '../../store/useCallStore';
import api from '../../api/api'; // 1. Import the 'api' helper

const VideoCall = () => {
  // 2. Get 'callDetails' and 'setCallDetails' from the store
  const { callDetails, setCallInProgress, setCallDetails } = useCallStore();

  // 3. Create the function to log the call
  const logCompletedCall = async () => {
    if (!callDetails) return; // No details, can't log

    const endTime = new Date();
    const startTime = new Date(callDetails.startTime);
    
    // Calculate duration in seconds
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    try {
      await api.post('/callhistory/log', {
        initiator: callDetails.initiator,
        receiver: callDetails.receiver,
        callType: callDetails.callType,
        status: 'completed', // Log as completed
        startTime: callDetails.startTime,
        endTime: endTime,
        duration: duration,
      });
    } catch (error) {
      console.error("Error logging call:", error);
    }
  };

  // 4. Update handleHangUp to use the new logic
  const handleHangUp = async () => {
    // Log the call *before* cleaning up
    await logCompletedCall();

    if (callDetails) {
      try {
        // The call document ID is the receiver's ID
        const callDocRef = doc(db, 'calls', callDetails.receiver);
        await deleteDoc(callDocRef);
      } catch (error) {
        console.error("Error hanging up:", error);
      }
    }

    // Clean up the store
    setCallInProgress(false);
    setCallDetails(null); // Use setCallDetails
  };

  // 5. Check for callDetails, not roomName
  if (!callDetails) {
    return <div className="text-center p-8">Setting up call...</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <JitsiMeeting
        domain="alpha.jitsi.net"
        
        // 6. Get roomName from callDetails
        roomName={callDetails.roomName}
        
        getIFrameRef={(iframeNode) => {
          iframeNode.style.height = '100vh';
          iframeNode.style.width = '100vw';
        }}
        onApiReady={(externalApi) => {
          // 7. Attach the updated handleHangUp
          externalApi.on('videoConferenceLeft', handleHangUp);
        }}
      />
    </div>
  );
};

export default VideoCall;