import { StatusBadge } from '../../components/StatusBadge';
import { Package, DollarSign, Clock, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const recentOrders = [
    { id: 'ORD-015', customer: 'Anna Kovalenko', total: 1299, status: 'paid' as const, date: '2026-05-04' },
    { id: 'ORD-014', customer: 'Dmytro Petrenko', total: 899, status: 'production' as const, date: '2026-05-03' },
    { id: 'ORD-013', customer: 'Olena Shevchenko', total: 1697, status: 'shipped' as const, date: '2026-05-02' },
  ];

  return (
    <div>
      <h1 className="text-4xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-black/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-[#7A1F2A]" />
            </div>
            <span className="text-2xl">127</span>
          </div>
          <h3 className="text-sm text-[#1A1A1A]">Total Orders</h3>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#7A1F2A]" />
            </div>
            <span className="text-2xl">98</span>
          </div>
          <h3 className="text-sm text-[#1A1A1A]">Paid Orders</h3>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#7A1F2A]" />
            </div>
            <span className="text-2xl">15</span>
          </div>
          <h3 className="text-sm text-[#1A1A1A]">In Production</h3>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#7A1F2A]" />
            </div>
            <span className="text-2xl">8</span>
          </div>
          <h3 className="text-sm text-[#1A1A1A]">Support Requests</h3>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-lg p-6">
        <h3 className="mb-6">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left pb-3 text-sm">Order ID</th>
                <th className="text-left pb-3 text-sm">Customer</th>
                <th className="text-left pb-3 text-sm">Date</th>
                <th className="text-left pb-3 text-sm">Total</th>
                <th className="text-left pb-3 text-sm">Status</th>
                <th className="text-left pb-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-black/10">
                  <td className="py-4">{order.id}</td>
                  <td className="py-4">{order.customer}</td>
                  <td className="py-4 text-[#1A1A1A]">{order.date}</td>
                  <td className="py-4">₴{order.total}</td>
                  <td className="py-4">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="py-4">
                    <button className="text-sm text-[#7A1F2A] hover:underline">
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
