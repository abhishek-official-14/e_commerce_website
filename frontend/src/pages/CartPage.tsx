import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyCart, removeItemFromCartApi, updateCartItemApi } from '../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

export const CartPage = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.cart);

  useEffect(() => {
    void dispatch(fetchMyCart());
  }, [dispatch]);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);

  if (loading && items.length === 0) {
    return <section className="container-page">Loading cart...</section>;
  }

  if (items.length === 0) {
    return (
      <section className="container-page text-center">
        <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
        <p className="mt-2 text-slate-500">Add products to continue shopping.</p>
        <Link to="/products" className="btn-primary mt-5 inline-block">
          Browse Products
        </Link>
      </section>
    );
  }

  return (
    <section className="container-page">
      <h2 className="mb-6 text-2xl font-bold">Shopping Cart</h2>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.product._id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-sm text-slate-500">${item.product.price.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary"
                  onClick={() =>
                    void dispatch(updateCartItemApi({ productId: item.product._id, quantity: Math.max(1, item.quantity - 1) }))
                  }
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  className="btn-secondary"
                  onClick={() => void dispatch(updateCartItemApi({ productId: item.product._id, quantity: item.quantity + 1 }))}
                >
                  +
                </button>
              </div>

              <button
                className="text-sm font-semibold text-red-500"
                onClick={() => void dispatch(removeItemFromCartApi(item.product._id))}
              >
                Remove
              </button>
            </article>
          ))}
        </div>

        <aside className="card h-fit">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <p className="mt-2 text-sm text-slate-500">Subtotal</p>
          <p className="text-2xl font-bold text-brand-700">${total.toFixed(2)}</p>
          <button className="btn-primary mt-4 w-full" disabled>
            Checkout (Coming soon)
          </button>
        </aside>
      </div>
    </section>
  );
};
