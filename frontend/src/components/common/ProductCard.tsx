import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { addToCart } from '../../features/cart/cartSlice';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useAppDispatch();

  return (
    <article className="card flex h-full flex-col">
      <img
        src={product.images[0] ?? 'https://placehold.co/400x260?text=Product'}
        alt={product.name}
        className="h-44 w-full rounded-xl object-cover"
      />
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{product.description}</p>
        <p className="mt-3 text-lg font-bold text-brand-700">${product.price.toFixed(2)}</p>
        <div className="mt-4 flex items-center gap-2">
          <Link to={`/products/${product._id}`} className="btn-secondary">
            Details
          </Link>
          <button className="btn-primary" onClick={() => dispatch(addToCart(product))}>
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
};
