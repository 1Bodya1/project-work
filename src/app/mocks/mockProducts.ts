import type { Product } from '../types';

type ProductMockups = NonNullable<Product['mockups']>;

const tshirtMockups: ProductMockups = {
  front: '/mockups/tshirt/front.png',
  back: '/mockups/tshirt/back.png',
  left: '/mockups/tshirt/left.png',
  right: '/mockups/tshirt/right.png',
};

const hoodieMockups: ProductMockups = {
  front: '/mockups/hoodie/front.png',
  back: '/mockups/hoodie/back.png',
  left: '/mockups/hoodie/left.png',
  right: '/mockups/hoodie/right.png',
};

const sweatshirtMockups: ProductMockups = {
  front: '/mockups/sweatshirt/front.png',
  back: '/mockups/sweatshirt/back.png',
  left: '/mockups/sweatshirt/left.png',
  right: '/mockups/sweatshirt/right.png',
};

function createProduct(data: Omit<Product, 'image' | 'images'> & { mockups: ProductMockups }): Product {
  const mockups = data.mockups;

  return {
    ...data,
    image: mockups.front,
    images: [mockups.front, mockups.back, mockups.left, mockups.right],
  };
}

export const mockProducts: Product[] = [
  createProduct({
    id: '1',
    name: 'Classic White T-Shirt',
    price: 399,
    mockups: tshirtMockups,
    description: 'Premium quality cotton t-shirt perfect for customization. Made from soft everyday fabric with a comfortable fit.',
    colors: ['#FFFFFF', '#000000', '#7A1F2A'],
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'T-Shirts',
    customizable: true,
    isCustomizable: true,
    stock: 40,
    createdAt: '2026-05-01',
    printArea: { x: 31, y: 30, width: 38, height: 34 },
  }),
  createProduct({
    id: '2',
    name: 'Premium Black Hoodie',
    price: 899,
    mockups: hoodieMockups,
    description: 'Warm premium hoodie with a dense feel, clean silhouette, and customization-ready front area.',
    colors: ['#000000', '#1A1A1A', '#FFFFFF'],
    sizes: ['M', 'L', 'XL'],
    category: 'Hoodies',
    customizable: true,
    isCustomizable: true,
    stock: 24,
    createdAt: '2026-05-03',
    printArea: { x: 32, y: 34, width: 36, height: 30 },
  }),
  createProduct({
    id: '3',
    name: 'Comfort Sweatshirt',
    price: 699,
    mockups: sweatshirtMockups,
    description: 'Soft sweatshirt for everyday wear with a relaxed fit and smooth print surface.',
    colors: ['#F5F5F5', '#7A1F2A', '#000000'],
    sizes: ['S', 'M', 'L'],
    category: 'Sweatshirts',
    customizable: true,
    isCustomizable: true,
    stock: 32,
    createdAt: '2026-04-26',
    printArea: { x: 32, y: 31, width: 36, height: 33 },
  }),
  createProduct({
    id: '4',
    name: 'Cotton Oversized Tee',
    price: 449,
    mockups: tshirtMockups,
    description: 'Oversized cotton tee with a modern shape and plenty of room for custom artwork.',
    colors: ['#FFFFFF', '#F5F5F5', '#1A1A1A'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'T-Shirts',
    customizable: true,
    isCustomizable: true,
    stock: 28,
    createdAt: '2026-04-30',
    printArea: { x: 31, y: 30, width: 38, height: 34 },
  }),
  createProduct({
    id: '5',
    name: 'Minimalist Black Tee',
    price: 399,
    mockups: tshirtMockups,
    description: 'Minimal black tee with a simple cut and durable fabric for daily use.',
    colors: ['#000000', '#FFFFFF'],
    sizes: ['S', 'M', 'L'],
    category: 'T-Shirts',
    customizable: true,
    isCustomizable: true,
    stock: 36,
    createdAt: '2026-04-24',
    printArea: { x: 31, y: 30, width: 38, height: 34 },
  }),
  createProduct({
    id: '6',
    name: 'Urban Hoodie Gray',
    price: 849,
    mockups: hoodieMockups,
    description: 'Urban gray hoodie with a comfortable fit, warm texture, and customizable print area.',
    colors: ['#1A1A1A', '#F5F5F5'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    category: 'Hoodies',
    customizable: true,
    isCustomizable: true,
    stock: 18,
    createdAt: '2026-05-04',
    printArea: { x: 32, y: 34, width: 36, height: 30 },
  }),
];
