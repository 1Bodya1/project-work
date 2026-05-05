import { Link } from 'react-router';
import { StatusBadge } from '../components/StatusBadge';
import { Package, User as UserIcon, LogOut, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const orders = [
    {
      id: 'ORD-001',
      date: '2026-04-28',
      total: 1697,
      status: 'delivered' as const,
      paymentStatus: 'paid' as const,
      trackingNumber: 'NP20269876543210',
      items: [
        {
          name: 'Classic White T-Shirt',
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
          customImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
        },
      ],
    },
    {
      id: 'ORD-002',
      date: '2026-05-02',
      total: 899,
      status: 'shipped' as const,
      paymentStatus: 'paid' as const,
      trackingNumber: 'NP20269876543211',
      items: [
        {
          name: 'Premium Black Hoodie',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop',
          customImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
        },
      ],
    },
  ];

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-[#7A1F2A]" />
              </div>
              <div>
                <h3 className="mb-1">John Doe</h3>
                <p className="text-sm text-[#1A1A1A]">john@example.com</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">First Name</label>
                <input
                  type="text"
                  defaultValue="John"
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Last Name</label>
                <input
                  type="text"
                  defaultValue="Doe"
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Phone</label>
                <input
                  type="tel"
                  defaultValue="+380501234567"
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  defaultValue="john@example.com"
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Save changes
              </button>

              <button className="w-full py-3 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Order History</h3>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A] mb-4">No orders yet</p>
                <Link
                  to="/catalog"
                  className="inline-block px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-black/10 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="mb-1">{order.id}</h4>
                        <p className="text-sm text-[#1A1A1A]">{order.date}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="mb-2">₴{order.total}</p>
                        <div className="flex gap-2">
                          <StatusBadge status={order.paymentStatus} size="sm" />
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden relative">
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
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.name}</p>
                            <p className="text-xs text-[#1A1A1A]">Quantity: {item.quantity}</p>
                            {item.customImage && (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Custom design
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.trackingNumber && (
                      <div className="bg-[#F5F5F5] rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-[#7A1F2A] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A1A1A] mb-0.5">Tracking Number</p>
                          <p className="text-sm break-all">{order.trackingNumber}</p>
                        </div>
                        <a
                          href={`https://novaposhta.ua/tracking/?cargo_number=${order.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#7A1F2A] hover:underline whitespace-nowrap"
                        >
                          Track →
                        </a>
                      </div>
                    )}

                    <Link
                      to={`/orders/${order.id}`}
                      className="block w-full py-2.5 text-center border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
