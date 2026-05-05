import { useParams, Link } from 'react-router';
import { ArrowLeft, Package, Truck, Check } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export default function OrderDetails() {
  const { orderId } = useParams();

  const order = {
    id: orderId || 'ORD-001',
    date: '2026-05-02',
    status: 'shipped' as const,
    paymentStatus: 'paid' as const,
    trackingNumber: 'NP20269876543210',
    customer: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+380501234567',
    },
    delivery: {
      provider: 'Nova Poshta',
      city: 'Kyiv',
      warehouse: 'Branch #1: Khreshchatyk St.',
    },
    items: [
      {
        id: '1',
        name: 'Classic White T-Shirt',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
        customImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
        size: 'M',
        color: 'White',
        quantity: 2,
        price: 399,
      },
    ],
    timeline: [
      { status: 'Order placed', date: '2026-05-02 10:30', completed: true },
      { status: 'Payment confirmed', date: '2026-05-02 10:31', completed: true },
      { status: 'In production', date: '2026-05-03 09:00', completed: true },
      { status: 'Shipped', date: '2026-05-04 14:20', completed: true },
      { status: 'Out for delivery', date: '', completed: false },
      { status: 'Delivered', date: '', completed: false },
    ],
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-[#7A1F2A] hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl mb-2">Order {order.id}</h1>
            <p className="text-[#1A1A1A]">Placed on {order.date}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-black/10 last:border-0">
                  <div className="w-24 h-24 bg-[#F5F5F5] rounded overflow-hidden relative flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-1">{item.name}</h4>
                    <p className="text-sm text-[#1A1A1A] mb-2">
                      Size: {item.size} • Color: {item.color}
                    </p>
                    <p className="text-sm text-green-600 mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Custom design applied
                    </p>
                    <p className="text-sm text-[#1A1A1A]">
                      Quantity: {item.quantity} × ₴{item.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg">₴{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {order.items[0]?.customImage && (
              <div className="mt-6 pt-6 border-t border-black/10">
                <h4 className="mb-4">Custom Design Preview</h4>
                <div className="flex gap-4 items-start">
                  <div className="w-48 h-48 bg-[#F5F5F5] rounded overflow-hidden">
                    <img
                      src={order.items[0].customImage}
                      alt="Custom design"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#1A1A1A] mb-2">
                      Your uploaded design will be printed on the product
                    </p>
                    <p className="text-sm text-[#1A1A1A]">
                      Production time: 3-5 business days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Delivery Timeline</h3>
            <div className="space-y-4">
              {order.timeline.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'
                      }`}
                    >
                      {step.completed ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    {index < order.timeline.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          step.completed ? 'bg-[#7A1F2A]' : 'bg-[#F5F5F5]'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className={step.completed ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>
                      {step.status}
                    </p>
                    {step.date && (
                      <p className="text-sm text-[#1A1A1A]">{step.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Customer Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#1A1A1A] mb-1">Name</p>
                <p>{order.customer.firstName} {order.customer.lastName}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Email</p>
                <p>{order.customer.email}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Phone</p>
                <p>{order.customer.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Delivery Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#1A1A1A] mb-1">Provider</p>
                <p className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#7A1F2A]" />
                  {order.delivery.provider}
                </p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Delivery Address</p>
                <p>{order.delivery.city}</p>
                <p>{order.delivery.warehouse}</p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-[#1A1A1A] mb-1">Tracking Number</p>
                  <p className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#7A1F2A]" />
                    {order.trackingNumber}
                  </p>
                  <a
                    href={`https://novaposhta.ua/tracking/?cargo_number=${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7A1F2A] hover:underline text-sm mt-2 inline-block"
                  >
                    Track on Nova Poshta →
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-[#1A1A1A]">
                <span>Subtotal</span>
                <span>₴{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#1A1A1A]">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₴${shipping}`}</span>
              </div>
            </div>
            <div className="border-t border-black/10 pt-4">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span>₴{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
