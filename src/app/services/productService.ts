import { mockProducts } from '../mocks/mockProducts';
import type { Category, Product } from '../types';

type ProductFilters = {
  category?: string;
  color?: string;
  size?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc';
};

const mockCategories: Category[] = Array.from(
  new Set(mockProducts.map((product) => product.category).filter(Boolean)),
).map((name) => ({
  id: String(name).toLowerCase().replace(/\s+/g, '-'),
  name: String(name),
  slug: String(name).toLowerCase().replace(/\s+/g, '-'),
}));

export const productService = {
  async getProducts(filters: ProductFilters = {}) {
    const products = mockProducts.filter((product) => {
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesColor = !filters.color || product.colors?.includes(filters.color);
      const matchesSize = !filters.size || product.sizes?.includes(filters.size);
      const matchesSearch =
        !filters.search || product.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesMinPrice = filters.minPrice === undefined || product.price >= filters.minPrice;
      const matchesMaxPrice = filters.maxPrice === undefined || product.price <= filters.maxPrice;

      return (
        matchesCategory &&
        matchesColor &&
        matchesSize &&
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    return [...products].sort((a, b) => {
      if (filters.sort === 'price-asc') return a.price - b.price;
      if (filters.sort === 'price-desc') return b.price - a.price;
      if (filters.sort === 'newest') {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
      return 0;
    });
  },

  async getProductById(id: string) {
    return mockProducts.find((product) => product.id === id) || null;
  },

  async getCategories() {
    return mockCategories;
  },

  async createProduct(data: Omit<Product, 'id'>) {
    return { id: `PRD-${Date.now()}`, ...data };
  },
};
