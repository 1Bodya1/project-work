import { Suspense, useEffect, useMemo, useState } from 'react';
import { Environment, Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const T_SHIRT_MODEL_PATH = '/models/tshirt.glb';
const FALLBACK_T_SHIRT_MODEL_PATH = '/models/t_shirt.glb';
const TARGET_MODEL_HEIGHT = 2.28;
const FRONT_BODY_MESH_NAMES = new Set(['Object_4', 'Object_6']);
const SHOW_UV_DEBUG_MARK = false;
const USE_UV_TEXTURE_PREVIEW = true;
const TEXTURE_SIZE = 1024;
const FRONT_CHEST_U = 0.25;
const FRONT_CHEST_V = 0.6;
const FRONT_CHEST_SIZE = 230;
const FRONT_CHEST_MIN_SIZE = 170;
const FRONT_CHEST_MAX_SIZE = 320;
const FRONT_CHEST_X_RANGE = 64;
const FRONT_CHEST_Y_RANGE = 50;
const SHOW_UV_PRINT_AREA_DEBUG = false;
const SHOW_UV_DEBUG_MARKS = false;
const SHOW_SLEEVE_UV_DEBUG = false;
const ENABLE_UV_EMERGENCY_FALLBACK = true;
const LEFT_SLEEVE_U = 0.165;
const LEFT_SLEEVE_V = 0.56;
const RIGHT_SLEEVE_U = 0.455;
const RIGHT_SLEEVE_V = 0.56;
const SLEEVE_UV_SIZE = 76;
const SLEEVE_UV_MIN_SIZE = 48;
const SLEEVE_UV_MAX_SIZE = 112;
const SLEEVE_UV_X_RANGE = 14;
const SLEEVE_UV_Y_RANGE = 14;
// Fallback overlays are used for MVP stability where UV/decal projection is not tuned yet.
// These tiny offsets keep prints visually close to the garment surface without clipping.
const backOffset = 0.0015;
const leftSleeveOffset = 0.006;
const rightSleeveOffset = 0.006;
const leftSideOffset = 0.0015;
const rightSideOffset = 0.0015;

type PrintPlacement = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'leftSide' | 'rightSide';

const printPlacementOrder: PrintPlacement[] = ['front', 'back', 'leftSleeve', 'rightSleeve', 'leftSide', 'rightSide'];

const UV_PRINT_AREAS: Record<PrintPlacement, {
  u: number;
  v: number;
  size: number;
  minSize: number;
  maxSize: number;
  xRange: number;
  yRange: number;
}> = {
  front: { u: 0.25, v: 0.62, size: 230, minSize: 170, maxSize: 320, xRange: 64, yRange: 50 },
  back: { u: 0.755, v: 0.635, size: 230, minSize: 170, maxSize: 320, xRange: 64, yRange: 50 },
  leftSleeve: {
    u: LEFT_SLEEVE_U,
    v: LEFT_SLEEVE_V,
    size: SLEEVE_UV_SIZE,
    minSize: SLEEVE_UV_MIN_SIZE,
    maxSize: SLEEVE_UV_MAX_SIZE,
    xRange: SLEEVE_UV_X_RANGE,
    yRange: SLEEVE_UV_Y_RANGE,
  },
  rightSleeve: {
    u: RIGHT_SLEEVE_U,
    v: RIGHT_SLEEVE_V,
    size: SLEEVE_UV_SIZE,
    minSize: SLEEVE_UV_MIN_SIZE,
    maxSize: SLEEVE_UV_MAX_SIZE,
    xRange: SLEEVE_UV_X_RANGE,
    yRange: SLEEVE_UV_Y_RANGE,
  },
  leftSide: { u: 0.058, v: 0.53, size: 160, minSize: 110, maxSize: 240, xRange: 36, yRange: 44 },
  rightSide: { u: 0.449, v: 0.53, size: 160, minSize: 110, maxSize: 240, xRange: 36, yRange: 44 },
};

const PLACEMENT_RENDER_METHOD: Record<PrintPlacement, 'uv' | 'fallback'> = {
  front: 'uv',
  back: 'uv',
  leftSleeve: 'uv',
  rightSleeve: 'uv',
  leftSide: 'uv',
  rightSide: 'uv',
};

type FallbackPrintAnchor = {
  position: [number, number, number];
  rotation: [number, number, number];
  normal: [number, number, number];
  horizontalAxis: 'x' | 'z';
  xRange: number;
  yRange: number;
  baseSize: number;
  minSize: number;
  maxSize: number;
  surfaceGap: number;
  rotationSign: 1 | -1;
};

const PLACEMENT_3D_ANCHORS: Record<PrintPlacement, FallbackPrintAnchor> = {
  front: {
    position: [-0.08, 0.28, 0.87],
    rotation: [0, 0, 0],
    normal: [0, 0, 1],
    horizontalAxis: 'x',
    xRange: 0.12,
    yRange: 0.1,
    baseSize: 0.34,
    minSize: 0.24,
    maxSize: 0.56,
    surfaceGap: 0.006,
    rotationSign: -1,
  },
  back: {
    position: [0, 0.31, -0.872],
    rotation: [0, Math.PI, 0],
    normal: [0, 0, -1],
    horizontalAxis: 'x',
    xRange: 0.12,
    yRange: 0.1,
    baseSize: 0.36,
    minSize: 0.24,
    maxSize: 0.56,
    surfaceGap: backOffset,
    rotationSign: 1,
  },
  leftSleeve: {
    position: [-0.67, 0.28, 0.08],
    rotation: [0, -Math.PI / 2, 0],
    normal: [-1, 0, 0],
    horizontalAxis: 'z',
    xRange: 0.1,
    yRange: 0.08,
    baseSize: 0.22,
    minSize: 0.14,
    maxSize: 0.34,
    surfaceGap: leftSleeveOffset,
    rotationSign: 1,
  },
  rightSleeve: {
    position: [0.67, 0.28, 0.08],
    rotation: [0, Math.PI / 2, 0],
    normal: [1, 0, 0],
    horizontalAxis: 'z',
    xRange: 0.1,
    yRange: 0.08,
    baseSize: 0.22,
    minSize: 0.14,
    maxSize: 0.34,
    surfaceGap: rightSleeveOffset,
    rotationSign: -1,
  },
  leftSide: {
    position: [-0.505, 0.02, 0.05],
    rotation: [0, -Math.PI / 2, 0],
    normal: [-1, 0, 0],
    horizontalAxis: 'z',
    xRange: 0.075,
    yRange: 0.1,
    baseSize: 0.25,
    minSize: 0.2,
    maxSize: 0.44,
    surfaceGap: leftSideOffset,
    rotationSign: 1,
  },
  rightSide: {
    position: [0.505, 0.02, 0.05],
    rotation: [0, Math.PI / 2, 0],
    normal: [1, 0, 0],
    horizontalAxis: 'z',
    xRange: 0.075,
    yRange: 0.1,
    baseSize: 0.25,
    minSize: 0.2,
    maxSize: 0.44,
    surfaceGap: rightSideOffset,
    rotationSign: -1,
  },
};

type ProductPreview3DProps = {
  designImage?: string | null;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  color?: string;
  category?: string;
  printArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  placement?: PrintPlacement;
  activePlacement?: PrintPlacement;
  placements?: Partial<Record<PrintPlacement, ProductPreviewPlacementData>>;
  currentPlacementData?: ProductPreviewPlacementData;
};

type ProductPreviewPlacementData = {
  uploadedImage?: string | null;
  uploadedImageUrl?: string | null;
  previewUrl?: string | null;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  isActive?: boolean;
};

function normalizeModel(scene: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const scale = size.y > 0 ? TARGET_MODEL_HEIGHT / size.y : 1;

  return {
    scale,
    position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number],
  };
}

