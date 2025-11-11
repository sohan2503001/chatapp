// client/src/types/Conversation.ts

// This represents the user data we get back from .populate()
interface PopulatedUser {
  _id: string;
  username: string;
  profilePic: string; // Assuming 'profilePic' is in your User model
}

export interface Conversation {
  _id: string;
  participants: PopulatedUser[];
  messages: string[]; // It's just an array of IDs
  
  isGroupChat: boolean;
  groupName: string;
  groupAdmin: PopulatedUser;
  groupAvatar: string;
  
  createdAt: string;
  updatedAt: string;
}