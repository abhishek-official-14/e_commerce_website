import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSeo } from '../hooks/useSeo';
import type { Product } from '../types';

export const WishlistPage = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useSeo({ title: 'My Wishlist | ShopLite', description: 'Your saved products in ShopLite wishlist.' });

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/wishlist');
        setItems(data.data as Product[]);
      } finally {
        setLoading(false);
      }
    };

    void fetchWishlist();
  }, []);

  const removeItem = async (productId: string) => {
    const { data } = await api.delete(`/users/wishlist/${productId}`);
    setItems(data.data as Product[]);
  };

  if (loading) return <section className="container-page">Loading wishlist...</section>;

  return (
    <section className="container-page">
      <h2 className="mb-6 text-2xl font-bold">My Wishlist</h2>
      {items.length === 0 ? (
        <div className="card text-center">
          <p>No items in wishlist.</p>
          <Link className="btn-primary mt-4 inline-block" to="/products">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((product) => (
            <article key={product._id} className="card">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-slate-500">₹{product.price.toFixed(2)}</p>
              <div className="mt-4 flex gap-3">
                <Link to={`/products/${product._id}`} className="btn-secondary">
                  View
                </Link>
                <button className="btn-primary" onClick={() => void removeItem(product._id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
