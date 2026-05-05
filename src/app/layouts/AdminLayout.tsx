import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-black/10 min-h-screen sticky top-0 flex flex-col">
          <div className="p-6 border-b border-black/10">
            <Link to="/" className="text-2xl tracking-tight">
              Solution.
            </Link>
            <p className="text-sm text-[#1A1A1A] mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
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

          <div className="p-4 border-t border-black/10">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Exit Admin
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
