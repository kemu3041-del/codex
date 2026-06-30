import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { defaultOrbitContent, mapCmsOrbitContent } from './cms-adapter.js';

const cmsContent = mapCmsOrbitContent(defaultOrbitContent);

function useReducedMotion() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
}

function createTextTexture(phrase) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(255, 255, 255, 1)';
  context.font = '900 190px Arial, Helvetica, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(phrase, canvas.width / 2, canvas.height / 2 + 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createCurvedPanelGeometry(width = 1.45, height = 0.62, bendRadius = 1.45, segments = 20) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const arc = width / bendRadius;

  for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
    const u = xIndex / segments;
    const theta = (u - 0.5) * arc;
    const x = Math.sin(theta) * bendRadius;
    const z = Math.cos(theta) * bendRadius - bendRadius;

    positions.push(x, -height / 2, z, x, height / 2, z);
    uvs.push(u, 0, u, 1);
  }

  for (let xIndex = 0; xIndex < segments; xIndex += 1) {
    const a = xIndex * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function CurvedTextPanel({ phrase }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { camera } = useThree();
  const texture = useMemo(() => createTextTexture(phrase), [phrase]);
  const geometry = useMemo(() => createCurvedPanelGeometry(), []);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraSpacePosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;
    meshRef.current.getWorldPosition(worldPosition);
    cameraSpacePosition.copy(worldPosition).applyMatrix4(camera.matrixWorldInverse);

    const depth = THREE.MathUtils.clamp((cameraSpacePosition.z + 10.9) / 3.1, 0, 1);
    const value = THREE.MathUtils.lerp(0.1, 1, Math.pow(depth, 2.0));
    materialRef.current.color.setRGB(value, value, value);
  });

  useEffect(() => {
    return () => {
      texture.dispose();
      geometry.dispose();
    };
  }, [geometry, texture]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        map={texture}
        opacity={1}
        transparent
        fog={false}
        side={THREE.DoubleSide}
        depthTest
        depthWrite={false}
      />
    </mesh>
  );
}

function CylindricalTextRing({ phrase = 'EXT', radius = 2.2, count = 24, speed = 0.22, tilt = 0.04, paused }) {
  const reducedMotion = useReducedMotion();
  const ringRef = useRef(null);
  const items = useMemo(() => Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;

    return {
      angle,
      position: [
        Math.sin(angle) * radius,
        0,
        Math.cos(angle) * radius
      ],
      rotation: [0, angle, 0]
    };
  }), [count, radius]);

  useFrame((_, delta) => {
    if (!ringRef.current || paused || reducedMotion) return;
    ringRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={ringRef} rotation={[tilt, 0, 0]}>
      {items.map((item, index) => (
        <group key={index} position={item.position} rotation={item.rotation}>
          <CurvedTextPanel phrase={phrase} />
        </group>
      ))}
    </group>
  );
}

function SuctionCup({ angle, index, radius }) {
  const cupColor = new THREE.Color(index % 2 ? '#ff0d64' : '#f2054f');
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius * 0.42;
  const y = Math.cos(angle * 1.3) * 0.32 + index * 0.006;

  return (
    <group position={[x, y, z]} rotation={[Math.PI * 0.52, 0, -angle]}>
      <mesh>
        <torusGeometry args={[0.12, 0.038, 12, 28]} />
        <meshStandardMaterial color={cupColor} roughness={0.22} metalness={0.08} emissive="#5b001c" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.072, 16, 12]} />
        <meshStandardMaterial color="#ff4b88" roughness={0.18} metalness={0.12} />
      </mesh>
    </group>
  );
}

