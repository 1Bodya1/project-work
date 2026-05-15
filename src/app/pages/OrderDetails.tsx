import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Check, Package, RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { formatOrderDateTime } from '../lib/dateFormat';
import { deliveryService, mockDeliveryStatuses } from '../services/deliveryService';
import { orderService } from '../services/orderService';
import type { Order, OrderTimelineStep } from '../types';

function getOrderStatus(order: Order) {
  return order.orderStatus || order.status || 'pending';
}

function buildDeliveryTimeline(order: Order): OrderTimelineStep[] {
  if (order.timeline?.length) return order.timeline;

  const deliveryStatus = order.deliveryStatus || order.delivery?.status || 'Created';
  const activeStatusIndex = Math.max(mockDeliveryStatuses.indexOf(deliveryStatus), 0);

  return mockDeliveryStatuses.map((status, index) => ({
    status,
    date: index === 0 ? formatOrderDateTime(order.date) : '',
    completed: index <= activeStatusIndex,
  }));
}

function getItemPreview(item: Order['items'][number]) {
  return item.screenshot3dUrl
    || item.previewUrl
    || item.customImage
    || item.customDesignImage
    || item.customDesign?.previewUrl
    || item.image;
}

function isCustomizedItem(item: Order['items'][number]) {
  return Boolean(
    item.hasCustomDesign
    || item.customDesignId
    || item.screenshot3dUrl
    || item.previewUrl
    || item.customImage
    || item.customDesignImage
    || item.customDesign?.previewUrl,
  );
}

function getDeliveryCityLabel(city: Order['delivery']['city'] | undefined) {
  return typeof city === 'object' && city ? city.description || city.ref || '-' : city || '-';
}

function getDeliveryWarehouseLabel(warehouse: Order['delivery']['warehouse'] | undefined) {
  if (typeof warehouse === 'object' && warehouse) {
    return [
      warehouse.description,
      warehouse.shortAddress,
      warehouse.number ? `#${warehouse.number}` : '',
    ].filter(Boolean).join(', ') || warehouse.ref || '-';
  }

  return warehouse || '-';
}

export default function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingDelivery, setIsRefreshingDelivery] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      const nextOrder = await orderService.getOrderById(orderId);
      setOrder(nextOrder);
      setIsLoading(false);
    }

    loadOrder();
  }, [orderId]);

  async function handleRefreshDeliveryStatus() {
    if (!order?.trackingNumber) return;

    setIsRefreshingDelivery(true);
    try {
      const delivery = await deliveryService.getDeliveryStatus(order.trackingNumber);
      setOrder({
        ...order,
        deliveryStatus: delivery.status,
        delivery: order.delivery ? { ...order.delivery, status: delivery.status } : order.delivery,
        timeline: mockDeliveryStatuses.map((status, index) => ({
          status,
          date: index === 0 ? formatOrderDateTime(order.date) : '',
          completed: index <= Math.max(mockDeliveryStatuses.indexOf(delivery.status), 0),
        })),
      });
    } catch {
      toast.error('Unable to refresh delivery status');
    } finally {
      setIsRefreshingDelivery(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-[#1A1A1A]">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Order not found</h1>
        <Link to="/orders" className="text-[#7A1F2A] hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const customerName = order.customer?.name || 'Customer';
  const delivery = order.delivery || {
    provider: 'Nova Poshta',
    city: 'Kyiv',
    warehouse: 'Branch #1: Khreshchatyk St.',
  };
  const orderStatus = getOrderStatus(order);
  const timeline = buildDeliveryTimeline(order);
  const orderItems = order.items || [];
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = order.total || subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-[#7A1F2A] hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl mb-2">Order details</h1>
            <p className="text-[#1A1A1A]">Placed on {formatOrderDateTime(order.date)}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={orderStatus} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Products</h3>
            <div className="space-y-4">
              {orderItems.map((item, index) => {
                const preview = getItemPreview(item);
                const isCustomized = isCustomizedItem(item);
                const itemName = item.name || 'Product';

                return (
                  <div key={`${itemName}-${index}`} className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-black/10 last:border-0">
                    <div className="w-full sm:w-28 h-32 sm:h-28 bg-[#F5F5F5] rounded overflow-hidden border border-black/5 flex-shrink-0">
                      {preview ? (
                        <img src={preview} alt={itemName} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#1A1A1A]">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4>{itemName}</h4>
                        {isCustomized && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Custom design saved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#1A1A1A] mb-2">
                        Size: {item.size || '-'} • Color: {item.color || '-'}
                      </p>
                      {item.customDesignId && (
                        <p className="text-xs text-[#1A1A1A] mb-2">
                          Design ID: {item.customDesignId}
                        </p>
                      )}
                      {item.usedPlacements?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.usedPlacements.map((placement) => (
                            <span
                              key={placement}
                              className="text-xs px-2 py-1 bg-[#F5F5F5] border border-black/10 rounded"
                            >
                              {placement}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {!isCustomized && (
                        <p className="text-sm text-[#1A1A1A] mb-2">
                          No customization
                        </p>
                      )}
                      <p className="text-sm text-[#1A1A1A]">
                        Quantity: {item.quantity || 1} x ₴{item.price || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg">₴{(item.price || 0) * (item.quantity || 1)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Delivery Status Timeline</h3>
            <div className="space-y-4">
              {timeline.map((step, index) => (
                <div key={`${step.status}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'
                      }`}
                    >
                      {step.completed ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${step.completed ? 'bg-[#7A1F2A]' : 'bg-[#F5F5F5]'}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className={step.completed ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>{step.status}</p>
                    {step.date && <p className="text-sm text-[#1A1A1A]">{step.date}</p>}
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
                <p>{customerName}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Email</p>
                <p>{order.customer?.email || '-'}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Phone</p>
                <p>{order.customer?.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Payment</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#1A1A1A] mb-1">Provider</p>
                <p>{order.paymentProvider || 'Monobank'}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Status</p>
                <StatusBadge status={order.paymentStatus} size="sm" />
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
                  {delivery.provider || 'Nova Poshta'}
                </p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Delivery Address</p>
                <p>{getDeliveryCityLabel(delivery.city)}</p>
                <p>{getDeliveryWarehouseLabel(delivery.warehouse)}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Delivery Status</p>
                <p>{order.deliveryStatus || delivery.status || 'Created'}</p>
              </div>
              <div>
                <p className="text-[#1A1A1A] mb-1">Tracking Number</p>
                {order.trackingNumber ? (
                  <p className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#7A1F2A]" />
                    {order.trackingNumber}
                  </p>
                ) : (
                  <p>Tracking number has not been added yet</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRefreshDeliveryStatus}
                disabled={!order.trackingNumber || isRefreshingDelivery}
                className="w-full py-2.5 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingDelivery ? 'animate-spin' : ''}`} />
                Refresh delivery status
              </button>
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
