import { useState } from 'react';
import { Link } from 'react-router';
import { ShoppingCart, User, Menu, X, LogOut, Package } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  async function handleLogout() {
    await logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  }

  return (
    <header className="border-b border-black/10 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl tracking-tight flex-shrink-0">
            Solution.
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="hover:text-[#7A1F2A] transition-colors">
              Home
            </Link>
            <Link to="/catalog" className="hover:text-[#7A1F2A] transition-colors">
              Catalog
            </Link>
            <Link to="/about" className="hover:text-[#7A1F2A] transition-colors">
              About
            </Link>
            <Link to="/support" className="hover:text-[#7A1F2A] transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/cart" className="hover:text-[#7A1F2A] transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-[#7A1F2A] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="hover:text-[#7A1F2A] transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-black/10 rounded-lg shadow-lg py-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F5] transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F5] transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="w-4 h-4" />
                      Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F5] transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F5] transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:block px-6 py-2.5 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Login
              </Link>
            )}

            <button
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setIsProfileOpen(false);
              }}
              className="md:hidden hover:text-[#7A1F2A] transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden absolute left-0 right-0 top-20 bg-white border-t border-b border-black/10 shadow-lg max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link
                to="/"
                className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/catalog"
                className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Catalog
              </Link>
              <Link
                to="/about"
                className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/support"
                className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile"
                    className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-2 py-3 rounded hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-2 py-3 rounded text-left hover:bg-[#F5F5F5] hover:text-[#7A1F2A] transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
