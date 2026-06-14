# AGENTS.md

## 目录定位

`html_codex/` 用于根据图片、截图、设计稿生成 HTML/CSS/JS 页面。这里的项目通常要复制到 SaaS/CMS 平台中，再按平台规则套数据展示。

## 工作重点

- 优先输出平台可直接使用的 HTML/CSS/JS。
- 页面还原要先保证结构、视觉层级、间距、字体、图片比例和响应式。
- 动效可以使用 GSAP、Swiper、Lenis 等库，但要说明资源引入方式。
- 不默认使用未编译的 React JSX、TypeScript、`import/export` 或依赖 `node_modules` 的源码。
- 如果先用现代工程化开发，需要额外说明如何打包成 SaaS 可粘贴版本。

## 推荐项目结构

```text
html_codex/
└── project-name/
    ├── index.html
    ├── css/
    │   └── style.css
    ├── js/
    │   └── main.js
    ├── img/
    └── README.md
```

## 命名建议

- 项目目录使用小写英文和连字符，例如 `product-landing-01`、`brand-homepage-02`。
- 图片还原类项目可以用业务名加编号，不建议使用中文长目录名。
- CSS 文件按职责命名，例如 `base.css`、`layout.css`、`animation.css`。
- JS 文件按职责命名，例如 `main.js`、`banner.js`、`cms-adapter.js`。

## 数据接入规则

- 页面中的标题、描述、图片、视频、按钮、列表、链接等内容，优先预留成可替换数据。
- 需要单独写 `cms-adapter.js` 或在 `main.js` 中保留清晰的数据适配区域。
- 不把 SaaS/CMS 平台字段名散落在动画逻辑里。
- 如果当前只是静态还原，也要说明后续哪些地方适合换成平台字段。

## 交付说明必须包含

1. 页面还原思路。
2. 文件结构说明。
3. SaaS/CMS 套数据建议。
4. 使用到的第三方库和引入方式。
5. 验证方式，例如直接打开 `index.html` 或通过本地服务访问。
