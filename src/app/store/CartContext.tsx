import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';
import type { CartItem } from '../types';

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

type CartContextValue = {
  items: CartItem[];
  totalPrice: number;
  isLoading: boolean;
  getCart: () => Promise<void>;
  addItem: (data: AddCartItemData) => Promise<void>;
  updateItem: (itemId: string, data: UpdateCartItemData) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function syncCart(action: () => Promise<{ items: CartItem[] }>) {
    const cart = await action();
    setItems(cart.items);
  }

  async function getCart() {
    try {
      await syncCart(() => cartService.getCart());
    } finally {
      setIsLoading(false);
    }
  }

  async function addItem(data: AddCartItemData) {
    await syncCart(() => cartService.addItem(data));
  }

  async function updateItem(itemId: string, data: UpdateCartItemData) {
    await syncCart(() => cartService.updateItem(itemId, data));
  }

  async function removeItem(itemId: string) {
    await syncCart(() => cartService.removeItem(itemId));
  }

  async function clearCart() {
    await syncCart(() => cartService.clearCart());
  }

  useEffect(() => {
    getCart();
  }, []);

  const value = useMemo(
    () => ({
      items,
      totalPrice,
      isLoading,
      getCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    }),
    [isLoading, items, totalPrice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
