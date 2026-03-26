import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { addItemToCartApi, addToCart } from '../features/cart/cartSlice';
import { fetchProductById } from '../features/products/productSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useSeo } from '../hooks/useSeo';

export const ProductDetailPage = () => {
  const { productId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, error } = useAppSelector((state) => state.products);
  const token = useAppSelector((state) => state.auth.token);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (productId) {
      void dispatch(fetchProductById(productId));
    }
  }, [dispatch, productId]);

  useSeo({
    title: selectedProduct ? `${selectedProduct.name} | ShopLite` : 'Product | ShopLite',
    description: selectedProduct?.description ?? 'Product details and customer reviews'
  });

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    if (token) {
      void dispatch(addItemToCartApi({ productId: selectedProduct._id, quantity: 1 }));
      return;
    }

    dispatch(addToCart(selectedProduct));
  };

  const handleWishlist = async () => {
    if (!selectedProduct) return;
    await api.post(`/users/wishlist/${selectedProduct._id}`);
  };

  const handleReviewSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) return;
    await api.post(`/products/${selectedProduct._id}/reviews`, { rating, comment });
    setComment('');
    await dispatch(fetchProductById(selectedProduct._id));
  };

  if (loading) return <section className="container-page">Loading product...</section>;
  if (error) return <section className="container-page text-red-500">{error}</section>;
  if (!selectedProduct) return <section className="container-page">Product not found.</section>;

  return (
    <section className="container-page space-y-6">
      <div className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <img
          src={selectedProduct.images[0] ?? 'https://placehold.co/500x360?text=Product'}
          alt={selectedProduct.name}
          className="h-80 w-full rounded-2xl object-cover"
        />

        <div>
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {selectedProduct.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold">{selectedProduct.name}</h1>
          <p className="mt-3 text-slate-600">{selectedProduct.description}</p>
          <p className="mt-2 text-sm text-amber-600">
            ⭐ {selectedProduct.averageRating?.toFixed(1) ?? '0.0'} ({selectedProduct.totalReviews ?? 0} reviews)
          </p>
          <p className="mt-4 text-2xl font-bold text-brand-700">${selectedProduct.price.toFixed(2)}</p>
          <div className="mt-6 flex gap-3">
            <button className="btn-primary" onClick={handleAddToCart}>
              Add to Cart
            </button>
            {token && (
              <button className="btn-secondary" onClick={() => void handleWishlist()}>
                Add to Wishlist
              </button>
            )}
          </div>
        </div>
      </div>

      {token && (
        <form onSubmit={handleReviewSubmit} className="card space-y-3">
          <h3 className="text-lg font-semibold">Write a Review</h3>
          <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} Star
              </option>
            ))}
          </select>
          <textarea
            className="input min-h-[110px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback"
            required
            minLength={5}
          />
          <button type="submit" className="btn-primary">
            Submit Review
          </button>
        </form>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        <div className="mt-4 space-y-3">
          {selectedProduct.reviews?.length ? (
            selectedProduct.reviews.map((review, index) => (
              <article key={`${review.user._id}-${index}`} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold">{review.user.name}</p>
                <p className="text-xs text-amber-600">{`⭐`.repeat(review.rating)}</p>
                <p className="text-sm text-slate-600">{review.comment}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No reviews yet. Be the first to review.</p>
          )}
        </div>
      </div>
    </section>
  );
};
