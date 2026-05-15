import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/LoadingState';
import { Search, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { productService } from '../services/productService';
import type { Category, Product, ProductType } from '../types';

type SortOption = 'newest' | 'price-asc' | 'price-desc';

const sortOptions: SortOption[] = ['newest', 'price-asc', 'price-desc'];

function getSortParam(value: string | null): SortOption {
  return sortOptions.includes(value as SortOption) ? value as SortOption : 'newest';
}

function normalizeCategoryParam(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized.endsWith('s') ? normalized.slice(0, -1) : normalized;
}

function isSelectedCategory(selectedCategory: string, item: Category) {
  if (!selectedCategory) return false;

  const selected = normalizeCategoryParam(selectedCategory);
  const candidates = [
    item.name,
    item.slug,
    item.id,
  ].filter(Boolean).map((value) => normalizeCategoryParam(String(value)));

  return candidates.includes(selected);
}

function getProductTypeFromValue(value?: string | null): ProductType | null {
  const normalizedValue = normalizeCategoryParam(value || '');
  if (normalizedValue === 'mug') return 'mug';
  if (normalizedValue === 'laptop') return 'laptop';
  if (normalizedValue === 'tshirt' || normalizedValue === 'tee' || normalizedValue === 'shirt') return 'tshirt';
  return null;
}

function getSelectedProductType(category: string, products: Product[]): ProductType | null {
  const categoryProductType = getProductTypeFromValue(category);
  if (categoryProductType) return categoryProductType;

  const matchedProduct = products.find((product) => {
    const productCategory = getProductTypeFromValue(product.category);
    const productType = getProductTypeFromValue(product.productType);

    return Boolean(productCategory || productType);
  });
  const productType = getProductTypeFromValue(matchedProduct?.productType)
    || getProductTypeFromValue(matchedProduct?.category);

  return productType;
}

function isSizeAllowedForProductType(size: string, productType: ProductType | null) {
  const normalizedSize = size.trim().toLowerCase();
  if (!normalizedSize) return false;

  if (productType === 'mug') return /\bml\b|мл/.test(normalizedSize);
  if (productType === 'laptop') return /\binch\b|\bin\b|"/.test(normalizedSize);
  if (productType === 'tshirt') return !(/\bml\b|мл|\binch\b|\bin\b|"/.test(normalizedSize));

  return true;
}

function getSizeSortValue(size: string) {
  const numericValue = Number(size.match(/\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
}

function getUniqueSortedSizes(products: Product[], productType: ProductType | null) {
  return Array.from(
    new Set(
      products
        .flatMap((product) => product.sizes || [])
        .map(String)
        .filter((item) => isSizeAllowedForProductType(item, productType)),
    ),
  ).sort((firstSize, secondSize) => {
    const firstNumericValue = getSizeSortValue(firstSize);
    const secondNumericValue = getSizeSortValue(secondSize);
    if (firstNumericValue !== secondNumericValue) return firstNumericValue - secondNumericValue;
    return firstSize.localeCompare(secondSize);
  });
}

function getUniqueColors(products: Product[]) {
  return Array.from(
    new Set(
      products
        .flatMap((product) => (
          product.colorOptions?.length
            ? product.colorOptions.map((option) => option.hex)
            : product.colors || []
        ))
        .map(String)
        .filter(Boolean),
    ),
  );
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilterProducts, setCategoryFilterProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [color, setColor] = useState(() => searchParams.get('color') || '');
  const [size, setSize] = useState(() => searchParams.get('size') || '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState<SortOption>(() => getSortParam(searchParams.get('sort')));
  const selectedProductType = useMemo(
    () => getSelectedProductType(category, categoryFilterProducts),
    [category, categoryFilterProducts],
  );
  const availableColorOptions = useMemo(
    () => (category ? getUniqueColors(categoryFilterProducts) : []),
    [category, categoryFilterProducts],
  );
  const availableSizeOptions = useMemo(
    () => (category ? getUniqueSortedSizes(categoryFilterProducts, selectedProductType) : []),
    [category, categoryFilterProducts, selectedProductType],
  );

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(searchParamsString);
    const nextSearchQuery = nextSearchParams.get('search') || '';
    const nextCategory = nextSearchParams.get('category') || '';
    const nextColor = nextSearchParams.get('color') || '';
    const nextSize = nextSearchParams.get('size') || '';
    const nextMinPrice = nextSearchParams.get('minPrice') || '';
    const nextMaxPrice = nextSearchParams.get('maxPrice') || '';
    const nextSort = getSortParam(nextSearchParams.get('sort'));

    setSearchQuery((currentValue) => (currentValue === nextSearchQuery ? currentValue : nextSearchQuery));
    setCategory((currentValue) => (currentValue === nextCategory ? currentValue : nextCategory));
    setColor((currentValue) => (currentValue === nextColor ? currentValue : nextColor));
    setSize((currentValue) => (currentValue === nextSize ? currentValue : nextSize));
    setMinPrice((currentValue) => (currentValue === nextMinPrice ? currentValue : nextMinPrice));
    setMaxPrice((currentValue) => (currentValue === nextMaxPrice ? currentValue : nextMaxPrice));
    setSort((currentValue) => (currentValue === nextSort ? currentValue : nextSort));
  }, [searchParamsString]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (searchQuery) nextParams.set('search', searchQuery);
    if (category) nextParams.set('category', category);
    if (color) nextParams.set('color', color);
    if (size) nextParams.set('size', size);
    if (minPrice) nextParams.set('minPrice', minPrice);
    if (maxPrice) nextParams.set('maxPrice', maxPrice);
    if (sort !== 'newest') nextParams.set('sort', sort);

    if (nextParams.toString() !== searchParamsString) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [category, color, maxPrice, minPrice, searchParamsString, searchQuery, setSearchParams, size, sort]);

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
      } catch (error) {
        console.error('Unable to load catalog products:', error);
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load products. Please try again.');
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

  useEffect(() => {
    let isMounted = true;

    if (!category) {
      setCategoryFilterProducts([]);
      setColor('');
      setSize('');
      return () => {
        isMounted = false;
      };
    }

    productService.getProducts({ category })
      .then((nextProducts) => {
        if (isMounted) setCategoryFilterProducts(nextProducts);
      })
      .catch(() => {
        if (isMounted) setCategoryFilterProducts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [category]);

  useEffect(() => {
    if (!category) return;
    if (color && !availableColorOptions.includes(color)) setColor('');
    if (size && !availableSizeOptions.includes(size)) setSize('');
  }, [availableColorOptions, availableSizeOptions, category, color, size]);

  function clearFilters() {
    setSearchQuery('');
    setCategory('');
    setColor('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
  }

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory);
    setColor('');
    setSize('');
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
            fixed lg:static top-0 right-0 h-full lg:h-auto w-80 max-w-[88vw] lg:max-w-none lg:w-64 bg-white lg:bg-transparent
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
                  onChange={() => handleCategoryChange('')}
                  className="rounded"
                />
                <span className="text-sm">All</span>
              </label>
              {categories.map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={isSelectedCategory(category, item)}
                    onChange={() => handleCategoryChange(item.name)}
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

            {category && availableColorOptions.length > 0 && (
              <>
                <h3 className="mb-4">Color</h3>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {availableColorOptions.map((item) => (
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
              </>
            )}

            {category && availableSizeOptions.length > 0 && (
              <>
                <h3 className="mb-4">Size</h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableSizeOptions.map((item) => (
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
              </>
            )}

            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors lg:hidden"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="w-full mt-3 py-3 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors lg:hidden"
            >
              Clear Filters
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
                <ProductCard
                  key={product.id}
                  {...product}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
