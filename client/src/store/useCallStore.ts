import { create } from 'zustand';

interface CallData {
  callerId: string;
  callerName: string;
  receiverId: string;
  status: 'ringing' | 'accepted' | 'declined';
  createdAt: any; // Firebase Timestamp
  roomName: string;
}

interface CallState {
  isReceivingCall: boolean;
  incomingCallData: CallData | null;
  setIncomingCall: (callData: CallData | null) => void;

  // --- Add these new lines ---
  callInProgress: boolean;
  roomName: string | null;
  setCallInProgress: (status: boolean) => void;
  setRoomName: (name: string | null) => void;
}

const useCallStore = create<CallState>((set) => ({
  isReceivingCall: false,
  incomingCallData: null,
  setIncomingCall: (callData) => {
    set({
      isReceivingCall: !!callData,
      incomingCallData: callData,
    });
  },

  // --- Add these new lines ---
  callInProgress: false,
  roomName: null,
  setCallInProgress: (status) => set({ callInProgress: status }),
  setRoomName: (name) => set({ roomName: name }),
}));

export default useCallStore;