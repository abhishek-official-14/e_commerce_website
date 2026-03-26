import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute } from '../components/common/AdminRoute';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { AdminProductsPage } from '../pages/AdminProductsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AuthPage } from '../pages/AuthPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutSuccessPage } from '../pages/CheckoutSuccessPage';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductListPage } from '../pages/ProductListPage';
import { WishlistPage } from '../pages/WishlistPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      {
        path: 'wishlist',
        element: (
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'checkout/success/:orderId',
        element: (
          <ProtectedRoute>
            <CheckoutSuccessPage />
          </ProtectedRoute>
        )
      },
      { path: 'auth', element: <AuthPage /> }
    ]
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'users', element: <AdminUsersPage /> }
    ]
  }
]);
