import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, Edit2, LogOut, Package, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { orderService } from '../services/orderService';
import { useAuth } from '../store/AuthContext';
import type { Order, User } from '../types';

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

type BadgeStatus =
  | 'pending'
  | 'paid'
  | 'production'
  | 'shipped'
  | 'delivered'
  | 'new'
  | 'in_progress'
  | 'resolved';

function getNameParts(user: User | null) {
  const [firstName = '', ...lastNameParts] = (user?.name || '').split(' ').filter(Boolean);

  return {
    firstName: user?.firstName || firstName,
    lastName: user?.lastName || lastNameParts.join(' '),
  };
}

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

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, loadMe } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const nameParts = getNameParts(user);
    setFormData({
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: user?.phone || '',
      email: user?.email || '',
    });
  }, [user]);

  useEffect(() => {
    async function loadRecentOrders() {
      try {
        const nextOrders = await orderService.getMyOrders();
        setOrders(nextOrders.slice(0, 2));
        setOrdersError('');
      } catch {
        setOrders([]);
        setOrdersError('Unable to load recent orders.');
      } finally {
        setIsLoadingOrders(false);
      }
    }

    loadRecentOrders();
  }, []);

  const displayName =
    `${formData.firstName} ${formData.lastName}`.trim() || user?.name || 'Solution customer';

  const handleSaveProfile = async () => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone.trim(),
      email: user.email,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    await loadMe();
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleFieldChange = (field: keyof ProfileForm, value: string) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
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
                <h3 className="mb-1">{displayName}</h3>
                <p className="text-sm text-[#1A1A1A]">{formData.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('firstName', event.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('lastName', event.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none opacity-70"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit profile
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!isEditing}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save changes
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3>Recent Orders</h3>
              <Link to="/orders" className="text-sm text-[#7A1F2A] hover:underline">
                View all orders
              </Link>
            </div>

            {isLoadingOrders ? (
              <div className="text-center py-12 text-[#1A1A1A]">
                Loading profile orders...
              </div>
            ) : ordersError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{ordersError}</p>
                <Link
                  to="/orders"
                  className="inline-block px-6 py-3 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                >
                  Open orders
                </Link>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A] mb-4">No orders yet</p>
                <Link
                  to="/catalog"
                  className="inline-block px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
                >
                  Go to catalog
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
                        <div className="flex gap-2 sm:justify-end">
                          <StatusBadge status={toBadgeStatus(order.paymentStatus)} size="sm" />
                          <StatusBadge status={toBadgeStatus(order.orderStatus || order.status)} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={`${order.id}-${item.productId || item.name}-${index}`} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden relative">
                            <img
                              src={item.customDesignImage || item.customImage || item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.name}</p>
                            <p className="text-xs text-[#1A1A1A]">Quantity: {item.quantity}</p>
                            {(item.customImage || item.customDesignImage || item.hasCustomDesign) && (
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
                          Track
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
