# Particle Model Story

## 实现思路

这是一个 HTML 驱动的多模型粒子背景组件。`index.html` 保存业务图文、模型配置和 GSAP 时间轴参数；React 只挂载固定 Three.js Canvas，并暴露模型插值 API。页面使用浏览器常规滚动，没有整屏切换、粘性定位或滚动吸附。

## 技术拆解

- 所有 GLB 预加载后生成等长粒子目标数组。
- 单套 Points 在两个模型目标间实时插值，不会同时绘制多套粒子。
- `story-timeline.js` 根据相邻 HTML 章节中心点计算滚动进度。
- 进度直接写入 Shader uniform，滚动多少就变化多少；反向滚动完全可逆。
- GSAP ScrollTrigger 同时读取 HTML 的文案节点和 `data-*` 参数，控制图文淡入、停留和淡出。
- 每个模型可以配置不同颜色、可见粒子数量和粒径倍率。

## 文件职责

```text
particle-model-story/
├── index.html                 # 文案结构、模型变量、图文时间轴变量
├── public/                    # GLB、图片、GSAP、Draco、KTX2 资源
└── src/
    ├── App.jsx                # 纯粒子背景组件和 setMorph API
    ├── config.js              # 安全默认值和配置合并
    ├── story-timeline.js      # HTML/滚动/粒子联动
    ├── model-particles.js     # 任意模型粒子采样
    ├── main.jsx               # Canvas 挂载入口
    └── styles.css
```

## HTML 章节

业务内容直接写在 `index.html`：

```html
<section
  class="particle-story-section"
  data-model-index="1"
  data-copy-in="0.18"
  data-copy-out="0.24"
>
  <div data-story-animate>需要进入时间轴的图片或文案</div>
</section>
```

- `data-model-index`：绑定 `PARTICLE_STORY_CONFIG.models` 中的模型。
- `data-copy-in`：淡入阶段占当前章节时间轴的比例。
- `data-copy-out`：淡出阶段占比。
- `data-story-animate`：加入 GSAP 图文时间轴的节点。

## 模型变量

模型配置也暴露在 `index.html`：

```js
{
  modelUrl: './product.glb',
  particleColor: '#c9ef18',
  highlightColor: '#ffffff',
  particleCount: { desktop: 3200, mobile: 1600 },
  particleSizeScale: 1
}
```

不同模型的粒子数量允许不同。GPU 使用配置中的最大数量作为 Buffer 长度，较少粒子的模型会把多余粒子透明度降为 0，因此仍能连续变形。

## 图文时间轴变量

`window.PARTICLE_STORY_TIMELINE` 位于 `index.html`，可配置章节选择器、动画节点选择器、ScrollTrigger 起止位置、scrub 平滑度、进入和退出位移。

运行时会在 `<html>` 暴露以下调试状态：

- `data-particle-from`
- `data-particle-to`
- `data-particle-progress`

## SaaS/CMS 接入

复制 HTML 章节并替换内容字段即可扩展业务内容；模型数组可由 CMS 模板或接口在 React 模块加载前写入 `window.PARTICLE_STORY_CONFIG`。只支持源码粘贴的平台需要先构建，并上传 GLB、图片、GSAP、Draco 与 Basis 资源。

## 验证方式

```bash
npm install
npm run build
npm run dev
```

重点验证普通连续滚动、任意中间滚动位置的模型形态、反向滚动、不同模型颜色和粒子数量、HTML 文案时间轴、移动端以及控制台错误。
