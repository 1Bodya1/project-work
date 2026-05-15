import { apiRequest, unwrapApiData, USE_BACKEND } from './api';
import type { Cart, CartItem } from '../types';

type AddCartItemData = Omit<CartItem, 'id'>;
type UpdateCartItemData = Partial<Omit<CartItem, 'id'>>;

const CART_STORAGE_KEY = 'solution_cart';
const PENDING_PAYMENT_CART_STORAGE_KEY = 'solution_pending_payment_cart';

function normalizeItem(value: unknown): CartItem {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const product = record.product && typeof record.product === 'object' ? record.product as Record<string, unknown> : {};
  const customDesign = record.customDesign && typeof record.customDesign === 'object'
    ? record.customDesign as CartItem['customDesign']
    : undefined;
  const title = String(record.title || record.name || product.title || product.name || 'Product');
  const customDesignPlacements = record.customDesignPlacements || customDesign?.placements;
  const usedPlacements =
    (Array.isArray(record.usedPlacements) ? record.usedPlacements.map(String) : undefined) ||
    Object.values(customDesignPlacements || {})
      .filter((placement) => placement && typeof placement === 'object' && (placement.uploadedImage || placement.uploadedImageUrl || placement.previewUrl))
      .map((placement) => placement.label || 'Placement');

  return {
    ...(record as CartItem),
    id: String(record.id || record._id || record.itemId || `CRT-${Date.now()}`),
    productId: String(record.productId || product.id || product._id || ''),
    productType: record.productType as CartItem['productType'] || product.productType as CartItem['productType'],
    title,
    name: String(record.name || title),
    image: String(record.image || record.previewUrl || product.image || ''),
    previewUrl: String(record.screenshot3dUrl || record.screenshot_3d_url || record.previewUrl || record.image || product.image || ''),
    screenshot3dUrl: record.screenshot3dUrl ? String(record.screenshot3dUrl) : record.screenshot_3d_url ? String(record.screenshot_3d_url) : undefined,
    customDesignId: record.customDesignId ? String(record.customDesignId) : record.designId ? String(record.designId) : undefined,
    quantity: Number(record.quantity || 1),
    price: Number(record.price || product.price || 0),
    size: String(record.size || ''),
    color: String(record.color || ''),
    isCustomized: Boolean(record.isCustomized ?? record.hasCustomDesign ?? record.customDesignId ?? record.previewUrl),
    hasCustomDesign: Boolean(record.hasCustomDesign ?? record.isCustomized ?? record.customDesignId ?? record.previewUrl),
    customDesign,
    customDesignPlacements: customDesignPlacements as CartItem['customDesignPlacements'],
    usedPlacements,
  };
}

