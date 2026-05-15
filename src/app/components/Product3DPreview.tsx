import { forwardRef, useImperativeHandle, useRef } from 'react';
import { LaptopPreview3D, type LaptopPreview3DHandle } from './LaptopPreview3D';
import { MugPreview3D, type MugPreview3DHandle } from './MugPreview3D';
import { ProductPreview3D, type ProductPreview3DHandle } from './ProductPreview3D';
import type { Product, ProductPrintAreaKey } from '../types';

type TShirtPrintPlacement = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'leftSide' | 'rightSide';
type MugPrintPlacement = 'handle' | 'outer';
type LaptopPrintPlacement = 'lid' | 'palmRest';
type PlacementState = {
  uploadedImage: string | null;
  uploadedImageUrl: string | null;
  previewUrl?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  isActive: boolean;
};

export type Product3DPreviewHandle = {
  capture3DScreenshot: () => string | null;
};

type Product3DPreviewProps = {
  product: Product;
  designImage?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  color?: string;
  printArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  activePlacement: ProductPrintAreaKey;
  placements: Record<string, PlacementState>;
  currentPlacementData: PlacementState;
  modelZoom?: number;
};

const tshirtPreviewPlacementKeys = new Set<ProductPrintAreaKey>([
  'front',
  'back',
  'leftSleeve',
  'rightSleeve',
  'leftSide',
  'rightSide',
]);
const mugPreviewPlacementKeys = new Set<ProductPrintAreaKey>(['handle', 'outer']);
const laptopPreviewPlacementKeys = new Set<ProductPrintAreaKey>(['lid', 'palmRest']);

function isTShirtPreviewPlacement(placement: ProductPrintAreaKey): placement is TShirtPrintPlacement {
  return tshirtPreviewPlacementKeys.has(placement);
}

function isMugPreviewPlacement(placement: ProductPrintAreaKey): placement is MugPrintPlacement {
  return mugPreviewPlacementKeys.has(placement);
}

function isLaptopPreviewPlacement(placement: ProductPrintAreaKey): placement is LaptopPrintPlacement {
  return laptopPreviewPlacementKeys.has(placement);
}

export const Product3DPreview = forwardRef<Product3DPreviewHandle, Product3DPreviewProps>(function Product3DPreview({
  product,
  designImage,
  position,
  scale,
  rotation,
  color,
  printArea,
  activePlacement,
  placements,
  currentPlacementData,
  modelZoom,
}, ref) {
  const tshirtPreview3DRef = useRef<ProductPreview3DHandle>(null);
  const mugPreview3DRef = useRef<MugPreview3DHandle>(null);
  const laptopPreview3DRef = useRef<LaptopPreview3DHandle>(null);
  const previewPlacement = isTShirtPreviewPlacement(activePlacement) ? activePlacement : 'front';
  const mugPreviewPlacement = isMugPreviewPlacement(activePlacement) ? activePlacement : 'outer';
  const laptopPreviewPlacement = isLaptopPreviewPlacement(activePlacement) ? activePlacement : 'lid';
  const previewPlacements = Object.fromEntries(
    Object.entries(placements).filter(([placement]) => isTShirtPreviewPlacement(placement as ProductPrintAreaKey)),
  ) as Partial<Record<TShirtPrintPlacement, PlacementState>>;
  const mugPreviewPlacements = Object.fromEntries(
    Object.entries(placements).filter(([placement]) => isMugPreviewPlacement(placement as ProductPrintAreaKey)),
  ) as Partial<Record<MugPrintPlacement, PlacementState>>;
  const laptopPreviewPlacements = Object.fromEntries(
    Object.entries(placements).filter(([placement]) => isLaptopPreviewPlacement(placement as ProductPrintAreaKey)),
  ) as Partial<Record<LaptopPrintPlacement, PlacementState>>;

  useImperativeHandle(ref, () => ({
    capture3DScreenshot() {
      if (product.productType === 'mug') return mugPreview3DRef.current?.capture3DScreenshot() || null;
      if (product.productType === 'laptop') return laptopPreview3DRef.current?.capture3DScreenshot() || null;
      return tshirtPreview3DRef.current?.capture3DScreenshot() || null;
    },
  }), [product.productType]);

  if (product.productType === 'mug') {
    return (
      <MugPreview3D
        ref={mugPreview3DRef}
        modelUrl={product.model3dUrl || '/models/mug.glb'}
        designImage={designImage}
        position={position}
        scale={scale}
        rotation={rotation}
        color={color}
        placement={mugPreviewPlacement}
        activePlacement={mugPreviewPlacement}
        placements={mugPreviewPlacements}
        currentPlacementData={currentPlacementData}
        modelZoom={modelZoom}
      />
    );
  }

  if (product.productType === 'laptop') {
    return (
      <LaptopPreview3D
        ref={laptopPreview3DRef}
        modelUrl={product.model3dUrl || '/models/laptop.glb'}
        designImage={designImage}
        position={position}
        scale={scale}
        rotation={rotation}
        color={color}
        placement={laptopPreviewPlacement}
        activePlacement={laptopPreviewPlacement}
        placements={laptopPreviewPlacements}
        currentPlacementData={currentPlacementData}
        modelZoom={modelZoom}
      />
    );
  }

  return (
    <ProductPreview3D
      ref={tshirtPreview3DRef}
      designImage={designImage}
      position={position}
      scale={scale}
      rotation={rotation}
      color={color}
      category={product.category}
      printArea={printArea}
      placement={previewPlacement}
      activePlacement={previewPlacement}
      placements={previewPlacements}
      currentPlacementData={currentPlacementData}
      modelZoom={modelZoom}
    />
  );
});
