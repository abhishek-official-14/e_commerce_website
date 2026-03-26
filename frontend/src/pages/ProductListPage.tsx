import { ChangeEvent, useEffect } from 'react';
import { useSeo } from '../hooks/useSeo';
import { ProductCard } from '../components/common/ProductCard';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts, updateFilters } from '../features/products/productSlice';

export const ProductListPage = () => {
  useSeo({ title: 'Products | ShopLite', description: 'Browse products with filters, ratings and best prices.' });
  const dispatch = useAppDispatch();
  const { products, loading, error, filters, meta } = useAppSelector((state) => state.products);

  useEffect(() => {
    void dispatch(
      fetchProducts({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined
      })
    );
  }, [dispatch, filters]);

  const updateTextFilter = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(updateFilters({ page: 1, [event.target.name]: event.target.value }));
  };

  const updateNumberFilter = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    dispatch(updateFilters({ page: 1, [event.target.name]: Number.isNaN(nextValue) ? 0 : nextValue }));
  };

  return (
    <section className="container-page">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product List</h2>
      </div>

      <div className="card mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <input
          className="input"
          placeholder="Search products"
          name="search"
          value={filters.search}
          onChange={updateTextFilter}
        />
        <input
          className="input"
          placeholder="Category"
          name="category"
          value={filters.category}
          onChange={updateTextFilter}
        />
        <input
          className="input"
          type="number"
          placeholder="Min price"
          name="minPrice"
          value={filters.minPrice || ''}
          onChange={updateNumberFilter}
        />
        <input
          className="input"
          type="number"
          placeholder="Max price"
          name="maxPrice"
          value={filters.maxPrice || ''}
          onChange={updateNumberFilter}
        />
        <button
          className="btn-secondary"
          onClick={() => dispatch(updateFilters({ page: 1, search: '', category: '', minPrice: 0, maxPrice: 0 }))}
        >
          Reset Filters
        </button>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p className="mb-4 text-red-500">{error}</p>}

      {!loading && products.length === 0 && <p>No products found for selected filters.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {meta.page} of {meta.totalPages} ({meta.total} products)
        </p>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={meta.page <= 1 || loading}
            onClick={() => dispatch(updateFilters({ page: Math.max(1, meta.page - 1) }))}
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            disabled={meta.page >= meta.totalPages || loading}
            onClick={() => dispatch(updateFilters({ page: Math.min(meta.totalPages, meta.page + 1) }))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};
