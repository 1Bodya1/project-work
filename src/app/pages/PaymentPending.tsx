import { Link, useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '../services/paymentService';
import type { PaymentProvider } from '../services/paymentService';

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const provider = (searchParams.get('provider') || 'mock') as PaymentProvider;

  async function handleSimulateSuccess() {
    if (orderId) {
      await paymentService.updatePaymentStatus(orderId, 'paid');
    }

    navigate(`/payment/success?orderId=${orderId}`);
  }

  async function handleSimulateFailure() {
    if (orderId) {
      await paymentService.updatePaymentStatus(orderId, 'failed');
    }

    toast.error('Payment failed');
    navigate(`/payment/failed?orderId=${orderId}&provider=${provider}`);
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-12 h-12 text-[#7A1F2A] animate-spin" />
        </div>
        <h1 className="text-4xl mb-4">Payment Pending</h1>
        <p className="text-xl text-[#1A1A1A] mb-2">
          Your payment is waiting for confirmation.
        </p>
        <p className="text-[#1A1A1A] mb-8">
          Order number: <span className="font-medium">{orderId || 'Not available'}</span>
        </p>

        <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8 text-left">
          <h3 className="mb-3">Mock payment mode</h3>
          <p className="text-sm text-[#1A1A1A]">
            Backend payment integration is not connected yet. Use the controls below to simulate the
            payment result for the MVP.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={handleSimulateSuccess}
            className="px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Simulate success
          </button>
          <button
            type="button"
            onClick={handleSimulateFailure}
            className="px-8 py-4 border border-black rounded hover:bg-black hover:text-white transition-colors"
          >
            Simulate failure
          </button>
        </div>

        <Link to="/orders" className="inline-block mt-6 text-sm text-[#7A1F2A] hover:underline">
          View orders
        </Link>
      </div>
    </div>
  );
}
