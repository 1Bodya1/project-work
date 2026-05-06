import { mockCart } from '../mocks/mockCart';
import type { Cart, CartItem } from '../types';

type AddCartItemData = Omit<CartItem, 'id'>;
type UpdateCartItemData = Partial<
  Pick<
    CartItem,
    | 'quantity'
    | 'size'
    | 'color'
    | 'customImage'
    | 'customDesignId'
    | 'designId'
    | 'isCustomized'
    | 'hasCustomDesign'
  >
>;

const CART_STORAGE_KEY = 'solution_cart';

function normalizeItem(item: CartItem): CartItem {
  const title = item.title || item.name || 'Product';
  const customDesignPlacements = item.customDesignPlacements || item.customDesign?.placements;
  const usedPlacements =
    item.usedPlacements ||
    Object.values(customDesignPlacements || {})
      .filter((placement) => placement.uploadedImage)
      .map((placement) => placement.label || 'Placement');

  return {
    ...item,
    title,
    name: item.name || title,
    image: item.image || item.previewUrl,
    previewUrl: item.previewUrl || item.image,
    customDesignId: item.customDesignId || item.designId,
    isCustomized: item.isCustomized ?? Boolean(item.hasCustomDesign || item.customImage),
    hasCustomDesign: item.hasCustomDesign ?? item.isCustomized,
    customDesignPlacements,
    usedPlacements,
  };
}

function readItems() {
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!storedCart) {
    const initialItems = mockCart.map(normalizeItem);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(initialItems));
    return initialItems;
  }

  try {
    return (JSON.parse(storedCart) as CartItem[]).map(normalizeItem);
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return mockCart.map(normalizeItem);
  }
}

function writeItems(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
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

export const cartService = {
  async getCart() {
    return buildCart(readItems());
  },

  async addItem(data: AddCartItemData) {
    const item: CartItem = normalizeItem({ id: `CRT-${Date.now()}`, ...data });
    const items = [...readItems(), item];
    writeItems(items);
    return buildCart(items);
  },

  async updateItem(itemId: string, data: UpdateCartItemData) {
    const items = readItems().map((item) => (item.id === itemId ? normalizeItem({ ...item, ...data }) : item));
    writeItems(items);
    return buildCart(items);
  },

  async removeItem(itemId: string) {
    const items = readItems().filter((item) => item.id !== itemId);
    writeItems(items);
    return buildCart(items);
  },

  async clearCart() {
    writeItems([]);
    return buildCart([]);
  },
};

export { CART_STORAGE_KEY };
