import { Link, NavLink } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

export const Navbar = () => {
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector((state) => state.cart.items.length);
  const { token, user } = useAppSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-brand-700">
          ShopLite
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
            }
          >
            Products
          </NavLink>
          {token && (
            <NavLink
              to="/wishlist"
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
              }
            >
              Wishlist
            </NavLink>
          )}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
            }
          >
            Cart ({cartCount})
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
              }
            >
              Admin
            </NavLink>
          )}
          {token ? (
            <button className="text-sm font-semibold text-slate-700" onClick={() => dispatch(logout())}>
              Logout{user?.name ? ` (${user.name})` : ''}
            </button>
          ) : (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'}`
              }
            >
              Login/Register
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};
