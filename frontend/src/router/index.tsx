import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthPage } from '../pages/AuthPage';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductListPage } from '../pages/ProductListPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        )
      },
      { path: 'auth', element: <AuthPage /> }
    ]
  }
]);
