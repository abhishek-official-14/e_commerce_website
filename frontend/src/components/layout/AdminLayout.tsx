import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' }
];

export const AdminLayout = () => {
  return (
    <section className="container-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </section>
  );
};
