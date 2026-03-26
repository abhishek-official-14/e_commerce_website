export const Footer = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} ShopLite. Built with React + TypeScript + Tailwind.
      </div>
    </footer>
  );
};
