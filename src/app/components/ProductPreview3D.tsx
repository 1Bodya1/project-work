import { Suspense } from 'react';
import { Decal, OrbitControls, useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

type ProductPreview3DProps = {
  designImage?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  color?: string;
};

function normalizeColor(color?: string) {
  if (!color) return '#F5F5F5';
  return color.startsWith('#') ? color : '#F5F5F5';
}

function DesignDecal({
  designImage,
  position,
  scale,
  rotation,
}: Required<Pick<ProductPreview3DProps, 'designImage' | 'position' | 'scale' | 'rotation'>>) {
  const texture = useTexture(designImage);
  texture.colorSpace = THREE.SRGBColorSpace;

  const decalX = (position.x - 50) / 95;
  const decalY = (50 - position.y) / 95;
  const decalScale = Math.max(0.3, scale / 55);

  return (
    <Decal
      position={[decalX, decalY, 0.2]}
      rotation={[0, 0, THREE.MathUtils.degToRad(-rotation)]}
      scale={[decalScale, decalScale, 0.35]}
      map={texture}
      polygonOffset
      polygonOffsetFactor={-1}
    />
  );
}

function ShirtMockup({ color, children }: { color?: string; children?: React.ReactNode }) {
  const baseColor = normalizeColor(color);

  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.75, 2.35, 0.28]} />
        <meshStandardMaterial color={baseColor} roughness={0.85} metalness={0.02} />
        {children}
      </mesh>

      <mesh position={[-1.1, 0.45, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.55, 1.1, 0.24]} />
        <meshStandardMaterial color={baseColor} roughness={0.85} metalness={0.02} />
      </mesh>

      <mesh position={[1.1, 0.45, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.55, 1.1, 0.24]} />
        <meshStandardMaterial color={baseColor} roughness={0.85} metalness={0.02} />
      </mesh>

      <mesh position={[0, 1.18, 0.01]}>
        <torusGeometry args={[0.35, 0.045, 16, 48, Math.PI]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function ProductPreview3D({
  designImage,
  position,
  scale,
  rotation,
  color,
}: ProductPreview3DProps) {
  return (
    <div className="w-full h-full min-h-[420px] bg-[#F5F5F5] rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0.2, 4.4], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <directionalLight position={[-3, 1, 2]} intensity={0.5} />
        <Suspense fallback={null}>
          <ShirtMockup color={color}>
            {designImage && (
              <DesignDecal
                designImage={designImage}
                position={position}
                scale={scale}
                rotation={rotation}
              />
            )}
          </ShirtMockup>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.4}
          maxPolarAngle={Math.PI / 1.75}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
