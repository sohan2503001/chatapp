// client/src/hooks/useGetMessages.ts
import { useEffect, useState } from "react";
import useConversation from "../store/useConversation";
import useAuthStore from "../store/useAuthStore";
import { isAxiosError } from 'axios';
import api from '../api/api';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { selectedConversation } = useConversation();
  const { token } = useAuthStore();

  useEffect(() => {
  const getMessages = async () => {
    // 1. Clear messages when conversation changes
    setMessages([]); 
    if (!selectedConversation) return;
    setLoading(true);
    try {
      // 2. Use the 'api' instance (no headers needed)
      const res = await api.get(`/messages/${selectedConversation._id}`);
      
      setMessages(res.data);
    } catch (error) {
      // 3. Use isAxiosError for better error handling
      if (isAxiosError(error) && error.response) {
        console.error("Error fetching messages:", error.response.data.message);
      } else {
        console.error("Error fetching messages:", (error as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  getMessages();
}, [selectedConversation, token, setMessages]);

  return { messages, loading, setMessages };
};

export default useGetMessages;