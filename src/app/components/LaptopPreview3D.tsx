import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Environment, Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

type LaptopPrintPlacement = 'lid' | 'palmRest';

type LaptopPreviewPlacementData = {
  uploadedImage?: string | null;
  uploadedImageUrl?: string | null;
  previewUrl?: string | null;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
};

type LaptopPreview3DProps = {
  modelUrl?: string;
  designImage?: string | null;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  color?: string;
  placement?: LaptopPrintPlacement;
  activePlacement?: LaptopPrintPlacement;
  placements?: Partial<Record<LaptopPrintPlacement, LaptopPreviewPlacementData>>;
  currentPlacementData?: LaptopPreviewPlacementData;
  modelZoom?: number;
};

export type LaptopPreview3DHandle = {
  capture3DScreenshot: () => string | null;
};

const DEFAULT_LAPTOP_MODEL_PATH = '/models/laptop.glb';
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const TARGET_MODEL_HEIGHT = 1.45;
const transparentPixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
const placementOrder: LaptopPrintPlacement[] = ['lid', 'palmRest'];
const placementAnchors: Record<LaptopPrintPlacement, {
  position: [number, number, number];
  normal: [number, number, number];
  size: [number, number, number];
  xRange: number;
  yRange: number;
  minScale: number;
  maxScale: number;
}> = {
  lid: {
    position: [0, 0.1, -1.02],
    normal: [0, -0.38, -0.92],
    size: [1.18, 0.8, 0.5],
    xRange: 0.48,
    yRange: 0.34,
    minScale: 0.35,
    maxScale: 1.05,
  },
  palmRest: {
    position: [0, -0.73, 0.18],
    normal: [0, -1, 0],
    size: [1.12, 0.54, 0.64],
    xRange: 0.5,
    yRange: 0.28,
    minScale: 0.32,
    maxScale: 0.92,
  },
};

function getCameraDistance(baseDistance: number, modelZoom = 100) {
  return baseDistance * (100 / THREE.MathUtils.clamp(modelZoom, 55, 165));
}

function CameraZoomSync({ modelZoom }: { modelZoom?: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.z = getCameraDistance(3.25, modelZoom);
    camera.updateProjectionMatrix();
  }, [camera, modelZoom]);

  return null;
}

function resolveModelUrl(modelUrl?: string | null) {
  const trimmedModelUrl = String(modelUrl || '').trim();
  if (!trimmedModelUrl) return DEFAULT_LAPTOP_MODEL_PATH;
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
  scene.updateMatrixWorld(true);
}

function getPlacementImageSource(placement?: LaptopPreviewPlacementData | null) {
  return placement?.uploadedImage || placement?.previewUrl || placement?.uploadedImageUrl || null;
}

function createDecalOrientation(position: THREE.Vector3, normal: THREE.Vector3, rotation: number) {
  const projector = new THREE.Object3D();
  projector.position.copy(position);
  projector.lookAt(position.clone().add(normal));
  projector.rotateZ(Math.PI + THREE.MathUtils.degToRad(rotation));
  projector.rotateY(Math.PI);
  return projector.rotation.clone();
}

