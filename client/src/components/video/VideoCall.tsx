// client/src/components/video/VideoCall.tsx
import { JitsiMeeting } from '@jitsi/react-sdk';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import useCallStore from '../../store/useCallStore';
// import useAuthStore from '../../store/useAuthStore';

const VideoCall = () => {
  const { roomName, setCallInProgress, setRoomName } = useCallStore();

  const handleHangUp = async () => {
    if (!roomName) return;

    try {
      // The roomName is the receiver's ID, which is the call document's ID
      const callDocRef = doc(db, 'calls', roomName);
      await deleteDoc(callDocRef);
    } catch (error) {
      console.error("Error hanging up:", error);
    }

    // Clean up the store
    setCallInProgress(false);
    setRoomName(null);
  };

  if (!roomName) {
    return <div className="text-center p-8">Setting up call...</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <JitsiMeeting
        // --- THIS IS THE FIX ---
        // Force the component to use the Jitsi developer server,
        // which is less restrictive than the main public ones.
        domain="alpha.jitsi.net"
        // --- END OF FIX ---
        
        roomName={roomName}
        
        // We are still using the default config (no configOverwrite)
        
        getIFrameRef={(iframeNode) => {
          iframeNode.style.height = '100vh';
          iframeNode.style.width = '100vw';
        }}
        onApiReady={(externalApi) => {
          externalApi.on('videoConferenceLeft', handleHangUp);
        }}
      />
    </div>
  );
};

export default VideoCall;