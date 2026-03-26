import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { addToCart } from '../features/cart/cartSlice';
import { fetchProductById } from '../features/products/productSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

export const ProductDetailPage = () => {
  const { productId = '' } = useParams();
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, error } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (productId) {
      void dispatch(fetchProductById(productId));
    }
  }, [dispatch, productId]);

  if (loading) return <section className="container-page">Loading product...</section>;
  if (error) return <section className="container-page text-red-500">{error}</section>;
  if (!selectedProduct) return <section className="container-page">Product not found.</section>;

  return (
    <section className="container-page">
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
          <p className="mt-4 text-2xl font-bold text-brand-700">${selectedProduct.price.toFixed(2)}</p>
          <button className="btn-primary mt-6" onClick={() => dispatch(addToCart(selectedProduct))}>
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
};
