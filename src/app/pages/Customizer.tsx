import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Check, ChevronRight, Move, RotateCw, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ProductPreview3D } from '../components/ProductPreview3D';
import { designService } from '../services/designService';
import { productService } from '../services/productService';
import { useCart } from '../store/CartContext';
import type { CustomDesign, Product } from '../types';

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;
const PREVIEW_MAX_SIZE = 800;
const PREVIEW_OUTPUT_TYPE = 'image/webp';
const PREVIEW_OUTPUT_QUALITY = 0.75;
type PreviewMode = '2d' | '3d';
type PrintPlacement = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'leftSide' | 'rightSide';
type PlacementView = 'front' | 'back' | 'left' | 'right';
type PlacementState = {
  uploadedImage: string | null;
  uploadedImageUrl: string | null;
  previewUrl?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  isActive: boolean;
};

const printPlacements: Array<{ id: PrintPlacement; label: string; view: PlacementView }> = [
  { id: 'front', label: 'Front', view: 'front' },
  { id: 'back', label: 'Back', view: 'back' },
  { id: 'leftSleeve', label: 'Left sleeve', view: 'left' },
  { id: 'rightSleeve', label: 'Right sleeve', view: 'right' },
  { id: 'leftSide', label: 'Left side', view: 'left' },
  { id: 'rightSide', label: 'Right side', view: 'right' },
];

const defaultPlacementState: PlacementState = {
  uploadedImage: null,
  uploadedImageUrl: null,
  previewUrl: null,
  position: { x: 50, y: 50 },
  scale: 50,
  rotation: 0,
  isActive: false,
};

function createDefaultPlacements(): Record<PrintPlacement, PlacementState> {
  return printPlacements.reduce(
    (placements, placement) => ({
      ...placements,
      [placement.id]: {
        uploadedImage: defaultPlacementState.uploadedImage,
        uploadedImageUrl: defaultPlacementState.uploadedImageUrl,
        position: { ...defaultPlacementState.position },
        scale: defaultPlacementState.scale,
        rotation: defaultPlacementState.rotation,
        isActive: placement.id === 'front',
      },
    }),
    {} as Record<PrintPlacement, PlacementState>,
  );
}

function resolvePlacementArea(product: Product, placement: PrintPlacement) {
  const frontArea = product.printArea || { x: 31, y: 30, width: 38, height: 34 };
  const placementAreas: Record<PrintPlacement, typeof frontArea> = {
    front: frontArea,
    back: { x: 32, y: 26, width: 36, height: 34 },
    leftSleeve: { x: 22, y: 25, width: 24, height: 24 },
    rightSleeve: { x: 54, y: 25, width: 24, height: 24 },
    leftSide: { x: 30, y: 34, width: 28, height: 36 },
    rightSide: { x: 42, y: 34, width: 28, height: 36 },
  };

  return placementAreas[placement];
}

