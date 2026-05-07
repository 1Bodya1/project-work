import type { Product } from '../types';
import type { ProductMockupViews } from '../lib/productMockups';

type ProductMockups = NonNullable<Product['mockups']>;
type ProductMockupsByColor = NonNullable<Product['mockupsByColor']>;

const colorSlugs: Record<string, string> = {
  '#FFFFFF': 'white',
  '#000000': 'black',
  '#7A1F2A': 'black',
  '#F5F5F5': 'gray',
  '#1A1A1A': 'black',
};

function baseMockups(category: string): ProductMockupViews {
  return {
    front: `/mockups/${category}/front.png`,
    back: `/mockups/${category}/back.png`,
    left: `/mockups/${category}/left.png`,
    right: `/mockups/${category}/right.png`,
  };
}

function colorMockups(category: string, color: string): ProductMockupViews {
  const colorSlug = colorSlugs[color] || color.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    front: `/mockups/${category}/${colorSlug}/front.png`,
    back: `/mockups/${category}/${colorSlug}/back.png`,
    left: `/mockups/${category}/${colorSlug}/left.png`,
    right: `/mockups/${category}/${colorSlug}/right.png`,
  };
}

function createMockupsByColor(category: string, colors: string[]): ProductMockupsByColor {
  return colors.reduce((mockups, color) => ({
    ...mockups,
    [colorSlugs[color] || color.toLowerCase().replace(/[^a-z0-9]+/g, '-')]: colorMockups(category, color),
  }), {} as ProductMockupsByColor);
}

function createProduct(data: Omit<Product, 'image' | 'images' | 'mockups' | 'mockupsByColor'> & {
  mockups: ProductMockups;
  mockupsByColor: ProductMockupsByColor;
}): Product {
  const defaultMockups = data.mockupsByColor.white || Object.values(data.mockupsByColor)[0] || data.mockups;

  return {
    ...data,
    image: defaultMockups.front,
    images: [defaultMockups.front, defaultMockups.back, defaultMockups.left, defaultMockups.right],
  };
}

export const mockProducts: Product[] = [
  createProduct({
    id: '1',
    name: 'Classic White T-Shirt',
    price: 399,
    mockups: baseMockups('tshirt'),
    mockupsByColor: createMockupsByColor('tshirt', ['#FFFFFF', '#000000', '#F5F5F5']),
    description: 'Premium quality cotton t-shirt perfect for customization. Made from soft everyday fabric with a comfortable fit.',
    colors: ['#FFFFFF', '#000000', '#F5F5F5'],
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
    mockups: baseMockups('hoodie'),
    mockupsByColor: createMockupsByColor('hoodie', ['#FFFFFF', '#000000', '#F5F5F5']),
    description: 'Warm premium hoodie with a dense feel, clean silhouette, and customization-ready front area.',
    colors: ['#000000', '#F5F5F5', '#FFFFFF'],
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
    mockups: baseMockups('sweatshirt'),
    mockupsByColor: createMockupsByColor('sweatshirt', ['#FFFFFF', '#000000', '#F5F5F5']),
    description: 'Soft sweatshirt for everyday wear with a relaxed fit and smooth print surface.',
    colors: ['#F5F5F5', '#000000', '#FFFFFF'],
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
    mockups: baseMockups('tshirt'),
    mockupsByColor: createMockupsByColor('tshirt', ['#FFFFFF', '#000000', '#F5F5F5']),
    description: 'Oversized cotton tee with a modern shape and plenty of room for custom artwork.',
    colors: ['#FFFFFF', '#F5F5F5', '#000000'],
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
    mockups: baseMockups('tshirt'),
    mockupsByColor: createMockupsByColor('tshirt', ['#FFFFFF', '#000000', '#F5F5F5']),
    description: 'Minimal black tee with a simple cut and durable fabric for daily use.',
    colors: ['#000000', '#FFFFFF', '#F5F5F5'],
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
    mockups: baseMockups('hoodie'),
    mockupsByColor: createMockupsByColor('hoodie', ['#FFFFFF', '#000000', '#F5F5F5']),
    description: 'Urban gray hoodie with a comfortable fit, warm texture, and customizable print area.',
    colors: ['#F5F5F5', '#000000', '#FFFFFF'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    category: 'Hoodies',
    customizable: true,
    isCustomizable: true,
    stock: 18,
    createdAt: '2026-05-04',
    printArea: { x: 32, y: 34, width: 36, height: 30 },
  }),
];
