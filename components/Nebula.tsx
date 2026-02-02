
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useControls } from 'leva';

const vertexShader = `
  attribute float size;
  uniform vec3 uColor;
  varying vec3 vColor;

  void main() {
    vColor = uColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D pointTexture;
  varying vec3 vColor;

  void main() {
    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
    if (texColor.a < 0.1) discard; 
    
    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * 0.5);
  }
`;

interface NebulaProps {
  position: [number, number, number];
  color: string;
  size: number;
}

const Nebula: React.FC<NebulaProps> = ({ position, color, size }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const sparkTexture = useTexture('https://picsum.photos/id/1018/256/256');

  const { count, randomness } = useControls('Nebula ' + color, {
    count: { value: 5000, min: 500, max: 20000, step: 100 },
    randomness: { value: 1.0, min: 0.1, max: 5.0, step: 0.1 }
  });

  const [particlePositions, particleSizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * size * randomness;
      const y = (Math.random() - 0.5) * size * randomness;
      const z = (Math.random() - 0.5) * size * randomness;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      sizes[i] = Math.random() * 5 + 2;
    }
    return [positions, sizes];
  }, [count, size, randomness]);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
    transparent: true,
    vertexShader,
    fragmentShader,
    uniforms: {
      pointTexture: { value: sparkTexture },
      uColor: { value: new THREE.Color(color) }
    },
  }), [sparkTexture, color]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={count} 
          array={particlePositions} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-size" 
          count={count} 
          array={particleSizes} 
          itemSize={1} 
        />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
};

export default Nebula;
