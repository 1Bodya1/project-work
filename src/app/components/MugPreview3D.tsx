import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Environment, Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

type MugPrintPlacement = 'handle' | 'outer';

type MugPreviewPlacementData = {
  uploadedImage?: string | null;
  uploadedImageUrl?: string | null;
  previewUrl?: string | null;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
};

type MugPreview3DProps = {
  modelUrl?: string;
  designImage?: string | null;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  color?: string;
  placement?: MugPrintPlacement;
  activePlacement?: MugPrintPlacement;
  placements?: Partial<Record<MugPrintPlacement, MugPreviewPlacementData>>;
  currentPlacementData?: MugPreviewPlacementData;
  modelZoom?: number;
};

export type MugPreview3DHandle = {
  capture3DScreenshot: () => string | null;
};

const DEFAULT_MUG_MODEL_PATH = '/models/mug.glb';
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const TARGET_MODEL_HEIGHT = 2.15;
const transparentPixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

const placementOrder: MugPrintPlacement[] = ['handle', 'outer'];

const placementAnchors: Record<MugPrintPlacement, {
  position: [number, number, number];
  normal: [number, number, number];
  size: [number, number, number];
  xRange: number;
  yRange: number;
  minScale: number;
  maxScale: number;
}> = {
  handle: {
    position: [1.12, 0.18, 0.02],
    normal: [1, 0, 0],
    size: [0.36, 0.48, 0.34],
    xRange: 0.1,
    yRange: 0.16,
    minScale: 0.32,
    maxScale: 0.85,
  },
  outer: {
    position: [0, 0.18, 1.31],
    normal: [0, 0, 1],
    size: [0.74, 0.56, 0.5],
    xRange: 0.58,
    yRange: 0.18,
    minScale: 0.38,
    maxScale: 1.05,
  },
};

function getCameraDistance(baseDistance: number, modelZoom = 100) {
  return baseDistance * (100 / THREE.MathUtils.clamp(modelZoom, 55, 165));
}

function CameraZoomSync({ modelZoom }: { modelZoom?: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.z = getCameraDistance(3.15, modelZoom);
    camera.updateProjectionMatrix();
  }, [camera, modelZoom]);

  return null;
}

function resolveModelUrl(modelUrl?: string | null) {
  const trimmedModelUrl = String(modelUrl || '').trim();
  if (!trimmedModelUrl) return DEFAULT_MUG_MODEL_PATH;
  if (/^(https?:|data:|blob:)/i.test(trimmedModelUrl)) return trimmedModelUrl;
  if (trimmedModelUrl.startsWith('/uploads/')) return `${API_ORIGIN}${trimmedModelUrl}`;
  return trimmedModelUrl;
}

function normalizeModel(scene: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const scale = size.y > 0 ? TARGET_MODEL_HEIGHT / size.y : 1;
  scene.scale.setScalar(scale);
  scene.position.sub(center.multiplyScalar(scale));
  scene.position.y -= 0.05;
  scene.updateMatrixWorld(true);
}

function useMugScene(modelUrl: string, color?: string) {
  const gltf = useGLTF(modelUrl);

  return useMemo(() => {
    const scene = gltf.scene.clone(true);
    const mugColor = new THREE.Color(color || '#ffffff');

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;

      const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
      const nextMaterial = sourceMaterial?.clone?.() || new THREE.MeshStandardMaterial();

      if ('color' in nextMaterial && nextMaterial.color instanceof THREE.Color) {
        nextMaterial.color.copy(mugColor);
      }

      if ('roughness' in nextMaterial) nextMaterial.roughness = 0.42;
      if ('metalness' in nextMaterial) nextMaterial.metalness = 0.02;

      object.material = nextMaterial;
    });

    normalizeModel(scene);
    return scene;
  }, [gltf.scene, color]);
}

function createDecalOrientation(position: THREE.Vector3, normal: THREE.Vector3, rotation: number) {
  const projector = new THREE.Object3D();
  projector.position.copy(position);
  projector.lookAt(position.clone().add(normal));
  projector.rotateZ(Math.PI + THREE.MathUtils.degToRad(rotation));
  projector.rotateY(Math.PI);
  return projector.rotation.clone();
}

function getMeshes(scene: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object);
  });
  return meshes;
}

