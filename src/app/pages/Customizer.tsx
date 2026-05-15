import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Check, ChevronRight, Move, RotateCw, Save, Trash2, Upload, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { Product3DPreview, type Product3DPreviewHandle } from '../components/Product3DPreview';
import { getProductMockup, getProductMockupFallback } from '../lib/productMockups';
import { designService } from '../services/designService';
import { uploadService } from '../services/uploadService';
import { productService } from '../services/productService';
import { useCart } from '../store/CartContext';
import type { CartItem, CustomDesign, Product, ProductPrintArea, ProductPrintAreaKey, ProductPrintAreaType } from '../types';

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;
const PREVIEW_MAX_SIZE = 400; // Reduced from 800 for smaller file size
const PREVIEW_OUTPUT_TYPE = 'image/webp';
const PREVIEW_OUTPUT_QUALITY = 0.5; // Reduced from 0.75 for smaller file size
type PreviewMode = '2d' | '3d';
type TShirtPrintPlacement = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'leftSide' | 'rightSide';
type PrintPlacement = ProductPrintAreaKey;
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
type PlacementStates = Record<string, PlacementState>;
type ProductPrintPlacement = {
  id: PrintPlacement;
  label: string;
  type: ProductPrintAreaType;
  view: PlacementView;
};
type PlacementImageFields = {
  uploadedImage?: string | null;
  uploadedImageUrl?: string | null;
  previewUrl?: string | null;
};

const tshirtPrintAreas: ProductPrintArea[] = [
  { key: 'front', label: 'Front', type: 'uv' },
  { key: 'back', label: 'Back', type: 'uv' },
  { key: 'leftSleeve', label: 'Left sleeve', type: 'uv' },
  { key: 'rightSleeve', label: 'Right sleeve', type: 'uv' },
  { key: 'leftSide', label: 'Left side', type: 'uv' },
  { key: 'rightSide', label: 'Right side', type: 'uv' },
];

const tshirtPreviewPlacementKeys = new Set<ProductPrintAreaKey>([
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
  'leftSide',
  'rightSide',
]);

const placementViews: Record<ProductPrintAreaKey, PlacementView> = {
  front: 'front',
  back: 'back',
  leftSleeve: 'left',
  rightSleeve: 'right',
  leftSide: 'left',
  rightSide: 'right',
  wrap: 'front',
  handle: 'right',
  outer: 'front',
  lid: 'front',
  palmRest: 'front',
};

const defaultPlacementState: PlacementState = {
  uploadedImage: null,
  uploadedImageUrl: null,
  previewUrl: null,
  position: { x: 50, y: 50 },
  scale: 50,
  rotation: 0,
  isActive: false,
};

function isTShirtPreviewPlacement(placement: PrintPlacement): placement is TShirtPrintPlacement {
  return tshirtPreviewPlacementKeys.has(placement);
}

function getProductPrintPlacements(product?: Product | null): ProductPrintPlacement[] {
  const printAreas = product?.printAreas?.length ? product.printAreas : tshirtPrintAreas;

  return printAreas.map((area) => ({
    id: area.key,
    label: area.label,
    type: area.type,
    view: placementViews[area.key] || 'front',
  }));
}

function resolveActivePlacement(
  printPlacements: ProductPrintPlacement[],
  candidate?: PrintPlacement,
): PrintPlacement {
  return printPlacements.some((placement) => placement.id === candidate)
    ? candidate as PrintPlacement
    : printPlacements[0]?.id || 'front';
}

function createPlacementState(isActive = false): PlacementState {
  return {
    uploadedImage: defaultPlacementState.uploadedImage,
    uploadedImageUrl: defaultPlacementState.uploadedImageUrl,
    previewUrl: defaultPlacementState.previewUrl,
    position: { ...defaultPlacementState.position },
    scale: defaultPlacementState.scale,
    rotation: defaultPlacementState.rotation,
    isActive,
  };
}

function createDefaultPlacements(
  printPlacements = getProductPrintPlacements(),
  activePlacement: PrintPlacement = 'front',
): PlacementStates {
  const resolvedActivePlacement = resolveActivePlacement(printPlacements, activePlacement);

  return printPlacements.reduce(
    (placements, placement) => ({
      ...placements,
      [placement.id]: createPlacementState(placement.id === resolvedActivePlacement),
    }),
    {} as PlacementStates,
  );
}

