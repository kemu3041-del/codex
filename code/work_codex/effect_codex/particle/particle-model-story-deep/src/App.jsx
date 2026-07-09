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
    uniform float uModelExit;
    uniform float uModelEnter;
    uniform float uPairMix;

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
      // 主体不做形态变形：旧主体随滚动持续放大并淡出，新主体从远处收束出现。
      float exitProgress = uModelExit;
      float enterProgress = uModelEnter;
      float pairMix = uPairMix;
      float exitScale = mix(0.84, 4.8, pow(exitProgress, 1.12));
      float enterScale = mix(0.28, 1.06, enterProgress);
      float gatherDistance = 1.0 - enterProgress;

      vec3 exitPosition = fromPosition * exitScale;
      exitPosition.z += exitProgress * 2.8;
      exitPosition += direction * uScatterStrength * 0.045 * exitProgress;

      vec3 enterPosition = toPosition * enterScale;
      enterPosition.z -= gatherDistance * 8.8;
      enterPosition += direction * uScatterStrength * 0.26 * gatherDistance;
      enterPosition += tangent * sin(phase * 0.91) * uCurlStrength * 0.08 * gatherDistance;

      vec3 transformed = mix(exitPosition, enterPosition, pairMix);

      float driftScale = mix(0.008, 0.05, particleType);
      transformed.x += sin(uTime * 0.31 + phase) * driftScale;
      transformed.y += cos(uTime * 0.27 + phase * 1.17) * driftScale;
      transformed.z += sin(uTime * 0.2 + phase * 0.73) * driftScale * 0.8;

      vec3 mouseDelta = transformed - uMousePoint;
      float mouseDistance = length(mouseDelta);
      float repel = (1.0 - smoothstep(0.0, uRepelRadius, mouseDistance)) * uMouseStrength;
      transformed += normalize(mouseDelta + vec3(0.0001)) * repel;

      // 切换时不显示 from/to 形变过程：旧主体先淡出，新主体再从远处淡入。
      vColor = mix(fromColor, toColor, pairMix);
      float exitOpacity = fromOpacity * (1.0 - smoothstep(0.34, 0.52, uTransition));
      float enterOpacity = toOpacity * smoothstep(0.56, 0.82, uTransition);
      vOpacity = mix(exitOpacity, enterOpacity, pairMix);
      float exitSize = fromSize * mix(1.0, 1.55, exitProgress);
      float enterSize = toSize * mix(0.72, 1.0, enterProgress);
      float pointSize = mix(exitSize, enterSize, pairMix);
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

const environmentParticleShader = {
  vertex: `
    attribute float particleSize;
    attribute float particleDepth;
    attribute float particleSeed;
    attribute float particleCluster;
    attribute vec3 particleColor;

    uniform float uPixelRatio;
    uniform float uTime;
    uniform float uStoryDepth;
    uniform float uTravelStrength;
    uniform float uFromVolume;
    uniform float uToVolume;
    uniform float uVolumeProgress;

    varying vec3 vColor;
    varying float vOpacity;

    void main() {
      vec3 transformed = position;
      float fromVolume = 1.0 - step(0.5, abs(particleCluster - uFromVolume));
      float toVolume = 1.0 - step(0.5, abs(particleCluster - uToVolume));
      float isVolumeParticle = step(0.0, particleCluster);

      // 所有背景粒子共用同一套滚动穿行机制，形状粒子只是一种初始排布。
      transformed.z += uStoryDepth * uTravelStrength * (0.38 + particleDepth * 0.92);

      // 所有背景粒子使用同样的静止漂浮公式，避免形状簇成为独立动画层。
      float floatStrength = mix(0.16, 0.48, particleDepth);
      transformed.x += sin(uTime * 0.16 + particleSeed * 18.0) * floatStrength;
      transformed.y += cos(uTime * 0.13 + particleSeed * 12.0) * floatStrength * 0.72;
      // 滚动时给背景粒子场一个轻微 Y 轴旋转，配合相机横移产生绕场景推进的感觉。
      float sweepAngle = (uStoryDepth - 0.5) * 0.28 + sin(uStoryDepth * 6.2831853) * 0.12;
      float sweepCos = cos(sweepAngle);
      float sweepSin = sin(sweepAngle);
      transformed.xz = vec2(
        transformed.x * sweepCos - transformed.z * sweepSin,
        transformed.x * sweepSin + transformed.z * sweepCos
      );

      vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
      float depthAttenuation = 290.0 / max(1.0, -viewPosition.z);
      float foregroundBoost = mix(0.78, 2.9, particleDepth);
      float zoomBoost = mix(1.0, 1.75, uStoryDepth * particleDepth);
      gl_PointSize = max(0.8, particleSize * foregroundBoost * zoomBoost * depthAttenuation * uPixelRatio);
      gl_Position = projectionMatrix * viewPosition;

      vColor = particleColor;
      vOpacity = mix(0.28, 0.88, particleDepth) * mix(0.72, 1.0, uStoryDepth);
      float outgoingOpacity = fromVolume * mix(1.0, 0.18, smoothstep(0.72, 1.0, uVolumeProgress));
      float incomingOpacity = toVolume * smoothstep(0.0, 0.64, uVolumeProgress);
      float volumeOpacity = max(outgoingOpacity, incomingOpacity);
      vOpacity *= mix(1.0, 0.34 * volumeOpacity, isVolumeParticle);
    }
  `,
  fragment: `
    varying vec3 vColor;
    varying float vOpacity;

    void main() {
      float distanceToCenter = length(gl_PointCoord - vec2(0.5));
      if (distanceToCenter > 0.5) discard;
      float softDot = pow(1.0 - smoothstep(0.04, 0.5, distanceToCenter), 1.45);
      float core = 1.0 - smoothstep(0.0, 0.13, distanceToCenter);
      vec3 finalColor = mix(vColor, vec3(1.0), core * 0.18);
      gl_FragColor = vec4(finalColor * 1.2, clamp((softDot + core * 0.35) * vOpacity, 0.0, 1.0));
    }
  `
};

