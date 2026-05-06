import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Check, ChevronRight, Move, RotateCw, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { productService } from '../services/productService';
import { useCart } from '../store/CartContext';
import type { Product } from '../types';

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export default function Customizer() {
  const { id, productId } = useParams();
  const resolvedProductId = productId || id;
  const navigate = useNavigate();
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(50);
  const [imageRotation, setImageRotation] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDesignSaved, setIsDesignSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!resolvedProductId) {
        setIsLoading(false);
        return;
      }

      const nextProduct = await productService.getProductById(resolvedProductId);
      if (isMounted) {
        setProduct(nextProduct);
        setSelectedSize(nextProduct?.sizes?.[0] || '');
        setSelectedColor(nextProduct?.colors?.[0] || '');
        setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [resolvedProductId]);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedMimeTypes.includes(file.type)) {
      toast.error('Unsupported file format. Upload PNG, JPG, JPEG, WEBP, or GIF.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setUploadedImage(readerEvent.target?.result as string);
      setImagePosition({ x: 50, y: 50 });
      setImageScale(50);
      setImageRotation(0);
      setIsDesignSaved(false);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function deleteDesign() {
    setUploadedImage(null);
    setIsDesignSaved(false);
  }

  function saveDesign() {
    if (!uploadedImage) {
      toast.error('Upload a design first');
      return;
    }

    setIsDesignSaved(true);
    toast.success('Design saved');
  }

  async function addToCart() {
    if (!product || !uploadedImage || !isDesignSaved) {
      toast.error('Please save your design first');
      return;
    }

    await addItem({
      productId: product.id,
      title: product.name,
      name: product.name,
      image: product.image,
      previewUrl: uploadedImage,
      customImage: uploadedImage,
      customDesignId: `MOCK-DESIGN-${Date.now()}`,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      price: product.price,
      isCustomized: true,
      hasCustomDesign: true,
    });

    toast.success('Added to cart!');
    navigate('/cart');
  }

  const currentStep = !uploadedImage ? 1 : isDesignSaved ? 4 : 3;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-[#1A1A1A]">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Product not found</h1>
        <button
          onClick={() => navigate('/catalog')}
          className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
        >
          Back to catalog
        </button>
      </div>
    );
  }

  const productImage = product.images?.[0] || product.image;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl mb-4">Product Customizer</h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2">
          {['Choose product', 'Upload design', 'Adjust design', 'Save and order'].map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep >= stepNumber;

            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
                  {currentStep > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                <span className={isActive ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>{step}</span>
                {stepNumber < 4 && <ChevronRight className="w-5 h-5 text-[#1A1A1A] hidden md:block" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-1">
          <div className="bg-[#F5F5F5] rounded-lg p-3 sm:p-6 md:p-8 flex items-center justify-center">
            <div className="relative w-full max-w-xs sm:max-w-md aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden">
              <img src={productImage} alt={product.name} className="w-full h-full object-cover" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-[#7A1F2A] bg-[#7A1F2A]/5 relative w-[60%] h-[40%]">
                  {uploadedImage ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${uploadedImage})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        transform: `translate(${imagePosition.x - 50}%, ${imagePosition.y - 50}%) scale(${imageScale / 100}) rotate(${imageRotation}deg)`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#7A1F2A] text-sm">
                      Print Area
                    </div>
                  )}
                </div>
              </div>

              {isDesignSaved && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Design saved
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 order-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Upload Design</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-black/20 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
            >
              <Upload className="w-5 h-5" />
              {uploadedImage ? 'Change Image' : 'Upload Image'}
            </button>
            <p className="text-xs text-[#1A1A1A] mt-2">PNG, JPG, JPEG, WEBP, GIF</p>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Adjust Design</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <Move className="w-4 h-4" />
                  Position X: {imagePosition.x}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={imagePosition.x}
                  onChange={(event) => {
                    setImagePosition({ ...imagePosition, x: Number(event.target.value) });
                    setIsDesignSaved(false);
                  }}
                  className="w-full"
                  disabled={!uploadedImage}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <Move className="w-4 h-4" />
                  Position Y: {imagePosition.y}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={imagePosition.y}
                  onChange={(event) => {
                    setImagePosition({ ...imagePosition, y: Number(event.target.value) });
                    setIsDesignSaved(false);
                  }}
                  className="w-full"
                  disabled={!uploadedImage}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Size: {imageScale}%</label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={imageScale}
                  onChange={(event) => {
                    setImageScale(Number(event.target.value));
                    setIsDesignSaved(false);
                  }}
                  className="w-full"
                  disabled={!uploadedImage}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <RotateCw className="w-4 h-4" />
                  Rotation: {imageRotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={imageRotation}
                  onChange={(event) => {
                    setImageRotation(Number(event.target.value));
                    setIsDesignSaved(false);
                  }}
                  className="w-full"
                  disabled={!uploadedImage}
                />
              </div>

              <button
                onClick={deleteDesign}
                disabled={!uploadedImage}
                className="w-full py-2 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete design
              </button>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-2">{product.name}</h3>

            <div className="mb-4">
              <p className="text-[#1A1A1A] text-sm mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || []).map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setIsDesignSaved(false);
                    }}
                    className={`px-3 py-2 border rounded text-sm transition-colors ${selectedSize === size ? 'bg-black text-white border-black' : 'border-black/10 hover:bg-[#F5F5F5]'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[#1A1A1A] text-sm mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {(product.colors || []).map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setIsDesignSaved(false);
                    }}
                    className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 ${selectedColor === color ? 'border-[#7A1F2A] ring-2 ring-[#7A1F2A]/30' : 'border-black/10'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {isDesignSaved && (
              <p className="text-green-600 text-sm mb-4 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Design saved
              </p>
            )}
            <p className="text-xl">₴{product.price}</p>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={saveDesign}
                disabled={!uploadedImage}
                className="w-full py-3 bg-black text-white rounded flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save design
              </button>
              <button
                onClick={addToCart}
                disabled={!isDesignSaved}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to cart
              </button>
              {!isDesignSaved && uploadedImage && (
                <p className="text-xs text-[#1A1A1A] text-center">Save your design to add to cart</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
