import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Minus, Plus } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const product = {
    name: 'Classic White T-Shirt',
    price: 399,
    description: 'Premium quality cotton t-shirt perfect for customization. Made from 100% organic cotton with a comfortable fit.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    colors: [
      { name: 'White', value: '#FFFFFF' },
      { name: 'Black', value: '#000000' },
      { name: 'Burgundy', value: '#7A1F2A' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-[#F5F5F5] rounded overflow-hidden mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-[#F5F5F5] rounded overflow-hidden cursor-pointer hover:opacity-75 transition-opacity">
                <img
                  src={product.image}
                  alt={`View ${i}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-4xl mb-2">{product.name}</h1>
          <p className="text-2xl mb-6">₴{product.price}</p>

          <div className="mb-6">
            <h3 className="mb-3">Color</h3>
            <div className="flex gap-3">
              {product.colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === color.value ? 'border-[#7A1F2A] scale-110' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3">Size</h3>
            <div className="flex gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-6 py-3 border rounded transition-colors ${
                    selectedSize === size
                      ? 'bg-black text-white border-black'
                      : 'border-black/10 hover:bg-[#F5F5F5]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-black/10 rounded flex items-center justify-center hover:bg-[#F5F5F5]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-black/10 rounded flex items-center justify-center hover:bg-[#F5F5F5]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <Link
              to={`/customize/${id}`}
              className="block w-full py-4 bg-[#7A1F2A] text-white text-center rounded hover:bg-[#5A1520] transition-colors"
            >
              Customize this product
            </Link>
            <button className="w-full py-4 border border-black rounded hover:bg-black hover:text-white transition-colors">
              Add to cart
            </button>
          </div>

          <div className="border-t border-black/10 pt-6">
            <h3 className="mb-3">Product Details</h3>
            <p className="text-[#1A1A1A] mb-6">{product.description}</p>

            <h3 className="mb-3">Delivery Information</h3>
            <ul className="text-[#1A1A1A] space-y-2 text-sm">
              <li>• Delivery via Nova Poshta</li>
              <li>• Production time: 3-5 business days</li>
              <li>• Shipping time: 1-3 business days</li>
              <li>• Free shipping on orders over ₴1000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
