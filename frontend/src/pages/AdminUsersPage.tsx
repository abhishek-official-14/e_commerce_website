import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AdminUser } from '../types';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data.data as AdminUser[]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleUserBlock = async (user: AdminUser) => {
    try {
      const { data } = await api.patch(`/users/${user._id}/block-status`, { isBlocked: !user.isBlocked });
      const updated = data.data as AdminUser;
      setUsers((prev) => prev.map((item) => (item._id === user._id ? updated : item)));
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update user status');
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500">{error}</p>}
      {users.map((user) => (
        <article key={user._id} className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              {user.name} {user.role === 'admin' && <span className="text-xs text-brand-700">(admin)</span>}
            </h3>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>

          {user.role !== 'admin' && (
            <button
              className={`btn-secondary ${user.isBlocked ? 'text-emerald-700' : 'text-red-600'}`}
              onClick={() => void toggleUserBlock(user)}
            >
              {user.isBlocked ? 'Unblock' : 'Block'}
            </button>
          )}
        </article>
      ))}
    </div>
  );
};
