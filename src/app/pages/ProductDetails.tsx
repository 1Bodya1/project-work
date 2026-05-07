import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { productService } from '../services/productService';
import { useCart } from '../store/CartContext';
import type { Product } from '../types';

export default function ProductDetails() {
  const { id, productId } = useParams();
  const resolvedProductId = productId || id;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!resolvedProductId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadingError('');

      try {
        const nextProduct = await productService.getProductById(resolvedProductId);

        if (isMounted) {
          setProduct(nextProduct);
          setSelectedImage(nextProduct?.mockups?.front || nextProduct?.images?.[0] || nextProduct?.image || '');
          setSelectedColor('');
          setSelectedSize('');
          setQuantity(1);
          setErrorMessage('');
        }
      } catch {
        if (isMounted) {
          setProduct(null);
          setLoadingError('Unable to load product. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [resolvedProductId]);

  async function handleAddToCart() {
    if (!product) return;

    if (!selectedColor) {
      const message = 'Please select a color before adding this product to cart.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!selectedSize) {
      const message = 'Please select a size before adding this product to cart.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    try {
      await addItem({
        productId: product.id,
        title: product.name,
        name: product.name,
        image: product.image,
        previewUrl: product.image,
        size: selectedSize,
        color: selectedColor,
        quantity,
        price: product.price,
        isCustomized: false,
        hasCustomDesign: false,
      });

      setErrorMessage('');
      toast.success('Product added to cart');
    } catch {
      const message = 'Unable to add product to cart. Please try again.';
      setErrorMessage(message);
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-[#1A1A1A]">Loading product...</p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Product loading error</h1>
        <p className="text-[#1A1A1A] mb-6">{loadingError}</p>
        <Link to="/catalog" className="text-[#7A1F2A] hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Product not found</h1>
        <Link to="/catalog" className="text-[#7A1F2A] hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const productImages = product.mockups
    ? [product.mockups.front, product.mockups.back, product.mockups.left, product.mockups.right]
    : product.images?.length ? product.images : [product.image];
  const canCustomize = product.isCustomizable ?? product.customizable;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-square bg-[#F5F5F5] border border-black/5 shadow-sm rounded overflow-hidden mb-4">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="w-full h-full object-contain p-6"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(image)}
                className={`w-20 h-20 sm:w-auto sm:h-auto sm:aspect-square flex-shrink-0 bg-[#F5F5F5] border border-black/5 rounded overflow-hidden cursor-pointer hover:opacity-75 transition-opacity ${
                  selectedImage === image ? 'ring-2 ring-[#7A1F2A]' : ''
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-contain p-2"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-4xl mb-2">{product.name}</h1>
          {product.category && <p className="text-[#1A1A1A] mb-2">{product.category}</p>}
          <p className="text-2xl mb-6">₴{product.price}</p>

          <div className="mb-6">
            <h3 className="mb-3">Color</h3>
            <div className="flex gap-3 flex-wrap">
              {(product.colors || []).map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setErrorMessage('');
                  }}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === color ? 'border-[#7A1F2A] scale-110' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3">Size</h3>
            <div className="flex gap-2 flex-wrap">
              {(product.sizes || []).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setErrorMessage('');
                  }}
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
            {canCustomize && (
              <Link
                to={`/customize/${product.id}`}
                className="block w-full py-4 bg-[#7A1F2A] text-white text-center rounded hover:bg-[#5A1520] transition-colors"
              >
                Customize this product
              </Link>
            )}
            <button
              onClick={handleAddToCart}
              className="w-full py-4 border border-black rounded hover:bg-black hover:text-white transition-colors"
            >
              Add to cart
            </button>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
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
