import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface DashboardStats {
  users: number;
  orders: number;
  revenue: number;
}

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data as DashboardStats);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!stats) return <p>No dashboard stats available.</p>;

  const cards = [
    { label: 'Users', value: stats.users },
    { label: 'Orders', value: stats.orders },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}` }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="card">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-brand-700">{card.value}</p>
        </article>
      ))}
    </div>
  );
};
