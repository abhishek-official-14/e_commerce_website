import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <section className="container-page">
      <div className="grid items-center gap-8 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white md:grid-cols-2 md:p-12">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-100">New Collection 2026</p>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">Discover Stylish Products for Everyday Life</h1>
          <p className="mt-4 text-brand-50">Shop curated products with fast checkout, responsive shopping experience, and secure access.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700">
              Browse Products
            </Link>
            <Link to="/auth" className="rounded-xl border border-brand-100 px-5 py-2.5 text-sm font-semibold text-white">
              Create Account
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-white/20 p-6 backdrop-blur-sm">
          <ul className="space-y-3 text-sm md:text-base">
            <li>✓ React + TypeScript architecture</li>
            <li>✓ Redux Toolkit state management</li>
            <li>✓ Axios API integration ready</li>
            <li>✓ Mobile-first responsive design</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
