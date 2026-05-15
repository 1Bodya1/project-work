import { productService } from './productService';
import { apiRequestAny, unwrapApiData, USE_BACKEND } from './api';
import { DESIGN_STORAGE_KEY } from './designService';
import { ORDERS_STORAGE_KEY } from './orderService';
import { SUPPORT_TICKETS_STORAGE_KEY } from './supportService';
import type { CustomDesign, Order, OrderItem, OrderStatus, Product, SupportTicket, TicketStatus } from '../types';

type CreateProductData = Omit<Product, 'id'>;
type UpdateProductData = Partial<Omit<Product, 'id'>>;
type UpdateOrderData = Partial<Pick<Order, 'orderStatus' | 'status' | 'trackingNumber' | 'deliveryStatus'>>;
export const PRODUCTS_STORAGE_KEY = 'solution_admin_products';
const DELETED_PRODUCTS_STORAGE_KEY = 'solution_deleted_products';
const LEGACY_DEMO_ORDER_IDS = new Set(['ORD-001', 'ORD-002', 'ORD-013', 'ORD-014', 'ORD-015']);
const LEGACY_DEMO_TICKET_IDS = new Set(['SUP-006', 'SUP-007', 'SUP-008']);

function joinName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function isEmailLike(value?: string) {
  return Boolean(value && /\S+@\S+\.\S+/.test(value));
}

function getDisplayName(...names: Array<string | undefined>) {
  const name = names.map((value) => value?.trim()).find((value) => value && !isEmailLike(value));
  return name || 'Customer';
}

function readStoredProducts() {
  const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!storedProducts) return [];

  try {
    return JSON.parse(storedProducts) as Product[];
  } catch {
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    return [];
  }
}

function writeStoredProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

function readDeletedProductIds() {
  const storedIds = localStorage.getItem(DELETED_PRODUCTS_STORAGE_KEY);
  if (!storedIds) return [];

  try {
    return JSON.parse(storedIds) as string[];
  } catch {
    localStorage.removeItem(DELETED_PRODUCTS_STORAGE_KEY);
    return [];
  }
}

function writeDeletedProductIds(ids: string[]) {
  localStorage.setItem(DELETED_PRODUCTS_STORAGE_KEY, JSON.stringify(ids));
}

function readStoredOrders() {
  const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!storedOrders) return [];

  try {
    return (JSON.parse(storedOrders) as Order[]).filter(
      (order) => !LEGACY_DEMO_ORDER_IDS.has(order.id),
    );
  } catch {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    return [];
  }
}

function writeStoredOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

function readStoredDesigns() {
  const storedDesigns = localStorage.getItem(DESIGN_STORAGE_KEY);
  if (!storedDesigns) return [];

  try {
    return JSON.parse(storedDesigns) as CustomDesign[];
  } catch {
    localStorage.removeItem(DESIGN_STORAGE_KEY);
    return [];
  }
}

function readStoredSupportTickets() {
  const storedTickets = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
  if (!storedTickets) return [];

  try {
    return (JSON.parse(storedTickets) as SupportTicket[]).filter(
      (ticket) => !LEGACY_DEMO_TICKET_IDS.has(ticket.id),
    );
  } catch {
    localStorage.removeItem(SUPPORT_TICKETS_STORAGE_KEY);
    return [];
  }
}

