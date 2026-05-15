import { apiRequest, apiRequestAny, unwrapApiData, USE_BACKEND } from './api';
import type { Order } from '../types';

type CreateOrderData = Partial<Omit<Order, 'id' | 'date' | 'paymentStatus'>>;
const ORDERS_STORAGE_KEY = 'solution_orders';
const LEGACY_DEMO_ORDER_IDS = new Set(['ORD-001', 'ORD-002', 'ORD-013', 'ORD-014', 'ORD-015']);

function normalizeOrder(order: Order): Order {
  const record = order as Order & { createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string };
  const orderStatus = order.orderStatus || order.status || 'pending';
  return {
    ...order,
    date: order.date || record.createdAt || record.created_at || record.updatedAt || record.updated_at || new Date().toISOString(),
    items: order.items || [],
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
    const orders = (JSON.parse(storedOrders) as Order[]).filter(
      (order) => !LEGACY_DEMO_ORDER_IDS.has(order.id),
    );
    return orders.map(normalizeOrder);
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
    if (!USE_BACKEND) {
      // In mock mode, create local order but still preserve all data
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
    }

    try {
      return normalizeOrder(
        unwrapApiData<Order>(
          await apiRequest<unknown>('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          ['order']
        )
      );
    } catch (error) {
      console.error('Failed to create order on backend:', error);
      throw error;
    }
  },

  async getMyOrders() {
    if (!USE_BACKEND) {
      return readStoredOrders();
    }

    try {
      const orders = unwrapApiData<Order[]>(
        await apiRequestAny<unknown>(
          ['/orders/my', '/orders']
        ),
        ['orders', 'items']
      );
      return Array.isArray(orders) ? orders.map(normalizeOrder) : [];
    } catch (error) {
      console.error('Failed to fetch orders from backend:', error);
      throw error;
    }
  },

  async getOrderById(id: string) {
    if (!USE_BACKEND) {
      return readStoredOrders().find((order) => order.id === id) || null;
    }

    try {
      return normalizeOrder(
        unwrapApiData<Order>(
          await apiRequest<unknown>(`/orders/${id}`),
          ['order']
        )
      );
    } catch (error) {
      console.error(`Failed to fetch order ${id} from backend:`, error);
      throw error;
    }
  },

  async getAdminOrders() {
    if (!USE_BACKEND) {
      return readStoredOrders();
    }

    try {
      const orders = unwrapApiData<Order[]>(
        await apiRequestAny<unknown>(
          ['/admin/orders', '/orders/admin/all']
        ),
        ['orders', 'items']
      );
      return Array.isArray(orders) ? orders.map(normalizeOrder) : [];
    } catch (error) {
      console.error('Failed to fetch admin orders from backend:', error);
      throw error;
    }
  },

  async getAdminOrderById(id: string) {
    if (!USE_BACKEND) {
      return readStoredOrders().find((order) => order.id === id) || null;
    }

    try {
      return normalizeOrder(
        unwrapApiData<Order>(
          await apiRequestAny<unknown>(
            [`/admin/orders/${id}`, `/orders/admin/${id}`]
          ),
          ['order']
        )
      );
    } catch (error) {
      console.error(`Failed to fetch admin order ${id} from backend:`, error);
      throw error;
    }
  },

  async updateAdminOrder(id: string, data: Partial<Pick<Order, 'orderStatus' | 'status' | 'trackingNumber' | 'deliveryStatus'>>) {
    if (!USE_BACKEND) {
      const orders = readStoredOrders();
      const orderIndex = orders.findIndex((o) => o.id === id);
      if (orderIndex < 0) throw new Error(`Order ${id} not found`);
      
      const updated = normalizeOrder({
        ...orders[orderIndex],
        ...data,
        orderStatus: data.orderStatus || data.status || orders[orderIndex].orderStatus,
        status: data.status || data.orderStatus || orders[orderIndex].status,
      });
      
      orders[orderIndex] = updated;
      writeStoredOrders(orders);
      return updated;
    }

    try {
      return normalizeOrder(
        unwrapApiData<Order>(
          await apiRequestAny<unknown>(
            [`/admin/orders/${id}`, `/orders/admin/${id}/status`],
            {
              method: 'PATCH',
              body: JSON.stringify(data),
            }
          ),
          ['order']
        )
      );
    } catch (error) {
      console.warn(`Failed to update admin order ${id} on backend:`, error);
      throw error;
    }
  },

  async updateAdminOrderTracking(id: string, trackingNumber: string) {
    if (!USE_BACKEND) {
      const orders = readStoredOrders();
      const orderIndex = orders.findIndex((o) => o.id === id);
      if (orderIndex < 0) throw new Error(`Order ${id} not found`);
      
      const updated = normalizeOrder({
        ...orders[orderIndex],
        trackingNumber,
      });
      
      orders[orderIndex] = updated;
      writeStoredOrders(orders);
      return updated;
    }

    try {
      return normalizeOrder(
        unwrapApiData<Order>(
          await apiRequestAny<unknown>(
            [`/admin/orders/${id}/tracking`, `/orders/admin/${id}/tracking`],
            {
              method: 'PATCH',
              body: JSON.stringify({ trackingNumber }),
            }
          ),
          ['order']
        )
      );
    } catch (error) {
      console.warn(`Failed to update tracking for order ${id}:`, error);
      throw error;
    }
  },
};

export { ORDERS_STORAGE_KEY };
