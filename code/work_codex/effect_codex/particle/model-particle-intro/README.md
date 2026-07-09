# Model Particle Intro

## 实现思路

把任意包含可渲染三角形 Mesh 的 GLB 自动转换为“聚拢、鼠标排斥、散场”的发光粒子首屏。处理流程不依赖某个 Logo 的原始尺寸、Mesh 数量或节点层级：读取当前蒙皮/形变后的顶点，应用世界变换，再自动居中和缩放。

## 技术拆解

- React Three Fiber 管理 Canvas、资源 Suspense 和渲染生命周期。
- GLTFLoader 支持普通 GLB、Draco、Meshopt 和 KTX2 资源。
- `MeshSurfaceSampler + EdgesGeometry` 形成表面、轮廓、氛围三层粒子。
- BufferGeometry + ShaderMaterial 绘制圆形加色光粒子。
- GPU Shader 持续执行轻微漂移和呼吸；CPU 仅在入场、交互、回弹和散场阶段遍历位置。
- 桌面端支持鼠标拖动旋转；关闭缩放和平移，避免与滚轮散场冲突。
- 粒子循环使用数字运算和复用对象，避免每帧创建 Vector3。
- WebGL2 不可用、系统启用减少动态效果或模型失败时显示静态标志。

## 文件结构

```text
model-particle-intro/
├── index.html                 # CMS 配置、宿主页回调、主内容
├── public/
│   ├── logo4.glb              # 示例模型，可直接替换
│   ├── draco/                 # Draco 解码器
│   ├── basis/                 # KTX2 转码器
│   └── particle-fallback.svg  # 静态降级图
├── src/
│   ├── App.jsx                # 加载、交互、动画和生命周期
│   ├── config.js              # 默认配置与 CMS 参数保护
│   ├── model-particles.js     # 模型无关的几何提取和粒子采样
│   ├── main.jsx               # React 入口和卸载 API
│   └── styles.css
└── package.json
```

## 更换模型

把 GLB 放进 `public/`，然后只改 `index.html`：

```js
window.PARTICLE_INTRO_CONFIG = {
  modelUrl: './your-model.glb',
  fallbackImageUrl: './your-fallback.svg',
  particleColor: '#bbd40f'
};
```

支持多 Mesh、嵌套缩放/旋转/位移、InstancedMesh、蒙皮和 morph target 的当前形态。模型必须至少包含一个三角形 Mesh；纯点云、纯线框、损坏文件会进入静态降级。动画模型默认采样初始姿态，不播放骨骼动画。

## SaaS/CMS 接入

可覆盖 `config.js` 中的模型 URL、粒子颜色、数量、边缘比例、氛围比例、入场/散场时长、排斥和移动端参数。工程化平台直接构建；只支持源码粘贴的平台需将 JS/CSS 打包，并把 GLB、Draco、Basis 和降级图上传到平台资源管理器后改成公开 URL。

宿主页通信 API：

- `window.startParticleExit()`：启动散场。
- `window.onModelLoadProgress(progress)`：当前 GLB 精确加载进度。
- `window.onParticleIntroReady()`：聚拢达到 85%。
- `window.onParticleIntroExit()`：散场完成。
- `window.unmountParticleIntro()`：卸载 React/Three.js。

## 性能与限制

- 桌面默认 3,200 粒子，移动端 1,800；通过聚簇、长尾粒径和大范围氛围分布保持层次，跨越 768px 时自动重建对应配置。
- 超大模型默认最多提取 250,000 个源三角形，避免初始化内存失控，可通过 `sourceTriangleLimit` 调整。
- 当前粒子位置仍由 CPU 更新，适合约 1 万以内粒子；数万粒子建议迁移到顶点 Shader/GPGPU。
- KTX2/Draco 解码目录需要随部署产物一起发布。

## 验证方式

```bash
npm install
npm run build
npm run dev
```

验证模型加载、多 Mesh 轮廓、鼠标排斥与回弹、ENTER/滚轮/触摸散场、窗口跨移动端断点、减少动态效果模式，以及散场后主内容展示和 Canvas 卸载。