function DesignDecal({
  placement,
  data,
  scene,
}: {
  placement: MugPrintPlacement;
  data: MugPreviewPlacementData;
  scene: THREE.Object3D;
}) {
  const image = data.uploadedImage || data.previewUrl || data.uploadedImageUrl;
  const texture = useTexture(image || transparentPixel);
  const anchor = placementAnchors[placement];
  const position = data.position || { x: 50, y: 50 };
  const scaleValue = data.scale ?? 50;
  const rotationValue = data.rotation ?? 0;
  const normalizedScale = THREE.MathUtils.lerp(anchor.minScale, anchor.maxScale, scaleValue / 100);
  const xOffset = ((position.x - 50) / 50) * anchor.xRange;
  const yOffset = -((position.y - 50) / 50) * anchor.yRange;
  const meshes = useMemo(() => getMeshes(scene), [scene]);
  const decalGeometries = useMemo(() => {
    if (!image) return [];

    scene.updateMatrixWorld(true);
    const decalPosition = new THREE.Vector3(
      anchor.position[0] + (anchor.normal[2] ? xOffset : 0),
      anchor.position[1] + yOffset,
      anchor.position[2] + (anchor.normal[0] ? xOffset : 0),
    );
    const normal = new THREE.Vector3(...anchor.normal).normalize();
    const orientation = createDecalOrientation(decalPosition, normal, rotationValue);
    const size = new THREE.Vector3(
      anchor.size[0] * normalizedScale,
      anchor.size[1] * normalizedScale,
      anchor.size[2],
    );

    return meshes
      .map((mesh) => new DecalGeometry(mesh, decalPosition, orientation, size))
      .filter((geometry) => geometry.attributes.position?.count > 0);
  }, [anchor, image, meshes, normalizedScale, position.x, position.y, rotationValue, scene, xOffset, yOffset]);

  useEffect(() => () => {
    decalGeometries.forEach((geometry) => geometry.dispose());
  }, [decalGeometries]);

  if (!image || decalGeometries.length === 0) return null;

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.center.set(0.5, 0.5);

  return (
    <>
      {decalGeometries.map((geometry, index) => (
        <mesh key={`${placement}-${index}`} geometry={geometry} renderOrder={8}>
          <meshBasicMaterial
            map={texture}
            transparent
            depthTest
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-12}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

function MugScene({
  modelUrl = DEFAULT_MUG_MODEL_PATH,
  color,
  activePlacement = 'outer',
  placements = {},
  currentPlacementData,
  designImage,
  position,
  scale,
  rotation,
}: MugPreview3DProps) {
  const scene = useMugScene(modelUrl, color);
  const resolvedPlacements = useMemo(() => {
    const nextPlacements: Partial<Record<MugPrintPlacement, MugPreviewPlacementData>> = {
      ...placements,
    };

    if (designImage || currentPlacementData) {
      nextPlacements[activePlacement] = {
        ...nextPlacements[activePlacement],
        ...currentPlacementData,
        uploadedImageUrl: currentPlacementData?.uploadedImageUrl || currentPlacementData?.uploadedImage || designImage || nextPlacements[activePlacement]?.uploadedImageUrl,
        uploadedImage: currentPlacementData?.uploadedImage || designImage || nextPlacements[activePlacement]?.uploadedImage,
        position: currentPlacementData?.position || position || nextPlacements[activePlacement]?.position,
        scale: currentPlacementData?.scale ?? scale ?? nextPlacements[activePlacement]?.scale,
        rotation: currentPlacementData?.rotation ?? rotation ?? nextPlacements[activePlacement]?.rotation,
      };
    }

    return nextPlacements;
  }, [activePlacement, currentPlacementData, designImage, placements, position, rotation, scale]);

  return (
    <>
      <primitive object={scene} />
      {placementOrder.map((placement) => (
        <DesignDecal
          key={placement}
          placement={placement}
          data={resolvedPlacements[placement] || {}}
          scene={scene}
        />
      ))}
    </>
  );
}

export const MugPreview3D = forwardRef<MugPreview3DHandle, MugPreview3DProps>(function MugPreview3D(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelUrl = resolveModelUrl(props.modelUrl);
  const cameraDistance = getCameraDistance(3.15, props.modelZoom);
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'missing'>('checking');

  useImperativeHandle(ref, () => ({
    capture3DScreenshot() {
      try {
        return canvasRef.current?.toDataURL('image/webp', 0.82) || null;
      } catch {
        try {
          return canvasRef.current?.toDataURL('image/png') || null;
        } catch {
          return null;
        }
      }
    },
  }), []);

  useEffect(() => {
    let isMounted = true;

    if (/^(https?:|data:|blob:)/i.test(modelUrl)) {
      setModelStatus('ready');
      return () => {
        isMounted = false;
      };
    }

    fetch(modelUrl, { method: 'HEAD' })
      .then((response) => {
        if (isMounted) setModelStatus(response.ok ? 'ready' : 'missing');
      })
      .catch(() => {
        if (isMounted) setModelStatus('missing');
      });

    return () => {
      isMounted = false;
    };
  }, [modelUrl]);

  if (modelStatus === 'checking') {
    return (
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F5F5F5] border border-black/5 flex items-center justify-center text-sm text-[#1A1A1A]">
        Loading mug model...
      </div>
    );
  }

  if (modelStatus === 'missing') {
    return (
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F5F5F5] border border-black/5 flex items-center justify-center p-6 text-center">
        <div>
          <p className="mb-2">3D model file is missing.</p>
          <p className="text-sm text-[#1A1A1A]">
            Add the model at <span className="font-mono">{modelUrl}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F5F5F5] border border-black/5">
      <Canvas
        camera={{ position: [0, 0.25, cameraDistance], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
        shadows
      >
        <CameraZoomSync modelZoom={props.modelZoom} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[2.8, 4, 3]} intensity={1.45} castShadow />
        <directionalLight position={[-2.5, 2.5, -2]} intensity={0.45} />
        <Suspense fallback={<Html center><span className="text-sm text-[#1A1A1A]">Loading mug...</span></Html>}>
          <MugScene {...props} modelUrl={modelUrl} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.45}
          maxDistance={5.75}
          target={[0, 0.2, 0]}
        />
      </Canvas>
    </div>
  );
});

useGLTF.preload(DEFAULT_MUG_MODEL_PATH);
