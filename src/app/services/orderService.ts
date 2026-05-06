import { mockOrders } from '../mocks/mockOrders';
import type { Order } from '../types';

type CreateOrderData = Partial<Omit<Order, 'id' | 'date' | 'paymentStatus'>>;
const ORDERS_STORAGE_KEY = 'solution_orders';

function normalizeOrder(order: Order): Order {
  const orderStatus = order.orderStatus || order.status || 'pending';
  return {
    ...order,
    status: order.status || orderStatus,
    orderStatus,
    paymentProvider: order.paymentProvider || 'Monobank',
    deliveryStatus: order.deliveryStatus || (orderStatus === 'delivered' ? 'Delivered' : 'In transit'),
    delivery: order.delivery
      ? {
          provider: order.delivery.provider || 'Nova Poshta',
          city: order.delivery.city,
          warehouse: order.delivery.warehouse,
          comment: order.delivery.comment,
          status: order.delivery.status || order.deliveryStatus,
        }
      : undefined,
  };
}

function readStoredOrders() {
  const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!storedOrders) return [];

  try {
    return (JSON.parse(storedOrders) as Order[]).map(normalizeOrder);
  } catch {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    return [];
  }
}

function writeStoredOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export const orderService = {
  async createOrder(data: CreateOrderData) {
    const order = normalizeOrder({
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      paymentStatus: 'pending' as const,
      status: 'pending' as const,
      orderStatus: 'pending' as const,
      trackingNumber: '',
      deliveryStatus: 'Pending',
      items: [],
      total: 0,
      ...data,
    });

    writeStoredOrders([order, ...readStoredOrders()]);
    return order;
  },

  async getMyOrders() {
    return [...readStoredOrders(), ...mockOrders.map(normalizeOrder)].filter(
      (order) => order.id === 'ORD-001' || order.id === 'ORD-002' || order.id.startsWith('ORD-'),
    );
  },

  async getOrderById(id: string) {
    return readStoredOrders().find((order) => order.id === id)
      || mockOrders.map(normalizeOrder).find((order) => order.id === id)
      || null;
  },
};

export { ORDERS_STORAGE_KEY };
