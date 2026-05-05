import { Link } from 'react-router';
import { Minus, Plus, X, Edit2, ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';

export default function Cart() {
  const [items, setItems] = useState([
    {
      id: '1',
      productId: '1',
      name: 'Classic White T-Shirt',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
      customImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      size: 'M',
      color: 'White',
      quantity: 2,
      price: 399,
      hasCustomDesign: true,
    },
    {
      id: '2',
      productId: '2',
      name: 'Premium Black Hoodie',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop',
      customImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
      size: 'L',
      color: 'Black',
      quantity: 1,
      price: 899,
      hasCustomDesign: true,
    },
  ]);

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, change: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-[#1A1A1A]" />
          </div>
          <h1 className="text-3xl mb-4">Your cart is empty</h1>
          <p className="text-[#1A1A1A] mb-8">
            Start adding products to your cart and create your custom designs
          </p>
          <Link
            to="/catalog"
            className="inline-block px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-black/10 rounded-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                <div className="w-full sm:w-32 h-32 bg-[#F5F5F5] rounded overflow-hidden flex-shrink-0 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.customImage && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-4">
                      <img
                        src={item.customImage}
                        alt="Custom design"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 truncate">{item.name}</h3>
                      <p className="text-sm text-[#1A1A1A]">
                        Size: {item.size} • Color: {item.color}
                      </p>
                      {item.hasCustomDesign && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Custom design saved
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#1A1A1A] hover:text-red-600 transition-colors ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 border border-black/10 rounded flex items-center justify-center hover:bg-[#F5F5F5]"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 border border-black/10 rounded flex items-center justify-center hover:bg-[#F5F5F5]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/customize/${item.productId}`}
                        className="text-sm text-[#7A1F2A] hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit design
                      </Link>
                      <p className="text-lg md:text-xl">₴{item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white border border-black/10 rounded-lg p-6 sticky top-24">
            <h3 className="mb-4">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[#1A1A1A]">
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>₴{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#1A1A1A]">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₴${shipping}`}</span>
              </div>
              {shipping > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                  Add ₴{1000 - subtotal} more for free shipping
                </div>
              )}
            </div>

            <div className="border-t border-black/10 pt-4 mb-6">
              <div className="flex justify-between text-xl">
                <span>Total</span>
                <span>₴{total}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full py-4 bg-[#7A1F2A] text-white text-center rounded hover:bg-[#5A1520] transition-colors mb-3"
            >
              Proceed to checkout
            </Link>

            <Link
              to="/catalog"
              className="block w-full py-4 border border-black rounded text-center hover:bg-black hover:text-white transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