function writeStoredSupportTickets(tickets: SupportTicket[]) {
  localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

function getAllSupportTickets() {
  return readStoredSupportTickets().map(normalizeSupportTicket);
}

function normalizeSupportTicket(ticket: SupportTicket): SupportTicket {
  const record = ticket as SupportTicket & {
    _id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    fullName?: string;
    created_at?: string;
    user?: { name?: string; fullName?: string; email?: string; firstName?: string; lastName?: string };
  };
  const userName = getDisplayName(
    record.user?.fullName,
    record.user?.name,
    joinName(record.user?.firstName, record.user?.lastName),
    record.fullName,
    record.name,
    joinName(record.firstName, record.lastName),
    record.customer?.name,
  );
  const userEmail = record.user?.email || record.customer?.email || record.userEmail || '';

  return {
    ...ticket,
    id: String(ticket.id || record._id || `SUP-${Date.now()}`),
    customer: {
      name: userName,
      email: userEmail,
    },
    userEmail,
    subject: ticket.subject || 'Support request',
    message: ticket.message || '',
    status: ticket.status || 'new',
    date: ticket.date || ticket.createdAt || record.created_at || new Date().toISOString(),
    createdAt: ticket.createdAt || record.created_at,
  };
}

function normalizeOrder(order: Order): Order {
  const record = order as Order & { createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string };
  const rawStatus = order.orderStatus || order.status || 'new';
  const orderStatus = rawStatus === 'pending' ? 'new' : rawStatus === 'delivered' ? 'completed' : rawStatus;
  const designs = readStoredDesigns();
  const items = (order.items || []).map((item) => enrichOrderItemWithDesign(item, designs));

  return {
    ...order,
    date: order.date || record.createdAt || record.created_at || record.updatedAt || record.updated_at || new Date().toISOString(),
    items,
    status: orderStatus,
    orderStatus,
    paymentProvider: order.paymentProvider || 'Monobank',
    deliveryStatus:
      order.deliveryStatus ||
      order.delivery?.status ||
      (orderStatus === 'completed'
        ? 'Delivered'
        : orderStatus === 'shipped'
          ? 'In transit'
          : 'Preparing shipment'),
  };
}

function enrichOrderItemWithDesign(item: OrderItem, designs: CustomDesign[]): OrderItem {
  const design = item.customDesignId
    ? designs.find((storedDesign) => storedDesign.id === item.customDesignId)
    : undefined;
  const inlineDesign = item.customDesign;
  const resolvedDesign = design || inlineDesign;

  if (!resolvedDesign) {
    return {
      ...item,
      previewUrl: item.screenshot3dUrl || item.previewUrl || item.customDesignImage || item.customImage,
      uploadedImageUrl: item.uploadedImageUrl || item.customImage || item.customDesignImage,
      hasCustomDesign: item.hasCustomDesign || Boolean(item.customDesignId || item.previewUrl || item.customImage || item.customDesignImage),
    };
  }

  return {
    ...item,
    customDesign: resolvedDesign,
    customDesignId: item.customDesignId || resolvedDesign.id,
    previewUrl: item.previewUrl || resolvedDesign.previewUrl || resolvedDesign.uploadedImageUrl || resolvedDesign.imageUrl,
    screenshot3dUrl: item.screenshot3dUrl || resolvedDesign.screenshot3dUrl,
    uploadedImageUrl: item.uploadedImageUrl || resolvedDesign.uploadedImageUrl || resolvedDesign.imageUrl,
    customImage: item.customImage || resolvedDesign.uploadedImageUrl || resolvedDesign.previewUrl,
    customDesignImage: item.customDesignImage || resolvedDesign.previewUrl || resolvedDesign.uploadedImageUrl,
    size: item.size || resolvedDesign.selectedSize,
    color: item.color || resolvedDesign.selectedColor,
    hasCustomDesign: true,
    designPosition: item.designPosition || resolvedDesign.position,
    designScale: item.designScale ?? resolvedDesign.scale,
    designRotation: item.designRotation ?? resolvedDesign.rotation,
    customDesignPlacements: item.customDesignPlacements || resolvedDesign.placements,
    usedPlacements:
      item.usedPlacements ||
      Object.values(resolvedDesign.placements || {})
        .filter((placement) => placement && typeof placement === 'object' && (placement.uploadedImage || placement.uploadedImageUrl || placement.previewUrl))
        .map((placement) => placement.label || 'Placement'),
  };
}

async function getAllOrders() {
  return readStoredOrders().map(normalizeOrder);
}

async function updateOrder(id: string, data: UpdateOrderData) {
  const orders = await getAllOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) return null;

  const nextStatus = data.orderStatus || data.status || order.orderStatus || order.status || 'new';
  const updatedOrder = normalizeOrder({
    ...order,
    ...data,
    status: nextStatus,
    orderStatus: nextStatus,
    deliveryStatus:
      data.deliveryStatus ||
      order.deliveryStatus ||
      (nextStatus === 'completed'
        ? 'Delivered'
        : nextStatus === 'shipped'
          ? 'In transit'
          : 'Preparing shipment'),
  });

  const storedOrders = readStoredOrders();
  const nextStoredOrders = storedOrders.some((item) => item.id === id)
    ? storedOrders.map((item) => (item.id === id ? updatedOrder : item))
    : [updatedOrder, ...storedOrders];

  writeStoredOrders(nextStoredOrders);
  return updatedOrder;
}

