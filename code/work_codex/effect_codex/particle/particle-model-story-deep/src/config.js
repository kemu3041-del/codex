const DEFAULT_CONFIG = {
  // 长页面中的沉浸段默认使用 pinned 舞台，让滚动驱动内部叙事而不是真实页面位移。
  stageMode: 'pinned',
  // 每个段落占用多少个视口高度的滚动距离，数值越大转场越慢。
  sectionsPerViewport: 1,
  // 全局默认粒子颜色；单个模型没有配置 particleColor 时使用该颜色。
  particleColor: '#c9ef18',
  // 少量高亮粒子的颜色，用于制造亮点和层次。
  highlightColor: '#ffffff',
  // WebGL 不可用或用户开启“减少动态效果”时显示的静态降级图片。
  fallbackImageUrl: './particle-fallback.svg',
  // 桌面端与移动端配置的切换宽度，单位为 px。
  breakpoint: 768,
  // 默认模型列表；index.html 未提供 models 时使用这里的示例模型。
  models: [
    {
      // 第一个 GLB/GLTF 模型的公开访问地址。
      modelUrl: './logo4.glb',
      // 该模型在桌面端和移动端实际显示的粒子数量。
      particleCount: { desktop: 3200, mobile: 1600 }
    },
    {
      // 第二个 GLB/GLTF 模型的公开访问地址。
      modelUrl: './logo3.glb',
      // 不同模型可独立设置粒子数，以适配模型复杂度。
      particleCount: { desktop: 2500, mobile: 1300 }
    },
    {
      // 第三个 GLB/GLTF 模型的公开访问地址；模型数量可以自由增减。
      modelUrl: './logo.glb',
      // 移动端通常使用约一半粒子，降低 GPU 和内存压力。
      particleCount: { desktop: 3400, mobile: 1750 }
    }
  ],
  // 模型完全打散后的空间扩散半径；数值越大，粒子分布范围越广。
  scatterStrength: 3.8,
  // 散点状态下的旋流和纵深偏移强度；过大会削弱模型辨识度。
  curlStrength: 1.35,
  // 控制一次模型切换的三段节奏：40% 前完成打散，60% 后才开始汇聚。
  morphPhases: {
    // 滚动进度到达该值时，旧模型完全打散。
    scatterEnd: 0.4,
    // 滚动进度到达该值后，散点开始汇聚成新模型。
    gatherStart: 0.6
  },
  // 从模型轮廓边缘采样的粒子比例，其余粒子从表面采样。
  edgeRatio: 0.78,
  // EdgesGeometry 的边缘夹角阈值，单位为度；越小识别的边越多。
  edgeThreshold: 20,
  // 边缘粒子采用簇状采样的比例，用于形成疏密不均的自然轮廓。
  edgeClusterRatio: 0.45,
  // 预生成的边缘采样簇数量；越多分布越均匀，越少聚集感越强。
  edgeClusterCount: 48,
  // 单个边缘簇内部的采样扩散范围。
  edgeClusterSpread: 0.14,
  // 边缘粒子的最大随机偏移，避免轮廓像机械描边。
  edgeJitterMax: 0.14,
  // 脱离模型主体、分布在外围空间中的氛围粒子比例。
  atmosphereRatio: 0.24,
  // 氛围粒子离开模型表面的最小距离。
  atmosphereMinDistance: 0.4,
  // 氛围粒子离开模型表面的最大距离。
  atmosphereMaxDistance: 7,
  // 使用 highlightColor 和较大尺寸的高亮粒子比例。
  highlightRatio: 0.045,
  // 允许参与采样的最大三角形数量，防止超高面数模型阻塞页面。
  sourceTriangleLimit: 250000,
  // 鼠标附近的粒子排斥半径，使用模型世界坐标单位。
  repelRadius: 1.3,
  // 鼠标排斥位移强度；设置为 0 可关闭排斥效果。
  repelStrength: 0.9,
  // Draco 压缩模型解码器目录，目录中需要包含 Draco WASM/JS 文件。
  dracoDecoderPath: './draco/',
  // KTX2/Basis 压缩纹理解码器目录。
  ktx2TranscoderPath: './basis/',
  // 鼠标拖动旋转配置；关闭后粒子模型保持固定观察角度。
  orbitControls: {
    // 是否启用桌面端拖动旋转。
    enabled: true,
    // 旋转阻尼系数，越小惯性越明显，越大停止越快。
    dampingFactor: 0.08,
    // 鼠标拖动旋转速度。
    rotateSpeed: 0.45
  },
  // 参考 CCUS 站点的全屏空间粒子层：负责包围主模型的白色、黄绿色前后景粒子。
  environment: {
    // 桌面端空间粒子数量；只是一套 GPU Points，不会产生大量 DOM。
    desktopCount: 5200,
    // 移动端降低粒子数量，避免滚动时掉帧。
    mobileCount: 2600,
    // 粒子空间宽度，越大越有横向包围感。
    spreadX: 34,
    // 粒子空间高度。
    spreadY: 18,
    // 粒子空间纵深，配合滚动形成镜头穿行感。
    spreadZ: 26,
    // 黄绿色粒子比例，剩余粒子在白色、浅绿和深绿之间随机。
    goldRatio: 0.34,
    // 靠近镜头的前景粒子比例，这部分滚动放大最明显。
    foregroundRatio: 0.18,
    // 组成球体、圆柱等大体积模糊形状的粒子比例。
    volumeRatio: 0.14,
    // 背景形状簇整体尺寸倍率；调大更占屏，调小更克制。
    volumeScale: 1.12,
    // 背景所有粒子的点尺寸倍率，普通散点和球体/圆柱形状簇共用同一套点大小机制。
    sizeScale: 1,
    // 滚动推进时镜头向前穿过粒子场的强度。
    travelStrength: 7.5,
    // 远景、中景、前景三层粒子共用一个 Points，但用属性区分速度、尺寸和透明度。
    layers: {
      // 远景负责建立大范围空气感，数量多、尺寸小、移动慢。
      far: { countRatio: 0.52, sizeScale: 0.72, speed: 0.56, opacity: 0.58 },
      // 中景形成横向流线和漩涡，是滚动时最明显的空间层。
      mid: { countRatio: 0.32, sizeScale: 1, speed: 1, opacity: 0.82 },
      // 前景用少量大颗粒掠过镜头，强化参考站那种穿行感。
      near: { countRatio: 0.16, sizeScale: 1.85, speed: 1.68, opacity: 1 }
    }
  },
  // 桌面端性能与相机配置。
  desktop: {
    // 未给单个模型配置粒子数时使用的默认缓冲区粒子数。
    particleCount: 3600,
    // 所有模型归一化后的最大显示尺寸。
    modelSize: 12.5,
    // 渲染器允许使用的最大设备像素比，限制高分屏 GPU 压力。
    maxDpr: 1.75,
    // 透视相机在 Z 轴上的距离。
    cameraZ: 11
  },
  // 移动端使用更少粒子、更低 DPR 和独立模型尺寸，保证滚动帧率。
  mobile: {
    // 移动端默认缓冲区粒子数。
    particleCount: 1800,
    // 移动端模型归一化后的最大显示尺寸。
    modelSize: 7,
    // 移动端最大设备像素比。
    maxDpr: 1.35,
    // 移动端相机在 Z 轴上的距离。
    cameraZ: 12
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function mergeEnvironmentLayers(externalLayers = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_CONFIG.environment.layers).map(([key, defaults]) => [
      key,
      { ...defaults, ...externalLayers[key] }
    ])
  );
}