function getPlacementState(
  placements: PlacementStates,
  placement: PrintPlacement,
  isActive = false,
): PlacementState {
  return placements[placement] || createPlacementState(isActive);
}

function restorePlacementsFromDesign(
  design: CustomDesign,
  printPlacements = getProductPrintPlacements(),
  activePlacement: PrintPlacement = 'front',
): PlacementStates {
  const defaultPlacements = createDefaultPlacements(printPlacements, activePlacement);
  const resolvedActivePlacement = resolveActivePlacement(printPlacements, activePlacement);

  return printPlacements.reduce(
    (placements, placement) => {
      const savedPlacement = design.placements?.[placement.id];

      return {
        ...placements,
        [placement.id]: {
          ...defaultPlacements[placement.id],
          uploadedImage: savedPlacement?.uploadedImage || null,
          uploadedImageUrl: savedPlacement?.uploadedImageUrl || savedPlacement?.uploadedImage || null,
          previewUrl: savedPlacement?.previewUrl || null,
          position: savedPlacement?.position || defaultPlacements[placement.id].position,
          scale: savedPlacement?.scale ?? defaultPlacements[placement.id].scale,
          rotation: savedPlacement?.rotation ?? defaultPlacements[placement.id].rotation,
          isActive: placement.id === resolvedActivePlacement,
        },
      };
    },
    {} as PlacementStates,
  );
}

function getPlacementSnapshot(placement: PlacementState | CustomDesign['placements'][string] | undefined) {
  return {
    image: getPlacementImageSource(placement),
    previewUrl: placement?.previewUrl || null,
    position: placement?.position || { x: 50, y: 50 },
    scale: placement?.scale ?? 50,
    rotation: placement?.rotation ?? 0,
  };
}

function getCurrentDesignSnapshot(
  placements: PlacementStates,
  selectedSize: string,
  selectedColor: string,
  printPlacements: ProductPrintPlacement[],
) {
  return {
    selectedSize,
    selectedColor,
    placements: printPlacements.reduce(
      (snapshot, placement) => ({
        ...snapshot,
        [placement.id]: getPlacementSnapshot(placements[placement.id]),
      }),
      {} as Record<string, ReturnType<typeof getPlacementSnapshot>>,
    ),
  };
}

function getSavedDesignSnapshot(design: CustomDesign, printPlacements: ProductPrintPlacement[]) {
  return {
    selectedSize: design.selectedSize || '',
    selectedColor: design.selectedColor || '',
    placements: printPlacements.reduce(
      (snapshot, placement) => ({
        ...snapshot,
        [placement.id]: getPlacementSnapshot(design.placements?.[placement.id]),
      }),
      {} as Record<string, ReturnType<typeof getPlacementSnapshot>>,
    ),
  };
}

function doesCurrentDesignMatchSaved(
  placements: PlacementStates,
  selectedSize: string,
  selectedColor: string,
  savedDesign: CustomDesign | null,
  printPlacements: ProductPrintPlacement[],
) {
  if (!savedDesign) return false;

  return JSON.stringify(getCurrentDesignSnapshot(placements, selectedSize, selectedColor, printPlacements))
    === JSON.stringify(getSavedDesignSnapshot(savedDesign, printPlacements));
}

function resolvePlacementArea(product: Product, placement: PrintPlacement) {
  const frontArea = product.printArea || { x: 31, y: 30, width: 38, height: 34 };
  const placementAreas: Partial<Record<PrintPlacement, typeof frontArea>> = {
    front: frontArea,
    back: { x: 32, y: 26, width: 36, height: 34 },
    leftSleeve: { x: 22, y: 25, width: 24, height: 24 },
    rightSleeve: { x: 54, y: 25, width: 24, height: 24 },
    leftSide: { x: 30, y: 34, width: 28, height: 36 },
    rightSide: { x: 42, y: 34, width: 28, height: 36 },
    handle: { x: 57, y: 33, width: 18, height: 24 },
    outer: { x: 24, y: 32, width: 52, height: 28 },
    lid: { x: 23, y: 20, width: 54, height: 34 },
    palmRest: { x: 23, y: 56, width: 54, height: 22 },
  };

  return placementAreas[placement] || frontArea;
}

function isStorageQuotaError(error: unknown) {
  return error instanceof DOMException
    && (error.name === 'QuotaExceededError'
      || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || error.code === 22
      || error.code === 1014);
}

