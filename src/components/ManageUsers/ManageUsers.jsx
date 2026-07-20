import { useState, useEffect } from 'react';
import { getAllUsers } from '../../mockData';

function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  const pending = users.filter(u => u.status === 'pending');
  const active = users.filter(u => u.status === 'active');
  const inactive = users.filter(u => u.status === 'inactive');

  const UserList = ({ users, emptyMessage }) => (
    <div className="space-y-2">
      {users.length === 0 ? (
        <p className="text-gray-400">{emptyMessage}</p>
      ) : (
        users.map(u => (
          <div key={u.id} className="bg-[#1a365d] border border-[#d4a574]/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{u.name}</p>
                <p className="text-gray-400 text-sm">{u.email}</p>
                <p className="text-gray-400 text-sm">{u.department}</p>
              </div>
              <span className={`px-3 py-1 rounded font-semibold text-sm ${
                u.status === 'active' ? 'bg-green-900 text-green-300' :
                u.status === 'pending' ? 'bg-blue-900 text-blue-300' :
                'bg-gray-900 text-gray-300'
              }`}>
                {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Manage Users</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Pending ({pending.length})</h2>
          <UserList users={pending} emptyMessage="No pending users" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Active ({active.length})</h2>
          <UserList users={active} emptyMessage="No active users" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Inactive ({inactive.length})</h2>
          <UserList users={inactive} emptyMessage="No inactive users" />
        </div>
      </div>
    </div>
  );
}

export default ManageUsers;
