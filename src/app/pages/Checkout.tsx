import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCart } from '../store/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';

type PaymentMethod = 'monobank' | 'liqpay' | '';

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cartItems, isLoading: isCartLoading, clearCart } = useCart();
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
  const [createdOrderId, setCreatedOrderId] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((currentData) => ({ ...currentData, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: '' }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setCreatedOrderId('');

    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.warehouse.trim()) newErrors.warehouse = 'Warehouse or branch is required';
    if (!paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (cartItems.length === 0) newErrors.cart = 'Your cart is empty';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await orderService.createOrder({
        orderNumber: `ORD-${Date.now()}`,
        subtotal,
        total,
        paymentMethod,
        paymentProvider: paymentMethod === 'liqpay' ? 'LiqPay' : 'Monobank',
        paymentStatus: 'paid',
        status: 'production',
        orderStatus: 'production',
        deliveryStatus: 'pending',
        trackingNumber: '',
        items: cartItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.title,
          image: item.image || item.previewUrl || '',
          previewUrl: item.previewUrl,
          customImage: item.customImage,
          customDesignId: item.customDesignId,
          customDesign: item.customDesign,
          customDesignPlacements: item.customDesignPlacements,
          usedPlacements: item.usedPlacements,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          isCustomized: item.isCustomized,
          hasCustomDesign: item.isCustomized,
        })),
        customer: {
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        delivery: {
          provider: 'Nova Poshta',
          city: formData.city.trim(),
          warehouse: formData.warehouse,
          comment: formData.deliveryComment.trim(),
        },
      });

      await paymentService.createPayment(order.id, paymentMethod);
      await paymentService.updatePaymentStatus(order.id, 'paid');
      await clearCart();
      setCreatedOrderId(order.id);
      toast.success('Order created and paid in mock mode');
      navigate(`/orders/${order.id}`);
    } catch {
      setErrors({ form: 'Unable to create order. Please try again.' });
      toast.error('Unable to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">Checkout</h1>
      {isCartLoading && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6 text-center text-[#1A1A1A]">
          Loading checkout...
        </div>
      )}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-6">
          {errors.form}
        </div>
      )}
      {createdOrderId && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-4 mb-6">
          Order {createdOrderId} has been created. Opening mock payment confirmation...
        </div>
      )}
      {!isCartLoading && cartItems.length === 0 && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl mb-1">Your cart is empty</h2>
            <p className="text-[#1A1A1A]">Add a product before placing an order.</p>
          </div>
          <Link
            to="/catalog"
            className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors text-center"
          >
            Go to catalog
          </Link>
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
                    onChange={(e) => updateField('firstName', e.target.value)}
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
                    onChange={(e) => updateField('lastName', e.target.value)}
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
                    onChange={(e) => updateField('phone', e.target.value)}
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
                    onChange={(e) => updateField('email', e.target.value)}
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
                    onChange={(e) => updateField('city', e.target.value)}
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
                    onChange={(e) => updateField('warehouse', e.target.value)}
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
                    onChange={(e) => updateField('deliveryComment', e.target.value)}
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
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setErrors((currentErrors) => ({ ...currentErrors, paymentMethod: '' }));
                    }}
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
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setErrors((currentErrors) => ({ ...currentErrors, paymentMethod: '' }));
                    }}
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
            <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24">
              <h3 className="mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="pb-3 border-b border-black/10 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden border border-black/5 flex-shrink-0">
                        {item.previewUrl || item.customImage || item.image ? (
                          <img
                            src={item.previewUrl || item.customImage || item.image}
                            alt={item.title}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#1A1A1A]">
                            No preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.size} • {item.color} • x{item.quantity}
                        </p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.isCustomized ? 'Custom design saved' : 'No customization'}
                        </p>
                      </div>
                      <p className="text-sm">₴{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-[#1A1A1A]">
                  <span>Subtotal ({totalItems} items)</span>
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
                disabled={isSubmitting || isCartLoading}
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
