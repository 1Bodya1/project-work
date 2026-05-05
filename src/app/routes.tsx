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
import OrderDetails from './pages/OrderDetails';
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
      { path: 'checkout', Component: Checkout },
      { path: 'profile', Component: Profile },
      { path: 'orders/:orderId', Component: OrderDetails },
      { path: 'support', Component: Support },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'about', Component: () => <div className="container mx-auto px-4 py-20 text-center"><h1 className="text-4xl mb-4">About Us</h1><p className="text-[#1A1A1A]">Learn more about Solution</p></div> },
    ],
  },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'products', Component: AdminProducts },
      { path: 'orders', Component: AdminOrders },
      { path: 'support', Component: AdminSupportTickets },
    ],
  },
]);
