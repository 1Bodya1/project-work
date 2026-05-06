import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCart } from '../store/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';

type PaymentMethod = 'monobank' | 'liqpay' | '';

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cartItems } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('monobank');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    warehouse: '',
    deliveryComment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (cartItems.length === 0) newErrors.cart = 'Your cart is empty';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await orderService.createOrder({
        total,
        items: cartItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.title,
          image: item.image || item.previewUrl || '',
          previewUrl: item.previewUrl,
          customImage: item.customImage,
          customDesignId: item.customDesignId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          hasCustomDesign: item.isCustomized,
        })),
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
        },
        delivery: {
          provider: 'Nova Poshta',
          city: formData.city,
          warehouse: formData.warehouse,
          comment: formData.deliveryComment,
        },
      });

      await paymentService.createPayment(order.id, paymentMethod);
      toast.success('Order created');
      navigate(`/payment/pending?orderId=${order.id}&provider=${paymentMethod}`);
    } catch {
      setErrors({ form: 'Unable to create order. Please try again.' });
      navigate('/payment/failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">Checkout</h1>
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-6">
          {errors.form}
        </div>
      )}

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
                  <label className="block mb-2">Warehouse / Branch / Parcel Locker</label>
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
                    <option value="parcel-locker1">Parcel locker #12: Central Mall</option>
                  </select>
                  {errors.warehouse && (
                    <p className="text-red-600 text-sm mt-1">{errors.warehouse}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Delivery Comment</label>
                  <textarea
                    value={formData.deliveryComment}
                    onChange={(e) => setFormData({ ...formData, deliveryComment: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="Optional comment for delivery"
                    rows={3}
                  />
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
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
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
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-4 h-4"
                  />
                  <span>LiqPay</span>
                </label>
                {errors.paymentMethod && (
                  <p className="text-red-600 text-sm mt-1">{errors.paymentMethod}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white border border-black/10 rounded-lg p-6 lg:sticky lg:top-24">
              <h3 className="mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="pb-3 border-b border-black/10 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded relative overflow-hidden">
                        <img
                          src={item.previewUrl || item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.customImage && item.previewUrl !== item.customImage && (
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
                        <p className="text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.size} • {item.color} • x{item.quantity}
                        </p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.isCustomized ? 'Custom design' : 'No customization'}
                        </p>
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
                disabled={isSubmitting}
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating order...' : 'Pay and place order'}
              </button>
              {errors.cart && (
                <p className="text-red-600 text-sm mt-3 text-center">{errors.cart}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
