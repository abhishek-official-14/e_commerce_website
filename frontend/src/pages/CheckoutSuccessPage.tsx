import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Order } from '../types';

export const CheckoutSuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>((location.state as { order?: Order } | null)?.order ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order || !orderId) {
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);

      try {
        const { data } = await api.get('/orders/my-orders');
        const matchedOrder = (data.data as Order[]).find((entry) => entry._id === orderId) ?? null;
        setOrder(matchedOrder);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [order, orderId]);

  if (loading) {
    return <section className="container-page">Loading your order details...</section>;
  }

  if (!order) {
    return (
      <section className="container-page text-center">
        <h2 className="text-2xl font-bold">Order details not found</h2>
        <p className="mt-2 text-slate-500">We could not load this order right now.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="container-page">
      <div className="card mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Payment Successful</p>
        <h2 className="mt-2 text-2xl font-bold">Thanks! Your order is confirmed.</h2>
        <p className="mt-2 text-sm text-slate-500">Order ID: {order._id}</p>

        <div className="mt-6 space-y-3">
          {order.items.map((item) => (
            <div key={`${item.productId}-${item.name}`} className="flex justify-between text-sm">
              <p>
                {item.name} × {item.quantity}
              </p>
              <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">Delivery Address</p>
          <p className="mt-1">{order.address}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <div>
            <p className="text-sm text-slate-500">Total Paid</p>
            <p className="text-xl font-bold text-brand-700">₹{order.totalAmount.toFixed(2)}</p>
          </div>
          <Link to="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
};