function OrganicCore({ accent, paused }) {
  const groupRef = useRef(null);
  const tubePath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, -2.35, 0.12),
      new THREE.Vector3(0.72, -1.32, 0.58),
      new THREE.Vector3(0.25, -0.2, -0.38),
      new THREE.Vector3(-0.1, 0.82, 0.34),
      new THREE.Vector3(0.58, 2.18, -0.1)
    ]);
  }, []);
  const cups = useMemo(() => Array.from({ length: 38 }, (_, index) => ({
    angle: -1.8 + index * 0.105,
    radius: 0.5 + index * 0.012
  })), []);

  useFrame((state) => {
    if (!groupRef.current || paused) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.24) * 0.18;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.24}>
      <group ref={groupRef} rotation={[0.18, -0.38, -0.16]} position={[0.1, -0.1, 0.6]}>
        <mesh>
          <tubeGeometry args={[tubePath, 96, 0.22, 22, false]} />
          <meshPhysicalMaterial
            color={accent}
            roughness={0.21}
            metalness={0.15}
            clearcoat={0.8}
            clearcoatRoughness={0.14}
            emissive="#740026"
            emissiveIntensity={0.28}
          />
        </mesh>
        <mesh position={[0.18, -0.2, -0.06]} rotation={[0.4, 0.1, -0.3]}>
          <sphereGeometry args={[0.44, 32, 24]} />
          <meshPhysicalMaterial color="#ff2a70" roughness={0.16} metalness={0.1} clearcoat={0.7} emissive="#5a001d" emissiveIntensity={0.22} />
        </mesh>
        <mesh position={[0.03, -1.44, 0.16]} rotation={[0.9, 0.1, 0.44]}>
          <torusGeometry args={[0.76, 0.15, 18, 76]} />
          <meshPhysicalMaterial color="#ff1b69" roughness={0.18} metalness={0.08} clearcoat={0.9} emissive="#8c0030" emissiveIntensity={0.2} />
        </mesh>
        {cups.map((cup, index) => (
          <SuctionCup key={index} angle={cup.angle} index={index} radius={cup.radius} />
        ))}
      </group>
    </Float>
  );
}

function Scene({ content, paused }) {
  const sceneRef = useRef(null);
  const { camera, viewport } = useThree();
  const sceneScale = viewport.width < 5 ? 0.62 : 1;

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state) => {
    if (!sceneRef.current) return;
    sceneRef.current.rotation.y = THREE.MathUtils.lerp(sceneRef.current.rotation.y, state.pointer.x * 0.1, 0.04);
    sceneRef.current.rotation.x = THREE.MathUtils.lerp(sceneRef.current.rotation.x, -state.pointer.y * 0.05, 0.04);
    if (paused) return;
    sceneRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.025;
  });

  return (
    <group ref={sceneRef} scale={sceneScale} position={[viewport.width < 5 ? 0 : 0.55, viewport.width < 5 ? 0.85 : 0, 0]}>
      <ambientLight intensity={0.7} />
      <spotLight position={[2.8, 4.2, 5.4]} angle={0.5} penumbra={0.7} intensity={58} color="#ff89b1" />
      <pointLight position={[-3, -2, 3]} intensity={18} color="#ff0f5b" />
      <Suspense fallback={null}>
        <CylindricalTextRing
          phrase={content.ringPhrase}
          radius={content.ringRadius}
          count={content.ringCopies}
          speed={content.motion.speed}
          tilt={content.motion.tilt}
          paused={paused}
        />
      </Suspense>
      <OrganicCore accent={content.theme.accent} paused={paused} />
    </group>
  );
}

function App() {
  const [paused, setPaused] = useState(false);

  return (
    <main className="orbit-shell" style={{ '--accent': cmsContent.theme.accent, '--accent-deep': cmsContent.theme.accentDeep }}>
      <section className="orbit-stage" aria-label="文字环绕运动 3D Demo">
        <div className="orbit-canvas">
          <Canvas
            camera={{ position: [0, 2.25, 9.4], fov: 38 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <color attach="background" args={['#050305']} />
            <Scene content={cmsContent} paused={paused} />
          </Canvas>
        </div>
        <div className="stage-vignette" aria-hidden="true" />
        <div className="stage-echo stage-echo-left" aria-hidden="true">Contact</div>
        <div className="stage-echo stage-echo-right" aria-hidden="true">Orbit</div>
      </section>

      <aside className="motion-panel" aria-label="效果信息">
        <p className="eyebrow">{cmsContent.eyebrow}</p>
        <h1>{cmsContent.title}</h1>
        <p>{cmsContent.description}</p>
        <div className="panel-actions">
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
            {paused ? '继续运动' : '暂停运动'}
          </button>
          <a href="https://threejs.org/" target="_blank" rel="noreferrer">Three.js</a>
        </div>
      </aside>
    </main>
  );
}

export default App;
