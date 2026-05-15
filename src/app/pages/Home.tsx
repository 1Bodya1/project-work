import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/LoadingState';
import { Upload, Paintbrush, ShoppingBag, Truck } from 'lucide-react';
import { productService } from '../services/productService';
import type { Product } from '../types';

const popularCategories = [
  {
    title: 'Laptops',
    image: '/categories/macbook.png',
    href: '/catalog?category=Laptops',
  },
  {
    title: 'Mugs',
    image: '/categories/mug.png',
    href: '/catalog?category=Mugs',
  },
  {
    title: 'T-shirt',
    image: '/categories/tshirt.png',
    href: '/catalog?category=T-shirt',
  },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProducts() {
      setIsLoadingFeatured(true);
      setFeaturedError('');

      try {
        const products = await productService.getFeaturedProducts(3);
        if (isMounted) {
          setFeaturedProducts(products);
        }
      } catch {
        if (isMounted) {
          setFeaturedProducts([]);
          setFeaturedError('Unable to load featured products right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingFeatured(false);
        }
      }
    }

    loadFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl mb-6 leading-tight">
            Create clothing with your own design
          </h1>
          <p className="text-xl text-[#1A1A1A] mb-8 max-w-2xl">
            Choose a clothing item, upload your unique design, and create something truly yours. Fast delivery across Ukraine.
          </p>
          <Link
            to="/catalog"
            className="inline-block px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Start customizing
          </Link>
        </div>
      </section>

      <section className="bg-[#F5F5F5] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl mb-12 text-center">Featured Products</h2>
          {featuredError ? (
            <p className="text-center text-[#1A1A1A]">{featuredError}</p>
          ) : isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[#1A1A1A]">No featured products available yet.</p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl mb-12 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#7A1F2A]" />
            </div>
            <h3 className="mb-2">1. Choose product</h3>
            <p className="text-sm text-[#1A1A1A]">
              Select from our range of quality clothing items
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-[#7A1F2A]" />
            </div>
            <h3 className="mb-2">2. Upload design</h3>
            <p className="text-sm text-[#1A1A1A]">
              Upload your image or artwork
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Paintbrush className="w-8 h-8 text-[#7A1F2A]" />
            </div>
            <h3 className="mb-2">3. Customize</h3>
            <p className="text-sm text-[#1A1A1A]">
              Adjust size, position, and preview your design
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-[#7A1F2A]" />
            </div>
            <h3 className="mb-2">4. Order & Track</h3>
            <p className="text-sm text-[#1A1A1A]">
              Pay online and track your delivery with Nova Poshta
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F5F5] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl mb-12 text-center">Popular Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {popularCategories.map((category) => (
              <Link
                key={category.title}
                to={category.href}
                className="group bg-white rounded overflow-hidden border border-black/10 hover:border-[#7A1F2A]/30 transition-colors"
              >
                <div className="aspect-square bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-xl">{category.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
