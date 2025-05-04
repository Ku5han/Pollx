import React, { useState } from 'react';
import { Users } from './components/Users';
import { Polls } from './components/Polls';
import { Users as UsersIcon, BarChart3, Menu } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>Admin Panel</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-700 rounded">
            <Menu size={24} />
          </button>
        </div>
        <nav className="p-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center w-full p-3 rounded mb-2 ${
              activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <UsersIcon size={24} />
            {isSidebarOpen && <span className="ml-3">Users</span>}
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={`flex items-center w-full p-3 rounded ${
              activeTab === 'polls' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <BarChart3 size={24} />
            {isSidebarOpen && <span className="ml-3">Polls</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {activeTab === 'users' && <Users />}
          {activeTab === 'polls' && <Polls />}
        </div>
      </div>
    </div>
  );
}

export default App;