export const adminService = {
  async getDashboardStats() {
    return null;
  },

  async getProducts() {
    if (USE_BACKEND) {
      return productService.getAdminProducts();
    }

    const storedProducts = readStoredProducts();
    const products = await productService.getProducts();
    const storedIds = new Set(storedProducts.map((product) => product.id));
    return [
      ...storedProducts,
      ...products.filter((product) => !storedIds.has(product.id)),
    ];
  },

  async createProduct(data: CreateProductData) {
    if (USE_BACKEND) {
      return productService.createProduct(data);
    }

    try {
      return await productService.createProduct(data);
    } catch (error) {
      console.error('Failed to create product via backend:', error);
      // Fallback to local storage
      const product = { id: `PRD-${Date.now()}`, ...data };
      writeStoredProducts([product, ...readStoredProducts()]);
      return product;
    }
  },

  async updateProduct(id: string, data: UpdateProductData) {
    if (USE_BACKEND) {
      return productService.updateProduct(id, data);
    }

    try {
      return await productService.updateProduct(id, data);
    } catch (error) {
      console.error('Failed to update product via backend:', error);
      // Fallback to local storage
      const products = readStoredProducts();
      const product = products.find((item) => item.id === id);
      if (!product) return null;

      const updatedProduct = { ...product, ...data };
      const nextStoredProducts = products.map((item) =>
        item.id === id ? updatedProduct : item,
      );

      writeStoredProducts(nextStoredProducts);
      return updatedProduct;
    }
  },

  async deleteProduct(id: string) {
    if (USE_BACKEND) {
      return productService.deleteProduct(id);
    }

    try {
      return await productService.deleteProduct(id);
    } catch (error) {
      console.error('Failed to delete product via backend:', error);
      // Fallback to local storage
      writeStoredProducts(readStoredProducts().filter((product) => product.id !== id));
      writeDeletedProductIds(Array.from(new Set([...readDeletedProductIds(), id])));
      return { success: true, id };
    }
  },

  async getOrders() {
    if (!USE_BACKEND) return getAllOrders();

    try {
      const orders = unwrapApiData<Order[]>(await apiRequestAny([
        '/admin/orders',
        '/orders/admin/all',
      ]), ['orders', 'items']);
      return Array.isArray(orders) ? orders.map(normalizeOrder) : [];
    } catch (error) {
      console.error('Failed to fetch admin orders:', error);
      return getAllOrders();
    }
  },

  async getOrderById(id: string) {
    if (!USE_BACKEND) return (await getAllOrders()).find((order) => order.id === id) || null;

    try {
      return normalizeOrder(unwrapApiData<Order>(await apiRequestAny([
        `/admin/orders/${id}`,
        `/orders/admin/${id}`,
      ]), ['order']));
    } catch (error) {
      console.error(`Failed to fetch admin order ${id}:`, error);
      return (await getAllOrders()).find((order) => order.id === id) || null;
    }
  },

  async updateOrder(id: string, data: UpdateOrderData) {
    if (!USE_BACKEND) return updateOrder(id, data);

    try {
      return normalizeOrder(unwrapApiData<Order>(await apiRequestAny([
        `/admin/orders/${id}`,
        `/orders/admin/${id}/status`,
      ], {
        method: 'PATCH',
        body: JSON.stringify(data),
      }), ['order']));
    } catch (error) {
      console.error(`Failed to update admin order ${id}:`, error);
      throw error;
    }
  },

  async updateOrderStatus(id: string, status: OrderStatus) {
    return updateOrder(id, { orderStatus: status, status });
  },

  async updateOrderTracking(id: string, trackingNumber: string) {
    if (!USE_BACKEND) return updateOrder(id, { trackingNumber });

    try {
      return normalizeOrder(unwrapApiData<Order>(await apiRequestAny([
        `/admin/orders/${id}/tracking`,
        `/orders/admin/${id}/tracking`,
      ], {
        method: 'PATCH',
        body: JSON.stringify({ trackingNumber }),
      }), ['order']));
    } catch (error) {
      console.error(`Failed to update tracking for order ${id}:`, error);
      throw error;
    }
  },

  async getSupportTickets() {
    if (!USE_BACKEND) return getAllSupportTickets();

    try {
      const tickets = unwrapApiData<SupportTicket[]>(await apiRequestAny([
        '/admin/support/tickets',
        '/support/admin/all',
      ]), ['tickets', 'items']);
      return Array.isArray(tickets) ? tickets.map(normalizeSupportTicket) : [];
    } catch (error) {
      console.error('Failed to fetch admin support tickets:', error);
      throw error;
    }
  },

  async updateSupportTicketStatus(id: string, status: TicketStatus) {
    if (!USE_BACKEND) {
      const ticket = getAllSupportTickets().find((item) => item.id === id);
      if (!ticket) return null;

      const updatedTicket = { ...ticket, status };
      const storedTickets = readStoredSupportTickets();
      const nextStoredTickets = storedTickets.some((item) => item.id === id)
        ? storedTickets.map((item) => (item.id === id ? updatedTicket : item))
        : [updatedTicket, ...storedTickets];

      writeStoredSupportTickets(nextStoredTickets);
      return updatedTicket;
    }

    try {
      return normalizeSupportTicket(unwrapApiData<SupportTicket>(await apiRequestAny([
        `/admin/support/tickets/${id}`,
        `/support/admin/${id}/status`,
      ], {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }), ['ticket']));
    } catch (error) {
      console.error(`Failed to update support ticket ${id}:`, error);
      throw error;
    }
  },
};

export { DELETED_PRODUCTS_STORAGE_KEY };