export function getStoryConfig() {
  const external = window.PARTICLE_STORY_CONFIG || {};
  const config = {
    ...DEFAULT_CONFIG,
    ...external,
    stageMode: external.stageMode || DEFAULT_CONFIG.stageMode,
    models: external.models?.length ? external.models : DEFAULT_CONFIG.models,
    // 阶段配置需要深合并，避免只覆盖一个字段时丢失另一个默认边界。
    morphPhases: { ...DEFAULT_CONFIG.morphPhases, ...external.morphPhases },
    orbitControls: { ...DEFAULT_CONFIG.orbitControls, ...external.orbitControls },
    environment: { ...DEFAULT_CONFIG.environment, ...external.environment },
    desktop: { ...DEFAULT_CONFIG.desktop, ...external.desktop },
    mobile: { ...DEFAULT_CONFIG.mobile, ...external.mobile }
  };

  config.edgeRatio = clamp(Number(config.edgeRatio) || 0, 0, 1);
  config.sectionsPerViewport = clamp(Number(config.sectionsPerViewport) || 1, 0.5, 2.5);
  config.edgeClusterRatio = clamp(Number(config.edgeClusterRatio) || 0, 0, 1);
  config.atmosphereRatio = clamp(Number(config.atmosphereRatio) || 0, 0, 0.5);
  config.highlightRatio = clamp(Number(config.highlightRatio) || 0, 0, 0.15);
  config.scatterStrength = clamp(Number(config.scatterStrength) || 0, 0, 20);
  config.curlStrength = clamp(Number(config.curlStrength) || 0, 0, 10);
  config.environment.desktopCount = clamp(Math.round(config.environment.desktopCount), 500, 20000);
  config.environment.mobileCount = clamp(Math.round(config.environment.mobileCount), 300, 10000);
  config.environment.spreadX = clamp(Number(config.environment.spreadX) || 0, 8, 80);
  config.environment.spreadY = clamp(Number(config.environment.spreadY) || 0, 6, 50);
  config.environment.spreadZ = clamp(Number(config.environment.spreadZ) || 0, 8, 80);
  config.environment.goldRatio = clamp(Number(config.environment.goldRatio) || 0, 0, 1);
  config.environment.foregroundRatio = clamp(Number(config.environment.foregroundRatio) || 0, 0, 0.5);
  config.environment.volumeRatio = clamp(Number(config.environment.volumeRatio) || 0, 0, 0.72);
  config.environment.volumeScale = clamp(Number(config.environment.volumeScale) || 1, 0.8, 3.2);
  config.environment.sizeScale = clamp(Number(config.environment.sizeScale) || 1, 0.2, 4);
  config.environment.travelStrength = clamp(Number(config.environment.travelStrength) || 0, 0, 24);
  config.environment.layers = mergeEnvironmentLayers(external.environment?.layers);
  Object.values(config.environment.layers).forEach((layer) => {
    layer.countRatio = clamp(Number(layer.countRatio) || 0, 0.05, 0.9);
    layer.sizeScale = clamp(Number(layer.sizeScale) || 1, 0.2, 4);
    layer.speed = clamp(Number(layer.speed) || 1, 0.1, 3);
    layer.opacity = clamp(Number(layer.opacity) || 1, 0.05, 1.5);
  });
  // 边界远离 0 和 1，保证打散与汇聚阶段都保留可见的滚动距离。
  const scatterEnd = clamp(Number(config.morphPhases.scatterEnd), 0.05, 0.95);
  const gatherStart = clamp(Number(config.morphPhases.gatherStart), 0.05, 0.95);
  // 错误顺序会让两个阶段重叠并产生跳变，因此整体恢复经过验证的默认节奏。
  config.morphPhases = Number.isFinite(scatterEnd)
    && Number.isFinite(gatherStart)
    && scatterEnd < gatherStart
    ? { scatterEnd, gatherStart }
    : { ...DEFAULT_CONFIG.morphPhases };
  config.desktop.particleCount = clamp(Math.round(config.desktop.particleCount), 300, 50000);
  config.mobile.particleCount = clamp(Math.round(config.mobile.particleCount), 300, 20000);

  return config;
}
