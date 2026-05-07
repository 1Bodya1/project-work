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
  mockups?: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
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
  productTitle?: string;
  uploadedImageUrl?: string;
  imageUrl?: string;
  previewUrl?: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  selectedColor?: string;
  selectedSize?: string;
  activePlacement?: string;
  previewMode?: '2d' | '3d';
  placements?: Record<string, CustomDesignPlacement>;
  usedPlacements?: string[];
  canvasState?: unknown;
  createdAt?: string;
}

export interface CustomDesignPlacement {
  uploadedImage: string | null;
  uploadedImageUrl?: string | null;
  previewUrl?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  isActive?: boolean;
  label?: string;
  view?: string;
  printArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
  customDesign?: CustomDesign;
  customDesignPlacements?: CustomDesign['placements'];
  usedPlacements?: string[];
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
  previewUrl?: string;
  customImage?: string;
  customDesignImage?: string;
  customDesignId?: string;
  uploadedImageUrl?: string;
  size?: string;
  color?: string;
  quantity: number;
  price?: number;
  isCustomized?: boolean;
  hasCustomDesign?: boolean;
  designPosition?: { x: number; y: number };
  designScale?: number;
  designRotation?: number;
  customDesign?: CustomDesign;
  customDesignPlacements?: CustomDesign['placements'];
  usedPlacements?: string[];
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
  orderNumber?: string;
  date: string;
  subtotal?: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
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
  userId?: string;
  userEmail?: string;
  subject: string;
  orderNumber?: string;
  customer: { name: string; email: string };
  date: string;
  createdAt?: string;
  status: TicketStatus;
  message: string;
}