function seededRandom(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

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

function DepthParticleField({ config, deviceKey, profile, storyDepthRef, volumeStateRef }) {
  const materialRef = useRef(null);
  const { gl } = useThree();
  const envConfig = config.environment;
  const count = deviceKey === 'mobile' ? envConfig.mobileCount : envConfig.desktopCount;

  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const depths = new Float32Array(count);
    const seeds = new Float32Array(count);
    const clusters = new Float32Array(count);
    const gold = new THREE.Color('#d5df68');
    const white = new THREE.Color('#eef6ed');
    const green = new THREE.Color('#76d677');
    const dark = new THREE.Color('#0a2517');
    const color = new THREE.Color();
    const volumeScale = envConfig.volumeScale;
    const volumeClusters = [
      { type: 'sphere', center: [-12.2, 3.2, -13.8], radius: 4.9 * volumeScale, height: 0 },
      { type: 'cylinder', center: [13.4, -0.6, -10.6], radius: 2.8 * volumeScale, height: 10.8 * volumeScale },
      { type: 'sphere', center: [11.6, 5.2, -19.2], radius: 3.9 * volumeScale, height: 0 },
      { type: 'cylinder', center: [-14.4, -4.1, -8.6], radius: 2.35 * volumeScale, height: 9.4 * volumeScale },
      { type: 'sphere', center: [0.8, 6.6, -24], radius: 3.4 * volumeScale, height: 0 }
    ];

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const seed = index + 1;
      const isVolumeParticle = seededRandom(seed * 19.1) < envConfig.volumeRatio;
      const foreground = seededRandom(seed * 9.7) < envConfig.foregroundRatio;
      const depth = foreground
        ? THREE.MathUtils.lerp(0.72, 1, Math.pow(seededRandom(seed * 14.3), 0.36))
        : Math.pow(seededRandom(seed * 5.1), 1.45) * 0.74;
      const band = Math.sin(seededRandom(seed * 2.3) * Math.PI * 8 + depth * 3.6);
      const sideBias = Math.sign(seededRandom(seed * 4.4) - 0.5) * Math.pow(seededRandom(seed * 6.9), 0.55);

      if (isVolumeParticle) {
        const clusterIndex = Math.floor(seededRandom(seed * 20.7) * volumeClusters.length);
        const cluster = volumeClusters[clusterIndex];
        const angle = seededRandom(seed * 21.3) * Math.PI * 2;
        const radius = Math.pow(seededRandom(seed * 22.4), cluster.type === 'sphere' ? 0.42 : 0.58) * cluster.radius;
        const zJitter = (seededRandom(seed * 23.5) - 0.5) * 2.6 * volumeScale;

        if (cluster.type === 'sphere') {
          const vertical = (seededRandom(seed * 24.6) * 2 - 1) * cluster.radius;
          const radialScale = Math.sqrt(Math.max(0.08, 1 - (vertical * vertical) / (cluster.radius * cluster.radius)));
          positions[offset] = cluster.center[0] + Math.cos(angle) * radius * radialScale;
          positions[offset + 1] = cluster.center[1] + vertical;
          positions[offset + 2] = cluster.center[2] + Math.sin(angle) * radius * 0.85 + zJitter;
        } else {
          positions[offset] = cluster.center[0] + Math.cos(angle) * radius;
          positions[offset + 1] = cluster.center[1] + (seededRandom(seed * 24.6) - 0.5) * cluster.height;
          positions[offset + 2] = cluster.center[2] + Math.sin(angle) * radius * 1.9 + zJitter;
        }
      } else {
        // 横向带状分布让空间粒子包围主模型，而不是均匀铺成噪点背景。
        positions[offset] = sideBias * envConfig.spreadX * 0.5 + band * 1.6;
        positions[offset + 1] = (seededRandom(seed * 3.1) - 0.5) * envConfig.spreadY + Math.sin(seed * 0.13) * 1.2;
        positions[offset + 2] = THREE.MathUtils.lerp(-envConfig.spreadZ, 4.5, depth);
      }

      const colorPick = seededRandom(seed * 8.2);
      if (colorPick < envConfig.goldRatio) {
        color.copy(gold).lerp(white, seededRandom(seed * 11.4) * 0.18);
      } else if (colorPick < envConfig.goldRatio + 0.32) {
        color.copy(white).lerp(green, seededRandom(seed * 12.5) * 0.16);
      } else {
        color.copy(green).lerp(dark, seededRandom(seed * 13.6) * 0.76);
      }

      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
      // 点大小不区分普通散点和形状簇，形状只由空间排布形成。
      sizes[index] = (0.035 + Math.pow(seededRandom(seed * 15.8), 4.2) * 0.46) * envConfig.sizeScale;
      depths[index] = depth;
      seeds[index] = seededRandom(seed * 17.9);
      clusters[index] = isVolumeParticle ? Math.floor(seededRandom(seed * 20.7) * volumeClusters.length) : -1;
    }

    return { positions, colors, sizes, depths, seeds, clusters };
  }, [count, envConfig]);

  const uniforms = useMemo(() => ({
    uPixelRatio: { value: gl.getPixelRatio() },
    uTime: { value: 0 },
    uStoryDepth: { value: 0 },
    uFromVolume: { value: 0 },
    uToVolume: { value: 0 },
    uVolumeProgress: { value: 0 },
    uTravelStrength: { value: envConfig.travelStrength }
  }), [envConfig.travelStrength, gl]);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uStoryDepth.value = THREE.MathUtils.damp(
      uniforms.uStoryDepth.value,
      storyDepthRef.current,
      3.8,
      delta
    );
    if (materialRef.current) {
      const volumeState = volumeStateRef.current;
      materialRef.current.uniforms.uStoryDepth.value = uniforms.uStoryDepth.value;
      materialRef.current.uniforms.uFromVolume.value = volumeState.from;
      materialRef.current.uniforms.uToVolume.value = volumeState.to;
      materialRef.current.uniforms.uVolumeProgress.value = volumeState.progress;
    }
  });

  return (
    <points frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
        <bufferAttribute attach="attributes-particleColor" args={[particleData.colors, 3]} />
        <bufferAttribute attach="attributes-particleSize" args={[particleData.sizes, 1]} />
        <bufferAttribute attach="attributes-particleDepth" args={[particleData.depths, 1]} />
        <bufferAttribute attach="attributes-particleSeed" args={[particleData.seeds, 1]} />
        <bufferAttribute attach="attributes-particleCluster" args={[particleData.clusters, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={environmentParticleShader.vertex}
        fragmentShader={environmentParticleShader.fragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
      />
    </points>
  );
}

function ParticleStoryScene({ config, deviceKey, profile, onReady }) {
  const materialRef = useRef(null);
  const modelGroupRef = useRef(null);
  const fromPositionRef = useRef(null);
  const toPositionRef = useRef(null);
  const fromColorRef = useRef(null);
  const toColorRef = useRef(null);
  const fromSizeRef = useRef(null);
  const toSizeRef = useRef(null);
  const fromOpacityRef = useRef(null);
  const toOpacityRef = useRef(null);
  const activePairRef = useRef([-1, -1]);
  const storyDepthRef = useRef(0);
  const modelFocusXRef = useRef(0);
  const volumeStateRef = useRef({ from: 0, to: 0, progress: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3());
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
    // 保留旧阶段配置入口，当前主体切换由放大淡出和远处出现控制。
    uScatterEnd: { value: config.morphPhases.scatterEnd },
    uGatherStart: { value: config.morphPhases.gatherStart },
    uModelExit: { value: 0 },
    uModelEnter: { value: 1 },
    uPairMix: { value: 0 },
    uMousePoint: { value: new THREE.Vector3(999, 999, 999) },
    uMouseStrength: { value: 0 },
    uRepelRadius: { value: config.repelRadius }
  }), [config, gl]);

  const updateAttribute = useCallback((attributeRef, sourceArray) => {
    attributeRef.current.array.set(sourceArray);
    attributeRef.current.needsUpdate = true;
  }, []);

  const setMorph = useCallback((
    fromIndex,
    toIndex,
    progress,
    storyProgress = progress,
    modelX = 0,
    fromShapeIndex = 0,
    toShapeIndex = fromShapeIndex,
    shapeProgress = 0
  ) => {
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
    const safeStoryProgress = THREE.MathUtils.clamp(storyProgress, 0, 1);
    const safeModelX = deviceKey === 'mobile'
      ? 0
      : THREE.MathUtils.clamp(Number(modelX) || 0, -5.2, 5.2);
    storyDepthRef.current = safeStoryProgress;
    modelFocusXRef.current = safeModelX;
    volumeStateRef.current = {
      from: THREE.MathUtils.clamp(Math.round(fromShapeIndex), 0, 4),
      to: THREE.MathUtils.clamp(Math.round(toShapeIndex), 0, 4),
      progress: THREE.MathUtils.clamp(Number(shapeProgress) || 0, 0, 1)
    };
    const exitProgress = THREE.MathUtils.smoothstep(safeProgress, 0.04, 0.54);
    const enterProgress = THREE.MathUtils.smoothstep(safeProgress, 0.52, 0.96);
    const pairMix = safeFrom === safeTo ? 0 : THREE.MathUtils.smoothstep(safeProgress, 0.5, 0.56);
    uniforms.uTransition.value = safeProgress;
    uniforms.uModelExit.value = safeFrom === safeTo ? 0 : exitProgress;
    uniforms.uModelEnter.value = safeFrom === safeTo ? 1 : enterProgress;
    uniforms.uPairMix.value = pairMix;
    // 直接更新 GPU 正在使用的材质实例，避免 React 属性对象与 Three.js uniform 脱节。
    if (materialRef.current) {
      materialRef.current.uniforms.uTransition.value = safeProgress;
      materialRef.current.uniforms.uModelExit.value = uniforms.uModelExit.value;
      materialRef.current.uniforms.uModelEnter.value = uniforms.uModelEnter.value;
      materialRef.current.uniforms.uPairMix.value = uniforms.uPairMix.value;
    }
    // 暴露 Shader 实际收到的进度，便于 CMS 集成和滚动联调时定位事件链路。
    document.documentElement.dataset.particleShaderProgress = safeProgress.toFixed(4);
    document.documentElement.dataset.particleStoryDepth = safeStoryProgress.toFixed(4);
    document.documentElement.dataset.particleModelX = safeModelX.toFixed(2);
    document.documentElement.dataset.particleActiveVolume = String(
      volumeStateRef.current.progress < 0.5 ? volumeStateRef.current.from : volumeStateRef.current.to
    );
  }, [deviceKey, modelData, uniforms, updateAttribute]);

  useEffect(() => {
    activePairRef.current = [0, Math.min(1, modelData.length - 1)];
    window.PARTICLE_STORY_API = { setMorph, modelCount: modelData.length };
    const handleMorph = (event) => {
      const {
        fromIndex,
        toIndex,
        progress,
        storyProgress,
        modelX,
        fromShapeIndex,
        toShapeIndex,
        shapeProgress
      } = event.detail;
      setMorph(
        fromIndex,
        toIndex,
        progress,
        storyProgress,
        modelX,
        fromShapeIndex,
        toShapeIndex,
        shapeProgress
      );
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
    const depthProgress = storyDepthRef.current;
    const targetCameraZ = THREE.MathUtils.lerp(profile.cameraZ + 1.8, profile.cameraZ - 1.15, depthProgress);
    const targetCameraX = THREE.MathUtils.lerp(0.28, 1.72, depthProgress) + Math.sin(depthProgress * Math.PI) * 0.24;
    const targetCameraY = Math.sin(depthProgress * Math.PI) * 0.24;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraZ, 2.6, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraX, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraY, 2.4, delta);
    cameraTargetRef.current.set(
      THREE.MathUtils.lerp(0.12, 0.72, depthProgress),
      0,
      0
    );
    camera.lookAt(cameraTargetRef.current);
    if (modelGroupRef.current) {
      const modelScale = THREE.MathUtils.lerp(0.78, 1.06, depthProgress);
      modelGroupRef.current.scale.setScalar(THREE.MathUtils.damp(modelGroupRef.current.scale.x, modelScale, 3.2, delta));
      modelGroupRef.current.position.x = THREE.MathUtils.damp(modelGroupRef.current.position.x, modelFocusXRef.current, 3.4, delta);
      modelGroupRef.current.position.z = THREE.MathUtils.damp(modelGroupRef.current.position.z, depthProgress * 0.38, 3.2, delta);
    }
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
    <>
      <DepthParticleField
        config={config}
        deviceKey={deviceKey}
        profile={profile}
        storyDepthRef={storyDepthRef}
        volumeStateRef={volumeStateRef}
      />
      <group ref={modelGroupRef}>
        <points frustumCulled={false} renderOrder={2}>
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
      </group>
    </>
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
