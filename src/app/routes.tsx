import { createBrowserRouter } from 'react-router';
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Customizer from './pages/Customizer';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import About from './pages/About';
import PaymentPending from './pages/PaymentPending';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminSupportTickets from './pages/admin/SupportTickets';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'catalog', Component: Catalog },
      { path: 'product/:id', Component: ProductDetails },
      { path: 'customize/:id', Component: Customizer },
      { path: 'cart', Component: Cart },
      { path: 'support', Component: Support },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'about', Component: About },
      {
        Component: ProtectedRoute,
        children: [
          { path: 'checkout', Component: Checkout },
          { path: 'profile', Component: Profile },
          { path: 'orders', Component: Orders },
          { path: 'orders/:orderId', Component: OrderDetails },
          { path: 'payment/pending', Component: PaymentPending },
          { path: 'payment/success', Component: PaymentSuccess },
          { path: 'payment/failed', Component: PaymentFailed },
        ],
      },
    ],
  },
  {
    path: '/admin',
    Component: AdminRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: 'products', Component: AdminProducts },
          { path: 'orders', Component: AdminOrders },
          { path: 'support', Component: AdminSupportTickets },
        ],
      },
    ],
  },
]);
