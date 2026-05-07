import { useEffect, useMemo, useState } from 'react';
import { Eye, Image } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';
import type { Order, OrderStatus } from '../../types';

const orderStatusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'production', label: 'Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function getOrderStatus(order: Order): OrderStatus {
  return order.orderStatus || order.status || 'new';
}

function getDeliveryStatus(orderStatus: OrderStatus, trackingNumber?: string) {
  if (orderStatus === 'completed') return 'Delivered';
  if (orderStatus === 'shipped' && trackingNumber) return 'In transit';
  if (orderStatus === 'cancelled') return 'Cancelled';
  return 'Preparing shipment';
}

function isCustomizedItem(item: Order['items'][number]) {
  return Boolean(
    item.hasCustomDesign ||
      item.customDesignId ||
      item.previewUrl ||
      item.customImage ||
      item.customDesignImage ||
      item.customDesign?.previewUrl,
  );
}

function getCustomPreview(item: Order['items'][number]) {
  return item.previewUrl || item.customDesignImage || item.customImage || item.customDesign?.previewUrl || item.image;
}

function getUploadedDesignPreview(item: Order['items'][number]) {
  return item.uploadedImageUrl
    || item.customImage
    || item.customDesign?.uploadedImageUrl
    || item.customDesignImage
    || item.previewUrl;
}

