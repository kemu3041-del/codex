# AGENTS.md

## 目录定位

`effect_codex/` 用于沉淀平时工作中的炫酷交互、视觉动效、Three.js/GSAP Demo 和可复用效果模块。

## 工作重点

- 每个效果都要先拆解思路，再实现。
- 效果不能只追求视觉，要考虑复用、性能、移动端和 SaaS/CMS 落地。
- 可以使用 ES6+、React、Three.js、GSAP、Vite 等现代前端工具。
- 如果效果最终要复制进 SaaS 平台，需要额外提供平台可运行版本或打包方式。

## 推荐项目结构

普通 HTML Demo：

```text
effect_codex/
└── scroll-gallery/
    ├── index.html
    ├── css/
    ├── js/
    ├── assets/
    └── README.md
```

React/工程化 Demo：

```text
effect_codex/
└── three-product-viewer/
    ├── package.json
    ├── src/
    ├── public/
    └── README.md
```

## 命名建议

- 项目目录使用小写英文和连字符，例如 `scroll-gallery`、`mouse-distortion`、`three-product-viewer`。
- Three.js 相关文件按职责拆分，例如 `scene.ts`、`camera.ts`、`materials.ts`、`loaders.ts`。
- GSAP 相关文件按职责拆分，例如 `timeline.ts`、`scroll-trigger.ts`。
- 数据适配使用 `cms-adapter.ts` 或 `cms-adapter.js`。

## 每个效果必须沉淀

1. 效果目标：这个效果适合什么页面或业务场景。
2. 参考拆解：视觉层级、动效节奏、交互触发、核心技术点。
3. 技术路线：为什么用 CSS、GSAP、Three.js、Canvas 或 React。
4. 实现步骤：按可落地顺序记录关键步骤。
5. 数据接入：如果放进 SaaS/CMS，需要哪些字段和配置。
6. 复用方式：如何变成组件、配置模块或模板。
7. 性能注意：帧率、资源大小、销毁逻辑、移动端降级。

## 交付说明必须包含

- 实现思路。
- 技术拆解。
- 文件结构或关键文件说明。
- SaaS/CMS 落地建议。
- 验证方式和已知限制。
