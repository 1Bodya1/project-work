import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/LoadingState';
import { Search, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { productService } from '../services/productService';
import type { Category, Product } from '../types';

type SortOption = 'newest' | 'price-asc' | 'price-desc';

const colorOptions = ['#FFFFFF', '#000000', '#7A1F2A', '#F5F5F5', '#1A1A1A'];
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Catalog() {
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [nextProducts, nextCategories] = await Promise.all([
          productService.getProducts({
            search: searchQuery,
            category: category || undefined,
            color: color || undefined,
            size: size || undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort,
          }),
          productService.getCategories(),
        ]);

        if (isMounted) {
          setProducts(nextProducts);
          setCategories(nextCategories);
        }
      } catch {
        if (isMounted) {
          setProducts([]);
          setErrorMessage('Unable to load products. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, category, color, size, minPrice, maxPrice, sort]);

  function clearFilters() {
    setSearchQuery('');
    setCategory('');
    setColor('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl mb-4">Catalog</h1>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-[#F5F5F5] rounded flex items-center gap-2 hover:bg-[#ECECEC] transition-colors lg:hidden"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      <div className="flex gap-8 relative">
        {/* Mobile Filters Overlay */}
        {showFilters && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Filters Sidebar */}
        <aside
          className={`
            fixed lg:static top-0 right-0 h-full lg:h-auto w-80 max-w-[85vw] lg:max-w-none lg:w-64 bg-white lg:bg-transparent
            transform transition-transform duration-300 z-50 lg:z-0
            ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            lg:flex-shrink-0
          `}
        >
          <div className="bg-white border border-black/10 rounded p-6 h-full lg:h-auto lg:sticky lg:top-24 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3>Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <h3 className="mb-4">Category</h3>
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={category === ''}
                  onChange={() => setCategory('')}
                  className="rounded"
                />
                <span className="text-sm">All</span>
              </label>
              {categories.map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={category === item.name}
                    onChange={() => setCategory(item.name)}
                    className="rounded"
                  />
                  <span className="text-sm">{item.name}</span>
                </label>
              ))}
            </div>

            <h3 className="mb-4">Price Range</h3>
            <div className="space-y-2 mb-6">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                />
              </div>
            </div>

            <h3 className="mb-4">Color</h3>
            <div className="flex gap-2 mb-6 flex-wrap">
              {colorOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setColor(color === item ? '' : item)}
                  className={`w-8 h-8 rounded-full border cursor-pointer hover:scale-110 transition-transform ${
                    color === item ? 'border-[#7A1F2A] ring-2 ring-[#7A1F2A]/30' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: item }}
                  aria-label={`Filter by color ${item}`}
                />
              ))}
            </div>

            <h3 className="mb-4">Size</h3>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setSize(size === item ? '' : item)}
                  className={`px-3 py-2 border rounded text-sm transition-colors ${
                    size === item
                      ? 'bg-black text-white border-black'
                      : 'border-black/10 hover:bg-[#F5F5F5]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors lg:hidden"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <p className="text-[#1A1A1A]">{products.length} products</p>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="px-4 py-2 bg-[#F5F5F5] rounded border-none"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {errorMessage ? (
            <div className="text-center py-20">
              <h2 className="text-2xl mb-2">Product loading error</h2>
              <p className="text-[#1A1A1A] mb-6">{errorMessage}</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Reset catalog
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-[#1A1A1A]" />
              </div>
              <h2 className="text-2xl mb-2">Товарів за вашим запитом не знайдено</h2>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
