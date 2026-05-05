import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Upload, Move, RotateCw, Trash2, Save, Eye, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Customizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(50);
  const [imageRotation, setImageRotation] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDesign = () => {
    setIsSaved(true);
    toast.success('Design saved successfully!');
  };

  const handleAddToCart = () => {
    if (!isSaved) {
      toast.error('Please save your design first');
      return;
    }
    toast.success('Added to cart!');
    setTimeout(() => navigate('/cart'), 1000);
  };

  const getCurrentStep = () => {
    if (!uploadedImage) return 1;
    if (uploadedImage && !isSaved) return 2;
    return 3;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl mb-4">Product Customizer</h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className={currentStep >= 1 ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>Choose product</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#1A1A1A] hidden md:block" />

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className={currentStep >= 2 ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>Upload design</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#1A1A1A] hidden md:block" />

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
              {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <span className={currentStep >= 3 ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>Adjust design</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#1A1A1A] hidden md:block" />

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSaved ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
              4
            </div>
            <span className={isSaved ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}>Save and order</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[#F5F5F5] rounded-lg p-4 md:p-8 flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop"
                alt="Product mockup"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="border-2 border-dashed border-[#7A1F2A] bg-[#7A1F2A]/5 relative"
                  style={{
                    width: '60%',
                    height: '40%',
                  }}
                >
                  {uploadedImage && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url(${uploadedImage})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        transform: `translate(${imagePosition.x - 50}%, ${imagePosition.y - 50}%) scale(${imageScale / 100}) rotate(${imageRotation}deg)`,
                      }}
                    />
                  )}
                  {!uploadedImage && (
                    <div className="absolute inset-0 flex items-center justify-center text-[#7A1F2A] text-sm">
                      Print Area
                    </div>
                  )}
                </div>
              </div>

              {isSaved && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Design Saved
                </div>
              )}
            </div>
          </div>

          {!uploadedImage && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p>💡 Upload your design to get started. Supported formats: PNG, JPG (max 10MB)</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-4">Upload Design</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
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
            <p className="text-xs text-[#1A1A1A] mt-2">
              PNG or JPG, max 10MB
            </p>
          </div>

          {uploadedImage && (
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
                    onChange={(e) => {
                      setImagePosition({ ...imagePosition, x: Number(e.target.value) });
                      setIsSaved(false);
                    }}
                    className="w-full"
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
                    onChange={(e) => {
                      setImagePosition({ ...imagePosition, y: Number(e.target.value) });
                      setIsSaved(false);
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">Size: {imageScale}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={imageScale}
                    onChange={(e) => {
                      setImageScale(Number(e.target.value));
                      setIsSaved(false);
                    }}
                    className="w-full"
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
                    onChange={(e) => {
                      setImageRotation(Number(e.target.value));
                      setIsSaved(false);
                    }}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setIsSaved(false);
                    }}
                    className="flex-1 py-2 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={handleSaveDesign}
                    className="flex-1 py-2 bg-black text-white rounded flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-2">Classic White T-Shirt</h3>
            <p className="text-[#1A1A1A] text-sm mb-1">Size: M</p>
            <p className="text-[#1A1A1A] text-sm mb-1">Color: White</p>
            {isSaved && (
              <p className="text-green-600 text-sm mb-4 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Custom design saved
              </p>
            )}
            <p className="text-xl mb-4">₴399</p>

            <div className="space-y-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full py-3 bg-[#F5F5F5] rounded flex items-center justify-center gap-2 hover:bg-[#ECECEC] transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!isSaved}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to cart
              </button>
              {!isSaved && uploadedImage && (
                <p className="text-xs text-[#1A1A1A] text-center">
                  Save your design to add to cart
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="relative max-w-2xl w-full bg-white rounded-lg p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl mb-4">Preview</h3>
            <div className="aspect-[3/4] max-h-[70vh] bg-[#F5F5F5] rounded-lg flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop"
                  alt="Product mockup"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative" style={{ width: '60%', height: '40%' }}>
                    {uploadedImage && (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="mt-4 w-full py-3 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