function isObjectUrl(value?: string | null) {
  return Boolean(value?.startsWith('blob:'));
}

function getPlacementImageSource(placement?: PlacementImageFields | null) {
  return placement?.uploadedImage || placement?.previewUrl || placement?.uploadedImageUrl || null;
}

function getDesignedPlacementIds(placements?: CustomDesign['placements']) {
  if (!placements) return [];

  return Object.entries(placements)
    .filter(([, placement]) =>
      Boolean(placement?.uploadedImage || placement?.uploadedImageUrl || placement?.previewUrl),
    )
    .map(([placementId]) => placementId);
}

function createDesignFromCartItem(
  item: CartItem,
  product?: Product | null,
): CustomDesign {
  const placements = item.customDesignPlacements || item.customDesign?.placements || {};
  const usedPlacements = item.usedPlacements?.length ? item.usedPlacements : getDesignedPlacementIds(placements);
  const customDesignId = item.customDesignId || item.designId || item.id;

  return {
    ...(item.customDesign || {}),
    id: customDesignId,
    customDesignId,
    productId: item.productId,
    productTitle: item.title || item.name || product?.name || '',
    productType: item.productType || product?.productType,
    uploadedImageUrl: item.customImage || item.customDesign?.uploadedImageUrl || item.customDesign?.imageUrl || '',
    imageUrl: item.customImage || item.customDesign?.imageUrl || '',
    previewUrl: item.previewUrl || item.customDesign?.previewUrl || item.image || '',
    screenshot3dUrl: item.screenshot3dUrl || item.customDesign?.screenshot3dUrl || '',
    selectedSize: item.size,
    selectedColor: item.color,
    activePlacement: item.customDesign?.activePlacement || usedPlacements[0] || 'front',
    position: item.customDesign?.position || { x: 50, y: 50 },
    scale: item.customDesign?.scale ?? 50,
    rotation: item.customDesign?.rotation ?? 0,
    previewMode: item.customDesign?.previewMode || '3d',
    placements,
    usedPlacements,
    canvasState: item.customDesign?.canvasState,
    createdAt: item.customDesign?.createdAt || new Date().toISOString(),
  };
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(dataUrl)) {
      image.crossOrigin = 'anonymous';
    }
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
  const [searchParams] = useSearchParams();
  const editingCartItemId = searchParams.get('cartItemId') || '';
  const editingDesignId = searchParams.get('designId') || '';
  const {
    addItem,
    updateItem,
    items: cartItems,
    isLoading: isCartLoading,
  } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preview3DRef = useRef<Product3DPreviewHandle>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlacement, setActivePlacement] = useState<PrintPlacement>('front');
  const [placements, setPlacements] = useState<PlacementStates>(createDefaultPlacements);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDesignSaved, setIsDesignSaved] = useState(false);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [showSavedAnimation, setShowSavedAnimation] = useState(false);
  const [customDesignId, setCustomDesignId] = useState('');
  const [savedPreviewUrl, setSavedPreviewUrl] = useState('');
  const [savedDesign, setSavedDesign] = useState<CustomDesign | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('2d');
  const [modelZoom, setModelZoom] = useState(100);
  const objectUrlsRef = useRef(new Set<string>());
  const savedAnimationTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const printPlacements = useMemo(() => getProductPrintPlacements(product), [product]);
  const editingCartItem = useMemo(
    () => editingCartItemId
      ? cartItems.find((item) => item.id === editingCartItemId) || null
      : null,
    [cartItems, editingCartItemId],
  );

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    if (savedAnimationTimeoutRef.current) {
      window.clearTimeout(savedAnimationTimeoutRef.current);
    }
  }, []);

  function markDesignUnsaved() {
    setIsDesignSaved(false);
    setShowSavedAnimation(false);
    if (savedAnimationTimeoutRef.current) {
      window.clearTimeout(savedAnimationTimeoutRef.current);
      savedAnimationTimeoutRef.current = null;
    }
  }

  function playSavedAnimation() {
    setShowSavedAnimation(true);
    if (savedAnimationTimeoutRef.current) {
      window.clearTimeout(savedAnimationTimeoutRef.current);
    }

    savedAnimationTimeoutRef.current = window.setTimeout(() => {
      setShowSavedAnimation(false);
      savedAnimationTimeoutRef.current = null;
    }, 1400);
  }

  function updateActivePlacement(data: Partial<PlacementState>) {
    setPlacements((currentPlacements) => {
      const currentPlacement = currentPlacements[activePlacement] || createPlacementState(true);
      const nextUploadedImage = Object.prototype.hasOwnProperty.call(data, 'uploadedImage')
        ? data.uploadedImage ?? null
        : currentPlacement.uploadedImage || null;

      if (
        currentPlacement.uploadedImage
        && currentPlacement.uploadedImage !== nextUploadedImage
        && isObjectUrl(currentPlacement.uploadedImage)
      ) {
        URL.revokeObjectURL(currentPlacement.uploadedImage);
        objectUrlsRef.current.delete(currentPlacement.uploadedImage);
      }

      return {
        ...currentPlacements,
        [activePlacement]: {
          ...currentPlacement,
          ...data,
          uploadedImage: nextUploadedImage,
          position: data.position || currentPlacement.position || defaultPlacementState.position,
          uploadedImageUrl: Object.prototype.hasOwnProperty.call(data, 'uploadedImageUrl')
            ? data.uploadedImageUrl ?? null
            : currentPlacement.uploadedImageUrl || null,
          previewUrl: Object.prototype.hasOwnProperty.call(data, 'previewUrl')
            ? data.previewUrl ?? null
            : currentPlacement.previewUrl || null,
        },
      };
    });
    markDesignUnsaved();
  }

  function handlePlacementChange(placement: PrintPlacement) {
    setActivePlacement(placement);
    setPlacements((currentPlacements) =>
      printPlacements.reduce(
        (nextPlacements, item) => ({
          ...nextPlacements,
          [item.id]: {
            ...(currentPlacements[item.id] || createPlacementState()),
            isActive: item.id === placement,
          },
        }),
        {} as PlacementStates,
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

      if (editingCartItemId && isCartLoading) {
        return;
      }

      const nextProduct = await productService.getProductById(resolvedProductId);
      const productDesign = editingCartItem
        ? createDesignFromCartItem(editingCartItem, nextProduct)
        : editingDesignId
          ? await designService.getDesignById(editingDesignId)
          : nextProduct
            ? await designService.getDesignByProductId(nextProduct.id)
            : null;
      if (isMounted) {
        setProduct(nextProduct);
        setSelectedSize(productDesign?.selectedSize || nextProduct?.sizes?.[0] || '');
        setSelectedColor(productDesign?.selectedColor || nextProduct?.colors?.[0] || '');
        const nextPrintPlacements = getProductPrintPlacements(nextProduct);
        const nextActivePlacement = resolveActivePlacement(
          nextPrintPlacements,
          (productDesign?.activePlacement as PrintPlacement) || 'front',
        );
        setActivePlacement(nextActivePlacement);
        setPlacements(
          productDesign
            ? restorePlacementsFromDesign(productDesign, nextPrintPlacements, nextActivePlacement)
            : createDefaultPlacements(nextPrintPlacements, nextActivePlacement),
        );
        setCustomDesignId(productDesign?.id || '');
        setSavedPreviewUrl(productDesign?.previewUrl || '');
        setSavedDesign(productDesign);
        setIsDesignSaved(Boolean(productDesign));
        setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [editingCartItem, editingCartItemId, editingDesignId, isCartLoading, resolvedProductId]);

  useEffect(() => {
    const matchesSavedDesign = doesCurrentDesignMatchSaved(
      placements,
      selectedSize,
      selectedColor,
      savedDesign,
      printPlacements,
    );
    setIsDesignSaved((currentValue) => (
      currentValue === matchesSavedDesign ? currentValue : matchesSavedDesign
    ));
  }, [placements, printPlacements, selectedColor, selectedSize, savedDesign]);

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

    const localPreviewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(localPreviewUrl);

    toast.loading('Uploading image...');

    uploadService.uploadDesignImage(file)
      .then((response) => {
        toast.dismiss();
        updateActivePlacement({
          uploadedImage: localPreviewUrl,
          uploadedImageUrl: response.url,
          previewUrl: localPreviewUrl,
          position: { x: 50, y: 50 },
          scale: 50,
          rotation: 0,
        });
        toast.success('Image uploaded successfully');
      })
      .catch((error) => {
        toast.dismiss();
        URL.revokeObjectURL(localPreviewUrl);
        objectUrlsRef.current.delete(localPreviewUrl);
        console.error('Failed to upload design image:', error);
        toast.error('Failed to upload image. Please try again.');
      })
      .finally(() => {
        event.target.value = '';
      });
  }

  function removeDesignFromActivePlacement() {
    setPlacements((currentPlacements) => ({
      ...currentPlacements,
      [activePlacement]: {
        ...getPlacementState(currentPlacements, activePlacement, true),
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
    if (isSavingDesign || isDesignSaved) return;

    const designedPlacements = printPlacements.filter((placement) => {
      const placementState = getPlacementState(placements, placement.id);
      return placementState.uploadedImage || placementState.uploadedImageUrl;
    });
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

    const activeState = getPlacementState(placements, activePlacement, true);
    const primaryPlacement = activeState.uploadedImage || activeState.uploadedImageUrl
      ? activePlacement
      : designedPlacements[0].id;
    const primaryState = getPlacementState(placements, primaryPlacement);

    try {
      setIsSavingDesign(true);
      const compressedEntries = await Promise.all(
        designedPlacements.map(async (placement) => [
          placement.id,
          await createCompressedPreviewUrl(getPlacementImageSource(getPlacementState(placements, placement.id)) || ''),
        ] as const),
      );
      const compressedPreviewByPlacement = Object.fromEntries(compressedEntries) as Partial<Record<PrintPlacement, string>>;
      const uploadedImageUrl = compressedPreviewByPlacement[primaryPlacement] || '';
      const previewUrl = uploadedImageUrl || getProductMockup(product, 'front', selectedColor || product.colors?.[0]);
      const screenshot3dUrl = preview3DRef.current?.capture3DScreenshot() || '';
      const usedPlacementIds = designedPlacements.map((placement) => placement.id);
      
      // Only store placement data for placements that have an uploaded image, to reduce storage size
      const placementData = printPlacements.reduce(
        (data, placement) => {
          const placementState = getPlacementState(placements, placement.id);
          const hasImage = placementState.uploadedImage || placementState.uploadedImageUrl;
          return {
            ...data,
            [placement.id]: hasImage ? {
              uploadedImage: compressedPreviewByPlacement[placement.id] || previewUrl,
              uploadedImageUrl: compressedPreviewByPlacement[placement.id] || previewUrl,
              previewUrl: compressedPreviewByPlacement[placement.id] || previewUrl,
              position: placementState.position,
              scale: placementState.scale,
              rotation: placementState.rotation,
              isActive: placement.id === activePlacement,
              label: placement.label,
              view: placement.view,
              printArea: resolvePlacementArea(product, placement.id),
            } : null,
          };
        },
        {} as Record<PrintPlacement, (PlacementState & { label: string; view: PlacementView; printArea: ReturnType<typeof resolvePlacementArea> }) | null>,
      );

      const { customDesignId: nextCustomDesignId, design } = await designService.saveDesign({
        productId: product.id,
        productTitle: product.name,
        productType: product.productType,
        uploadedImageUrl,
        previewUrl,
        screenshot3dUrl,
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
      setPlacements(restorePlacementsFromDesign(design, printPlacements, activePlacement));
      setIsDesignSaved(true);
      playSavedAnimation();
    } catch (error) {
      if (isStorageQuotaError(error)) {
        toast.error('Image is too large for local preview storage. Please use a smaller image.');
        return;
      }

      toast.error('Could not save design. Try a smaller image and save again.');
    } finally {
      setIsSavingDesign(false);
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
      || getProductMockup(product, 'front', selectedColor || product.colors?.[0]);
    const screenshot3dUrl = preview3DRef.current?.capture3DScreenshot()
      || savedDesign.screenshot3dUrl
      || previewUrl;
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
      const cartItemData = {
        productId: product.id,
        productType: product.productType,
        title: product.name,
        name: product.name,
        image: screenshot3dUrl || previewUrl,
        previewUrl,
        screenshot3dUrl,
        customImage: savedDesign.uploadedImageUrl || previewUrl,
        customDesignId,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
        price: product.price,
        isCustomized: true,
        hasCustomDesign: true,
        customDesign: savedDesign,
        customDesignPlacements: savedDesign.placements,
        usedPlacements,
      };

      if (editingCartItemId) {
        await updateItem(editingCartItemId, cartItemData);
      } else {
        await addItem(cartItemData);
      }

      await designService.deleteDesign(customDesignId, product.id);

      toast.success(editingCartItemId ? 'Cart design updated' : 'Product added to cart');
      navigate('/cart');
    } catch (error) {
      if (isStorageQuotaError(error)) {
        toast.error('Image is too large for local preview storage. Please use a smaller image.');
        return;
      }

      toast.error('Could not add product to cart');
    }
  }

  const activePlacementState = getPlacementState(placements, activePlacement, true);
  const activePlacementImageSource = getPlacementImageSource(activePlacementState);
  const hasDesignedPlacements = printPlacements.some((placement) => {
    const placementState = getPlacementState(placements, placement.id);
    return Boolean(placementState.uploadedImage || placementState.uploadedImageUrl);
  });
  const canSaveDesign = hasDesignedPlacements && !isDesignSaved && !isSavingDesign;
  const currentStep = !printPlacements.some((placement) => {
    const placementState = getPlacementState(placements, placement.id);
    return placementState.uploadedImage || placementState.uploadedImageUrl;
  })
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
  const productImage = getProductMockup(product, activePlacementMeta.view, selectedColor || product.colors?.[0]);
  const productImageFallback = getProductMockupFallback(product, activePlacementMeta.view);
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
                <Product3DPreview
                  ref={preview3DRef}
                  product={product}
                  designImage={activePlacementImageSource}
                  position={activePlacementState.position}
                  scale={activePlacementState.scale}
                  rotation={activePlacementState.rotation}
                  color={selectedColor}
                  printArea={printArea}
                  activePlacement={activePlacement}
                  placements={placements}
                  currentPlacementData={activePlacementState}
                  modelZoom={modelZoom}
                />
                <p className="text-xs text-[#1A1A1A] text-center mt-3">
                  Drag to rotate the 3D preview. This is optional and does not affect checkout.
                </p>
              </div>
            ) : (
              <div className="relative w-full max-w-xs sm:max-w-md aspect-[3/4] bg-[#F5F5F5] border border-black/5 rounded-lg shadow-lg overflow-hidden">
                <img
                  src={productImage}
                  alt={product.name}
                  onError={(event) => {
                    if (event.currentTarget.src !== window.location.origin + productImageFallback) {
                      event.currentTarget.src = productImageFallback;
                    }
                  }}
                  className="w-full h-full object-contain p-4"
                />

                <div
                  className="absolute border-2 border-dashed border-[#7A1F2A] bg-[#7A1F2A]/5 overflow-hidden pointer-events-none"
                  style={printAreaStyle}
                >
                  {activePlacementImageSource ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${activePlacementImageSource})`,
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

              </div>
            )}
          </div>
        </div>
        <div className="space-y-6 order-2">
          <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6">
            <h3 className="mb-4">Print Area</h3>
            <div className="grid grid-cols-2 gap-2">
              {printPlacements.map((placement) => {
                const placementState = getPlacementState(placements, placement.id);
                const hasDesign = Boolean(placementState.uploadedImage || placementState.uploadedImageUrl);

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
              {activePlacementImageSource ? 'Change Image' : 'Upload Image'}
            </button>
            <p className="text-xs text-[#1A1A1A] mt-2">PNG, JPG, JPEG, WEBP, GIF</p>
            {!activePlacementImageSource && (
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

              {previewMode === '3d' && (
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm">
                    <ZoomIn className="w-4 h-4" />
                    3D Model Zoom: {modelZoom}%
                  </label>
                  <input
                    type="range"
                    min="55"
                    max="165"
                    value={modelZoom}
                    onChange={(event) => {
                      setModelZoom(Number(event.target.value));
                    }}
                    className="w-full"
                  />
                </div>
              )}

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
              <div className="relative">
                {showSavedAnimation && (
                  <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 shadow-sm animate-bounce">
                    Design saved
                  </div>
                )}
                <button
                  onClick={saveDesign}
                  disabled={!canSaveDesign}
                  className="w-full py-3 bg-black text-white rounded flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingDesign ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Saving...
                    </>
                  ) : isDesignSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Design saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save design
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={addToCart}
                disabled={!isDesignSaved}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCartItemId ? 'Update cart item' : 'Add to cart'}
              </button>
              {!isDesignSaved && hasDesignedPlacements && (
                <p className="text-xs text-[#1A1A1A] text-center">
                  Save your design to {editingCartItemId ? 'update cart' : 'add to cart'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
