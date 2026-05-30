import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { ACESFilmicToneMapping } from "three";
import { CubeMesh } from "./CubeMesh.tsx";
import { CameraDirector } from "./CameraDirector.tsx";

export function CubeScene() {
  const controls = useRef<any>(null);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        preserveDrawingBuffer: true, // allow canvas snapshots / image export
      }}
      camera={{ position: [5, 5.5, 6.5], fov: 38, near: 0.1, far: 100 }}
    >
      <Suspense fallback={null}>
        {/* Key / fill / rim lighting */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[6, 9, 5]}
          intensity={2.1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight position={[-7, 3, -4]} intensity={0.5} color="#9ec5ff" />
        <directionalLight position={[0, -4, 6]} intensity={0.3} color="#ffd9a0" />

        {/* Procedural studio environment for reflections (no external assets). */}
        <Environment resolution={256}>
          <Lightformer intensity={2.6} position={[0, 5, -2]} scale={[10, 6, 1]} color="#ffffff" />
          <Lightformer intensity={1.2} position={[-5, 1, 2]} scale={[3, 6, 1]} color="#bcd4ff" />
          <Lightformer intensity={1.0} position={[5, 0, 2]} scale={[3, 6, 1]} color="#ffe7c2" />
          <Lightformer intensity={1.4} position={[0, 1, 6]} scale={[10, 4, 1]} color="#ffffff" />
        </Environment>

        <CubeMesh controls={controls} />

        {/* Soft grounded contact shadow */}
        <ContactShadows
          position={[0, -2.0, 0]}
          opacity={0.55}
          scale={14}
          blur={2.6}
          far={5}
          resolution={1024}
          color="#000000"
        />

        <OrbitControls
          ref={controls}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={14}
          rotateSpeed={0.9}
        />
        <CameraDirector controls={controls} />
      </Suspense>
    </Canvas>
  );
}
