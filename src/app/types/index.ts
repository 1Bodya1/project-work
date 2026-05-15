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
  twoFactorEnabled?: boolean;
  city?: {
    ref?: string;
    description?: string;
  };
  novaPoshtaWarehouse?: {
    ref?: string;
    description?: string;
    shortAddress?: string;
    number?: string;
  };
}

export interface NovaPoshtaCity {
  ref: string;
  description: string;
  descriptionRu?: string;
  areaDescription?: string;
  settlementTypeDescription?: string;
}

export interface NovaPoshtaWarehouse {
  ref: string;
  description: string;
  shortAddress?: string;
  number?: string;
  typeOfWarehouse?: string;
  categoryOfWarehouse?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type ProductType = 'tshirt' | 'mug' | 'laptop' | 'custom';
export type CustomizationMode = 'multi-placement' | 'single-surface' | 'wrap';
export type ProductPrintAreaKey =
  | 'front'
  | 'back'
  | 'leftSleeve'
  | 'rightSleeve'
  | 'leftSide'
  | 'rightSide'
  | 'wrap'
  | 'handle'
  | 'outer'
  | 'lid'
  | 'palmRest';
export type ProductPrintAreaType = 'uv' | 'decal' | 'uv-or-decal';

export interface ProductPrintArea {
  key: ProductPrintAreaKey;
  label: string;
  type: ProductPrintAreaType;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  title?: string;
  price: number;
  productType?: ProductType;
  model3dUrl?: string;
  customizationMode?: CustomizationMode;
  printAreas?: ProductPrintArea[];
  image: string;
  images?: string[];
  mockups?: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
  mockupsByColor?: Record<string, {
    front: string;
    back: string;
    left: string;
    right: string;
  }>;
  colorOptions?: ProductColorOption[];
  colors?: string[];
  category?: string;
  featured?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
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
  customDesignId?: string;
  productId?: string;
  productTitle?: string;
  uploadedImageUrl?: string;
  imageUrl?: string;
  previewUrl?: string;
  screenshot3dUrl?: string;
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
  productType?: ProductType;
  title: string;
  name?: string;
  image?: string;
  previewUrl?: string;
  screenshot3dUrl?: string;
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
  productType?: ProductType;
  name: string;
  image: string;
  previewUrl?: string;
  screenshot3dUrl?: string;
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
  city: string | {
    ref?: string;
    description?: string;
  };
  warehouse: string | {
    ref?: string;
    description?: string;
    shortAddress?: string;
    number?: string;
  };
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
