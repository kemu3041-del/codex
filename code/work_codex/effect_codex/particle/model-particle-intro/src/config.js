const DEFAULT_CONFIG = {
  // === 资源配置 ===
  modelUrl: './logo4.glb', // GLB/GLTF 模型地址；更换模型时主要修改此项。
  fallbackImageUrl: './particle-fallback.svg', // WebGL 不可用、减少动态效果或模型加载失败时显示的静态图片。
  particleColor: '#bbd40f', // 普通粒子的主色，同时用于页面按钮等强调色。
  highlightColor: '#ffffff', // 少量高亮粒子的颜色，用于制造闪光和层次。

  // === 响应式断点 ===
  breakpoint: 768, // 移动端断点，视口宽度小于等于该值时使用 mobile 配置，单位 px。

  // === 模型边缘粒子 ===
  edgeRatio: 0.72, // 非氛围粒子中采样到模型边缘的比例；越大，模型轮廓越清晰。
  edgeThreshold: 20, // EdgesGeometry 的夹角阈值，单位为度；越小提取的模型细节边越多。
  edgeClusterRatio: 0.45, // 边缘粒子采用聚簇分布的比例；越大，局部疏密和断层越明显。
  edgeClusterCount: 48, // 边缘聚簇中心的目标数量；越多，粒子分布越均匀，越少则局部聚集更明显。
  edgeClusterSpread: 0.14, // 单个聚簇沿边缘线段扩散的范围；越大，粒子簇越松散。
  edgeJitterMax: 0.14, // 边缘粒子偏离模型轮廓的最大距离；用于破坏过于笔直的机械描边。

  // === 外围氛围粒子 ===
  atmosphereRatio: 0.28, // 全部粒子中氛围粒子的比例；越大，画面外围粒子越多，但模型主体会变弱。
  atmosphereMinDistance: 0.4, // 氛围粒子离开模型表面的最小距离，使用归一化后的 Three.js 世界单位。
  atmosphereMaxDistance: 9, // 氛围粒子离开模型表面的最大距离；控制粒子扩散到画面外围的范围。
  highlightRatio: 0.03, // 高亮大粒子的比例，0.03 表示约 3%；不宜过高，否则容易过曝。

  // === 入场与鼠标交互 ===
  introDuration: 2, // 粒子从散乱位置聚拢成模型的时长，单位秒。
  repelRadius: 1.25, // 鼠标排斥影响半径，使用 Three.js 世界单位。
  repelStrength: 7, // 鼠标排斥力度；越大，粒子被推开的速度和距离越明显。
  returnSpeed: 11, // 粒子停止受力后回到模型目标位置的速度；越大，回弹越快。

  // === 桌面端拖动旋转 ===
  orbitControls: {
    enabled: true, // 是否开启鼠标拖动旋转；移动端会自动关闭，避免与上滑散场冲突。
    dampingFactor: 0.08, // 拖动停止后的惯性阻尼；越小滑行越明显，越大停止越快。
    rotateSpeed: 0.55 // 鼠标拖动旋转速度。
  },

  // === 散场动画 ===
  exitDuration: 1.8, // 散场动画持续时间，单位秒；结束后通知宿主页切换主内容。
  coreExitSpeed: 6.5, // 模型核心粒子的基础散场速度。
  atmosphereExitSpeed: 10, // 外围氛围粒子的散场速度，通常高于核心粒子以快速清空背景。

  // === 模型加载与复杂度保护 ===
  sourceTriangleLimit: 250000, // 最多读取的模型源三角形数量；限制超大模型的初始化内存和计算量。
  dracoDecoderPath: './draco/', // Draco 压缩模型解码器目录，部署时必须保留目录内文件。
  ktx2TranscoderPath: './basis/', // KTX2/Basis 纹理转码器目录，使用压缩纹理模型时必须正确部署。

  // === 散场触发方式 ===
  triggers: {
    wheel: true, // 是否允许鼠标滚轮向下触发散场。
    touch: true // 是否允许移动端手指向上滑动触发散场。
  },

  // === 桌面端渲染配置 ===
  desktop: {
    particleCount: 3200, // 桌面端粒子总数；越高越细腻，但 CPU/GPU 开销越大。
    modelSize: 14.5, // 模型归一化后的最长边尺寸，控制模型在画面中的视觉占比。
    maxDpr: 1.75 // 桌面端最大设备像素比；提高可增强清晰度，同时增加 GPU 像素开销。
  },

  // === 移动端渲染配置 ===
  mobile: {
    particleCount: 1800, // 移动端粒子总数，默认低于桌面端以保证帧率和降低发热。
    modelSize: 7.5, // 移动端模型归一化尺寸，用于适配窄屏画面占比。
    maxDpr: 1.35 // 移动端最大设备像素比，限制高分屏渲染压力。
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function getParticleConfig() {
  const external = window.PARTICLE_INTRO_CONFIG || {};
  const config = {
    ...DEFAULT_CONFIG,
    ...external,
    triggers: { ...DEFAULT_CONFIG.triggers, ...external.triggers },
    orbitControls: { ...DEFAULT_CONFIG.orbitControls, ...external.orbitControls },
    desktop: { ...DEFAULT_CONFIG.desktop, ...external.desktop },
    mobile: { ...DEFAULT_CONFIG.mobile, ...external.mobile }
  };

  // 限制高风险参数，避免 CMS 误配置造成空画面或浏览器卡死。
  config.edgeRatio = clamp(Number(config.edgeRatio) || 0, 0, 1);
  config.edgeClusterRatio = clamp(Number(config.edgeClusterRatio) || 0, 0, 1);
  config.edgeClusterCount = clamp(Math.round(config.edgeClusterCount), 1, 256);
  config.edgeClusterSpread = clamp(Number(config.edgeClusterSpread) || 0.14, 0.01, 0.5);
  config.edgeJitterMax = clamp(Number(config.edgeJitterMax) || 0, 0, 1);
  config.atmosphereRatio = clamp(Number(config.atmosphereRatio) || 0, 0, 0.5);
  config.highlightRatio = clamp(Number(config.highlightRatio) || 0, 0, 0.15);
  config.orbitControls.dampingFactor = clamp(Number(config.orbitControls.dampingFactor) || 0.08, 0.01, 0.3);
  config.orbitControls.rotateSpeed = clamp(Number(config.orbitControls.rotateSpeed) || 0.55, 0.05, 2);
  config.introDuration = Math.max(0.1, Number(config.introDuration) || 2);
  config.exitDuration = Math.max(0.2, Number(config.exitDuration) || 1.8);
  config.sourceTriangleLimit = Math.max(1000, Number(config.sourceTriangleLimit) || 250000);
  config.desktop.particleCount = clamp(Math.round(config.desktop.particleCount), 100, 50000);
  config.mobile.particleCount = clamp(Math.round(config.mobile.particleCount), 100, 20000);
  config.desktop.maxDpr = clamp(Number(config.desktop.maxDpr) || 1, 1, 2);
  config.mobile.maxDpr = clamp(Number(config.mobile.maxDpr) || 1, 1, 2);

  return config;
}
