
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';

const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;

  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) {
      discard;
    }
    float strength = 1.0 - (dist * 2.0);
    
    // Reverse radial gradient
    vec3 color = mix(vColor, vec3(1.0, 1.0, 1.0), pow(strength, 2.0) * 0.8);
    
    // Glow effect
    float glow = pow(0.5 - dist, 3.0) * 10.0;
    
    gl_FragColor = vec4(color + glow, strength * 0.7 + 0.3);
  }
`;

const Galaxy: React.FC = () => {
    const pointsRef = useRef<THREE.Points>(null);

    const props = useControls('Galaxy Core', {
        count: { value: 60000, min: 1000, max: 200000, step: 5000 },
        radius: { value: 12, min: 1, max: 30, step: 0.1 },
        branches: { value: 4, min: 2, max: 12, step: 1 },
        spin: { value: 0.8, min: -5, max: 5, step: 0.1 },
        randomness: { value: 0.4, min: 0, max: 2, step: 0.01 },
        randomnessPower: { value: 4, min: 1, max: 10, step: 0.1 },
        insideColor: '#ff7b39',
        outsideColor: '#2b5ea4',
    });

    const [positions, colors, sizes] = useMemo(() => {
        const positions = new Float32Array(props.count * 3);
        const colors = new Float32Array(props.count * 3);
        const sizes = new Float32Array(props.count);

        const colorInside = new THREE.Color(props.insideColor);
        const colorOutside = new THREE.Color(props.outsideColor);

        for (let i = 0; i < props.count; i++) {
            const i3 = i * 3;
            const radius = Math.random() * props.radius;
            const spinAngle = radius * props.spin;
            const branchAngle = ((i % props.branches) / props.branches) * Math.PI * 2;

            const randomX = Math.pow(Math.random(), props.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * props.randomness * radius;
            const randomY = Math.pow(Math.random(), props.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * props.randomness * (radius * 0.3);
            const randomZ = Math.pow(Math.random(), props.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * props.randomness * radius;

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, radius / props.radius);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            sizes[i] = Math.random() * 2.0 + 0.5;
        }

        return [positions, colors, sizes];
    }, [props.count, props.radius, props.branches, props.spin, props.randomness, props.randomnessPower, props.insideColor, props.outsideColor]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
        }
    });

    const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader,
        fragmentShader,
        transparent: true,
        uniforms: {},
    }), []);

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={props.count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-customColor" count={props.count} array={colors} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={props.count} array={sizes} itemSize={1} />
            </bufferGeometry>
            <primitive object={shaderMaterial} attach="material" />
        </points>
    );
};

export default Galaxy;
