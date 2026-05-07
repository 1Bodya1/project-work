import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Clock, CreditCard, DollarSign, Eye, MessageSquare, Package, Truck } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';
import type { Order, SupportTicket } from '../../types';

type BadgeStatus =
  | 'pending'
  | 'paid'
  | 'production'
  | 'shipped'
  | 'delivered'
  | 'new'
  | 'in_progress'
  | 'resolved';

function toBadgeStatus(status?: string): BadgeStatus {
  const supportedStatuses: BadgeStatus[] = [
    'pending',
    'paid',
    'production',
    'shipped',
    'delivered',
    'new',
    'in_progress',
    'resolved',
  ];

  return supportedStatuses.includes(status as BadgeStatus) ? (status as BadgeStatus) : 'pending';
}

function getOrderStatus(order: Order) {
  return order.orderStatus || order.status || 'pending';
}

function getCustomerName(order: Order) {
  return order.customer?.name || 'Customer';
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [nextOrders, nextSupportTickets] = await Promise.all([
          adminService.getOrders(),
          adminService.getSupportTickets(),
        ]);

        setOrders(nextOrders);
        setSupportTickets(nextSupportTickets);
        setErrorMessage('');
      } catch {
        setErrorMessage('Unable to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.paymentStatus === 'paid');

    return {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      inProduction: orders.filter((order) => getOrderStatus(order) === 'production').length,
      shippedOrders: orders.filter((order) => getOrderStatus(order) === 'shipped').length,
      supportRequests: supportTickets.length,
      totalRevenue: paidOrders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders, supportTickets]);

  const recentOrders = useMemo(
    () => [...orders].sort((firstOrder, secondOrder) => secondOrder.date.localeCompare(firstOrder.date)).slice(0, 5),
    [orders],
  );

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package },
    { label: 'Paid Orders', value: stats.paidOrders, icon: CreditCard },
    { label: 'In Production', value: stats.inProduction, icon: Clock },
    { label: 'Shipped Orders', value: stats.shippedOrders, icon: Truck },
    { label: 'Support Requests', value: stats.supportRequests, icon: MessageSquare },
    { label: 'Total Revenue', value: `₴${stats.totalRevenue}`, icon: DollarSign },
  ];

  if (isLoading) {
    return (
      <div>
        <h1 className="text-4xl mb-8">Dashboard</h1>
        <div className="bg-white border border-black/10 rounded-lg p-8 text-center text-[#1A1A1A]">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div>
        <h1 className="text-4xl mb-8">Dashboard</h1>
        <div className="bg-white border border-black/10 rounded-lg p-8 text-center">
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="bg-white border border-black/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#7A1F2A]" />
                </div>
                <span className="text-2xl text-right">{card.value}</span>
              </div>
              <h3 className="text-sm text-[#1A1A1A]">{card.label}</h3>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-black/10 rounded-lg p-6">
        <h3 className="mb-6">Recent Orders</h3>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left pb-3 text-sm">Order Number</th>
                <th className="text-left pb-3 text-sm">Customer</th>
                <th className="text-left pb-3 text-sm">Total</th>
                <th className="text-left pb-3 text-sm">Payment</th>
                <th className="text-left pb-3 text-sm">Order Status</th>
                <th className="text-left pb-3 text-sm">Date</th>
                <th className="text-left pb-3 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <h4 className="mb-2">No admin orders</h4>
                    <p className="text-[#1A1A1A]">Checkout-created orders will appear here.</p>
                  </td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-black/10">
                  <td className="py-4">{order.id}</td>
                  <td className="py-4">{getCustomerName(order)}</td>
                  <td className="py-4">₴{order.total}</td>
                  <td className="py-4">
                    <StatusBadge status={toBadgeStatus(order.paymentStatus)} size="sm" />
                  </td>
                  <td className="py-4">
                    <StatusBadge status={toBadgeStatus(getOrderStatus(order))} size="sm" />
                  </td>
                  <td className="py-4 text-[#1A1A1A]">{order.date}</td>
                  <td className="py-4">
                    <Link
                      to="/admin/orders"
                      className="inline-flex items-center gap-1 text-sm text-[#7A1F2A] hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
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
