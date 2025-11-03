// client/src/hooks/useGetUsers.ts
import { useEffect, useState } from "react";
import api from '../api/api';
import { isAxiosError } from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
}

const useGetUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        // 1. Use the 'api' instance. No headers or token needed.
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (error) {
        // 2. Add improved error handling
        if (isAxiosError(error) && error.response) {
          console.error("Error fetching users:", error.response.data.message);
        } else {
          console.error("Error fetching users:", (error as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, [setUsers]); // 3. Add setUsers to the dependency array

  return { users, loading };
};

export default useGetUsers;