function filterDecalGeometryByNormal(
  geometry: THREE.BufferGeometry,
  targetNormal: THREE.Vector3,
  minDot = 0.25,
) {
  const positionAttribute = geometry.getAttribute('position');
  const uvAttribute = geometry.getAttribute('uv');
  const normalAttribute = geometry.getAttribute('normal');

  if (!positionAttribute || !uvAttribute || !normalAttribute) return geometry;

  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const triangleNormal = new THREE.Vector3();

  for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex += 3) {
    triangleNormal.set(0, 0, 0);

    for (let offset = 0; offset < 3; offset += 1) {
      triangleNormal.add(new THREE.Vector3(
        normalAttribute.getX(vertexIndex + offset),
        normalAttribute.getY(vertexIndex + offset),
        normalAttribute.getZ(vertexIndex + offset),
      ));
    }

    triangleNormal.normalize();

    if (triangleNormal.dot(targetNormal) < minDot) continue;

    for (let offset = 0; offset < 3; offset += 1) {
      positions.push(
        positionAttribute.getX(vertexIndex + offset),
        positionAttribute.getY(vertexIndex + offset),
        positionAttribute.getZ(vertexIndex + offset),
      );
      uvs.push(
        uvAttribute.getX(vertexIndex + offset),
        uvAttribute.getY(vertexIndex + offset),
      );
      normals.push(
        normalAttribute.getX(vertexIndex + offset),
        normalAttribute.getY(vertexIndex + offset),
        normalAttribute.getZ(vertexIndex + offset),
      );
    }
  }

  const filteredGeometry = new THREE.BufferGeometry();
  filteredGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  filteredGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  filteredGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return filteredGeometry;
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
  placement: LaptopPrintPlacement;
  data: LaptopPreviewPlacementData;
  scene: THREE.Object3D;
}) {
  const image = getPlacementImageSource(data);
  const texture = useTexture(image || transparentPixel);
  const anchor = placementAnchors[placement];
  const resolvedPosition = data.position || { x: 50, y: 50 };
  const resolvedScale = data.scale ?? 50;
  const resolvedRotation = data.rotation ?? 0;
  const planeScale = THREE.MathUtils.lerp(anchor.minScale, anchor.maxScale, resolvedScale / 100);
  const xOffset = ((resolvedPosition.x - 50) / 50) * anchor.xRange;
  const yOffset = -((resolvedPosition.y - 50) / 50) * anchor.yRange;
  const meshes = useMemo(() => getMeshes(scene), [scene]);
  const decalGeometries = useMemo(() => {
    if (!image) return [];

    scene.updateMatrixWorld(true);
    const decalPosition = new THREE.Vector3(
      anchor.position[0] + xOffset,
      anchor.position[1] + (placement === 'palmRest' ? 0 : yOffset),
      anchor.position[2] + (placement === 'palmRest' ? yOffset : 0),
    );
    const normal = new THREE.Vector3(...anchor.normal).normalize();
    const orientation = createDecalOrientation(decalPosition, normal, resolvedRotation);
    const size = new THREE.Vector3(
      anchor.size[0] * planeScale,
      anchor.size[1] * planeScale,
      anchor.size[2],
    );

    return meshes
      .map((mesh) => {
        const rawGeometry = new DecalGeometry(mesh, decalPosition, orientation, size);
        const filteredGeometry = filterDecalGeometryByNormal(rawGeometry, normal);
        if (filteredGeometry !== rawGeometry) rawGeometry.dispose();
        return filteredGeometry;
      })
      .filter((geometry) => geometry.attributes.position?.count > 0);
  }, [anchor, image, meshes, planeScale, placement, resolvedRotation, scene, xOffset, yOffset]);

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
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </>
  );
}

function LaptopScene({
  modelUrl = DEFAULT_LAPTOP_MODEL_PATH,
  color,
  designImage,
  position = { x: 50, y: 50 },
  scale = 50,
  rotation = 0,
  activePlacement = 'lid',
  placements = {},
  currentPlacementData,
}: LaptopPreview3DProps) {
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => {
    const nextScene = gltf.scene.clone(true);
    const laptopColor = new THREE.Color(color || '#d9d9d9');

    nextScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
      const nextMaterial = sourceMaterial?.clone?.() || new THREE.MeshStandardMaterial();

      if ('color' in nextMaterial && nextMaterial.color instanceof THREE.Color) {
        nextMaterial.color.copy(laptopColor);
      }

      object.material = nextMaterial;
    });

    normalizeModel(nextScene);
    return nextScene;
  }, [color, gltf.scene]);
  const resolvedPlacements = useMemo(() => {
    const nextPlacements: Partial<Record<LaptopPrintPlacement, LaptopPreviewPlacementData>> = {
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

export const LaptopPreview3D = forwardRef<LaptopPreview3DHandle, LaptopPreview3DProps>(function LaptopPreview3D(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelUrl = resolveModelUrl(props.modelUrl);
  const cameraDistance = getCameraDistance(3.25, props.modelZoom);
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
        Loading laptop model...
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
        camera={{ position: [0, 0.75, cameraDistance], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
        shadows
      >
        <CameraZoomSync modelZoom={props.modelZoom} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[2.8, 4, 3]} intensity={1.45} castShadow />
        <Suspense fallback={<Html center><span className="text-sm text-[#1A1A1A]">Loading laptop...</span></Html>}>
          <LaptopScene {...props} modelUrl={modelUrl} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.45} maxDistance={5.9} target={[0, 0.35, 0]} />
      </Canvas>
    </div>
  );
});

useGLTF.preload(DEFAULT_LAPTOP_MODEL_PATH);
