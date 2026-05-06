import { Link, useSearchParams } from 'react-router';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const provider = searchParams.get('provider') || 'mock';
  const retryUrl = `/payment/pending?orderId=${orderId}&provider=${provider}`;

  function handleTryAgain() {
    toast.error('Payment failed');
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-4xl mb-4">Payment Failed</h1>
        <p className="text-xl text-[#1A1A1A] mb-8">
          We could not confirm your payment. Please try again or return to checkout and choose a
          different payment method.
        </p>

        <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8 text-left">
          <h3 className="mb-3">What happened?</h3>
          <p className="text-sm text-[#1A1A1A]">
            This is a mock payment failure state for the MVP. No real Monobank or LiqPay payment was
            processed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={retryUrl}
            onClick={handleTryAgain}
            className="px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Try again
          </Link>
          <Link
            to="/checkout"
            className="px-8 py-4 border border-black rounded hover:bg-black hover:text-white transition-colors"
          >
            Back to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
