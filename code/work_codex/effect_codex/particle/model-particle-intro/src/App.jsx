import React, { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getParticleConfig } from './config.js';
import { buildModelParticleData } from './model-particles.js';

const particleShader = {
  vertex: `
    attribute float size;
    attribute float opacity;
    attribute float randomness;
    attribute float particleType;
    varying vec3 vColor;
    varying float vOpacity;
    uniform float uPixelRatio;
    uniform float uTime;

    void main() {
      vColor = color;
      vOpacity = opacity;
      float phase = randomness * 43.982;
      float driftScale = mix(0.008, 0.055, particleType);
      vec3 animatedPosition = position;
      animatedPosition.x += sin(uTime * 0.35 + phase) * driftScale;
      animatedPosition.y += cos(uTime * 0.28 + phase * 1.17) * driftScale;
      animatedPosition.z += sin(uTime * 0.22 + phase * 0.73) * driftScale * 0.8;

      vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
      float attenuation = 250.0 / max(1.0, -viewPosition.z);
      float pulse = 0.9 + sin(uTime * (0.45 + randomness * 0.55) + phase) * 0.12;
      gl_PointSize = max(1.0, size * pulse * uPixelRatio * attenuation);
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  fragment: `
    varying vec3 vColor;
    varying float vOpacity;

    void main() {
      float distanceToCenter = length(gl_PointCoord - vec2(0.5));
      if (distanceToCenter > 0.5) discard;
      float core = 1.0 - smoothstep(0.0, 0.16, distanceToCenter);
      float halo = pow(1.0 - smoothstep(0.06, 0.5, distanceToCenter), 1.25);
      vec3 finalColor = mix(vColor, vec3(1.0), core * 0.12);
      float alpha = clamp((halo * 0.84 + core * 0.78) * vOpacity, 0.0, 1.0);
      gl_FragColor = vec4(finalColor * 1.35, alpha);
    }
  `
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function supportsWebGL2() {
  const canvas = document.createElement('canvas');
  return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
}

function DragOrbitControls({ enabled, settings }) {
  const controlsRef = useRef(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!enabled) return undefined;

    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = settings.dampingFactor;
    controls.rotateSpeed = settings.rotateSpeed;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, enabled, gl, settings.dampingFactor, settings.rotateSpeed]);

  // OrbitControls 的阻尼需要持续 update，当前 Canvas 已使用 always 渲染循环。
  useFrame(() => controlsRef.current?.update());

  return null;
}

function StaticFallback({ config, message }) {
  useEffect(() => {
    window.onModelLoadProgress?.(100);
    window.onParticleIntroReady?.();
    window.startParticleExit = () => window.onParticleIntroExit?.();
    return () => {
      delete window.startParticleExit;
    };
  }, []);

  return (
    <div className="static-fallback" role="img" aria-label={message}>
      <img src={config.fallbackImageUrl} alt="品牌标志" />
      <span>{message}</span>
    </div>
  );
}

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('粒子模型初始化失败：', error);
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ParticleModel({ config, profile }) {
  const pointsRef = useRef(null);
  const progressRef = useRef(0);
  const introNotifiedRef = useRef(false);
  const exitRef = useRef(false);
  const exitElapsedRef = useRef(0);
  const exitNotifiedRef = useRef(false);
  const mouseActivityRef = useRef(0);
  const settleTimeRef = useRef(0);
  const pointerRef = useRef(new THREE.Vector2(999, 999));
  const interactionPointRef = useRef(new THREE.Vector3());
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const decoderLoadersRef = useRef([]);
  const { camera, gl, invalidate, raycaster } = useThree();

  const configureLoader = useCallback((loader) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(config.dracoDecoderPath);
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath(config.ktx2TranscoderPath);
    ktx2Loader.detectSupport(gl);
    decoderLoadersRef.current.push(dracoLoader, ktx2Loader);
    loader.setDRACOLoader(dracoLoader);
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);
  }, [config.dracoDecoderPath, config.ktx2TranscoderPath, gl]);

  const reportProgress = useCallback((event) => {
    if (event.total > 0) {
      window.onModelLoadProgress?.((event.loaded / event.total) * 100);
    }
  }, []);

  const gltf = useLoader(GLTFLoader, config.modelUrl, configureLoader, reportProgress);
  const particleData = useMemo(
    () => buildModelParticleData(gltf.scene, config, profile),
    [config, gltf.scene, profile]
  );

  const startExit = useCallback(() => {
    if (progressRef.current < 0.85 || exitRef.current) return;
    exitRef.current = true;
    mouseActivityRef.current = 0;
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    window.onModelLoadProgress?.(100);
    return () => {
      decoderLoadersRef.current.forEach((loader) => loader.dispose?.());
      decoderLoadersRef.current = [];

      // 当前应用独占此 GLB；卸载时释放 useLoader 缓存及源模型 GPU 资源。
      gltf.scene.traverse((child) => {
        child.geometry?.dispose?.();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value?.isTexture) value.dispose();
          });
          material.dispose?.();
        });
      });
      useLoader.clear(GLTFLoader, config.modelUrl);
    };
  }, [config.modelUrl, gltf.scene]);

  useEffect(() => {
    window.startParticleExit = startExit;
    return () => {
      if (window.startParticleExit === startExit) delete window.startParticleExit;
    };
  }, [startExit]);

  useEffect(() => {
    let touchStartY = 0;

    const handlePointerMove = (event) => {
      // 按住鼠标时交给 OrbitControls 处理旋转，避免同时触发粒子排斥。
      if (event.buttons !== 0) {
        mouseActivityRef.current = 0;
        settleTimeRef.current = 0;
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      pointerRef.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      mouseActivityRef.current = 1;
      settleTimeRef.current = 0.8;
      invalidate();
    };
    const handlePointerUp = () => {
      settleTimeRef.current = 0.8;
      invalidate();
    };
    const handleWheel = (event) => {
      if (config.triggers.wheel && event.deltaY > 0) startExit();
    };
    const handleTouchStart = (event) => {
      touchStartY = event.touches[0]?.clientY || 0;
    };
    const handleTouchMove = (event) => {
      const currentY = event.touches[0]?.clientY;
      if (config.triggers.touch && currentY != null && currentY - touchStartY < -20) startExit();
    };

    gl.domElement.addEventListener('pointermove', handlePointerMove, { passive: true });
    gl.domElement.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [config.triggers, gl, invalidate, startExit]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    points.material.uniforms.uTime.value = state.clock.elapsedTime;

    const positions = points.geometry.attributes.position.array;
    const {
      startPositions,
      targetPositions,
      exitDirections,
      types,
      randomness
    } = particleData;

    const introActive = progressRef.current < 1;
    if (introActive) {
      progressRef.current = Math.min(1, progressRef.current + delta / config.introDuration);
    }
    if (progressRef.current >= 0.85 && !introNotifiedRef.current) {
      introNotifiedRef.current = true;
      window.onParticleIntroReady?.();
    }

    mouseActivityRef.current = Math.max(0, mouseActivityRef.current - delta * 2.5);
    settleTimeRef.current = Math.max(0, settleTimeRef.current - delta);
    const easedProgress = 1 - Math.pow(1 - progressRef.current, 3);
    let isInteracting = false;

    if (!exitRef.current && mouseActivityRef.current > 0.001) {
      raycaster.setFromCamera(pointerRef.current, camera);
      isInteracting = Boolean(raycaster.ray.intersectPlane(interactionPlane, interactionPointRef.current));
    }

    if (exitRef.current) exitElapsedRef.current += delta;
    const returnAlpha = 1 - Math.exp(-config.returnSpeed * delta);
    const positionsActive = introActive || exitRef.current || settleTimeRef.current > 0;

    // 静止阶段只更新 GPU uniform，跳过 CPU 粒子位置遍历。
    if (!positionsActive) return;

    for (let offset = 0; offset < positions.length; offset += 3) {
      const particleIndex = offset / 3;
      let x = positions[offset];
      let y = positions[offset + 1];
      let z = positions[offset + 2];

      if (exitRef.current) {
        const randomValue = randomness[particleIndex];
        const isAtmosphere = types[particleIndex] === 1;
        const speed = isAtmosphere
          ? config.atmosphereExitSpeed * (0.75 + randomValue * 0.55)
          : config.coreExitSpeed * (0.35 + randomValue * 1.1) * (0.45 + exitElapsedRef.current);
        const drift = Math.sin(exitElapsedRef.current * 3 + randomValue * 30) * delta * 0.18;
        x += exitDirections[offset] * speed * delta;
        y += exitDirections[offset + 1] * speed * delta;
        z += exitDirections[offset + 2] * speed * delta + drift;
      } else {
        const targetX = THREE.MathUtils.lerp(startPositions[offset], targetPositions[offset], easedProgress);
        const targetY = THREE.MathUtils.lerp(startPositions[offset + 1], targetPositions[offset + 1], easedProgress);
        const targetZ = THREE.MathUtils.lerp(startPositions[offset + 2], targetPositions[offset + 2], easedProgress);

        if (isInteracting) {
          const dx = x - interactionPointRef.current.x;
          const dy = y - interactionPointRef.current.y;
          const dz = (z - interactionPointRef.current.z) * 0.25;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance > 0.0001 && distance < config.repelRadius) {
            const normalizedDistance = distance / config.repelRadius;
            const falloff = Math.pow(1 - normalizedDistance, 3);
            const force = falloff * config.repelStrength * mouseActivityRef.current * delta;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
            z += (dz / distance) * force;
          }
        }

        x += (targetX - x) * returnAlpha;
        y += (targetY - y) * returnAlpha;
        z += (targetZ - z) * returnAlpha;
      }

      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
    }

    points.geometry.attributes.position.needsUpdate = true;

    if (exitRef.current && exitElapsedRef.current >= config.exitDuration && !exitNotifiedRef.current) {
      exitNotifiedRef.current = true;
      window.onParticleIntroExit?.();
      return;
    }

  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData.startPositions.slice(), 3]}
        />
        <bufferAttribute attach="attributes-color" args={[particleData.colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[particleData.sizes, 1]} />
        <bufferAttribute attach="attributes-opacity" args={[particleData.opacities, 1]} />
        <bufferAttribute attach="attributes-randomness" args={[particleData.randomness, 1]} />
        <bufferAttribute attach="attributes-particleType" args={[particleData.types, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleShader.vertex}
        fragmentShader={particleShader.fragment}
        transparent
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uPixelRatio: { value: gl.getPixelRatio() },
          uTime: { value: 0 }
        }}
      />
    </points>
  );
}

export default function App() {
  const config = useMemo(getParticleConfig, []);
  const isMobile = useMediaQuery(`(max-width: ${config.breakpoint}px)`);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [sceneFailed, setSceneFailed] = useState(false);
  const profile = isMobile ? config.mobile : config.desktop;
  const profileKey = isMobile ? 'mobile' : 'desktop';

  useEffect(() => {
    document.documentElement.style.setProperty('--particle-accent', config.particleColor);
  }, [config.particleColor]);

  if (prefersReducedMotion || !supportsWebGL2() || sceneFailed) {
    const message = sceneFailed ? '模型不可用，已显示静态标志' : '已启用静态低动态模式';
    return <StaticFallback config={config} message={message} />;
  }

  return (
    <SceneErrorBoundary onError={() => setSceneFailed(true)}>
      <Canvas
        key={profileKey}
        camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, profile.maxDpr]}
        frameloop="always"
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <DragOrbitControls
          enabled={!isMobile && config.orbitControls.enabled}
          settings={config.orbitControls}
        />
        <Suspense fallback={null}>
          <ParticleModel config={config} profile={profile} />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
