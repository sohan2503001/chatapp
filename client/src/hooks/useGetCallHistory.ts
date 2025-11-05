// client/src/hooks/useGetCallHistory.ts
import { useEffect, useState } from "react";
import api from "../api/api";
import { isAxiosError } from "axios";
import type { CallHistory } from "../types/CallHistory"; // Import the new type
 // Import the new type

const useGetCallHistory = () => {
  const [loading, setLoading] = useState(false);
  const [callLogs, setCallLogs] = useState<CallHistory[]>([]);

  useEffect(() => {
    const getCallHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/callhistory');
        setCallLogs(res.data);
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          console.error("Error getting call history:", error.response.data.message);
        } else {
          console.error("Error getting call history:", (error as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    getCallHistory();
  }, []); // Runs once on mount

  return { callLogs, loading };
};

export default useGetCallHistory;