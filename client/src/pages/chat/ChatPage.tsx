// client/src/pages/chat/ChatPage.tsx
import { useState, useEffect, type FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { isAxiosError } from 'axios';
import { collection, query, orderBy, onSnapshot, Timestamp, where, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

import useGetUsers from "../../hooks/useGetUsers";
import useGetConversations from "../../hooks/useGetConversations";
import type { Conversation } from '../../types/Conversation';
import useConversation from "../../store/useConversation";
import useAuthStore from '../../store/useAuthStore';
import useGetMessages from "../../hooks/useGetMessages";
import type { Message } from '../../types/Message'; // Import the Message type
import useListenOnlineStatus from '../../hooks/useListenOnlineStatus'; 
import useOnlineStore from '../../store/useOnlineStore'; 
import useCallListener from '../../hooks/useCallListener';
import useCallStore from '../../store/useCallStore'; // Import the call store
import IncomingCallModal from '../../components/modals/IncomingCallModal'; // Import the modal
import VideoCall from '../../components/video/VideoCall'; // For video call UI
import NotificationBell from '../../components/notifications/NotificationBell'; //Import the NotificationBell component
import NotificationDropdown from '../../components/notifications/NotificationDropdown'; // Import the NotificationDropdown component
import useNotificationListener from '../../hooks/useNotificationListener'; // Import the hook to listen for notifications
import MediaViewerModal from '../../components/modals/MediaViewerModal';
import useTypingStore from '../../store/useTypingStore';       // Import typing store
import useTypingListener from '../../hooks/useTypingListener'; // Import typing listener
import CreateGroupModal from '../../components/modals/CreateGroupModal';
import { DefaultUserAvatar, DefaultGroupAvatar } from '../../components/sidebar/DefaultAvatar';
import type { User } from '../../types/User'; // Import the User type

// This is the type we get from Firebase
interface FirebaseMessage {
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageType: 'text' | 'image' | 'video' | 'audio';
  content: string;
  url: string;
  thumbnailUrl: string;
  createdAt: Timestamp; // Firebase uses a specific Timestamp object
  firebaseDocId?: string;
  isSeen?: boolean;
}

const ChatPage = () => {
  const navigate = useNavigate();

  const { users, loading: usersLoading } = useGetUsers();
  const { conversations, loading: conversationsLoading, setConversations } = useGetConversations();

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { authUser, setToken, setAuthUser } = useAuthStore();
  const { onlineUsers } = useOnlineStore(); // To access online users
  useListenOnlineStatus(); // Start listening to online status changes
  useCallListener(); // Start listening for incoming calls
  useNotificationListener(); // Start listening for notifications
  useTypingListener(); // Start listening for typing indicators
  const { isReceivingCall, callInProgress, setCallInProgress, setCallDetails} = useCallStore(); // Get the state to check if receiving a call
  const { isOpponentTyping } = useTypingStore(); // Get typing state

  // This loads the history from MongoDB
  const { messages, loading: messagesLoading, setMessages } = useGetMessages();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // Add sending state for messages
  const [isUploading, setIsUploading] = useState(false); // Add uploading state for file uploads
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input element
  const [viewingMedia, setViewingMedia] = useState<{ url: string, type: string } | null>(null); // State for media viewer
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for typing timeout

  // Function to update typing status in Firestore
  const updateTypingStatus = async (isTyping: boolean) => {
    if (!selectedConversation || !authUser) return;
    const typingDocRef = doc(db, 'typingStatus', selectedConversation._id);
    if (isTyping) {
      try {
        await setDoc(typingDocRef, { senderId: authUser._id });
      } catch (error) { console.error("Error setting typing status:", error); }
    } else {
      try {
        await deleteDoc(typingDocRef);
      } catch (error) { console.error("Error deleting typing status:", error); }
    }
  };

  // --- START: SEEN INDICATOR CODE ---
  // Function to mark a message as seen
  const markMessageAsSeen = async (message: Message) => {
    if (!message.firebaseDocId || message.isSeen) return;
    try {
      const messageDocRef = doc(db, "messages", message.firebaseDocId);
      await updateDoc(messageDocRef, { isSeen: true });
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  };

  // Handle input change for typing indicator
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingStatus(true);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };
  
  // This hook listens for NEW real-time messages
  useEffect(() => {
    if (!selectedConversation || !authUser) return;
    const listenerStartTime = new Date();

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      where("createdAt", ">", listenerStartTime)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMsgs: Message[] = [];
      const updatedMsgs: Message[] = [];

      querySnapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as FirebaseMessage;

        // Check if the message's conversationId matches the selected conversation
        if (data.conversationId !== selectedConversation._id) {
          return; // Ignore messages not for this chat
        }

        // --- Now we construct the message ---
        const msg: Message = {
          _id: change.doc.id,
          firebaseDocId: change.doc.id,
          conversationId: data.conversationId, // Add this
          senderId: data.senderId,
          // receiverId: data.receiverId, // This might be undefined, that's fine
          messageType: data.messageType,
          content: data.content,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          isSeen: data.isSeen || false,
          createdAt: data.createdAt.toDate().toISOString(),
        };
        
        // --- THIS IS THE NEW LOGIC ---
        if (change.type === "added") {
          newMsgs.push(msg);
          // If this new message is from the other person, mark it as seen
          if (msg.senderId === selectedConversation._id) {
            markMessageAsSeen(msg);
          }
        }
        
        if (change.type === "modified") {
          updatedMsgs.push(msg);
        }
        // --- END OF NEW LOGIC ---
      });

      if (newMsgs.length > 0) {
        // We must check for duplicates before adding.
        setMessages((prevMessages) => {
          // Create a Set of existing message IDs for quick lookup
          const existingIds = new Set(prevMessages.map(msg => msg._id));
          
          // Filter out any new messages that are already in our state
          const uniqueNewMsgs = newMsgs.filter(msg => !existingIds.has(msg._id));

          // If there are any truly new messages, add them
          if (uniqueNewMsgs.length > 0) {
            return [...prevMessages, ...uniqueNewMsgs];
          } else {
            // Otherwise, return the old state to prevent a re-render
            return prevMessages;
          }
        });
        // --- END OF FIX ---
      }
      
      // Handle updated messages
      if (updatedMsgs.length > 0) {
        setMessages((prevMessages) => {
          const updates = new Map(updatedMsgs.map(m => [m._id, m]));
          return prevMessages.map(msg => 
            updates.has(msg._id) ? updates.get(msg._id)! : msg
          );
        });
      }

    });

    return () => unsubscribe();
    
  }, [selectedConversation, authUser, setMessages]);

  // Helper to get the other participant in a one-on-one chat
  const getOtherParticipant = (conversation: Conversation) => {
    if (!authUser || conversation.isGroupChat) {
      return null;
    }
    const validParticipants = conversation.participants.filter(p => p);
    return validParticipants.find(p => p._id !== authUser._id);
  };

  // --- 5. NEW: Click handler for 1-on-1 chats ---
  // This will find or create the chat, then select it.
  const handleSelectChat = async (user: User) => {
    // First, check if a 1-on-1 conversation with this user already exists
    const existingChat = conversations.find(c => 
      !c.isGroupChat && c.participants.some(p => p && p._id === user._id)
    );

    if (existingChat) {
      setSelectedConversation(existingChat);
      return;
    }

    // If it doesn't exist, create it via the API
    try {
      const res = await api.post('/conversations/find-or-create', { 
        receiverId: user._id 
      });
      const newConversation: Conversation = res.data;
      
      // Add this new chat to our list and select it
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      
    } catch (error) {
      console.error("Error finding or creating chat:", error);
      alert("Could not start chat.");
    }
  };

  // --- 6. Update video call, log call, and delete group logic to use getOtherParticipant ---
  const logCall = async (status: 'declined' | 'completed' | 'missed', startTime: Date, endTime: Date) => {
    if (!selectedConversation || !authUser) return;
    
    // Get the correct receiver ID
    const otherUser = getOtherParticipant(selectedConversation);
    const receiverId = otherUser ? otherUser._id : null;
    if (!receiverId) return; // Can't log a call for a group

    let duration = 0;
    if (status === 'completed') {
      duration = (endTime.getTime() - startTime.getTime()) / 1000;
    }

    try {
      await api.post('/callhistory/log', {
        initiator: authUser._id,
        receiver: receiverId, // Use the correct receiver ID
        callType: 'video',
        status: status,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
      });
    } catch (error) {
      console.error("Error logging call:", error);
    }
  };

  const handleVideoCall = async () => {
    if (!selectedConversation || !authUser || selectedConversation.isGroupChat) {
      return;
    }
    const otherUser = getOtherParticipant(selectedConversation);
    if (!otherUser) return;

    try {
      const roomName = Math.random().toString(36).substring(2, 15);
      const callDocRef = doc(db, 'calls', otherUser._id); // Call the receiver's ID
      const callStartTime = new Date();

      await setDoc(callDocRef, {
        callerId: authUser._id,
        callerName: authUser.username,
        receiverId: otherUser._id, // Set the receiver ID
        status: 'ringing',
        createdAt: Timestamp.now(),
        roomName: roomName,
      });
      
      const unsubscribe = onSnapshot(callDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const callData = docSnapshot.data();
          if (callData.status === 'accepted') {
            setCallDetails({
              initiator: authUser._id,
              receiver: otherUser._id, // Use otherUser._id
              callType: 'video',
              startTime: callStartTime,
              isInitiator: true,
              roomName: callData.roomName,
              callerName: authUser.username,
            });
            setCallInProgress(true);
            unsubscribe();
          }
        } else {
          logCall('missed', callStartTime, new Date());
          unsubscribe();
        }
      });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Call the backend to clear the httpOnly cookie
      await api.post('/auth/logout');
      
      // 2. Clear all local state
      setToken(null);
      setAuthUser(null);
      setSelectedConversation(null);
      
      // 3. Navigate to login (this is now handled by the store,
      //    but we can keep it for an immediate redirect)
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // --- UPDATE: This function is now correct ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Call the upload endpoint
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const { fileType, url, thumbnailUrl } = uploadRes.data;

      // 2. Send the message using the NEW format
      await api.post(
        `/messages/send/${selectedConversation._id}`,
        { 
          messageType: fileType,
          url: url,
          thumbnailUrl: thumbnailUrl || '', // Send thumbnail if it exists
          content: '' // No text content for files
        }
      );

    } catch (error) {
      if (isAxiosError(error) && error.response) {
        console.error("Error uploading file:", error.response.data.error);
      } else {
        console.error("Error uploading file:", (error as Error).message);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // --- UPDATE: This function now uses isSending state ---
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Also check if we are uploading
    if (newMessage.trim() === '' || !selectedConversation || isUploading || isSending) return;

    // Stop and clear any typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingStatus(false); // Stop typing immediately

    setIsSending(true); // Use the isSending state
    try {
      // Send the message using the NEW format
      await api.post(
        `/messages/send/${selectedConversation._id}`,
        { 
          messageType: 'text',
          content: newMessage // Send text in the 'content' field
        } 
      );
      
      setNewMessage('');
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        // Corrected logging to see the real error from the backend
        console.error("Error sending message:", error.response.data.error); 
      } else {
        console.error("Error sending message:", (error as Error).message);
      }
    } finally {
      setIsSending(false); // Unset the isSending state
    }
  };

  // --- NEW FUNCTION: Handle deleting a group ---
  const handleDeleteGroup = async () => {
    if (!selectedConversation || !selectedConversation.isGroupChat) return;

    // Ask for confirmation
    if (!window.confirm(`Are you sure you want to delete the group "${selectedConversation.groupName}"? This is permanent.`)) {
      return;
    }

    try {
      await api.delete(`/conversations/${selectedConversation._id}`);
      
      // Remove from the sidebar list
      setConversations((prev) => prev.filter((c) => c._id !== selectedConversation._id));
      
      // Close the chat window
      setSelectedConversation(null);

    } catch (error) {
      console.error("Error deleting group:", error);
      alert('Failed to delete group. Only the admin can do this.');
    }
  };

  // --- Split conversations into groups and 1-on-1s for rendering ---
  const groupChats = conversations.filter(c => c.isGroupChat);
  const oneOnOneChats = conversations.filter(c => !c.isGroupChat);
  
  // Filter out the authUser from the main user list
  const otherUsers = users.filter(u => u._id !== authUser?._id);

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Render the media viewer modal if viewingMedia is set */}
      {viewingMedia && (
        <MediaViewerModal
          mediaType={viewingMedia.type}
          url={viewingMedia.url}
          onClose={() => setViewingMedia(null)}
        />
      )}

      {/* Render the modal if a call is ringing */}
      {isReceivingCall && <IncomingCallModal />}

      {/* Show the Jitsi meeting if a call is in progress */}
      {callInProgress && <VideoCall />}

      {/* --- NEW CODE: Create Group Modal --- */}
      {isCreateGroupOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onGroupCreated={(newGroup) => {
            setConversations(prev => [newGroup, ...prev]);
            setSelectedConversation(newGroup);
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-1/4 bg-gray-800 text-white p-4 flex flex-col ${callInProgress || viewingMedia  ? 'blur-sm' : ''}`}>
        
        {/* Create a header for the sidebar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Users</h2>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="p-2 rounded-full hover:bg-gray-700"
              title="Create new group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A9.06 9.06 0 0 1 6 18.719m12 0a9.06 9.06 0 0 0-6-2.185m0 0a9.06 9.06 0 0 0-6 2.185m0 0A9.06 9.06 0 0 1 6 18.719m0 0A9.06 9.06 0 0 1 6 18.719M6 21a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21m0 0a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21m0 0a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21m0 0a9.06 9.06 0 0 0 6-2.185m0 0a9.06 9.06 0 0 0 6 2.185m0 0a9.06 9.06 0 0 1 6 2.185m0 0A9.06 9.06 0 0 1 6 21M6 21a9.06 9.06 0 0 0 6-2.185M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            </button>
            
            <button
              onClick={() => navigate('/call-history')}
              className="p-2 rounded-full hover:bg-gray-700"
              title="Call History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
            <div className="relative">
              <NotificationBell />
              <NotificationDropdown />
            </div>
            </div>
        </div>

        {/* --- UPDATE the user/conversation list --- */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversationsLoading || usersLoading ? (
            <p className="p-2">Loading...</p>
          ) : (
            <>
              {/* --- Group Chats List --- */}
              {groupChats.length > 0 && (
                <div className="pt-2">
                  <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase">Groups</h3>
                  <ul className="space-y-1">
                    {groupChats.map((convo) => {
                      const isSelected = selectedConversation?._id === convo._id;
                      return (
                        <li
                          key={convo._id}
                          onClick={() => setSelectedConversation(convo)}
                          className={`p-2 rounded-md cursor-pointer flex items-center space-x-3 ${isSelected ? "bg-gray-600" : "hover:bg-gray-700"}`}
                        >
                          <div className="relative">
                            <DefaultGroupAvatar />
                          </div>
                          <span className="font-medium">{convo.groupName}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* --- 1-on-1 Users List --- */}
              <div className="pt-4">
                <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase">Direct Messages</h3>
                <ul className="space-y-1">
                  {otherUsers.map((user) => {
                    // Check if a 1-on-1 chat is selected
                    const isSelected = selectedConversation?._id === oneOnOneChats.find(c => c.participants.some(p => p && p._id === user._id))?._id;
                    const isOnline = onlineUsers.includes(user._id);

                    return (
                      <li
                        key={user._id}
                        onClick={() => handleSelectChat(user)}
                        className={`p-2 rounded-md cursor-pointer flex items-center space-x-3 ${isSelected ? "bg-gray-600" : "hover:bg-gray-700"}`}
                      >
                        <div className="relative">
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <DefaultUserAvatar />
                          )}
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                          )}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>

        <button onClick={handleLogout} className="w-full mt-6 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex flex-col flex-1 ${callInProgress || viewingMedia ? 'blur-sm' : ''}`}>
        {selectedConversation ? (
          <>
            {/* --- HEADER with video call button--- */}
            <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {selectedConversation.isGroupChat 
                  ? selectedConversation.groupName 
                  : getOtherParticipant(selectedConversation)?.username
                }
              </h2>
            
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleVideoCall}
                  // --- 8. Disable video calls for groups (for now) ---
                  disabled={selectedConversation.isGroupChat}
                  className="p-2 rounded-full hover:bg-gray-200 disabled:text-gray-300"
                  title={selectedConversation.isGroupChat ? "Video call not supported in groups" : "Start video call"}
                >

                  {/* A simple video camera icon using SVG */}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-6 h-6 text-gray-700"
                  >
                    <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-12Z" />
                    <path d="M18 7.5a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3ZM21.75 9a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 .75-.75Z" />
                  </svg>
                </button>

                {selectedConversation.isGroupChat && selectedConversation.groupAdmin._id === authUser?._id && (
                    <button
                      onClick={handleDeleteGroup}
                      className="p-2 rounded-full hover:bg-gray-200 text-red-500"
                      title="Delete Group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.576 0H3.398c-.621 0-1.175.055-1.7.158L2.036 6.165a2.25 2.25 0 0 0 .216 2.03m15.853-2.062a2.25 2.25 0 0 0 .216-2.03l-.38-1.018a1.875 1.875 0 0 0-1.7-.158H6.641a1.875 1.875 0 0 0-1.7.158l-.38 1.018a2.25 2.25 0 0 0 .216 2.03m15.853 0-1.018 3.869a2.25 2.25 0 0 1-2.14 1.761H7.141a2.25 2.25 0 0 1-2.14-1.761L4.084 5.79m15.853 0a48.108 48.108 0 0 0-3.478-.397m-12.576 0H3.398c-.621 0-1.175.055-1.7.158L2.036 6.165a2.25 2.25 0 0 0 .216 2.03m15.853-2.062a2.25 2.25 0 0 0 .216-2.03l-.38-1.018a1.875 1.875 0 0 0-1.7-.158H6.641a1.875 1.875 0 0 0-1.7.158l-.38 1.018a2.25 2.25 0 0 0 .216 2.03m15.853 0-1.018 3.869a2.25 2.25 0 0 1-2.14 1.761H7.141a2.25 2.25 0 0 1-2.14-1.761L4.084 5.79" />
                      </svg>
                    </button>
                  )}
                </div>
            </header>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {messagesLoading && <p className="text-center">Loading messages...</p>}
              
              {!messagesLoading && messages.length === 0 && (
                <p className="text-center text-gray-500">
                  Send a message to start the conversation!
                </p>
              )}

              {/* --- New Message Rendering Logic --- */}
              {!messagesLoading && messages.map((msg) => {
                const fromMe = msg.senderId === authUser?._id;

                // Helper function to decide what to render
                const renderMessageContent = () => {
                  switch (msg.messageType) {
                    case 'image':
                      return (
                        // Add onClick to set the modal state
                        <img 
                          src={msg.thumbnailUrl || msg.url}
                          alt="Uploaded content" 
                          className="max-w-[250px] rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => setViewingMedia({ url: msg.url, type: 'image' })}
                        />
                      );
                    case 'video':
                      return (
                        // Add an overlay/icon and onClick to open the modal
                        <div 
                          className="relative max-w-[250px] cursor-pointer"
                          onClick={() => setViewingMedia({ url: msg.url, type: 'video' })}
                        >
                          <video 
                            src={msg.url + '#t=0.1'} // Show first frame
                            className="rounded-lg"
                            preload="metadata"
                          />
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      );
                    case 'audio':
                      return (
                        <audio controls src={msg.url}>
                          Your browser does not support the audio element.
                        </audio>
                      );
                    case 'text':
                    default:
                      return msg.content || (msg as any).message;
                  }
                };

                return (
                  <div key={msg._id} className={`flex mb-4 ${fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg inline-block ${fromMe ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-black'}`}>
                        {/* Render the correct content */}
                      {renderMessageContent()}
                    </div>

                    {/* --- ADD THIS BLOCK: For Seen Indicator --- */}
                    {fromMe && (
                      <div className="flex items-end pl-1 pb-1">
                        {msg.isSeen ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-400">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M8.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-1.5-1.5a.75.75 0 0 1 1.06-1.06L.75 13.893l7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}

                  </div>
                );

              })}

              {/* --- (Typing indicator is correct) ---*/}
              {isOpponentTyping && (
              <div className="mb-4 text-left">
                <div className="p-2 rounded-lg inline-block bg-gray-300 text-black">
                  <span className="italic">is typing...</span>
                </div>
              </div>
            )}

            </div>
            
            {/* --- UPDATE: Input Form now uses isSending --- */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex">
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSending} // Disable if uploading or sending
                  className="p-2 text-gray-500 rounded-full hover:bg-gray-200 disabled:opacity-50"
                  title="Send a file"
                >
                    {isUploading ? (
                      <div className="w-6 h-6 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.121 10.121a.75.75 0 0 0 1.06 1.061l10.121-10.121a.75.75 0 0 1 1.06 1.06l-10.12 10.121a2.25 2.25 0 0 1-3.182 0l-2.625-2.625a2.25 2.25 0 0 1 0-3.182l10.121-10.121a3.75 3.75 0 0 1 5.303 0l4.09 4.09a3.75 3.75 0 0 1 0 5.303l-4.09 4.09a.75.75 0 0 1-1.06-1.061l4.09-4.09a2.25 2.25 0 0 0 0-3.182l-4.09-4.09Z" clipRule="evenodd" />
      m          </svg>
                    )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,audio/*"
                />

                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  value={newMessage}
                  onChange={handleTypingChange}
                  disabled={isUploading || isSending} // Disable if uploading or sending
                />
                <button
                	type="submit"
                	className="px-6 py-2 text-white bg-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                  disabled={isUploading || isSending || newMessage.trim() === ''} // Disable
            	  >
              	  {isSending ? '...' : 'Send'}
            	  </button>
      	        </form>
    	      </div>
      	    </>
    	  ) : (
      	    <div className="flex items-center justify-center h-full">
      	      <p className="text-xl text-gray-500">Select a user to start chatting</p>
      	    </div>
    	  )}
  	  </main>
  	</div>
  );
};

export default ChatPage;