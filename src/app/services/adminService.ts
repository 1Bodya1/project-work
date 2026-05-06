import { mockOrders } from '../mocks/mockOrders';
import { mockProducts } from '../mocks/mockProducts';
import { mockSupportTickets } from '../mocks/mockSupportTickets';
import { DESIGN_STORAGE_KEY } from './designService';
import { ORDERS_STORAGE_KEY } from './orderService';
import { SUPPORT_TICKETS_STORAGE_KEY } from './supportService';
import type { CustomDesign, Order, OrderItem, OrderStatus, Product, SupportTicket, TicketStatus } from '../types';

type CreateProductData = Omit<Product, 'id'>;
type UpdateProductData = Partial<Omit<Product, 'id'>>;
type UpdateOrderData = Partial<Pick<Order, 'orderStatus' | 'status' | 'trackingNumber' | 'deliveryStatus'>>;
const PRODUCTS_STORAGE_KEY = 'solution_admin_products';
const DELETED_PRODUCTS_STORAGE_KEY = 'solution_deleted_products';

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
    return JSON.parse(storedOrders) as Order[];
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
    return JSON.parse(storedTickets) as SupportTicket[];
  } catch {
    localStorage.removeItem(SUPPORT_TICKETS_STORAGE_KEY);
    return [];
  }
}

function writeStoredSupportTickets(tickets: SupportTicket[]) {
  localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

function getAllSupportTickets() {
  const storedTickets = readStoredSupportTickets();
  const storedTicketIds = new Set(storedTickets.map((ticket) => ticket.id));
  const availableMockTickets = mockSupportTickets.filter((ticket) => !storedTicketIds.has(ticket.id));

  return [...storedTickets, ...availableMockTickets];
}

function normalizeOrder(order: Order): Order {
  const rawStatus = order.orderStatus || order.status || 'new';
  const orderStatus = rawStatus === 'pending' ? 'new' : rawStatus === 'delivered' ? 'completed' : rawStatus;
  const designs = readStoredDesigns();
  const items = order.items.map((item) => enrichOrderItemWithDesign(item, designs));

  return {
    ...order,
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

  if (!design) {
    return {
      ...item,
      previewUrl: item.previewUrl || item.customDesignImage || item.customImage,
      uploadedImageUrl: item.uploadedImageUrl || item.customImage || item.customDesignImage,
      hasCustomDesign: item.hasCustomDesign || Boolean(item.customDesignId || item.previewUrl || item.customImage || item.customDesignImage),
    };
  }

  return {
    ...item,
    customDesignId: item.customDesignId || design.id,
    previewUrl: item.previewUrl || design.previewUrl || design.uploadedImageUrl || design.imageUrl,
    uploadedImageUrl: item.uploadedImageUrl || design.uploadedImageUrl || design.imageUrl,
    customImage: item.customImage || design.uploadedImageUrl || design.previewUrl,
    customDesignImage: item.customDesignImage || design.previewUrl || design.uploadedImageUrl,
    size: item.size || design.selectedSize,
    color: item.color || design.selectedColor,
    hasCustomDesign: true,
    designPosition: item.designPosition || design.position,
    designScale: item.designScale ?? design.scale,
    designRotation: item.designRotation ?? design.rotation,
  };
}

async function getAllOrders() {
  const storedOrders = readStoredOrders().map(normalizeOrder);
  const storedOrderIds = new Set(storedOrders.map((order) => order.id));
  const availableMockOrders = mockOrders
    .filter((order) => !storedOrderIds.has(order.id))
    .map(normalizeOrder);

  return [...storedOrders, ...availableMockOrders];
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
  async getProducts() {
    const storedProducts = readStoredProducts();
    const storedProductIds = new Set(storedProducts.map((product) => product.id));
    const deletedProductIds = new Set(readDeletedProductIds());
    const availableMockProducts = mockProducts.filter(
      (product) => !storedProductIds.has(product.id) && !deletedProductIds.has(product.id),
    );

    return [...storedProducts, ...availableMockProducts];
  },

  async createProduct(data: CreateProductData) {
    const product = { id: `PRD-${Date.now()}`, ...data };
    writeStoredProducts([product, ...readStoredProducts()]);
    return product;
  },

  async updateProduct(id: string, data: UpdateProductData) {
    const products = await this.getProducts();
    const product = products.find((item) => item.id === id);
    if (!product) return null;

    const updatedProduct = { ...product, ...data };
    const storedProducts = readStoredProducts();
    const nextStoredProducts = storedProducts.some((item) => item.id === id)
      ? storedProducts.map((item) => (item.id === id ? updatedProduct : item))
      : [updatedProduct, ...storedProducts];

    writeStoredProducts(nextStoredProducts);
    return updatedProduct;
  },

  async deleteProduct(id: string) {
    writeStoredProducts(readStoredProducts().filter((product) => product.id !== id));
    writeDeletedProductIds(Array.from(new Set([...readDeletedProductIds(), id])));
    return { success: true, id };
  },

  async getOrders() {
    return getAllOrders();
  },

  async getOrderById(id: string) {
    return (await getAllOrders()).find((order) => order.id === id) || null;
  },

  async updateOrder(id: string, data: UpdateOrderData) {
    return updateOrder(id, data);
  },

  async updateOrderStatus(id: string, status: OrderStatus) {
    return updateOrder(id, { orderStatus: status, status });
  },

  async updateOrderTracking(id: string, trackingNumber: string) {
    return updateOrder(id, { trackingNumber });
  },

  async getSupportTickets() {
    return getAllSupportTickets();
  },

  async updateSupportTicketStatus(id: string, status: TicketStatus) {
    const ticket = getAllSupportTickets().find((item) => item.id === id);
    if (!ticket) return null;

    const updatedTicket = { ...ticket, status };
    const storedTickets = readStoredSupportTickets();
    const nextStoredTickets = storedTickets.some((item) => item.id === id)
      ? storedTickets.map((item) => (item.id === id ? updatedTicket : item))
      : [updatedTicket, ...storedTickets];

    writeStoredSupportTickets(nextStoredTickets);
    return updatedTicket;
  },
};

export { PRODUCTS_STORAGE_KEY, DELETED_PRODUCTS_STORAGE_KEY };