function readItems() {
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!storedCart) {
    return [];
  }

  try {
    return (JSON.parse(storedCart) as unknown[]).map(normalizeItem);
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

function readPendingPaymentItems() {
  const storedCart = sessionStorage.getItem(PENDING_PAYMENT_CART_STORAGE_KEY);
  if (!storedCart) return [];

  try {
    return (JSON.parse(storedCart) as unknown[]).map(normalizeItem);
  } catch {
    sessionStorage.removeItem(PENDING_PAYMENT_CART_STORAGE_KEY);
    return [];
  }
}

function writeItems(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function writePendingPaymentItems(items: CartItem[]) {
  if (readPendingPaymentItems().length === 0) return;

  if (items.length === 0) {
    sessionStorage.removeItem(PENDING_PAYMENT_CART_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(PENDING_PAYMENT_CART_STORAGE_KEY, JSON.stringify(items.map(normalizeItem)));
}

function buildCart(items: CartItem[]): Cart {
  const normalizedItems = items.map(normalizeItem);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    id: 'mock-cart',
    items: normalizedItems,
    subtotal,
    totalPrice: subtotal,
    total: subtotal,
  };
}

function normalizeCart(value: unknown): Cart {
  const cart = unwrapApiData<Partial<Cart> | CartItem[]>(value, ['cart', 'items']);
  if (Array.isArray(cart)) return buildCart(cart.map(normalizeItem));

  return buildCart(((cart?.items || []) as unknown[]).map(normalizeItem));
}

export const cartService = {
  async getCart() {
    if (!USE_BACKEND) return buildCart(readItems());

    try {
      const cart = normalizeCart(await apiRequest('/cart'));
      const pendingPaymentItems = readPendingPaymentItems();
      if (cart.items.length === 0 && pendingPaymentItems.length > 0) {
        writeItems(pendingPaymentItems);
        return buildCart(pendingPaymentItems);
      }
      const storedItems = readItems();
      if (cart.items.length === 0 && storedItems.length > 0) {
        return buildCart(storedItems);
      }

      writeItems(cart.items);
      return cart;
    } catch (error) {
      console.error('Failed to load backend cart:', error);
      throw error;
    }
  },

  async addItem(data: AddCartItemData) {
    if (!USE_BACKEND) {
      const item: CartItem = normalizeItem({ id: `CRT-${Date.now()}`, ...data });
      const items = [...readItems(), item];
      writeItems(items);
      writePendingPaymentItems(items);
      return buildCart(items);
    }

    try {
      const cart = normalizeCart(await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }));
      writeItems(cart.items);
      writePendingPaymentItems(cart.items);
      return cart;
    } catch (error) {
      console.error('Failed to add backend cart item:', error);
      throw error;
    }
  },

  async updateItem(itemId: string, data: UpdateCartItemData) {
    if (!USE_BACKEND) {
      const items = readItems().map((item) => (item.id === itemId ? normalizeItem({ ...item, ...data }) : item));
      writeItems(items);
      writePendingPaymentItems(items);
      return buildCart(items);
    }

    const optimisticItems = readItems().map((item) => (item.id === itemId ? normalizeItem({ ...item, ...data }) : item));
    writeItems(optimisticItems);
    writePendingPaymentItems(optimisticItems);

    try {
      const cart = normalizeCart(await apiRequest(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }));
      const nextItems = cart.items.length > 0 ? cart.items : optimisticItems;
      writeItems(nextItems);
      writePendingPaymentItems(nextItems);
      return buildCart(nextItems);
    } catch (error) {
      console.error(`Failed to update backend cart item ${itemId}:`, error);
      return buildCart(optimisticItems);
    }
  },

  async removeItem(itemId: string) {
    if (!USE_BACKEND) {
      const items = readItems().filter((item) => item.id !== itemId);
      writeItems(items);
      writePendingPaymentItems(items);
      return buildCart(items);
    }

    const optimisticItems = readItems().filter((item) => item.id !== itemId);
    writeItems(optimisticItems);
    writePendingPaymentItems(optimisticItems);

    try {
      const cart = normalizeCart(await apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' }));
      const nextItems = cart.items.length > 0 || optimisticItems.length === 0 ? cart.items : optimisticItems;
      writeItems(nextItems);
      writePendingPaymentItems(nextItems);
      return buildCart(nextItems);
    } catch (error) {
      console.error(`Failed to remove backend cart item ${itemId}:`, error);
      return buildCart(optimisticItems);
    }
  },

  async clearCart() {
    sessionStorage.removeItem(PENDING_PAYMENT_CART_STORAGE_KEY);

    if (!USE_BACKEND) {
      writeItems([]);
      return buildCart([]);
    }

    try {
      const cart = normalizeCart(await apiRequest('/cart', { method: 'DELETE' }));
      writeItems(cart.items);
      return cart;
    } catch (error) {
      console.error('Failed to clear backend cart:', error);
      throw error;
    }
  },

  savePendingPaymentCart(items: CartItem[]) {
    sessionStorage.setItem(PENDING_PAYMENT_CART_STORAGE_KEY, JSON.stringify(items.map(normalizeItem)));
    writeItems(items.map(normalizeItem));
  },

  restorePendingPaymentCart() {
    const pendingItems = readPendingPaymentItems();
    if (pendingItems.length === 0) return buildCart(readItems());

    writeItems(pendingItems);
    return buildCart(pendingItems);
  },

  clearPendingPaymentCart() {
    sessionStorage.removeItem(PENDING_PAYMENT_CART_STORAGE_KEY);
  },

  getStoredCart() {
    const pendingItems = readPendingPaymentItems();
    return buildCart(pendingItems.length > 0 ? pendingItems : readItems());
  },

  hasRecoverableCart() {
    return readPendingPaymentItems().length > 0;
  },
};

export { CART_STORAGE_KEY };