function getPlacementImageSource(placement?: ProductPreviewPlacementData | null) {
  return placement?.uploadedImageUrl || placement?.uploadedImage || placement?.previewUrl || null;
}

function loadPlacementImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createMultiPlacementCanvasTexture(
  placements: Partial<Record<PrintPlacement, ProductPreviewPlacementData>>,
) {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const placementEntries = await Promise.all(
    printPlacementOrder.map(async (placement) => {
      const placementData = placements[placement];
      const imageSource = getPlacementImageSource(placementData);
      if (!imageSource) return null;
      const placementMethod = PLACEMENT_RENDER_METHOD[placement];
      if (placementMethod === 'fallback' && !SHOW_SLEEVE_UV_DEBUG) return null;

      try {
        return {
          placement,
          placementData,
          image: await loadPlacementImage(imageSource),
        };
      } catch {
        return null;
      }
    }),
  );

  placementEntries.forEach((entry) => {
    if (!entry) return;

    const { placement, placementData, image } = entry;
    const area = UV_PRINT_AREAS[placement];
    const position = placementData.position || { x: 50, y: 50 };
    const scale = placementData.scale ?? 50;
    const rotation = placementData.rotation ?? 0;
    const centerX = (area.u * TEXTURE_SIZE) + ((position.x - 50) / 50) * area.xRange;
    const centerY = ((1 - area.v) * TEXTURE_SIZE) + ((50 - position.y) / 50) * area.yRange;
    const maxPrintSize = THREE.MathUtils.clamp(
      area.size * (scale / 50),
      area.minSize,
      area.maxSize,
    );
    const imageAspect = image.width / image.height || 1;
    const printWidth = imageAspect >= 1 ? maxPrintSize : maxPrintSize * imageAspect;
    const printHeight = imageAspect >= 1 ? maxPrintSize / imageAspect : maxPrintSize;
    const isSleeve = placement === 'leftSleeve' || placement === 'rightSleeve';

    if (SHOW_UV_PRINT_AREA_DEBUG || SHOW_UV_DEBUG_MARK || SHOW_UV_DEBUG_MARKS || (SHOW_SLEEVE_UV_DEBUG && isSleeve)) {
      context.save();
      context.translate(centerX, centerY);
      context.fillStyle = isSleeve ? '#ff00ff' : placement === 'front' || placement === 'back' ? '#ff0000' : '#0066ff';
      context.globalAlpha = 0.45;
      context.fillRect(-area.size / 2, -area.size / 2, area.size, area.size);
      context.globalAlpha = 1;
      context.fillStyle = '#ffffff';
      context.font = 'bold 24px sans-serif';
      context.textAlign = 'center';
      context.fillText(placement === 'leftSleeve' ? 'LEFT SLEEVE TEST' : placement === 'rightSleeve' ? 'RIGHT SLEEVE TEST' : placement, 0, 10);
      context.restore();
    }

    context.save();
    context.translate(centerX, centerY);
    context.rotate(THREE.MathUtils.degToRad(rotation));
    context.drawImage(image, -printWidth / 2, -printHeight / 2, printWidth, printHeight);
    context.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

function FallbackPrintOverlay({
  designImage,
  position,
  scale,
  rotation,
  placement,
}: Required<Pick<ProductPreview3DProps, 'designImage' | 'position' | 'scale' | 'rotation'>> & { placement: PrintPlacement }) {
  const texture = useTexture(designImage);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  const anchor = PLACEMENT_3D_ANCHORS[placement];
  const horizontalOffset = ((position.x - 50) / 50) * anchor.xRange;
  const verticalOffset = ((50 - position.y) / 50) * anchor.yRange;
  const printPosition: [number, number, number] = [
    anchor.position[0] + anchor.normal[0] * anchor.surfaceGap,
    anchor.position[1] + verticalOffset + anchor.normal[1] * anchor.surfaceGap,
    anchor.position[2] + anchor.normal[2] * anchor.surfaceGap,
  ];

  if (anchor.horizontalAxis === 'x') {
    printPosition[0] += horizontalOffset;
  } else {
    printPosition[2] += horizontalOffset;
  }

  const printSize = THREE.MathUtils.clamp(
    anchor.baseSize * (scale / 50),
    anchor.minSize,
    anchor.maxSize,
  );
  const imageAspect = texture.image && 'width' in texture.image && texture.image.height
    ? texture.image.width / texture.image.height
    : 1;
  const printWidth = imageAspect >= 1 ? printSize : printSize * imageAspect;
  const printHeight = imageAspect >= 1 ? printSize / imageAspect : printSize;
  const printRotation: [number, number, number] = [
    anchor.rotation[0],
    anchor.rotation[1],
    anchor.rotation[2] + THREE.MathUtils.degToRad(rotation * anchor.rotationSign),
  ];

  // UV texture mapping is experimental for this GLB; fallback plane overlay ensures stable MVP preview.
  return (
    <mesh
      position={printPosition}
      rotation={printRotation}
      renderOrder={30}
    >
      <planeGeometry args={[printWidth, printHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        toneMapped={false}
        depthTest
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

function GarmentModelWithDecal({
  designImage,
  position,
  scale,
  rotation,
  placement,
  placements,
}: ProductPreview3DProps & { placement: PrintPlacement }) {
  const gltf = useGLTF(T_SHIRT_MODEL_PATH);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const transform = useMemo(() => normalizeModel(scene), [scene]);
  const [shirtTexture, setShirtTexture] = useState<THREE.CanvasTexture | null>(null);
  const resolvedPlacements = useMemo(() => {
    const nextPlacements: Partial<Record<PrintPlacement, ProductPreviewPlacementData>> = {
      ...(placements || {}),
    };

    if (designImage) {
      nextPlacements[placement] = {
        ...nextPlacements[placement],
        uploadedImageUrl: getPlacementImageSource(nextPlacements[placement]) || designImage,
        position,
        scale,
        rotation,
      };
    }

    return nextPlacements;
  }, [designImage, placement, placements, position, rotation, scale]);
  const placementTextureKey = useMemo(() => JSON.stringify(
    printPlacementOrder.map((printPlacement) => {
      const placementData = resolvedPlacements[printPlacement];

      return {
        placement: printPlacement,
        image: getPlacementImageSource(placementData),
        position: placementData?.position || null,
        scale: placementData?.scale ?? null,
        rotation: placementData?.rotation ?? null,
      };
    }),
  ), [resolvedPlacements]);

  useEffect(() => {
    let isMounted = true;
    const hasUvPlacements = printPlacementOrder.some((printPlacement) => {
      const placementMethod = PLACEMENT_RENDER_METHOD[printPlacement];

      return Boolean(
        getPlacementImageSource(resolvedPlacements[printPlacement])
        && (placementMethod === 'uv' || SHOW_SLEEVE_UV_DEBUG),
      );
    });

    if (!hasUvPlacements) {
      setShirtTexture((currentTexture) => {
        currentTexture?.dispose();
        return null;
      });
      return;
    }

    createMultiPlacementCanvasTexture(resolvedPlacements)
      .then((texture) => {
        if (!isMounted) return;

        setShirtTexture((currentTexture) => {
          currentTexture?.dispose();
          return texture;
        });
      })
      .catch(() => {
        if (isMounted) setShirtTexture(null);
      });

    return () => {
      isMounted = false;
    };
  }, [placementTextureKey, resolvedPlacements]);

  useEffect(() => {
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material;

      const material = sourceMaterial instanceof THREE.MeshStandardMaterial
        || sourceMaterial instanceof THREE.MeshPhysicalMaterial
        ? sourceMaterial.clone()
        : new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0 });

      material.color.set('#ffffff');

      if (FRONT_BODY_MESH_NAMES.has(object.name) && USE_UV_TEXTURE_PREVIEW && shirtTexture) {
        material.map = shirtTexture;
        material.roughness = 0.62;
        material.metalness = 0;
      } else {
        material.map = null;
      }

      material.needsUpdate = true;
      object.material = material;
    });
  }, [placement, scene, shirtTexture]);

  const placementMethod = PLACEMENT_RENDER_METHOD[placement];
  const shouldShowFallbackPrint = Boolean(
    designImage
    && ENABLE_UV_EMERGENCY_FALLBACK
    && (
      placementMethod === 'fallback'
      || !USE_UV_TEXTURE_PREVIEW
      || !shirtTexture
    ),
  );

  return (
    <group>
      <group position={transform.position} scale={transform.scale}>
        <primitive object={scene} />
      </group>
      {shouldShowFallbackPrint && (
        <FallbackPrintOverlay
          designImage={designImage}
          position={position}
          scale={scale}
          rotation={rotation}
          placement={placement}
        />
      )}
    </group>
  );
}

export function ProductPreview3D({
  designImage,
  position = { x: 50, y: 50 },
  scale = 50,
  rotation = 0,
  placement = 'front',
  activePlacement,
  placements,
  currentPlacementData,
}: ProductPreview3DProps) {
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'missing'>('checking');
  const resolvedPlacement = activePlacement || placement;
  const resolvedDesignImage = currentPlacementData?.uploadedImageUrl
    || currentPlacementData?.uploadedImage
    || currentPlacementData?.previewUrl
    || designImage;
  const resolvedPosition = currentPlacementData?.position || position;
  const resolvedScale = currentPlacementData?.scale ?? scale;
  const resolvedRotation = currentPlacementData?.rotation ?? rotation;

  useEffect(() => {
    let isMounted = true;

    fetch(T_SHIRT_MODEL_PATH, { method: 'HEAD' })
      .then((response) => {
        if (isMounted) setModelStatus(response.ok ? 'ready' : 'missing');
      })
      .catch(() => {
        if (isMounted) setModelStatus('missing');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (modelStatus === 'checking') {
    return (
      <div className="w-full min-h-[420px] bg-[#F5F5F5] rounded-lg flex items-center justify-center text-sm text-[#1A1A1A]">
        Loading 3D model...
      </div>
    );
  }

  if (modelStatus === 'missing') {
    return (
      <div className="w-full min-h-[420px] bg-[#F5F5F5] rounded-lg flex items-center justify-center p-6 text-center">
        <div>
          <p className="mb-2">3D model file is missing.</p>
          <p className="text-sm text-[#1A1A1A]">
            Place the GLB file at <span className="font-mono">public/models/tshirt.glb</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[460px] bg-[#F5F5F5] rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.15, 4.75], fov: 36 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#F5F5F5']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 4]} intensity={1.7} />
        <directionalLight position={[-3, 2, 3]} intensity={0.65} />
        <Suspense fallback={<Html center>Loading model...</Html>}>
          <GarmentModelWithDecal
            designImage={resolvedDesignImage}
            position={resolvedPosition}
            scale={resolvedScale}
            rotation={resolvedRotation}
            placement={resolvedPlacement}
            placements={placements}
          />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.65}
          rotateSpeed={0.75}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(T_SHIRT_MODEL_PATH);
