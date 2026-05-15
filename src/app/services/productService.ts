import { API_BASE_URL, ApiError, apiRequest, apiRequestAny, USE_BACKEND } from './api';
import { mockProducts, productPrintAreasByType } from '../mocks/mockProducts';
import type {
  Category,
  CustomizationMode,
  Product,
  ProductColorOption,
  ProductPrintArea,
  ProductType,
} from '../types';

type ProductFilters = {
  category?: string;
  color?: string;
  size?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc';
};

const ADMIN_PRODUCTS_STORAGE_KEY = 'solution_admin_products';
const productTypes = new Set<ProductType>(['tshirt', 'mug', 'laptop', 'custom']);

const defaultCategories: Record<ProductType, string> = {
  tshirt: 'T-shirt',
  mug: 'Mugs',
  laptop: 'Laptops',
  custom: 'Custom',
};

const defaultModes: Record<ProductType, CustomizationMode> = {
  tshirt: 'multi-placement',
  mug: 'multi-placement',
  laptop: 'multi-placement',
  custom: 'single-surface',
};

const defaultModels: Partial<Record<ProductType, string>> = {
  tshirt: '/models/tshirt.glb',
};

function logProductApiError(context: string, endpoint: string, error: unknown) {
  const url = /^https?:\/\//i.test(endpoint)
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (error instanceof ApiError) {
    console.error(`${context}:`, {
      url,
      status: error.status,
      message: error.message,
      response: error.data,
    });
    return;
  }

  console.error(`${context}:`, { url, error });
}

const colorSlugs: Record<string, string> = {
  '#ffffff': 'white',
  '#fff': 'white',
  '#000000': 'black',
  '#000': 'black',
  '#f5f5f5': 'gray',
  '#7a1f2a': 'black',
  '#1a1a1a': 'black',
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'default';
}

function normalizeCategoryName(category: string) {
  return category.trim().toLowerCase() === 't-shirts' ? 'T-shirt' : category.trim();
}

function unwrapObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : null;

  return (
    (record.product && typeof record.product === 'object' && record.product as Record<string, unknown>) ||
    (record.item && typeof record.item === 'object' && record.item as Record<string, unknown>) ||
    (data?.product && typeof data.product === 'object' && data.product as Record<string, unknown>) ||
    (data?.item && typeof data.item === 'object' && data.item as Record<string, unknown>) ||
    data ||
    record
  );
}

function inferProductType(record: Record<string, unknown>): ProductType {
  const rawType = String(record.productType || record.type || record.kind || '').toLowerCase();
  if (productTypes.has(rawType as ProductType)) return rawType as ProductType;

  const searchable = `${record.category || ''} ${record.name || ''} ${record.title || ''}`.toLowerCase();
  if (searchable.includes('mug')) return 'mug';
  if (searchable.includes('laptop')) return 'laptop';
  if (searchable.includes('shirt') || searchable.includes('tee')) return 'tshirt';

  return 'tshirt';
}

function getHex(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.hex || record.value || record.color || record.code || '');
  }

  return '';
}

function normalizeColors(value: unknown): { colors: string[]; colorOptions: ProductColorOption[] } {
  const values = Array.isArray(value) ? value : [];
  const colorOptions = values
    .map((item) => {
      const hex = getHex(item);
      if (!hex) return null;
      const name = typeof item === 'object' && item
        ? String((item as Record<string, unknown>).name || hex)
        : hex;

      return { name, hex };
    })
    .filter(Boolean) as ProductColorOption[];

  return {
    colors: colorOptions.length ? colorOptions.map((color) => color.hex) : ['#FFFFFF'],
    colorOptions: colorOptions.length ? colorOptions : [{ name: 'White', hex: '#FFFFFF' }],
  };
}

function isOldExternalImage(value: string) {
  return /images\.unsplash\.com|source\.unsplash\.com/i.test(value);
}

function normalizeAssetPath(value: unknown) {
  const path = String(value || '');
  if (!path) return '';
  return path.replace(/^\/public\//, '/').replace(/^public\//, '/');
}

function pickAssetPath(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const firstPath = pickAssetPath(...value);
      if (firstPath) return firstPath;
    } else if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const nestedPath = pickAssetPath(
        record.url,
        record.src,
        record.path,
        record.image,
        record.imageUrl,
        record.secure_url,
      );
      if (nestedPath) return nestedPath;
    } else {
      const path = normalizeAssetPath(value);
      if (path) return path;
    }
  }

  return '';
}

function baseMockups(productType: ProductType, image = '') {
  const category = productType === 'custom' ? 'tshirt' : productType;
  const base = productType === 'mug' ? `/mockups/${category}/white` : `/mockups/${category}`;
  const normalizedImage = normalizeAssetPath(image);
  const safeImage = normalizedImage && !isOldExternalImage(normalizedImage) ? normalizedImage : '';

  return {
    front: safeImage || `${base}/front.png`,
    back: `${base}/back.png`,
    left: `${base}/left.png`,
    right: `${base}/right.png`,
  };
}

