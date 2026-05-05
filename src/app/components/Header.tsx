import { useState } from 'react';
import { Link } from 'react-router';
import { ShoppingCart, User, Menu, X, LogOut, Package } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would come from auth context
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="border-b border-black/10 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl tracking-tight">
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

          <div className="flex items-center gap-4">
            <Link to="/cart" className="hover:text-[#7A1F2A] transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-[#7A1F2A] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </Link>

            {isLoggedIn ? (
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
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F5] transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="w-4 h-4" />
                      Orders
                    </Link>
                    <button
                      onClick={() => {
                        setIsLoggedIn(false);
                        setIsProfileOpen(false);
                      }}
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:text-[#7A1F2A] transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden border-t border-black/10 py-4">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/catalog"
                className="hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Catalog
              </Link>
              <Link
                to="/about"
                className="hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/support"
                className="hover:text-[#7A1F2A] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              {!isLoggedIn && (
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
