import { create } from 'zustand';

// Define the CallData type (from useCallListener)
// (We assume this is the type, you can adjust if needed)
export interface CallData {
  callerId: string;
  callerName: string;
  receiverId: string;
  status: 'ringing' | 'accepted' | 'declined';
  createdAt: any; // Firebase Timestamp
  roomName: string;
  docId: string; // Add this, it's useful
}

// Define the CallDetails for an active call
export interface CallDetails {
  initiator: string;
  receiver: string;
  callType: 'video' | 'audio';
  startTime: Date;
  isInitiator: boolean;
  roomName: string;
  callerName: string;
}

// Define the complete state
interface CallState {
  // For incoming call popups
  isReceivingCall: boolean;
  callData: CallData | null; // Renamed from incomingCallData for clarity
  setCallData: (callData: CallData | null) => void;

  // For the active call screen
  callInProgress: boolean;
  setCallInProgress: (status: boolean) => void;
  
  // For logging and managing the call
  callDetails: CallDetails | null;
  setCallDetails: (details: CallDetails | null) => void;
}

// Create the store
const useCallStore = create<CallState>((set) => ({
  // Default values for incoming calls
  isReceivingCall: false,
  callData: null,
  setCallData: (callData) => {
    set({
      isReceivingCall: !!callData, // Becomes true if callData is not null
      callData: callData,
    });
  },

  // Default values for active call
  callInProgress: false,
  setCallInProgress: (status) => set({ callInProgress: status }),

  // --- YOU WERE MISSING THESE ---
  // Default values for call details
  callDetails: null,
  setCallDetails: (details) => set({ callDetails: details }),
}));

export default useCallStore;