// client/src/types/Message.ts
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  messageType: 'text' | 'image' | 'video' | 'audio';
  content: string; // For text
  url: string; // For media
  thumbnailUrl: string; // For media thumbnails
  createdAt: string;
  firebaseDocId: string;
  isSeen: boolean;
}