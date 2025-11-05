// client/src/types/CallHistory.ts

// The backend populates initiator/receiver with just these fields
interface PopulatedUser {
  _id: string;
  username: string;
  profilePic: string; // Assuming 'profilePic' is in your User model
}

export interface CallHistory {
  _id: string;
  initiator: PopulatedUser;
  receiver: PopulatedUser;
  callType: 'video' | 'audio';
  status: 'completed' | 'missed' | 'declined';
  startTime: string; // This will be an ISO date string
  duration: number; // in seconds
  createdAt: string;
}