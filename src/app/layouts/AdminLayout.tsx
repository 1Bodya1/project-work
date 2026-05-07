import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Home, LayoutDashboard, LogOut, MessageSquare, Package, ShoppingCart } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/support', icon: MessageSquare, label: 'Support' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="flex flex-col lg:flex-row">
        <aside className="bg-white border-b lg:border-b-0 lg:border-r border-black/10 lg:w-64 lg:min-h-screen lg:sticky lg:top-0 flex flex-col">
          <div className="p-6 border-b border-black/10">
            <Link to="/" className="text-2xl tracking-tight">
              Solution.
            </Link>
            <p className="text-sm text-[#1A1A1A] mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 p-4 overflow-x-auto">
            <ul className="flex lg:block gap-2 lg:space-y-2 min-w-max lg:min-w-0">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded whitespace-nowrap transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#7A1F2A] text-white'
                        : 'text-[#1A1A1A] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-black/10 flex lg:block gap-2 overflow-x-auto">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors whitespace-nowrap"
            >
              <Home className="w-5 h-5" />
              Back to store
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors whitespace-nowrap w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
