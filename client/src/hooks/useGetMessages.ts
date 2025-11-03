// client/src/hooks/useGetMessages.ts
import { useEffect, useState } from "react";
import useConversation from "../store/useConversation";
import useAuthStore from "../store/useAuthStore";

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
      if (!selectedConversation) return;
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/messages/${selectedConversation._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, [selectedConversation, token]);

  return { messages, loading, setMessages };
};

export default useGetMessages;