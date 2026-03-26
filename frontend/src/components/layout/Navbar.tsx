import { Link, NavLink } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/cart', label: 'Cart' },
  { to: '/auth', label: 'Login/Register' }
];

export const Navbar = () => {
  const cartCount = useAppSelector((state) => state.cart.items.length);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-brand-700">
          ShopLite
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
              }
            >
              {item.label}
              {item.to === '/cart' ? ` (${cartCount})` : ''}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
