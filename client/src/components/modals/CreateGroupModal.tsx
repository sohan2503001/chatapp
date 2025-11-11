// client/src/components/modals/CreateGroupModal.tsx
import { useState } from 'react';
import useGetUsers from '../../hooks/useGetUsers'; // We need this to list users
import api from '../../api/api';
import type { Conversation } from '../../types/Conversation';
import useAuthStore from '../../store/useAuthStore';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (newGroup: Conversation) => void;
}

const CreateGroupModal = ({ onClose, onGroupCreated }: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { users, loading: usersLoading } = useGetUsers(); // Fetch all users
  const { authUser } = useAuthStore();

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId) // Remove user
        : [...prev, userId] // Add user
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please enter a group name and select at least one member.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/conversations/create-group', {
        groupName: groupName,
        participants: selectedUsers,
      });

      onGroupCreated(res.data); // Pass the new group back to ChatPage
      onClose(); // Close the modal

    } catch (error) {
      console.error("Error creating group:", error);
      alert('Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  // Filter out the logged-in user from the list
  const otherUsers = users.filter(user => user._id !== authUser?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Group Name Input */}
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* User Selection List */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Members
            </label>
            <div className="mt-2 h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {usersLoading ? (
                <p>Loading users...</p>
              ) : (
                otherUsers.map((user) => (
                  <div key={user._id} className="flex items-center space-x-2 p-1">
                    <input
                      type="checkbox"
                      id={`user-${user._id}`}
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserToggle(user._id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`user-${user._id}`} className="text-gray-700">
                      {user.username}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;