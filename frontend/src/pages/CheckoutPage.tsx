import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { clearCart, fetchMyCart } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import type { Order } from '../types';

type PaymentStatus = 'idle' | 'processing' | 'failed';

interface RazorpayOrderPayload {
  orderId: string;
  razorpay: {
    key: string;
    amount: number;
    currency: string;
    orderId: string;
  };
}

interface VerifyPaymentPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const loadRazorpayScript = async (): Promise<boolean> => {
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.cart);

  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      void dispatch(fetchMyCart());
    }
  }, [dispatch, items.length]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);

  const createOrder = async () => {
    const { data } = await api.post('/orders', {
      address,
      currency: 'INR'
    });

    return data.data as RazorpayOrderPayload;
  };

  const verifyPayment = async (payload: VerifyPaymentPayload) => {
    const { data } = await api.post('/orders/verify-payment', payload);
    return data.data as Order;
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();

    if (address.trim().length < 5) {
      setAddressError('Please enter a valid address (minimum 5 characters).');
      return;
    }

    setAddressError(null);
    setPaymentError(null);
    setPaymentStatus('processing');

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Check your network and try again.');
      }

      const orderResponse = await createOrder();

      const options = {
        key: orderResponse.razorpay.key,
        amount: orderResponse.razorpay.amount,
        currency: orderResponse.razorpay.currency,
        name: 'E-Commerce Website',
        description: `Order #${orderResponse.orderId}`,
        order_id: orderResponse.razorpay.orderId,
        prefill: {},
        notes: {
          backendOrderId: orderResponse.orderId
        },
        handler: async (response: VerifyPaymentPayload) => {
          try {
            const paidOrder = await verifyPayment(response);
            dispatch(clearCart());
            navigate(`/checkout/success/${paidOrder._id}`, { state: { order: paidOrder } });
          } catch (error: any) {
            setPaymentStatus('failed');
            setPaymentError(error.response?.data?.message ?? 'Payment verification failed. Please retry.');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('failed');
            setPaymentError('Payment was cancelled before completion.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setPaymentStatus('failed');
      setPaymentError(error.response?.data?.message ?? error.message ?? 'Unable to start payment. Please retry.');
    }
  };

  if (loading && items.length === 0) {
    return <section className="container-page">Loading checkout...</section>;
  }

  if (items.length === 0) {
    return (
      <section className="container-page text-center">
        <h2 className="text-2xl font-bold">No items to checkout</h2>
        <p className="mt-2 text-slate-500">Please add products to cart before checkout.</p>
        <Link to="/products" className="btn-primary mt-5 inline-block">
          Browse Products
        </Link>
      </section>
    );
  }

  return (
    <section className="container-page">
      <h2 className="mb-6 text-2xl font-bold">Checkout</h2>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handlePlaceOrder} className="card space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Shipping Address</h3>
            <p className="mt-1 text-sm text-slate-500">Enter the full delivery address.</p>
          </div>

          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-medium">
              Address
            </label>
            <textarea
              id="address"
              className="input min-h-[130px]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House number, street, area, city, state, pincode"
            />
            {addressError && <p className="mt-2 text-sm text-red-500">{addressError}</p>}
          </div>

          {paymentError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{paymentError}</p>}

          <button className="btn-primary" type="submit" disabled={paymentStatus === 'processing'}>
            {paymentStatus === 'processing' ? 'Processing Payment...' : 'Pay with Razorpay'}
          </button>

          {paymentStatus === 'failed' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setPaymentStatus('idle');
                setPaymentError(null);
              }}
            >
              Retry Payment
            </button>
          )}
        </form>

        <aside className="card h-fit">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.product._id} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-brand-700">₹{subtotal.toFixed(2)}</p>
          </div>
        </aside>
      </div>
    </section>
  );
};
