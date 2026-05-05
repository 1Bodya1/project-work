import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, X, Loader2 } from 'lucide-react';

type PaymentStatus = 'idle' | 'pending' | 'success' | 'failed';

export default function Checkout() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('monobank');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [orderId, setOrderId] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    warehouse: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cartItems = [
    {
      id: '1',
      name: 'Classic White T-Shirt',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
      customImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      size: 'M',
      color: 'White',
      quantity: 2,
      price: 399,
    },
    {
      id: '2',
      name: 'Premium Black Hoodie',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop',
      customImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
      size: 'L',
      color: 'Black',
      quantity: 1,
      price: 899,
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.warehouse) newErrors.warehouse = 'Warehouse is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process payment
    setPaymentStatus('pending');

    // Simulate payment processing
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      if (success) {
        setPaymentStatus('success');
        setOrderId(`ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
      } else {
        setPaymentStatus('failed');
      }
    }, 3000);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl mb-4">Payment Successful!</h1>
          <p className="text-xl text-[#1A1A1A] mb-2">
            Your order has been placed successfully
          </p>
          <p className="text-[#1A1A1A] mb-8">
            Order number: <span className="font-medium">{orderId}</span>
          </p>

          <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8 text-left">
            <h3 className="mb-4">What's next?</h3>
            <ul className="space-y-3 text-[#1A1A1A]">
              <li className="flex gap-3">
                <span className="text-[#7A1F2A]">1.</span>
                <span>We'll send you an email confirmation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7A1F2A]">2.</span>
                <span>Your custom design will be printed (3-5 business days)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7A1F2A]">3.</span>
                <span>Your order will be shipped via Nova Poshta</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7A1F2A]">4.</span>
                <span>Track your delivery in your profile</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
            >
              View Order
            </button>
            <button
              onClick={() => navigate('/catalog')}
              className="px-8 py-4 border border-black rounded hover:bg-black hover:text-white transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl mb-4">Payment Failed</h1>
          <p className="text-xl text-[#1A1A1A] mb-8">
            We couldn't process your payment. Please try again or use a different payment method.
          </p>

          <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8 text-left">
            <h3 className="mb-4">Common reasons for payment failure:</h3>
            <ul className="space-y-2 text-[#1A1A1A] text-sm">
              <li>• Insufficient funds</li>
              <li>• Incorrect card details</li>
              <li>• Card expired</li>
              <li>• Transaction limit exceeded</li>
              <li>• Bank declined the transaction</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setPaymentStatus('idle')}
              className="px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="px-8 py-4 border border-black rounded hover:bg-black hover:text-white transition-colors"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-12 h-12 text-[#7A1F2A] animate-spin" />
          </div>
          <h1 className="text-4xl mb-4">Processing Payment...</h1>
          <p className="text-xl text-[#1A1A1A] mb-8">
            Please wait while we process your payment via {paymentMethod === 'monobank' ? 'Monobank' : 'LiqPay'}
          </p>
          <p className="text-sm text-[#1A1A1A]">
            Do not close or refresh this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h3 className="mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.firstName ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.lastName ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.phone ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="+380"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.email ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h3 className="mb-4">Nova Poshta Delivery</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.city ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="Kyiv"
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Warehouse / Branch</label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.warehouse ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                  >
                    <option value="">Select warehouse</option>
                    <option value="branch1">Branch #1: Khreshchatyk St.</option>
                    <option value="branch2">Branch #2: Shevchenko Blvd.</option>
                    <option value="branch3">Branch #3: Peremohy Ave.</option>
                  </select>
                  {errors.warehouse && (
                    <p className="text-red-600 text-sm mt-1">{errors.warehouse}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h3 className="mb-4">Payment Method</h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-colors ${
                  paymentMethod === 'monobank' ? 'border-[#7A1F2A] bg-[#7A1F2A]/5' : 'border-black/10 hover:bg-[#F5F5F5]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="monobank"
                    checked={paymentMethod === 'monobank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Monobank</span>
                </label>
                <label className={`flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-colors ${
                  paymentMethod === 'liqpay' ? 'border-[#7A1F2A] bg-[#7A1F2A]/5' : 'border-black/10 hover:bg-[#F5F5F5]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="liqpay"
                    checked={paymentMethod === 'liqpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>LiqPay</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white border border-black/10 rounded-lg p-6 sticky top-24">
              <h3 className="mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="pb-3 border-b border-black/10 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded relative overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.customImage && (
                          <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-2">
                            <img
                              src={item.customImage}
                              alt="Custom"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">{item.name}</p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.size} • {item.color} • x{item.quantity}
                        </p>
                        <p className="text-xs text-green-600">Custom design</p>
                      </div>
                      <p className="text-sm">₴{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-[#1A1A1A]">
                  <span>Subtotal</span>
                  <span>₴{subtotal}</span>
                </div>
                <div className="flex justify-between text-[#1A1A1A]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₴${shipping}`}</span>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <div className="flex justify-between text-xl">
                  <span>Total</span>
                  <span>₴{total}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Pay and place order
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
