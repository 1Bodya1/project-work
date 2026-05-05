import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { LoadingState, ProductCardSkeleton } from '../components/LoadingState';
import { Search, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';

export default function Catalog() {
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const allProducts = [
    { id: '1', name: 'Classic White T-Shirt', price: 399, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', colors: ['#FFFFFF', '#000000', '#7A1F2A'] },
    { id: '2', name: 'Premium Black Hoodie', price: 899, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop', colors: ['#000000', '#1A1A1A', '#FFFFFF'] },
    { id: '3', name: 'Comfort Sweatshirt', price: 699, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=500&fit=crop', colors: ['#F5F5F5', '#7A1F2A', '#000000'] },
    { id: '4', name: 'Cotton Oversized Tee', price: 449, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop', colors: ['#FFFFFF', '#F5F5F5', '#1A1A1A'] },
    { id: '5', name: 'Minimalist Black Tee', price: 399, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop', colors: ['#000000', '#FFFFFF'] },
    { id: '6', name: 'Urban Hoodie Gray', price: 849, image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=500&h=500&fit=crop', colors: ['#1A1A1A', '#F5F5F5'] },
  ];

  const products = searchQuery
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allProducts;

  useEffect(() => {
    // Simulate loading products
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
            fixed lg:static top-0 right-0 h-full lg:h-auto w-80 lg:w-64 bg-white lg:bg-transparent
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
              {['All', 'T-Shirts', 'Hoodies', 'Sweatshirts'].map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>

            <h3 className="mb-4">Price Range</h3>
            <div className="space-y-2 mb-6">
              <input type="range" min="0" max="2000" className="w-full" />
              <div className="flex justify-between text-sm text-[#1A1A1A]">
                <span>₴0</span>
                <span>₴2000</span>
              </div>
            </div>

            <h3 className="mb-4">Color</h3>
            <div className="flex gap-2 mb-6 flex-wrap">
              {['#FFFFFF', '#000000', '#7A1F2A', '#F5F5F5', '#1A1A1A'].map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <h3 className="mb-4">Size</h3>
            <div className="grid grid-cols-3 gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                <button
                  key={size}
                  className="px-3 py-2 border border-black/10 rounded text-sm hover:bg-[#F5F5F5] transition-colors"
                >
                  {size}
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
            <select className="px-4 py-2 bg-[#F5F5F5] rounded border-none">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>

          {isLoading ? (
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
              <h2 className="text-2xl mb-2">No products found</h2>
              <p className="text-[#1A1A1A] mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Clear Search
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
