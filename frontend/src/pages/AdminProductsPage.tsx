import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Product } from '../types';

const initialForm = {
  name: '',
  price: 0,
  description: '',
  category: '',
  stock: 0,
  images: ''
};

export const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products', { params: { limit: 100 } });
      setProducts(data.data as Product[]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = {
      ...form,
      images: form.images
        .split(',')
        .map((img) => img.trim())
        .filter(Boolean)
    };

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      resetForm();
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save product');
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      stock: product.stock,
      images: product.images.join(', ')
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <form className="card grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input
          className="input"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
        <input
          className="input"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
        />
        <input
          className="input md:col-span-2"
          placeholder="Image URLs (comma separated)"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
        />
        <textarea
          className="input min-h-[100px] md:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="flex gap-2 md:col-span-2">
          <button className="btn-primary" type="submit">
            {editingId ? 'Update Product' : 'Create Product'}
          </button>
          {editingId && (
            <button className="btn-secondary" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <article key={product._id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-slate-500">
                  ${product.price.toFixed(2)} • Stock: {product.stock}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => startEdit(product)}>
                  Edit
                </button>
                <button className="btn-secondary text-red-600" onClick={() => void handleDelete(product._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
