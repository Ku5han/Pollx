import React, { useState, useEffect } from "react";
import { User, Trash2, Ban, Clock } from "lucide-react";
import axios from "axios";

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDuration, setBanDuration] = useState(1); // Default 1 day

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/admin/users"
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Are you sure you want to delete this user and all their polls?")) return;

    try {
      // Delete user and their polls
      await axios.delete(`http://localhost:8000/api/v1/admin/users/${userId}`);
      setUsers(users.filter((user) => user._id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setBanModal(true);
  };

  const closeBanModal = () => {
    setBanModal(false);
    setSelectedUser(null);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      await axios.post(`http://localhost:8000/api/v1/admin/users/${selectedUser._id}/ban`, {
        duration: banDuration // Duration in days
      });
      
      // Update the user's status in the local state
      const updatedUsers = users.map(user => {
        if (user._id === selectedUser._id) {
          return {
            ...user,
            isBanned: true,
            banExpiresAt: new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000).toISOString()
          };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      closeBanModal();
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  const isBanned = (user) => {
    return user.isBanned && new Date(user.banExpiresAt) > new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center">Loading users...</div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isBanned(user) ? (
                      <span className="px-2 py-1 bg-red-900 text-red-200 rounded">
                        Banned until {new Date(user.banExpiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-900 text-green-200 rounded">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openBanModal(user)}
                        className="p-2 text-yellow-500 hover:bg-gray-700 rounded"
                        title="Ban User"
                      >
                        <Ban size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-500 hover:bg-gray-700 rounded"
                        title="Delete User"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Ban User</h3>
            <p className="mb-4">
              Ban {selectedUser?.username} for how many days?
            </p>
            <div className="flex items-center mb-4">
              <Clock className="mr-2" size={20} />
              <input
                type="number"
                min="1"
                value={banDuration}
                onChange={(e) => setBanDuration(parseInt(e.target.value))}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeBanModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}