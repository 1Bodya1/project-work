import { Link } from 'react-router';
import { Instagram, Facebook, Twitter } from 'lucide-react';

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
                <Link to="/shipping" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#1A1A1A] hover:text-[#7A1F2A]">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 mt-8 pt-8 text-center text-sm text-[#1A1A1A]">
          <p>&copy; 2026 Solution. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
