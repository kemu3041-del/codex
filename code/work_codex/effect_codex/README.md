# effect_codex

这个目录用于存放平时工作的炫酷交互、动效 Demo、Three.js/GSAP 效果沉淀。

## 适合放这里的内容

- GSAP 时间线动画
- ScrollTrigger 滚动交互
- Three.js 产品展示或视觉场景
- 鼠标跟随、拖拽、转场、视差、文字动效
- 参考 Awwwards、CSS Design Awards 后拆解练习的效果

## 推荐结构

```text
work_codex/effect_codex/
└── scroll-gallery/
    ├── index.html 或 package.json
    ├── src/ 或 js/
    ├── public/ 或 assets/
    └── README.md
```

## 注意

- 每个效果都要沉淀实现思路，不只保留代码。
- 如果最终要复制到 SaaS 平台，需要说明是否能直接复制、通过 CDN 引库，或需要先打包。
- 不要为了 SaaS/CMS 交付过度保守：GSAP、ScrollTrigger、Three.js、Swiper、Lenis 和现代 CSS 可以正常使用，只要最终代码不依赖 `import/export`、Vite、Webpack、TypeScript 编译或本地 `node_modules`。
- 复杂滚动、路径高光、时间线、分阶段触发优先考虑 `GSAP + ScrollTrigger`，比手写滚动进度更易维护和调节。
- 新建静态效果时优先引用根目录公共插件，例如 `../../../js/gsap.min.js`、`../../../js/ScrollTrigger.min.js`、`../../../js/lenis.min.js`，保证 Codex 本地预览不依赖 CDN。
- 新建普通 HTML/JS/GSAP 静态效果时，标题、描述、图片、卡片、列表等主体内容直接写在 `index.html`，JS 只负责动画、交互、坐标计算和状态切换。
- 只有 React、Vite、Webpack 等需要构建的效果项目，才把内容做成对象或数组，例如 `cards`、`sections`、`items`，用于后续替换 SaaS/CMS 数据。
- 静态效果如需可配置能力，优先使用 HTML 结构、`data-*` 属性、CSS 变量或少量效果配置，不用 JS 动态注入主体内容。
- 动效要关注性能、移动端、资源释放和可配置参数。
