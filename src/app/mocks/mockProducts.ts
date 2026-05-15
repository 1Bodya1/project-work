import type { Product, ProductType } from '../types';
import type { ProductMockupViews } from '../lib/productMockups';

type ProductMockups = NonNullable<Product['mockups']>;
type ProductMockupsByColor = NonNullable<Product['mockupsByColor']>;
type ProductPrintAreas = NonNullable<Product['printAreas']>;

export const productPrintAreasByType: Record<ProductType, ProductPrintAreas> = {
  tshirt: [
    { key: 'front', label: 'Front', type: 'uv' },
    { key: 'back', label: 'Back', type: 'uv' },
    { key: 'leftSleeve', label: 'Left sleeve', type: 'uv' },
    { key: 'rightSleeve', label: 'Right sleeve', type: 'uv' },
    { key: 'leftSide', label: 'Left side', type: 'uv' },
    { key: 'rightSide', label: 'Right side', type: 'uv' },
  ],
  mug: [
    { key: 'handle', label: 'Handle', type: 'decal' },
    { key: 'outer', label: 'Outer side', type: 'uv-or-decal' },
  ],
  laptop: [
    { key: 'lid', label: 'Screen back', type: 'decal' },
    { key: 'palmRest', label: 'Lower case', type: 'decal' },
  ],
  custom: [
    { key: 'front', label: 'Front', type: 'decal' },
  ],
};

const tshirtPrintAreas = productPrintAreasByType.tshirt;

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

function createMockupsByColor(category: string, colors: string[]): ProductMockupsByColor {
  return colors.reduce((mockups, color) => ({
    ...mockups,
    [colorSlugs[color] || color.toLowerCase().replace(/[^a-z0-9]+/g, '-')]: baseMockups(category),
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
    category: 'T-shirt',
    productType: 'tshirt',
    model3dUrl: '/models/tshirt.glb',
    customizationMode: 'multi-placement',
    printAreas: tshirtPrintAreas,
    customizable: true,
    isCustomizable: true,
    stock: 40,
    createdAt: '2026-05-01',
    printArea: { x: 31, y: 30, width: 38, height: 34 },
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
    category: 'T-shirt',
    productType: 'tshirt',
    model3dUrl: '/models/tshirt.glb',
    customizationMode: 'multi-placement',
    printAreas: tshirtPrintAreas,
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
    category: 'T-shirt',
    productType: 'tshirt',
    model3dUrl: '/models/tshirt.glb',
    customizationMode: 'multi-placement',
    printAreas: tshirtPrintAreas,
    customizable: true,
    isCustomizable: true,
    stock: 36,
    createdAt: '2026-04-24',
    printArea: { x: 31, y: 30, width: 38, height: 34 },
  }),
];
