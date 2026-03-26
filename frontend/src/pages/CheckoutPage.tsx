import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { clearCart, fetchMyCart } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useSeo } from '../hooks/useSeo';
import type { Address, Order } from '../types';

type PaymentStatus = 'idle' | 'processing' | 'failed';

interface RazorpayOrderPayload {
  orderId: string;
  pricing: {
    subtotalAmount: number;
    discountAmount: number;
    shippingCharges: number;
    totalAmount: number;
    couponCode?: string;
  };
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
  if (window.Razorpay) return true;

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

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [pricing, setPricing] = useState<RazorpayOrderPayload['pricing'] | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useSeo({ title: 'Checkout | ShopLite', description: 'Secure checkout with coupons, shipping charges, and Razorpay.' });

  useEffect(() => {
    if (items.length === 0) {
      void dispatch(fetchMyCart());
    }
  }, [dispatch, items.length]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await api.get('/users/me');
      const profileAddresses = (data.data.addresses ?? []) as Address[];
      setAddresses(profileAddresses);
      const defaultAddress = profileAddresses.find((entry) => entry.isDefault) ?? profileAddresses[0];
      if (defaultAddress?._id) {
        setSelectedAddressId(defaultAddress._id);
      }
    };

    void fetchProfile();
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);

  const createOrder = async () => {
    const payload: Record<string, string> = { currency: 'INR', couponCode };
    if (selectedAddressId) {
      payload.addressId = selectedAddressId;
    } else {
      payload.address = address;
    }

    const { data } = await api.post('/orders', payload);
    return data.data as RazorpayOrderPayload;
  };

  const verifyPayment = async (payload: VerifyPaymentPayload) => {
    const { data } = await api.post('/orders/verify-payment', payload);
    return data.data as Order;
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedAddressId && address.trim().length < 5) {
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
      setPricing(orderResponse.pricing);

      const razorpay = new window.Razorpay({
        key: orderResponse.razorpay.key,
        amount: orderResponse.razorpay.amount,
        currency: orderResponse.razorpay.currency,
        name: 'E-Commerce Website',
        description: `Order #${orderResponse.orderId}`,
        order_id: orderResponse.razorpay.orderId,
        notes: { backendOrderId: orderResponse.orderId },
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
      });

      razorpay.open();
    } catch (error: any) {
      setPaymentStatus('failed');
      setPaymentError(error.response?.data?.message ?? error.message ?? 'Unable to start payment. Please retry.');
    }
  };

  if (loading && items.length === 0) return <section className="container-page">Loading checkout...</section>;

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

  const shipping = pricing?.shippingCharges ?? (subtotal >= 1000 ? 0 : subtotal >= 500 ? 40 : 80);
  const discount = pricing?.discountAmount ?? 0;
  const total = pricing?.totalAmount ?? subtotal - discount + shipping;

  return (
    <section className="container-page">
      <h2 className="mb-6 text-2xl font-bold">Checkout</h2>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handlePlaceOrder} className="card space-y-4">
          <h3 className="text-lg font-semibold">Shipping Address</h3>

          {addresses.length > 0 && (
            <select className="input" value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
              {addresses.map((entry) => (
                <option key={entry._id} value={entry._id}>
                  {entry.label} - {entry.line1}, {entry.city}
                </option>
              ))}
              <option value="">Use one-time address</option>
            </select>
          )}

          {!selectedAddressId && (
            <textarea
              id="address"
              className="input min-h-[120px]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House number, street, area, city, state, pincode"
            />
          )}

          <input
            className="input"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon code (optional)"
          />

          {addressError && <p className="text-sm text-red-500">{addressError}</p>}
          {paymentError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{paymentError}</p>}

          <button className="btn-primary" type="submit" disabled={paymentStatus === 'processing'}>
            {paymentStatus === 'processing' ? 'Processing Payment...' : 'Pay with Razorpay'}
          </button>
        </form>

        <aside className="card h-fit">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <p className="mt-4 text-sm text-slate-500">Subtotal: ₹{subtotal.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-500">Discount: -₹{discount.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-500">Shipping: ₹{shipping.toFixed(2)}</p>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-brand-700">₹{total.toFixed(2)}</p>
          </div>
        </aside>
      </div>
    </section>
  );
};
