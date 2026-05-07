import { Link } from 'react-router';
import { Minus, Plus, X, Edit2, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../store/CartContext';
import type { CartItem } from '../types';

const placementLabels: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  leftSleeve: 'Left sleeve',
  rightSleeve: 'Right sleeve',
  leftSide: 'Left side',
  rightSide: 'Right side',
};

function getUsedPlacementLabels(item: CartItem) {
  if (item.usedPlacements?.length) {
    return item.usedPlacements.map((placement) => placementLabels[placement] || placement);
  }

  const placements = item.customDesignPlacements || item.customDesign?.placements;
  if (!placements) return [];

  return Object.entries(placements)
    .filter(([, placement]) => placement.uploadedImage || placement.uploadedImageUrl || placement.previewUrl)
    .map(([placementId, placement]) => placement.label || placementLabels[placementId] || 'Placement');
}

export default function Cart() {
  const { items, isLoading, updateItem, removeItem } = useCart();

  const updateQuantity = async (id: string, quantity: number, change: number) => {
    await updateItem(id, { quantity: Math.max(1, quantity + change) });
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryPlaceholder = 'Calculated at checkout';
  const total = subtotal;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-[#1A1A1A]">Loading cart...</p>
      </div>
    );
  }

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
            Go to catalog
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
              {(() => {
                const usedPlacements = getUsedPlacementLabels(item);

                const previewImage = item.previewUrl || item.customImage || item.image;

                return (
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                    <div className="w-full sm:w-36 h-40 sm:h-36 bg-[#F5F5F5] rounded overflow-hidden flex-shrink-0 border border-black/5">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={item.title}
                          className="w-full h-full object-contain p-3"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-[#1A1A1A]">
                          No preview
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="truncate">{item.title}</h3>
                            {item.isCustomized ? (
                              <span className="w-fit text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Custom design saved
                              </span>
                            ) : (
                              <span className="w-fit text-xs px-2 py-1 rounded-full bg-[#F5F5F5] text-[#1A1A1A] border border-black/10">
                                No customization
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-[#1A1A1A]">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-black/50">Size</p>
                              <p>{item.size}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-black/50">Color</p>
                              <p>{item.color}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-black/50">Price</p>
                              <p>₴{item.price}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-black/50">Item total</p>
                              <p>₴{item.price * item.quantity}</p>
                            </div>
                          </div>

                          {usedPlacements.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-[#1A1A1A] mb-1">Print areas:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {usedPlacements.map((placement) => (
                                  <span
                                    key={placement}
                                    className="text-xs px-2 py-1 bg-[#F5F5F5] border border-black/10 rounded"
                                  >
                                    {placement}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#1A1A1A] hover:text-red-600 transition-colors"
                          aria-label={`Remove ${item.title}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity, -1)}
                            className="w-8 h-8 border border-black/10 rounded flex items-center justify-center hover:bg-[#F5F5F5]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity, 1)}
                            className="w-8 h-8 border border-black/10 rounded flex items-center justify-center hover:bg-[#F5F5F5]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          {item.isCustomized && (
                            <Link
                              to={`/customize/${item.productId}`}
                              className="text-sm text-[#7A1F2A] hover:underline flex items-center gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit design
                            </Link>
                          )}
                          <p className="text-lg md:text-xl">₴{item.price * item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24">
            <h3 className="mb-4">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[#1A1A1A]">
                <span>Subtotal ({totalItems} items)</span>
                <span>₴{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#1A1A1A]">
                <span>Delivery</span>
                <span>{deliveryPlaceholder}</span>
              </div>
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
