import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { deliveryService } from '../services/deliveryService';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

function getOrderStatus(order: Order) {
  return order.orderStatus || order.status || 'pending';
}

function getPreview(order: Order) {
  const customizedItem = order.items.find((item) =>
    item.previewUrl
    || item.customImage
    || item.customDesignImage
    || item.customDesign?.previewUrl
    || item.hasCustomDesign
    || item.customDesignId
  );

  return customizedItem?.previewUrl
    || customizedItem?.customImage
    || customizedItem?.customDesignImage
    || customizedItem?.customDesign?.previewUrl
    || customizedItem?.image
    || order.items[0]?.previewUrl
    || order.items[0]?.image;
}

function hasCustomizedItem(order: Order) {
  return order.items.some((item) =>
    item.hasCustomDesign
    || item.customDesignId
    || item.previewUrl
    || item.customImage
    || item.customDesignImage
    || item.customDesign?.previewUrl
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      const nextOrders = await orderService.getMyOrders();
      setOrders(nextOrders);
      setIsLoading(false);
    }

    loadOrders();
  }, []);

  async function handleRefreshDeliveryStatus(order: Order) {
    if (!order.trackingNumber) return;

    setRefreshingOrderId(order.id);
    try {
      const delivery = await deliveryService.getDeliveryStatus(order.trackingNumber);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? {
                ...currentOrder,
                deliveryStatus: delivery.status,
                delivery: currentOrder.delivery
                  ? { ...currentOrder.delivery, status: delivery.status }
                  : currentOrder.delivery,
              }
            : currentOrder,
        ),
      );
    } catch {
      toast.error('Unable to refresh delivery status');
    } finally {
      setRefreshingOrderId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-[#1A1A1A]">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-[#1A1A1A]" />
          </div>
          <h1 className="text-3xl mb-4">No orders yet</h1>
          <p className="text-[#1A1A1A] mb-8">Your orders will appear here after checkout.</p>
          <Link
            to="/catalog"
            className="inline-block px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Go to catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">My Orders</h1>

      <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
        <h3 className="mb-6">Order List</h3>

        <div className="space-y-4">
          {orders.map((order) => {
            const preview = getPreview(order);
            const orderStatus = getOrderStatus(order);
            const isCustomized = hasCustomizedItem(order);
            const deliveryStatus = order.deliveryStatus || order.delivery?.status || 'Created';

            return (
              <div key={order.id} className="border border-black/10 rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
                  <div className="flex flex-col sm:flex-row gap-4 min-w-0">
                    <div className="w-24 h-24 bg-[#F5F5F5] rounded overflow-hidden flex-shrink-0 border border-black/5">
                      {preview ? (
                        <img src={preview} alt={order.id} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#1A1A1A]">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4>{order.id}</h4>
                        {isCustomized && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                            Customized
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#1A1A1A]">Date: {order.date}</p>
                      {order.trackingNumber ? (
                        <>
                          <p className="text-sm text-[#1A1A1A] mt-1">Tracking: {order.trackingNumber}</p>
                          <p className="text-sm text-[#1A1A1A]">Delivery: {deliveryStatus}</p>
                        </>
                      ) : (
                        <p className="text-sm text-[#1A1A1A] mt-1">
                          Tracking number has not been added yet
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="md:text-right">
                    <p className="text-lg mb-2">₴{order.total}</p>
                    <div className="flex gap-2 md:justify-end flex-wrap">
                      <StatusBadge status={order.paymentStatus} size="sm" />
                      <StatusBadge status={orderStatus} size="sm" />
                    </div>
                    <p className="text-sm text-[#1A1A1A] mt-2">
                      Delivery status: {deliveryStatus}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRefreshDeliveryStatus(order)}
                    disabled={!order.trackingNumber || refreshingOrderId === order.id}
                    className="w-full py-2.5 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshingOrderId === order.id ? 'animate-spin' : ''}`} />
                    Refresh delivery status
                  </button>
                  <Link
                    to={`/orders/${order.id}`}
                    className="block w-full py-2.5 text-center border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                  >
                    View details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
