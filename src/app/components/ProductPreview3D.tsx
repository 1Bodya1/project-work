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
const FALLBACK_PRINT_ANCHOR = {
  x: -0.08,
  y: 0.28,
  z: 0.87,
  xRange: 0.12,
  yRange: 0.1,
  baseSize: 0.34,
  surfaceGap: 0.006,
};

type PrintPlacement = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'leftSide' | 'rightSide';

type ProductPreview3DProps = {
  designImage?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  color?: string;
  category?: string;
  printArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  placement?: PrintPlacement;
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

function createChestCanvasTexture({
  image,
  position,
  scale,
  rotation,
}: {
  image: HTMLImageElement;
  position: ProductPreview3DProps['position'];
  scale: number;
  rotation: number;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  if (SHOW_UV_DEBUG_MARK) {
    const debugX = FRONT_CHEST_U * TEXTURE_SIZE;
    const debugY = (1 - FRONT_CHEST_V) * TEXTURE_SIZE;

    context.fillStyle = '#ff0000';
    context.fillRect(debugX - 140, debugY - 140, 280, 280);
    context.fillStyle = '#ffffff';
    context.font = 'bold 52px sans-serif';
    context.textAlign = 'center';
    context.fillText('PRINT', debugX, debugY + 18);
  }

  const centerX = (FRONT_CHEST_U * TEXTURE_SIZE) + ((position.x - 50) / 50) * FRONT_CHEST_X_RANGE;
  const centerY = ((1 - FRONT_CHEST_V) * TEXTURE_SIZE) + ((50 - position.y) / 50) * FRONT_CHEST_Y_RANGE;
  const maxPrintSize = THREE.MathUtils.clamp(
    FRONT_CHEST_SIZE * (scale / 50),
    FRONT_CHEST_MIN_SIZE,
    FRONT_CHEST_MAX_SIZE,
  );
  const imageAspect = image.width / image.height || 1;
  const printWidth = imageAspect >= 1 ? maxPrintSize : maxPrintSize * imageAspect;
  const printHeight = imageAspect >= 1 ? maxPrintSize / imageAspect : maxPrintSize;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(THREE.MathUtils.degToRad(rotation));
  context.drawImage(image, -printWidth / 2, -printHeight / 2, printWidth, printHeight);
  context.restore();

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
}: Required<Pick<ProductPreview3DProps, 'designImage' | 'position' | 'scale' | 'rotation'>>) {
  const texture = useTexture(designImage);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  const printX = FALLBACK_PRINT_ANCHOR.x + ((position.x - 50) / 50) * FALLBACK_PRINT_ANCHOR.xRange;
  const printY = FALLBACK_PRINT_ANCHOR.y + ((50 - position.y) / 50) * FALLBACK_PRINT_ANCHOR.yRange;
  const printSize = THREE.MathUtils.clamp(FALLBACK_PRINT_ANCHOR.baseSize * (scale / 50), 0.24, 0.54);
  const imageAspect = texture.image && 'width' in texture.image && texture.image.height
    ? texture.image.width / texture.image.height
    : 1;
  const printWidth = imageAspect >= 1 ? printSize : printSize * imageAspect;
  const printHeight = imageAspect >= 1 ? printSize / imageAspect : printSize;

  // UV texture mapping is experimental for this GLB; fallback plane overlay ensures stable MVP preview.
  return (
    <mesh
      position={[printX, printY, FALLBACK_PRINT_ANCHOR.z + FALLBACK_PRINT_ANCHOR.surfaceGap]}
      rotation={[0, 0, THREE.MathUtils.degToRad(-rotation)]}
      renderOrder={30}
    >
      <planeGeometry args={[printWidth, printHeight]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} toneMapped={false} depthTest />
    </mesh>
  );
}

function GarmentModelWithDecal({
  designImage,
  position,
  scale,
  rotation,
  placement,
}: ProductPreview3DProps & { placement: PrintPlacement }) {
  const gltf = useGLTF(T_SHIRT_MODEL_PATH);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const transform = useMemo(() => normalizeModel(scene), [scene]);
  const [shirtTexture, setShirtTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!designImage) {
      setShirtTexture((currentTexture) => {
        currentTexture?.dispose();
        return null;
      });
      return;
    }

    const image = new Image();
    image.onload = () => {
      if (!isMounted) return;

      const texture = createChestCanvasTexture({
        image,
        position,
        scale,
        rotation,
      });

      setShirtTexture((currentTexture) => {
        currentTexture?.dispose();
        return texture;
      });
    };
    image.onerror = () => {
      if (isMounted) setShirtTexture(null);
    };
    image.src = designImage;

    return () => {
      isMounted = false;
    };
  }, [designImage, position.x, position.y, rotation, scale]);

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
  }, [scene, shirtTexture]);

  return (
    <group>
      <group position={transform.position} scale={transform.scale}>
        <primitive object={scene} />
      </group>
      {designImage && (!USE_UV_TEXTURE_PREVIEW || !shirtTexture) && (
        <FallbackPrintOverlay
          designImage={designImage}
          position={position}
          scale={scale}
          rotation={rotation}
        />
      )}
    </group>
  );
}

export function ProductPreview3D({
  designImage,
  position,
  scale,
  rotation,
  placement = 'front',
}: ProductPreview3DProps) {
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'missing'>('checking');

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
            designImage={designImage}
            position={position}
            scale={scale}
            rotation={rotation}
            placement={placement}
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
