import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Upload, Paintbrush, ShoppingBag, Truck } from 'lucide-react';

export default function Home() {
  const featuredProducts = [
    { id: '1', name: 'Classic White T-Shirt', price: 399, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', colors: ['#FFFFFF', '#000000', '#7A1F2A'] },
    { id: '2', name: 'Premium Black Hoodie', price: 899, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop', colors: ['#000000', '#1A1A1A', '#FFFFFF'] },
    { id: '3', name: 'Comfort Sweatshirt', price: 699, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=500&fit=crop', colors: ['#F5F5F5', '#7A1F2A', '#000000'] },
    { id: '4', name: 'Cotton Oversized Tee', price: 449, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop', colors: ['#FFFFFF', '#F5F5F5', '#1A1A1A'] },
  ];

  return (
    <div>
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl mb-6 leading-tight">
            Create clothing with your own design
          </h1>
          <p className="text-xl text-[#1A1A1A] mb-8 max-w-2xl">
            Choose your favorite clothing item, upload your unique design, and create something truly yours. Fast delivery across Ukraine.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
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
          <h2 className="text-3xl md:text-4xl mb-12 text-center">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/catalog?category=t-shirts"
              className="group relative aspect-square bg-white rounded overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop"
                alt="T-Shirts"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <h3 className="text-white text-2xl">T-Shirts</h3>
              </div>
            </Link>

            <Link
              to="/catalog?category=hoodies"
              className="group relative aspect-square bg-white rounded overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop"
                alt="Hoodies"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <h3 className="text-white text-2xl">Hoodies</h3>
              </div>
            </Link>

            <Link
              to="/catalog?category=sweatshirts"
              className="group relative aspect-square bg-white rounded overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop"
                alt="Sweatshirts"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <h3 className="text-white text-2xl">Sweatshirts</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
