import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { Eye, Image } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const orders = [
    {
      id: 'ORD-015',
      customer: { name: 'Anna Kovalenko', email: 'anna@example.com', phone: '+380501234567' },
      date: '2026-05-04',
      total: 1299,
      paymentStatus: 'paid' as const,
      orderStatus: 'production' as const,
      trackingNumber: '',
      items: [
        {
          name: 'Classic White T-Shirt',
          quantity: 2,
          size: 'M',
          color: 'White',
          hasCustomDesign: true,
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
          customDesignImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
        },
      ],
      delivery: { city: 'Kyiv', warehouse: 'Branch #1: Khreshchatyk St.' },
    },
    {
      id: 'ORD-014',
      customer: { name: 'Dmytro Petrenko', email: 'dmytro@example.com', phone: '+380509876543' },
      date: '2026-05-03',
      total: 899,
      paymentStatus: 'paid' as const,
      orderStatus: 'shipped' as const,
      trackingNumber: 'NP20269876543210',
      items: [
        {
          name: 'Premium Black Hoodie',
          quantity: 1,
          size: 'L',
          color: 'Black',
          hasCustomDesign: true,
          image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop',
          customDesignImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop',
        },
      ],
      delivery: { city: 'Lviv', warehouse: 'Branch #5: Svobody Ave.' },
    },
  ];

  const [orderStatuses, setOrderStatuses] = useState<Record<string, typeof orders[0]['orderStatus']>>(
    Object.fromEntries(orders.map(o => [o.id, o.orderStatus]))
  );
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>(
    Object.fromEntries(orders.map(o => [o.id, o.trackingNumber]))
  );

  const order = orders.find((o) => o.id === selectedOrder);

  const handleUpdateOrder = () => {
    toast.success('Order updated successfully!');
  };

  return (
    <div>
      <h1 className="text-4xl mb-8">Orders</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">All Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left pb-3 text-sm">Order ID</th>
                    <th className="text-left pb-3 text-sm">Customer</th>
                    <th className="text-left pb-3 text-sm">Date</th>
                    <th className="text-left pb-3 text-sm">Total</th>
                    <th className="text-left pb-3 text-sm">Status</th>
                    <th className="text-left pb-3 text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className={`border-b border-black/10 cursor-pointer hover:bg-[#F5F5F5] ${selectedOrder === o.id ? 'bg-[#F5F5F5]' : ''}`}
                      onClick={() => setSelectedOrder(o.id)}
                    >
                      <td className="py-4">{o.id}</td>
                      <td className="py-4">{o.customer.name}</td>
                      <td className="py-4 text-[#1A1A1A]">{o.date}</td>
                      <td className="py-4">₴{o.total}</td>
                      <td className="py-4">
                        <StatusBadge status={orderStatuses[o.id]} size="sm" />
                      </td>
                      <td className="py-4">
                        <button className="p-2 hover:bg-white rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          {order ? (
            <div className="bg-white border border-black/10 rounded-lg p-6 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="mb-6">Order Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Order ID</p>
                  <p>{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Customer</p>
                  <p>{order.customer.name}</p>
                  <p className="text-sm text-[#1A1A1A]">{order.customer.email}</p>
                  <p className="text-sm text-[#1A1A1A]">{order.customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Delivery</p>
                  <p className="text-sm">{order.delivery.city}</p>
                  <p className="text-sm">{order.delivery.warehouse}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <h4 className="mb-3">Items</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">{item.name}</p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.size} • {item.color} • x{item.quantity}
                        </p>
                        {item.hasCustomDesign && (
                          <p className="text-xs text-green-600 mt-1">✓ Custom design</p>
                        )}
                      </div>
                    </div>

                    {item.customDesignImage && (
                      <div className="bg-[#F5F5F5] rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="w-4 h-4 text-[#7A1F2A]" />
                          <p className="text-xs">Uploaded Design Preview</p>
                        </div>
                        <div className="w-full h-32 bg-white rounded overflow-hidden">
                          <img
                            src={item.customDesignImage}
                            alt="Custom design"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">Order Status</label>
                    <select
                      value={orderStatuses[order.id]}
                      onChange={(e) => setOrderStatuses({ ...orderStatuses, [order.id]: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="production">In Production</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumbers[order.id]}
                      onChange={(e) => setTrackingNumbers({ ...trackingNumbers, [order.id]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                      placeholder="NP20269876543210"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateOrder}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Update Order
              </button>
            </div>
          ) : (
            <div className="bg-white border border-black/10 rounded-lg p-6 text-center text-[#1A1A1A]">
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
