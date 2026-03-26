import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Order } from '../types';

const statuses: Order['status'][] = ['pending', 'paid', 'shipped', 'delivered', 'failed'];

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      setOrders(data.data as Order[]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((order) => (order._id === id ? { ...order, status } : order)));
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update order status');
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500">{error}</p>}
      {orders.map((order) => (
        <article key={order._id} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Order #{order._id.slice(-8)}</h3>
              <p className="text-sm text-slate-500">Total: ${order.totalAmount.toFixed(2)}</p>
            </div>
            <select className="input max-w-[180px]" value={order.status} onChange={(e) => void updateStatus(order._id, e.target.value as Order['status'])}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-600">{order.address}</p>
        </article>
      ))}
    </div>
  );
};