function getUsedPlacementLabels(item: Order['items'][number]) {
  if (item.usedPlacements?.length) return item.usedPlacements;

  const placements = item.customDesignPlacements || item.customDesign?.placements;
  if (!placements) return [];

  return Object.values(placements)
    .filter((placement) => placement.uploadedImage)
    .map((placement) => placement.label || 'Placement');
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('new');
  const [draftTrackingNumber, setDraftTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const nextOrders = await adminService.getOrders();
      setOrders(nextOrders);
      setLoadError('');
      setSelectedOrderId((currentSelectedOrderId) => currentSelectedOrderId || nextOrders[0]?.id || null);
    } catch {
      setOrders([]);
      setLoadError('Unable to load admin orders.');
    } finally {
      setIsLoading(false);
    }
  }

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  useEffect(() => {
    if (!selectedOrder) return;

    setDraftStatus(getOrderStatus(selectedOrder));
    setDraftTrackingNumber(selectedOrder.trackingNumber || '');
  }, [selectedOrder]);

  async function handleUpdateOrder() {
    if (!selectedOrder) return;

    try {
      const updatedOrder = await adminService.updateOrder(selectedOrder.id, {
        orderStatus: draftStatus,
        status: draftStatus,
        trackingNumber: draftTrackingNumber,
        deliveryStatus: getDeliveryStatus(draftStatus, draftTrackingNumber),
      });

      if (!updatedOrder) {
        toast.error('Unable to update order');
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
      );
      toast.success('Order updated successfully!');
    } catch {
      toast.error('Unable to update order');
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-4xl mb-8">Orders</h1>
        <div className="bg-white border border-black/10 rounded-lg p-8 text-center text-[#1A1A1A]">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl mb-8">Orders</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">All Orders</h3>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left pb-3 text-sm">Order Number</th>
                    <th className="text-left pb-3 text-sm">Customer</th>
                    <th className="text-left pb-3 text-sm">Total</th>
                    <th className="text-left pb-3 text-sm">Customized</th>
                    <th className="text-left pb-3 text-sm">Payment</th>
                    <th className="text-left pb-3 text-sm">Order Status</th>
                    <th className="text-left pb-3 text-sm">Tracking</th>
                    <th className="text-left pb-3 text-sm">Date</th>
                    <th className="text-left pb-3 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadError ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <p className="text-red-600 mb-4">{loadError}</p>
                        <button
                          type="button"
                          onClick={loadOrders}
                          className="px-5 py-2.5 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#1A1A1A]">
                        No admin orders
                      </td>
                    </tr>
                  ) : orders.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b border-black/10 cursor-pointer hover:bg-[#F5F5F5] ${
                        selectedOrderId === order.id ? 'bg-[#F5F5F5]' : ''
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="py-4">{order.id}</td>
                      <td className="py-4">{order.customer?.name || 'Customer'}</td>
                      <td className="py-4">₴{order.total}</td>
                      <td className="py-4">
                        {order.items.some(isCustomizedItem) ? (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            Customized
                          </span>
                        ) : (
                          <span className="text-sm text-[#1A1A1A]">No</span>
                        )}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={order.paymentStatus} size="sm" />
                      </td>
                      <td className="py-4">
                        <StatusBadge status={getOrderStatus(order)} size="sm" />
                      </td>
                      <td className="py-4 text-[#1A1A1A]">{order.trackingNumber || '-'}</td>
                      <td className="py-4 text-[#1A1A1A]">{order.date}</td>
                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="inline-flex items-center gap-1 text-sm text-[#7A1F2A] hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          View/Edit
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
          {selectedOrder ? (
            <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="mb-6">Order Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Order Number</p>
                  <p>{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Customer</p>
                  <p>{selectedOrder.customer?.name || 'Customer'}</p>
                  <p className="text-sm text-[#1A1A1A]">{selectedOrder.customer?.email}</p>
                  <p className="text-sm text-[#1A1A1A]">{selectedOrder.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Delivery</p>
                  <p className="text-sm">{selectedOrder.delivery?.provider || 'Nova Poshta'}</p>
                  <p className="text-sm">{selectedOrder.delivery?.city || 'City not specified'}</p>
                  <p className="text-sm">{selectedOrder.delivery?.warehouse || 'Warehouse not specified'}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <h4 className="mb-3">Ordered Products</h4>
                {selectedOrder.items.map((item, index) => {
                  const customPreview = getCustomPreview(item);
                  const uploadedDesignPreview = getUploadedDesignPreview(item);
                  const isCustomized = isCustomizedItem(item);
                  const usedPlacements = getUsedPlacementLabels(item);

                  return (
                    <div key={`${selectedOrder.id}-${item.productId || item.name}-${index}`} className="mb-4">
                      <div className="flex gap-3 mb-3">
                        <div className="w-20 h-20 bg-[#F5F5F5] rounded overflow-hidden border border-black/5 flex-shrink-0">
                          {customPreview ? (
                            <img
                              src={customPreview}
                              alt={item.name}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[#1A1A1A]">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm">{item.name}</p>
                            {isCustomized && (
                              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                Customized
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#1A1A1A]">
                            Size: {item.size || '-'} • Color: {item.color || '-'} • x{item.quantity}
                          </p>
                          <p className="text-xs text-[#1A1A1A]">₴{item.price || 0}</p>
                          {isCustomized && (
                            <p className="text-xs text-green-600 mt-1">Custom design saved</p>
                          )}
                          {usedPlacements.length > 0 && (
                            <p className="text-xs text-[#1A1A1A] mt-1">
                              Areas: {usedPlacements.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {isCustomized && (
                        <div className="bg-[#F5F5F5] rounded p-3 space-y-3">
                          {customPreview && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Image className="w-4 h-4 text-[#7A1F2A]" />
                                <p className="text-xs">Customized Product Preview</p>
                              </div>
                              <div className="w-full h-32 bg-white rounded overflow-hidden">
                                <img
                                  src={customPreview}
                                  alt="Customized product preview"
                                  className="w-full h-full object-contain p-2"
                                />
                              </div>
                            </div>
                          )}

                          {uploadedDesignPreview && (
                            <div>
                              <p className="text-xs mb-2">Uploaded Design Image</p>
                              <div className="w-full h-24 bg-white rounded overflow-hidden">
                                <img
                                  src={uploadedDesignPreview}
                                  alt="Uploaded design"
                                  className="w-full h-full object-contain p-2"
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 text-xs text-[#1A1A1A] break-all">
                            <p>
                              <span className="text-black">customDesignId:</span>{' '}
                              {item.customDesignId || '-'}
                            </p>
                            <p>
                              <span className="text-black">Size:</span> {item.size || '-'}{' '}
                              <span className="text-black">Color:</span> {item.color || '-'}
                            </p>
                            <p>
                              <span className="text-black">Used placements:</span>{' '}
                              {usedPlacements.length > 0 ? usedPlacements.join(', ') : '-'}
                            </p>
                            <p>
                              <span className="text-black">previewUrl:</span>{' '}
                              {item.previewUrl || customPreview || '-'}
                            </p>
                            <p>
                              <span className="text-black">Position:</span>{' '}
                              {item.designPosition
                                ? `x ${item.designPosition.x}, y ${item.designPosition.y}`
                                : '-'}
                            </p>
                            <p>
                              <span className="text-black">Scale:</span>{' '}
                              {item.designScale ?? '-'}
                            </p>
                            <p>
                              <span className="text-black">Rotation:</span>{' '}
                              {item.designRotation ?? '-'}
                            </p>
                          </div>

                          {item.customDesignPlacements && (
                            <div className="space-y-2">
                              <p className="text-xs">Placement Metadata</p>
                              {Object.entries(item.customDesignPlacements)
                                .filter(([, placement]) => placement.uploadedImage)
                                .map(([placementId, placement]) => (
                                  <div key={placementId} className="bg-white rounded p-2 text-xs text-[#1A1A1A]">
                                    <p className="text-black">{placement.label || placementId}</p>
                                    <p>Position: x {placement.position.x}, y {placement.position.y}</p>
                                    <p>Scale: {placement.scale}</p>
                                    <p>Rotation: {placement.rotation}</p>
                                    {placement.printArea && (
                                      <p>
                                        Print area: x {placement.printArea.x}, y {placement.printArea.y}, w{' '}
                                        {placement.printArea.width}, h {placement.printArea.height}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#1A1A1A] mb-1">Payment Provider</p>
                    <p>{selectedOrder.paymentProvider || 'Monobank'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#1A1A1A] mb-1">Payment Status</p>
                    <StatusBadge status={selectedOrder.paymentStatus} size="sm" />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Order Status</label>
                    <select
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value as OrderStatus)}
                      className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    >
                      {orderStatusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Tracking Number</label>
                    <input
                      type="text"
                      value={draftTrackingNumber}
                      onChange={(event) => setDraftTrackingNumber(event.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                      placeholder="NP20269876543210"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-[#1A1A1A] mb-1">Delivery Status</p>
                    <p>{getDeliveryStatus(draftStatus, draftTrackingNumber)}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateOrder}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Save changes
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
