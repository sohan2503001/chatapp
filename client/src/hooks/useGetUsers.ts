// client/src/hooks/useGetUsers.ts
import { useEffect, useState } from "react";
import api from "../api/api";
import { isAxiosError } from "axios";
import type { User } from "../types/User"; // --- 1. Import the new type ---

const useGetUsers = () => {
  const [loading, setLoading] = useState(false);
  // --- 2. Use the new User type for state ---
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users'); // Fetch all users
        
        // --- 3. Set state with the new Message type ---
        setUsers(res.data as User[]); 
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          console.error("Error getting users:", error.response.data.message);
        } else {
          console.error("Error getting users:", (error as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []); // Runs once on mount

  return { users, loading };
};

export default useGetUsers;