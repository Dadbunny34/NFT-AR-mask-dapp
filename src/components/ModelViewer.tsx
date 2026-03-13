"use client";

import { Suspense, useRef, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
  url: string;
  autoRotate?: boolean;
}

function Model({ url, autoRotate = true }: ModelProps) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Center>
      <group ref={ref}>
        <primitive object={scene} scale={1} />
      </group>
    </Center>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#9945FF" wireframe />
    </mesh>
  );
}

// Simple inline error boundary — no extra dependency needed
class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
          <p className="text-red-400 text-sm text-center">
            Failed to load 3D model: {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-purple-400 text-sm px-4 py-2 border border-purple-400 rounded-lg"
          >
            🔄 Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ModelViewer({
  url,
  autoRotate = true,
  className = "",
}: ModelProps & { className?: string }) {
  return (
    <div className={`w-full aspect-square rounded-2xl overflow-hidden bg-black/30 ${className}`}>
      <ModelErrorBoundary>
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Suspense fallback={<LoadingFallback />}>
            <Model url={url} autoRotate={autoRotate} />
            <Environment preset="studio" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={1.5}
            maxDistance={6}
          />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  );
}