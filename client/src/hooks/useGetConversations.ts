// client/src/hooks/useGetConversations.ts
import { useEffect, useState } from "react";
import api from "../api/api";
import { isAxiosError } from "axios";
import type { Conversation } from "../types/Conversation"; // Import our new type

const useGetConversations = () => {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const getConversations = async () => {
      setLoading(true);
      try {
        const res = await api.get('/conversations'); // Fetch from the new endpoint
        setConversations(res.data as Conversation[]);
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          console.error("Error getting conversations:", error.response.data.message);
        } else {
          console.error("Error getting conversations:", (error as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, []); // Runs once on mount

  return { conversations, loading, setConversations };
};

export default useGetConversations;