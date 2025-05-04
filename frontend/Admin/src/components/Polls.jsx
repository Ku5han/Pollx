import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Save, X } from "lucide-react";
import axios from "axios";
export function Polls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPoll, setEditingPoll] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(
        "https://pollx-backend.onrender.com/api/v1/admin/polls"
      );
      // console.log(response.data);
      setPolls(response.data);
      console.log("data after  set ", polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (poll) => {
    setEditingPoll(poll._id);
    setEditQuestion(poll.question);
  };

  const handleSave = async (pollId) => {
    try {
      const response = await axios.put(
        `https://pollx-backend.onrender.com/api/v1/admin/polls/${pollId}`,
        {
          question: editQuestion,
        }
      );
      setPolls(
        polls.map((poll) => (poll._id === pollId ? response.data : poll))
      );
      setEditingPoll(null);
    } catch (error) {
      console.error("Error updating poll:", error);
    }
  };

  const handleDelete = async (pollId) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;

    try {
      await axios.delete(`https://pollx-backend.onrender.com/api/v1/admin/polls/${pollId}`);
      setPolls(polls.filter((poll) => poll._id !== pollId));
    } catch (error) {
      console.error("Error deleting poll:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center">Loading polls...</div>
    );
  }
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Polls Management</h2>
      <div className="space-y-4">
        {polls.map((poll) => (
          <div key={poll._id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              {editingPoll === poll._id ? (
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 p-3 rounded-lg mb-4"
                />
              ) : (
                <h3 className="text-xl font-semibold">{poll.question}</h3>
              )}
              <div className="flex space-x-2">
                {editingPoll === poll._id ? (
                  <>
                    <button
                      onClick={() => handleSave(poll._id)}
                      className="p-2 text-green-500 hover:bg-gray-700 rounded"
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={() => setEditingPoll(null)}
                      className="p-2 text-red-500 hover:bg-gray-700 rounded"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(poll)}
                      className="p-2 text-blue-500 hover:bg-gray-700 rounded"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(poll._id)}
                      className="p-2 text-red-500 hover:bg-gray-700 rounded"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-gray-300 mb-4">{poll.description}</p>
            <div className="grid grid-cols-2 gap-4">
              {poll.options.map((option, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg">
                  {option.optionText}
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Created: {new Date(poll.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
