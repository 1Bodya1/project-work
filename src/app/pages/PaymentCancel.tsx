import { useEffect } from 'react';
import { Link } from 'react-router';
import { X } from 'lucide-react';
import { useCart } from '../store/CartContext';

export default function PaymentCancel() {
  const { restorePendingPaymentCart } = useCart();

  useEffect(() => {
    restorePendingPaymentCart();
  }, []);

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-4xl mb-4">Payment Cancelled</h1>
        <p className="text-xl text-[#1A1A1A] mb-2">
          Your Monobank payment was not completed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/checkout"
            className="px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Back to checkout
          </Link>
          <Link
            to="/catalog"
            className="px-8 py-4 border border-black rounded hover:bg-black hover:text-white transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
