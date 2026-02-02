
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars as DreiStars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useControls } from 'leva';

import Galaxy from './Galaxy';
import Nebula from './Nebula';

const PostEffects: React.FC = () => {
  const bloomProps = useControls('Bloom Effect', {
    intensity: { value: 1.2, min: 0, max: 5, step: 0.1 },
    luminanceThreshold: { value: 0.2, min: 0, max: 1, step: 0.01 },
    luminanceSmoothing: { value: 0.3, min: 0, max: 1, step: 0.01 },
  });

  return (
    <EffectComposer disableNormalPass>
      <Bloom 
        {...bloomProps}
        mipmapBlur
      />
    </EffectComposer>
  );
};

const GalaxyCanvas: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 10, 25]} fov={60} />
        <OrbitControls 
          enableDamping
          dampingFactor={0.05}
          autoRotate
          autoRotateSpeed={0.2}
          minDistance={2}
          maxDistance={100}
        />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
          <DreiStars radius={300} depth={50} count={12000} factor={10} saturation={0.5} fade speed={1} />
          <Galaxy />
          <Nebula position={[15, 5, -20]} color="#ff2255" size={25} />
          <Nebula position={[-20, -5, -30]} color="#2255ff" size={30} />
          <Nebula position={[5, -15, -15]} color="#22ff77" size={20} />
          <PostEffects />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GalaxyCanvas;
