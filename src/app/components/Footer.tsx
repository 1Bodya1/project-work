import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="bg-[#F5F5F5] border-t border-black/10 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl mb-4">Solution.</h3>
            <p className="text-sm text-[#1A1A1A]">
              Create clothing with your own design
            </p>
          </div>

          <div>
            <h4 className="mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalog" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=t-shirts" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=hoodies" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Hoodies
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=sweatshirts" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Sweatshirts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/support" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">MVP</h4>
            <p className="text-sm text-[#1A1A1A]">
              Catalog, customization, checkout, tracking, support, and admin tools.
            </p>
          </div>
        </div>

        <div className="border-t border-black/10 mt-8 pt-8 text-center text-sm text-[#1A1A1A]">
          <p>&copy; 2026 Solution. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
