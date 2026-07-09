import React, { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { getStoryConfig } from './config.js';
import { buildModelParticleData } from './model-particles.js';

const storyParticleShader = {
  vertex: `
    attribute vec3 fromPosition;
    attribute vec3 toPosition;
    attribute vec3 scatterDirection;
    attribute vec3 fromColor;
    attribute vec3 toColor;
    attribute float fromSize;
    attribute float toSize;
    attribute float fromOpacity;
    attribute float toOpacity;
    attribute float randomness;
    attribute float particleType;

    uniform float uPixelRatio;
    uniform float uTime;
    uniform float uTransition;
    uniform float uScatterStrength;
    uniform float uCurlStrength;
    uniform float uScatterEnd;
    uniform float uGatherStart;
    uniform vec3 uMousePoint;
    uniform float uMouseStrength;
    uniform float uRepelRadius;

    varying vec3 vColor;
    varying float vOpacity;

    // 非线性哈希把三个种子打散为独立随机值，避免单一随机参数形成可见曲线。
    float particleHash(vec3 seed) {
      return fract(sin(dot(seed, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    }

    void main() {
      float phase = randomness * 43.982;
      // 对原方向和固定随机值做哈希，既保证反向滚动稳定，也彻底消除模型轮廓相关性。
      vec3 randomSeed = scatterDirection * 17.31 + vec3(randomness * 29.17);
      vec3 randomDirection = normalize(vec3(
        particleHash(randomSeed + vec3(3.17, 11.43, 19.71)),
        particleHash(randomSeed.yzx + vec3(23.41, 5.83, 37.19)),
        particleHash(randomSeed.zxy + vec3(41.73, 29.11, 7.47))
      ) - vec3(0.5) + vec3(0.0001));
      vec3 direction = normalize(randomDirection + vec3(0.0001));
      vec3 tangent = normalize(vec3(-direction.y, direction.x, 0.32));
      // 前 40% 只打散旧模型，后 40% 才汇聚新模型，中间阶段保持完整散点场。
      float scatterProgress = smoothstep(0.0, uScatterEnd, uTransition);
      float gatherProgress = smoothstep(uGatherStart, 1.0, uTransition);
      float scatterWeight = scatterProgress * (1.0 - gatherProgress);
      float scatterRadius = uScatterStrength * (0.58 + randomness * 1.08 + particleType * 0.55);
      vec3 scatterPosition = direction * scatterRadius;
      scatterPosition += tangent * sin(phase * 1.21) * uCurlStrength;
      scatterPosition.z += cos(phase * 0.83) * uCurlStrength * 0.72;

      // 两次独立插值确保第二个模型在 gatherStart 之前不会提前显露轮廓。
      vec3 transformed = mix(fromPosition, scatterPosition, scatterProgress);
      transformed = mix(transformed, toPosition, gatherProgress);

      // 中段漂移仅在散点状态生效，模型完整时不会产生额外形变。
      transformed += tangent * sin(uTime * 0.34 + phase) * uCurlStrength * 0.18 * scatterWeight;
      transformed.z += cos(uTime * 0.27 + phase * 0.71) * uCurlStrength * 0.12 * scatterWeight;

      float driftScale = mix(0.008, 0.05, particleType);
      transformed.x += sin(uTime * 0.31 + phase) * driftScale;
      transformed.y += cos(uTime * 0.27 + phase * 1.17) * driftScale;
      transformed.z += sin(uTime * 0.2 + phase * 0.73) * driftScale * 0.8;

      vec3 mouseDelta = transformed - uMousePoint;
      float mouseDistance = length(mouseDelta);
      float repel = (1.0 - smoothstep(0.0, uRepelRadius, mouseDistance)) * uMouseStrength;
      transformed += normalize(mouseDelta + vec3(0.0001)) * repel;

      // 散开阶段保留旧模型风格，汇聚阶段再同步过渡到新模型颜色与可见粒子数。
      vColor = mix(fromColor, toColor, gatherProgress);
      float scatteredOpacity = fromOpacity * mix(1.0, 0.68 + randomness * 0.22, scatterProgress);
      vOpacity = mix(scatteredOpacity, toOpacity, gatherProgress);
      float scatteredSize = fromSize * mix(1.0, 0.76 + randomness * 0.42, scatterProgress);
      float pointSize = mix(scatteredSize, toSize, gatherProgress);
      vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
      float attenuation = 250.0 / max(1.0, -viewPosition.z);
      float pulse = 0.9 + sin(uTime * (0.42 + randomness * 0.5) + phase) * 0.11;
      gl_PointSize = max(1.0, pointSize * pulse * uPixelRatio * attenuation);
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
      gl_FragColor = vec4(finalColor * 1.25, alpha);
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
    return () => controls.dispose();
  }, [camera, enabled, gl, settings.dampingFactor, settings.rotateSpeed]);

  useFrame(() => controlsRef.current?.update());
  return null;
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
    console.error('多模型粒子背景初始化失败：', error);
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function getConfiguredParticleCount(model, deviceKey, fallbackCount) {
  const configured = typeof model.particleCount === 'number'
    ? model.particleCount
    : model.particleCount?.[deviceKey];
  return Math.max(100, Math.round(configured || fallbackCount));
}

function applyModelStyle(data, model, visibleCount) {
  const sizeScale = Number(model.particleSizeScale) || 1;
  for (let index = 0; index < data.sizes.length; index += 1) {
    data.sizes[index] *= sizeScale;
    if (index >= visibleCount) data.opacities[index] = 0;
  }
  return data;
}

function ParticleStoryScene({ config, deviceKey, profile, onReady }) {
  const materialRef = useRef(null);
  const fromPositionRef = useRef(null);
  const toPositionRef = useRef(null);
  const fromColorRef = useRef(null);
  const toColorRef = useRef(null);
  const fromSizeRef = useRef(null);
  const toSizeRef = useRef(null);
  const fromOpacityRef = useRef(null);
  const toOpacityRef = useRef(null);
  const activePairRef = useRef([-1, -1]);
  const pointerRef = useRef(new THREE.Vector2(999, 999));
  const pointerActivityRef = useRef(0);
  const mousePointRef = useRef(new THREE.Vector3());
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const decoderLoadersRef = useRef([]);
  const { camera, gl, raycaster } = useThree();
  const modelUrls = useMemo(() => config.models.map((model) => model.modelUrl), [config.models]);
  const visibleCounts = useMemo(
    () => config.models.map((model) => getConfiguredParticleCount(model, deviceKey, profile.particleCount)),
    [config.models, deviceKey, profile.particleCount]
  );
  const renderParticleCount = Math.max(...visibleCounts, profile.particleCount);
  const samplingProfile = useMemo(
    () => ({ ...profile, particleCount: renderParticleCount }),
    [profile, renderParticleCount]
  );

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

  const gltfs = useLoader(GLTFLoader, modelUrls, configureLoader);
  const modelData = useMemo(() => gltfs.map((gltf, index) => {
    const model = config.models[index];
    const modelConfig = {
      ...config,
      particleColor: model.particleColor || config.particleColor,
      highlightColor: model.highlightColor || config.highlightColor
    };
    return applyModelStyle(
      buildModelParticleData(gltf.scene, modelConfig, samplingProfile),
      model,
      visibleCounts[index]
    );
  }), [config, gltfs, samplingProfile, visibleCounts]);
  const baseData = modelData[0];
  const secondData = modelData[1] || baseData;

  const uniforms = useMemo(() => ({
    uPixelRatio: { value: gl.getPixelRatio() },
    uTime: { value: 0 },
    uTransition: { value: 0 },
    uScatterStrength: { value: config.scatterStrength },
    uCurlStrength: { value: config.curlStrength },
    // 阶段边界来自 index.html，允许不同项目调整打散与汇聚占用的滚动比例。
    uScatterEnd: { value: config.morphPhases.scatterEnd },
    uGatherStart: { value: config.morphPhases.gatherStart },
    uMousePoint: { value: new THREE.Vector3(999, 999, 999) },
    uMouseStrength: { value: 0 },
    uRepelRadius: { value: config.repelRadius }
  }), [config, gl]);

  const updateAttribute = useCallback((attributeRef, sourceArray) => {
    attributeRef.current.array.set(sourceArray);
    attributeRef.current.needsUpdate = true;
  }, []);

  const setMorph = useCallback((fromIndex, toIndex, progress) => {
    const safeFrom = THREE.MathUtils.clamp(Math.round(fromIndex), 0, modelData.length - 1);
    const safeTo = THREE.MathUtils.clamp(Math.round(toIndex), 0, modelData.length - 1);
    const pair = activePairRef.current;

    if (pair[0] !== safeFrom || pair[1] !== safeTo) {
      const fromData = modelData[safeFrom];
      const toData = modelData[safeTo];
      updateAttribute(fromPositionRef, fromData.targetPositions);
      updateAttribute(toPositionRef, toData.targetPositions);
      updateAttribute(fromColorRef, fromData.colors);
      updateAttribute(toColorRef, toData.colors);
      updateAttribute(fromSizeRef, fromData.sizes);
      updateAttribute(toSizeRef, toData.sizes);
      updateAttribute(fromOpacityRef, fromData.opacities);
      updateAttribute(toOpacityRef, toData.opacities);
      activePairRef.current = [safeFrom, safeTo];
    }

    const safeProgress = THREE.MathUtils.clamp(progress, 0, 1);
    uniforms.uTransition.value = safeProgress;
    // 直接更新 GPU 正在使用的材质实例，避免 React 属性对象与 Three.js uniform 脱节。
    if (materialRef.current) materialRef.current.uniforms.uTransition.value = safeProgress;
    // 暴露 Shader 实际收到的进度，便于 CMS 集成和滚动联调时定位事件链路。
    document.documentElement.dataset.particleShaderProgress = safeProgress.toFixed(4);
  }, [modelData, uniforms.uTransition, updateAttribute]);

  useEffect(() => {
    activePairRef.current = [0, Math.min(1, modelData.length - 1)];
    window.PARTICLE_STORY_API = { setMorph, modelCount: modelData.length };
    const handleMorph = (event) => {
      const { fromIndex, toIndex, progress } = event.detail;
      setMorph(fromIndex, toIndex, progress);
    };
    window.addEventListener('particle-story-morph', handleMorph);
    onReady();
    window.dispatchEvent(new CustomEvent('particle-story-ready'));

    return () => {
      window.removeEventListener('particle-story-morph', handleMorph);
      if (window.PARTICLE_STORY_API?.setMorph === setMorph) delete window.PARTICLE_STORY_API;
      decoderLoadersRef.current.forEach((loader) => loader.dispose?.());
      decoderLoadersRef.current = [];
      gltfs.forEach((gltf, index) => {
        gltf.scene.traverse((child) => {
          child.geometry?.dispose?.();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.filter(Boolean).forEach((material) => material.dispose?.());
        });
        useLoader.clear(GLTFLoader, modelUrls[index]);
      });
    };
  }, [gltfs, modelData.length, modelUrls, onReady, setMorph]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handlePointerMove = (event) => {
      if (event.buttons !== 0) {
        pointerActivityRef.current = 0;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      pointerActivityRef.current = 1;
    };
    const handlePointerLeave = () => {
      pointerActivityRef.current = 0;
    };
    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [gl]);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    pointerActivityRef.current = THREE.MathUtils.damp(pointerActivityRef.current, 0, 3.2, delta);
    if (pointerActivityRef.current > 0.002) {
      raycaster.setFromCamera(pointerRef.current, camera);
      if (raycaster.ray.intersectPlane(interactionPlane, mousePointRef.current)) {
        uniforms.uMousePoint.value.copy(mousePointRef.current);
      }
    }
    uniforms.uMouseStrength.value = config.repelStrength * pointerActivityRef.current;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[baseData.targetPositions.slice(), 3]} />
        <bufferAttribute ref={fromPositionRef} attach="attributes-fromPosition" args={[baseData.targetPositions.slice(), 3]} />
        <bufferAttribute ref={toPositionRef} attach="attributes-toPosition" args={[secondData.targetPositions.slice(), 3]} />
        <bufferAttribute attach="attributes-scatterDirection" args={[baseData.exitDirections, 3]} />
        <bufferAttribute ref={fromColorRef} attach="attributes-fromColor" args={[baseData.colors.slice(), 3]} />
        <bufferAttribute ref={toColorRef} attach="attributes-toColor" args={[secondData.colors.slice(), 3]} />
        <bufferAttribute ref={fromSizeRef} attach="attributes-fromSize" args={[baseData.sizes.slice(), 1]} />
        <bufferAttribute ref={toSizeRef} attach="attributes-toSize" args={[secondData.sizes.slice(), 1]} />
        <bufferAttribute ref={fromOpacityRef} attach="attributes-fromOpacity" args={[baseData.opacities.slice(), 1]} />
        <bufferAttribute ref={toOpacityRef} attach="attributes-toOpacity" args={[secondData.opacities.slice(), 1]} />
        <bufferAttribute attach="attributes-randomness" args={[baseData.randomness, 1]} />
        <bufferAttribute attach="attributes-particleType" args={[baseData.types, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={storyParticleShader.vertex}
        fragmentShader={storyParticleShader.fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
      />
    </points>
  );
}

function StaticFallback({ config }) {
  return <img className="particle-static-fallback" src={config.fallbackImageUrl} alt="" />;
}

export default function App() {
  const config = useMemo(getStoryConfig, []);
  const isMobile = useMediaQuery(`(max-width: ${config.breakpoint}px)`);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const profile = isMobile ? config.mobile : config.desktop;
  const deviceKey = isMobile ? 'mobile' : 'desktop';
  const [sceneFailed, setSceneFailed] = useState(false);
  const markReady = useCallback(() => {
    document.documentElement.classList.add('particle-ready');
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--particle-accent', config.particleColor);
    return () => document.documentElement.classList.remove('particle-ready');
  }, [config.particleColor]);

  const useFallback = prefersReducedMotion || !supportsWebGL2() || sceneFailed;

  if (useFallback) {
    document.documentElement.classList.add('particle-ready');
    return <StaticFallback config={config} />;
  }

  return (
    <SceneErrorBoundary onError={() => setSceneFailed(true)}>
      <Canvas
        key={deviceKey}
        camera={{ position: [0, 0, profile.cameraZ], fov: 45, near: 0.1, far: 120 }}
        dpr={[1, profile.maxDpr]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <DragOrbitControls
          enabled={!isMobile && config.orbitControls.enabled}
          settings={config.orbitControls}
        />
        <Suspense fallback={null}>
          <ParticleStoryScene
            config={config}
            deviceKey={deviceKey}
            profile={profile}
            onReady={markReady}
          />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
