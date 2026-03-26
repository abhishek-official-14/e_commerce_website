import { useEffect } from 'react';
import { ProductCard } from '../components/common/ProductCard';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts } from '../features/products/productSlice';

export const ProductListPage = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector((state) => state.products);

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <section className="container-page">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product List</h2>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};
