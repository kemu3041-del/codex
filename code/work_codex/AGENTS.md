# AGENTS.md

## 目录定位

`work_codex/` 是前端工作专项目录，用于统一管理页面还原、SaaS/CMS 可复制代码、炫酷交互、视觉动效、Three.js/GSAP Demo 和可复用前端模块。

原来的两个方向现在归到本目录下：

- `html_codex/`：页面、组件、图片/截图/设计稿还原、HTML/CSS/JS 交付。
- `effect_codex/`：交互实验、动效 Demo、Three.js/GSAP 效果、可复用动效模块。

## 工作重点

- 如果需求是业务页面、CMS 模板、设计稿还原，优先放到 `html_codex/`。
- 如果需求是交互效果、滚动动画、Three.js、GSAP、Canvas 或视觉实验，优先放到 `effect_codex/`。
- 两类项目都要关注 SaaS/CMS 落地方式、移动端、性能和复用方式。
- 静态 HTML/JS 项目主体内容直接写在 HTML 中；JS 主要负责动画、交互和状态。
- 工程化项目才使用 React/Vite/Webpack，并说明打包或平台接入方式。

## 代码注释要求

- 写入或修改代码时，要为关键逻辑补充必要注释说明，尤其是 Three.js/GSAP 动画、空间数学、CMS 数据适配、性能优化和兼容性处理。
- 注释重点解释“为什么这样做”和“关键参数含义”，不要写成逐行翻译代码的流水账。
- 新增公共函数、复杂计算、非直观布局或后续需要调参的位置，必须保留简短注释，方便以后复用和二次修改。
- 简单 JSX 结构、普通样式声明和自解释变量不强制注释，避免噪音。

## 推荐目录结构

```text
work_codex/
├── html_codex/
│   └── project-name/
│       ├── index.html
│       ├── css/
│       ├── js/
│       ├── img/
│       └── README.md
└── effect_codex/
    └── effect-name/
        ├── index.html
        ├── css/
        ├── js/
        ├── assets/
        └── README.md
```

## 资源引用

根目录 `js/` 仍然作为公共前端插件目录。

从 `work_codex/html_codex/project/index.html` 或 `work_codex/effect_codex/project/index.html` 引用根目录插件时，路径通常是：

```html
<script src="../../../js/gsap.min.js"></script>
<script src="../../../js/ScrollTrigger.min.js"></script>
```

## 调试与验证优先级

- 调代码时，优先跑 `npm run build` 和静态检查，确认编译、类型、语法和基础配置问题。
- 不要一开始就反复启动 Chrome 截图，尤其是 Three.js/WebGL 页面；截图验证放在构建通过、关键逻辑稳定之后。
- 需要浏览器验证时，先复用已有本地服务和已确认端口，避免重复重启服务造成 token 和时间消耗。

## 交付说明必须包含

1. 实现思路。
2. 技术拆解。
3. 文件结构或关键文件说明。
4. SaaS/CMS 落地建议。
5. 验证方式和已知限制。