function isStorageQuotaError(error: unknown) {
  return error instanceof DOMException
    && (error.name === 'QuotaExceededError'
      || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || error.code === 22
      || error.code === 1014);
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function createCompressedPreviewUrl(dataUrl: string) {
  const image = await loadImageFromDataUrl(dataUrl);
  const ratio = Math.min(PREVIEW_MAX_SIZE / image.width, PREVIEW_MAX_SIZE / image.height, 1);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL(PREVIEW_OUTPUT_TYPE, PREVIEW_OUTPUT_QUALITY);
}

export default function Customizer() {
  const { id, productId } = useParams();
  const resolvedProductId = productId || id;
  const navigate = useNavigate();
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlacement, setActivePlacement] = useState<PrintPlacement>('front');
  const [placements, setPlacements] = useState<Record<PrintPlacement, PlacementState>>(createDefaultPlacements);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDesignSaved, setIsDesignSaved] = useState(false);
  const [customDesignId, setCustomDesignId] = useState('');
  const [savedPreviewUrl, setSavedPreviewUrl] = useState('');
  const [savedDesign, setSavedDesign] = useState<CustomDesign | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('2d');

  function markDesignUnsaved() {
    setIsDesignSaved(false);
    setCustomDesignId('');
    setSavedPreviewUrl('');
    setSavedDesign(null);
  }

  function updateActivePlacement(data: Partial<PlacementState>) {
    setPlacements((currentPlacements) => ({
      ...currentPlacements,
      [activePlacement]: {
        ...currentPlacements[activePlacement],
        ...data,
        position: data.position || currentPlacements[activePlacement].position,
        uploadedImageUrl: Object.prototype.hasOwnProperty.call(data, 'uploadedImageUrl')
          ? data.uploadedImageUrl ?? null
          : Object.prototype.hasOwnProperty.call(data, 'uploadedImage')
            ? data.uploadedImage ?? null
            : currentPlacements[activePlacement].uploadedImageUrl,
        previewUrl: Object.prototype.hasOwnProperty.call(data, 'previewUrl')
          ? data.previewUrl ?? null
          : currentPlacements[activePlacement].previewUrl,
      },
    }));
    markDesignUnsaved();
  }

  function handlePlacementChange(placement: PrintPlacement) {
    setActivePlacement(placement);
    setPlacements((currentPlacements) =>
      printPlacements.reduce(
        (nextPlacements, item) => ({
          ...nextPlacements,
          [item.id]: {
            ...currentPlacements[item.id],
            isActive: item.id === placement,
          },
        }),
        {} as Record<PrintPlacement, PlacementState>,
      ),
    );
  }

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
        setActivePlacement('front');
        setPlacements(createDefaultPlacements());
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

    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      toast.error('Image is too large. Please upload an image up to 5MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const uploadedImageUrl = readerEvent.target?.result as string;
      updateActivePlacement({
        uploadedImage: uploadedImageUrl,
        uploadedImageUrl,
        position: { x: 50, y: 50 },
        scale: 50,
        rotation: 0,
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function removeDesignFromActivePlacement() {
    setPlacements((currentPlacements) => ({
      ...currentPlacements,
      [activePlacement]: {
        ...currentPlacements[activePlacement],
        uploadedImage: null,
        uploadedImageUrl: null,
        previewUrl: null,
        position: { x: 50, y: 50 },
        scale: 50,
        rotation: 0,
      },
    }));
    markDesignUnsaved();
    toast.success('Design removed from this print area');
  }

  async function saveDesign() {
    if (!product) return;

    const designedPlacements = printPlacements.filter((placement) =>
      placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl,
    );
    if (!designedPlacements.length) {
      toast.error('Upload a design first');
      return;
    }

    if (!selectedSize) {
      toast.error('Select a size before saving your design');
      return;
    }

    if (!selectedColor) {
      toast.error('Select a color before saving your design');
      return;
    }

    const primaryPlacement = placements[activePlacement].uploadedImage || placements[activePlacement].uploadedImageUrl
      ? activePlacement
      : designedPlacements[0].id;
    const primaryState = placements[primaryPlacement];

    try {
      const compressedEntries = await Promise.all(
        designedPlacements.map(async (placement) => [
          placement.id,
          await createCompressedPreviewUrl(placements[placement.id].uploadedImageUrl || placements[placement.id].uploadedImage || ''),
        ] as const),
      );
      const compressedPreviewByPlacement = Object.fromEntries(compressedEntries) as Partial<Record<PrintPlacement, string>>;
      const uploadedImageUrl = compressedPreviewByPlacement[primaryPlacement] || '';
      const previewUrl = uploadedImageUrl || product.mockups?.front || product.image;
      const usedPlacementIds = designedPlacements.map((placement) => placement.id);
      const placementData = printPlacements.reduce(
        (data, placement) => ({
          ...data,
          [placement.id]: {
            uploadedImage: placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl
              ? compressedPreviewByPlacement[placement.id] || previewUrl
              : null,
            uploadedImageUrl: placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl
              ? compressedPreviewByPlacement[placement.id] || previewUrl
              : null,
            previewUrl: placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl
              ? compressedPreviewByPlacement[placement.id] || previewUrl
              : null,
            position: placements[placement.id].position,
            scale: placements[placement.id].scale,
            rotation: placements[placement.id].rotation,
            isActive: placement.id === activePlacement,
            label: placement.label,
            view: placement.view,
            printArea: resolvePlacementArea(product, placement.id),
          },
        }),
        {} as Record<PrintPlacement, PlacementState & { label: string; view: PlacementView; printArea: ReturnType<typeof resolvePlacementArea> }>,
      );

      const { customDesignId: nextCustomDesignId, design } = await designService.saveDesign({
        productId: product.id,
        productTitle: product.name,
        uploadedImageUrl,
        previewUrl,
        selectedSize,
        selectedColor,
        activePlacement,
        position: primaryState.position,
        scale: primaryState.scale,
        rotation: primaryState.rotation,
        previewMode,
        createdAt: new Date().toISOString(),
        placements: placementData,
        usedPlacements: usedPlacementIds,
        canvasState: {
          mode: 'figma-style-mock',
          previewMode,
          activePlacement,
          usedPlacements: usedPlacementIds,
        },
      });

      setCustomDesignId(nextCustomDesignId);
      setSavedPreviewUrl(design.previewUrl || previewUrl);
      setSavedDesign(design);
      setIsDesignSaved(true);
      toast.success('Design saved');
    } catch (error) {
      if (isStorageQuotaError(error)) {
        toast.error('Image is too large for local preview storage. Please use a smaller image.');
        return;
      }

      toast.error('Could not save design. Try a smaller image and save again.');
    }
  }

  async function addToCart() {
    if (!product) return;

    if (!isDesignSaved || !customDesignId || !savedDesign) {
      toast.error('Please save your design first');
      return;
    }

    if (!selectedSize) {
      toast.error('Select a size before adding to cart');
      return;
    }

    if (!selectedColor) {
      toast.error('Select a color before adding to cart');
      return;
    }

    const previewUrl = savedDesign.previewUrl
      || savedPreviewUrl
      || savedDesign.uploadedImageUrl
      || product.mockups?.front
      || product.image;
    const usedPlacements = savedDesign.usedPlacements?.length
      ? savedDesign.usedPlacements
      : printPlacements
        .filter((placement) =>
          savedDesign.placements?.[placement.id]?.uploadedImage
          || savedDesign.placements?.[placement.id]?.uploadedImageUrl
          || savedDesign.placements?.[placement.id]?.previewUrl,
        )
        .map((placement) => placement.id);

    try {
      await addItem({
        productId: product.id,
        title: product.name,
        name: product.name,
        image: previewUrl,
        previewUrl,
        customImage: savedDesign.uploadedImageUrl || previewUrl,
        customDesignId,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
        price: product.price,
        isCustomized: true,
        hasCustomDesign: true,
        customDesignPlacements: savedDesign.placements,
        usedPlacements,
      });

      toast.success('Product added to cart');
      navigate('/cart');
    } catch (error) {
      if (isStorageQuotaError(error)) {
        toast.error('Image is too large for local preview storage. Please use a smaller image.');
        return;
      }

      toast.error('Could not add product to cart');
    }
  }

  const activePlacementState = placements[activePlacement];
  const currentStep = !printPlacements.some((placement) => placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl)
    ? 1
    : isDesignSaved
      ? 4
      : 3;

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

  const activePlacementMeta = printPlacements.find((placement) => placement.id === activePlacement) || printPlacements[0];
  const productImage = product.mockups?.[activePlacementMeta.view] || product.images?.[0] || product.image;
  const printArea = resolvePlacementArea(product, activePlacement);
  const printAreaStyle = {
    left: `${printArea.x}%`,
    top: `${printArea.y}%`,
    width: `${printArea.width}%`,
    height: `${printArea.height}%`,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl mb-4">Product Customizer</h1>

        <div className="flex items-center gap-3 md:gap-2 overflow-x-auto pb-2 md:pb-0">
          {['Choose product', 'Upload design', 'Adjust design', 'Save and order'].map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep >= stepNumber;

            return (
              <div key={step} className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center ${isActive ? 'bg-[#7A1F2A] text-white' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
                  {currentStep > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                <span className={`whitespace-nowrap text-sm md:text-base ${isActive ? 'text-[#7A1F2A]' : 'text-[#1A1A1A]'}`}>{step}</span>
                {stepNumber < 4 && <ChevronRight className="w-5 h-5 text-[#1A1A1A] hidden md:block" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 order-1">
          <div className="mb-4 flex rounded border border-black/10 overflow-hidden bg-white w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setPreviewMode('2d')}
              className={`flex-1 sm:flex-none px-5 py-2.5 text-sm transition-colors ${
                previewMode === '2d' ? 'bg-[#7A1F2A] text-white' : 'hover:bg-[#F5F5F5]'
              }`}
            >
              2D Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('3d')}
              className={`flex-1 sm:flex-none px-5 py-2.5 text-sm transition-colors ${
                previewMode === '3d' ? 'bg-[#7A1F2A] text-white' : 'hover:bg-[#F5F5F5]'
              }`}
            >
              3D Preview
            </button>
          </div>

          <div className="bg-[#F5F5F5] rounded-lg p-3 sm:p-6 md:p-8 flex items-center justify-center">
            {previewMode === '3d' ? (
              <div className="w-full max-w-2xl">
                <ProductPreview3D
                  designImage={activePlacementState.uploadedImageUrl || activePlacementState.uploadedImage}
                  position={activePlacementState.position}
                  scale={activePlacementState.scale}
                  rotation={activePlacementState.rotation}
                  color={selectedColor}
                  category={product.category}
                  printArea={printArea}
                  placement={activePlacement}
                  activePlacement={activePlacement}
                  placements={placements}
                  currentPlacementData={activePlacementState}
                />
                <p className="text-xs text-[#1A1A1A] text-center mt-3">
                  Drag to rotate the 3D preview. This is optional and does not affect checkout.
                </p>
              </div>
            ) : (
              <div className="relative w-full max-w-xs sm:max-w-md aspect-[3/4] bg-[#F5F5F5] border border-black/5 rounded-lg shadow-lg overflow-hidden">
                <img src={productImage} alt={product.name} className="w-full h-full object-contain p-4" />

                <div
                  className="absolute border-2 border-dashed border-[#7A1F2A] bg-[#7A1F2A]/5 overflow-hidden pointer-events-none"
                  style={printAreaStyle}
                >
                  {activePlacementState.uploadedImageUrl || activePlacementState.uploadedImage ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${activePlacementState.uploadedImageUrl || activePlacementState.uploadedImage})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        transform: `translate(${activePlacementState.position.x - 50}%, ${activePlacementState.position.y - 50}%) scale(${activePlacementState.scale / 100}) rotate(${activePlacementState.rotation}deg)`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#7A1F2A] text-sm">
                      Print Area
                    </div>
                  )}
                </div>

                {isDesignSaved && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Design saved
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6 order-2">
          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
            <h3 className="mb-4">Print Area</h3>
            <div className="grid grid-cols-2 gap-2">
              {printPlacements.map((placement) => {
                const hasDesign = Boolean(placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl);

                return (
                  <button
                    key={placement.id}
                    type="button"
                    onClick={() => handlePlacementChange(placement.id)}
                    aria-pressed={activePlacement === placement.id}
                    className={`px-3 py-2 border rounded text-sm transition-colors ${
                      activePlacement === placement.id
                        ? 'bg-[#7A1F2A] text-white border-[#7A1F2A]'
                        : 'border-black/10 hover:bg-[#F5F5F5]'
                    }`}
                  >
                    {placement.label}
                    {hasDesign && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#1A1A1A] mt-3">
              Each area keeps its own uploaded image and adjustments.
            </p>
            <p className="text-xs text-[#1A1A1A] mt-1">
              Active area: {activePlacementMeta.label}
            </p>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
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
              {activePlacementState.uploadedImageUrl || activePlacementState.uploadedImage ? 'Change Image' : 'Upload Image'}
            </button>
            <p className="text-xs text-[#1A1A1A] mt-2">PNG, JPG, JPEG, WEBP, GIF</p>
            {!activePlacementState.uploadedImageUrl && !activePlacementState.uploadedImage && (
              <p className="text-xs text-[#1A1A1A] mt-2">
                No image uploaded for {activePlacementMeta.label.toLowerCase()} yet.
              </p>
            )}
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
            <h3 className="mb-4">Adjust Design</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <Move className="w-4 h-4" />
                  Position X: {activePlacementState.position.x}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activePlacementState.position.x}
                  onChange={(event) => {
                    updateActivePlacement({
                      position: { ...activePlacementState.position, x: Number(event.target.value) },
                    });
                  }}
                  className="w-full"
                  disabled={!activePlacementState.uploadedImage && !activePlacementState.uploadedImageUrl}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <Move className="w-4 h-4" />
                  Position Y: {activePlacementState.position.y}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activePlacementState.position.y}
                  onChange={(event) => {
                    updateActivePlacement({
                      position: { ...activePlacementState.position, y: Number(event.target.value) },
                    });
                  }}
                  className="w-full"
                  disabled={!activePlacementState.uploadedImage && !activePlacementState.uploadedImageUrl}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Size: {activePlacementState.scale}%</label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={activePlacementState.scale}
                  onChange={(event) => {
                    updateActivePlacement({ scale: Number(event.target.value) });
                  }}
                  className="w-full"
                  disabled={!activePlacementState.uploadedImage && !activePlacementState.uploadedImageUrl}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-sm">
                  <RotateCw className="w-4 h-4" />
                  Rotation: {activePlacementState.rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={activePlacementState.rotation}
                  onChange={(event) => {
                    updateActivePlacement({ rotation: Number(event.target.value) });
                  }}
                  className="w-full"
                  disabled={!activePlacementState.uploadedImage && !activePlacementState.uploadedImageUrl}
                />
              </div>

              <button
                onClick={removeDesignFromActivePlacement}
                disabled={!activePlacementState.uploadedImage && !activePlacementState.uploadedImageUrl}
                className="w-full py-2 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete design
              </button>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
            <h3 className="mb-2">{product.name}</h3>

            <div className="mb-4">
              <p className="text-[#1A1A1A] text-sm mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || []).map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      markDesignUnsaved();
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
                      markDesignUnsaved();
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

          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
            <h3 className="mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={saveDesign}
                className="w-full py-3 bg-black text-white rounded flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-colors"
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
              {!isDesignSaved && printPlacements.some((placement) => placements[placement.id].uploadedImage || placements[placement.id].uploadedImageUrl) && (
                <p className="text-xs text-[#1A1A1A] text-center">Save your design to add to cart</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
