import { Link, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl mb-4">Payment Successful</h1>
        <p className="text-xl text-[#1A1A1A] mb-2">
          Your payment has been confirmed.
        </p>
        <p className="text-[#1A1A1A] mb-2">
          Order number: <span className="font-medium">{orderId || 'Not available'}</span>
        </p>
        <p className="text-[#1A1A1A] mb-8">
          Payment status: <span className="text-green-700">paid</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            View orders
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
