export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
  | 'new'
  | 'pending'
  | 'paid'
  | 'processing'
  | 'production'
  | 'shipped'
  | 'completed'
  | 'delivered'
  | 'cancelled';
export type TicketStatus = 'new' | 'in_progress' | 'resolved';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  colors?: string[];
  category?: string;
  customizable?: boolean;
  isCustomizable?: boolean;
  description?: string;
  sizes?: string[];
  stock?: number;
  createdAt?: string;
  printArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CustomDesign {
  id: string;
  productId?: string;
  uploadedImageUrl?: string;
  imageUrl?: string;
  previewUrl?: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  selectedColor?: string;
  selectedSize?: string;
  canvasState?: unknown;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  name?: string;
  image?: string;
  previewUrl?: string;
  customImage?: string;
  customDesignId?: string;
  designId?: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  isCustomized: boolean;
  hasCustomDesign?: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalPrice: number;
  total: number;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  name: string;
  image: string;
  customImage?: string;
  customDesignImage?: string;
  size?: string;
  color?: string;
  quantity: number;
  price?: number;
  hasCustomDesign?: boolean;
}

export interface DeliveryInfo {
  provider?: string;
  city: string;
  warehouse: string;
  comment?: string;
  status?: string;
}

export interface OrderTimelineStep {
  status: string;
  date: string;
  completed: boolean;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  paymentStatus: PaymentStatus;
  paymentProvider?: string;
  status?: OrderStatus;
  orderStatus?: OrderStatus;
  trackingNumber?: string;
  deliveryStatus?: string;
  customer?: { name: string; email: string; phone?: string };
  delivery?: DeliveryInfo;
  items: OrderItem[];
  timeline?: OrderTimelineStep[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  orderNumber?: string;
  customer: { name: string; email: string };
  date: string;
  status: TicketStatus;
  message: string;
}