function normalizeMockups(value: unknown, productType: ProductType, image = ''): NonNullable<Product['mockups']> {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const fallback = baseMockups(productType, image);

  return {
    front: normalizeAssetPath(record.front || record.main || fallback.front),
    back: normalizeAssetPath(record.back || record.rear || fallback.back),
    left: normalizeAssetPath(record.left || record.leftSide || fallback.left),
    right: normalizeAssetPath(record.right || record.rightSide || fallback.right),
  };
}

function normalizeMockupsByColor(
  value: unknown,
  colors: ProductColorOption[],
  mockups: NonNullable<Product['mockups']>,
  productType: ProductType,
): Product['mockupsByColor'] {
  if (value && typeof value === 'object' && Object.keys(value).length) {
    const record = value as Record<string, unknown>;
    return Object.entries(record).reduce<Product['mockupsByColor']>((acc, [key, nextValue]) => {
      acc[key] = normalizeMockups(nextValue, productType, mockups.front);
      return acc;
    }, {});
  }

  return colors.reduce<Product['mockupsByColor']>((acc, color) => {
    const slug = colorSlugs[color.hex.toLowerCase()] || slugify(color.name || color.hex);
    acc[slug] = mockups;
    return acc;
  }, {});
}

function normalizePrintAreas(value: unknown, productType: ProductType): ProductPrintArea[] {
  const defaultPrintAreas = productPrintAreasByType[productType] || productPrintAreasByType.tshirt;
  const allowedKeys = new Set(defaultPrintAreas.map((area) => area.key));
  if (!Array.isArray(value) || value.length === 0) return defaultPrintAreas;

  const normalizedPrintAreasByKey = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const key = String(record.key || record.id || record.name || 'front') as ProductPrintArea['key'];

      if (!allowedKeys.has(key)) return null;

      const defaultArea = defaultPrintAreas.find((area) => area.key === key);

      return {
        key,
        label: defaultArea?.label || String(record.label || record.name || record.key || 'Print area'),
        type: defaultArea?.type || String(record.type || 'uv') as ProductPrintArea['type'],
      };
    })
    .filter(Boolean)
    .reduce<Record<string, ProductPrintArea>>((areas, area) => {
      areas[area.key] = area;
      return areas;
    }, {});

  return defaultPrintAreas.map((area) => normalizedPrintAreasByKey[area.key] || area);
}

export function normalizeProduct(value: unknown): Product {
  const record = unwrapObject(value);
  const productType = inferProductType(record);
  const title = String(record.name || record.title || 'Product');
  const sourceImages = Array.isArray(record.images)
    ? record.images.map((image) => pickAssetPath(image)).filter(Boolean)
    : [];
  const rawImage = pickAssetPath(
    record.image,
    record.imageUrl,
    record.image_url,
    record.mainImage,
    record.main_image,
    record.thumbnail,
    record.thumbnailUrl,
    record.previewUrl,
    sourceImages[0],
  );
  const mockups = normalizeMockups(record.mockups, productType, rawImage);
  const normalizedColors = normalizeColors(record.colors || record.colorOptions);
  const mockupsByColor = normalizeMockupsByColor(
    record.mockupsByColor,
    normalizedColors.colorOptions,
    mockups,
    productType,
  );
  const firstImage = rawImage || mockups.front;
  const images = sourceImages.length
    ? sourceImages
    : [firstImage, mockups.back, mockups.left, mockups.right];

  return {
    ...record,
    id: String(record.id || record._id || record.productId || `PRD-${Date.now()}`),
    name: title,
    title,
    description: String(record.description || ''),
    price: Number(record.price || 0),
    category: normalizeCategoryName(String(record.category || defaultCategories[productType])),
    featured: Boolean(record.featured ?? record.isFeatured ?? false),
    isFeatured: Boolean(record.isFeatured ?? record.featured ?? false),
    isActive: Boolean(record.isActive ?? true),
    productType,
    customizationMode: (record.customizationMode as CustomizationMode) || defaultModes[productType],
    model3dUrl: String(record.model3dUrl || record.modelUrl || ''),
    printAreas: normalizePrintAreas(record.printAreas, productType),
    image: images[0] || mockups.front,
    images,
    mockups,
    mockupsByColor,
    colorOptions: normalizedColors.colorOptions,
    colors: normalizedColors.colors,
    customizable: Boolean(record.customizable ?? record.isCustomizable ?? true),
    isCustomizable: Boolean(record.isCustomizable ?? record.customizable ?? true),
    sizes: Array.isArray(record.sizes) ? record.sizes.map(String) : [],
    stock: Number(record.stock || 0),
    createdAt: String(record.createdAt || record.created_at || new Date().toISOString()),
    printArea: record.printArea as Product['printArea'] || { x: 31, y: 30, width: 38, height: 34 },
  };
}

function extractArray(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  if (Array.isArray(record.data)) return record.data;

  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key] as unknown[];
    }
    if (Array.isArray(data.data)) return data.data;
  }

  return [];
}

function extractProductArray(value: unknown): unknown[] {
  return extractArray(value, ['products', 'items']);
}

function normalizeProducts(value: unknown) {
  return extractProductArray(value).map(normalizeProduct);
}

function normalizeCategories(value: unknown) {
  const categories = extractArray(value, ['categories', 'items']);

  return categories.map((item) => (
    typeof item === 'string'
      ? item
      : String((item as Record<string, unknown>).name || (item as Record<string, unknown>).title || '')
  )).map(normalizeCategoryName).filter(Boolean);
}

function transformCategoriesToObjects(categories: string[]): Category[] {
  return Array.from(new Set(categories.map(normalizeCategoryName))).map((name) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
  }));
}

function normalizeCategoryFilter(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized.endsWith('s') ? normalized.slice(0, -1) : normalized;
}

function matchesCategory(product: Product, category: string) {
  const normalizedFilter = normalizeCategoryFilter(category);
  const categoryValues = [
    product.category,
    product.productType,
  ].filter(Boolean).map((value) => normalizeCategoryFilter(String(value)));

  return categoryValues.includes(normalizedFilter);
}

function readStoredAdminProducts() {
  const storedProducts = localStorage.getItem(ADMIN_PRODUCTS_STORAGE_KEY);
  if (!storedProducts) return [];

  try {
    return (JSON.parse(storedProducts) as Product[]).map(normalizeProduct);
  } catch {
    localStorage.removeItem(ADMIN_PRODUCTS_STORAGE_KEY);
    return [];
  }
}

function getAllLocalProducts() {
  const storedProducts = readStoredAdminProducts();
  const storedIds = new Set(storedProducts.map((product) => product.id));

  return [
    ...storedProducts,
    ...mockProducts.map(normalizeProduct).filter((product) => !storedIds.has(product.id)),
  ];
}

function getMockProducts(filters: ProductFilters = {}) {
  const filteredProducts = getAllLocalProducts().filter((product) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const searchableText = `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();
      if (!searchableText.includes(search)) return false;
    }

    if (filters.category && !matchesCategory(product, filters.category)) return false;
    if (filters.color && !product.colors?.includes(filters.color)) return false;
    if (filters.size && !product.sizes?.includes(filters.size)) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;

    return true;
  });

  return [...filteredProducts].sort((firstProduct, secondProduct) => {
    if (filters.sort === 'price-asc') return firstProduct.price - secondProduct.price;
    if (filters.sort === 'price-desc') return secondProduct.price - firstProduct.price;

    return new Date(secondProduct.createdAt || '').getTime() - new Date(firstProduct.createdAt || '').getTime();
  });
}

function isFeaturedProduct(product: Product) {
  return Boolean(product.isFeatured ?? product.featured);
}

function getMockCategories() {
  return Array.from(new Set(
    (getAllLocalProducts().map((product) => product.category).filter(Boolean) as string[]).map(normalizeCategoryName),
  ));
}

export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    if (!USE_BACKEND) return getMockProducts(filters);

    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.color) params.append('color', filters.color);
    if (filters.size) params.append('size', filters.size);
    if (filters.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
    if (filters.sort) params.append('sort', filters.sort);

    const endpoint = params.toString() ? `/products?${params.toString()}` : '/products';

    try {
      return normalizeProducts(await apiRequest<unknown>(endpoint));
    } catch (error) {
      logProductApiError('Failed to fetch products from backend', endpoint, error);
      throw error;
    }
  },

  async getAdminProducts(): Promise<Product[]> {
    if (!USE_BACKEND) return getAllLocalProducts();

    const endpoints = [
      '/products',
    ];

    try {
      return normalizeProducts(await apiRequestAny(endpoints));
    } catch (error) {
      logProductApiError('Failed to fetch admin products from backend', endpoints.join(' or '), error);
      throw error;
    }
  },

  async getFeaturedProducts(limit = 3): Promise<Product[]> {
    const products = await this.getProducts({ sort: 'newest' });
    const featuredProducts = products.filter(isFeaturedProduct);
    return (featuredProducts.length ? featuredProducts : products).slice(0, limit);
  },

  async getProductById(id: string): Promise<Product | null> {
    if (!USE_BACKEND) {
      return getAllLocalProducts().find((product) => product.id === id) || null;
    }

    try {
      const endpoint = `/products/${id}`;
      return normalizeProduct(await apiRequest<unknown>(endpoint));
    } catch (error) {
      logProductApiError(`Failed to fetch product ${id} from backend`, `/products/${id}`, error);
      return null;
    }
  },

  async getCategories(): Promise<Category[]> {
    if (!USE_BACKEND) return transformCategoriesToObjects(getMockCategories());

    try {
      const categories = normalizeCategories(await apiRequest<unknown>('/categories'));
      return transformCategoriesToObjects(categories);
    } catch (error) {
      console.warn('Failed to fetch categories from backend:', error);
      return [];
    }
  },

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    return normalizeProduct(await apiRequest<unknown>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }));
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return normalizeProduct(await apiRequest<unknown>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }));
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
};
