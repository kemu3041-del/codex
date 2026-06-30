# AGENTS.md

## 目录定位

`work_codex/html_codex/` 用于根据图片、截图、设计稿生成 HTML/CSS/JS 页面。这里的项目通常要复制到 SaaS/CMS 平台中，再按平台规则套数据展示。

## 工作重点

- 优先输出平台可直接使用的 HTML/CSS/JS。
- 页面还原要先保证结构、视觉层级、间距、字体、图片比例和响应式。
- 动效可以使用 GSAP、Swiper、Lenis 等库，但要说明资源引入方式。
- 不默认使用未编译的 React JSX、TypeScript、`import/export` 或依赖 `node_modules` 的源码。
- 如果先用现代工程化开发，需要额外说明如何打包成 SaaS 可粘贴版本。

## 截图还原判断规则

- 先根据截图中能明确观察到的属性，用最少的 CSS 完成基础还原；不要因为用户提到“高光”或“叠加”，就默认增加渐变边框、强发光或 `mix-blend-mode`。
- 对轻薄玻璃弹窗，默认起点是：半透明单色背景、低强度 `backdrop-filter`、1px 细边框和多层 `box-shadow`。
- 先判断边框是均匀还是局部变亮。均匀时使用普通 `border`；只有右上角、底边等确实存在局部高光时，才增加一个伪元素定向补光。
- 先匹配透明度、模糊强度、边框明度、圆角和阴影这些主要特征，再增加装饰性细节。
- `backdrop-filter` 依赖元素背后的纹理。纯色背景上几乎看不出模糊，不能用纯色预览反推原图中的模糊参数。
- 高级效果必须有截图证据再增加。如果基础方案已经还原主要视觉，应停止叠加技术，避免把“准确还原”做成“同类炫酷效果”。

## 推荐项目结构

```text
work_codex/html_codex/
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

- 标准 HTML/CSS/JS 页面中，标题、描述、图片、视频、按钮、列表、链接等主体内容直接写在 `index.html` 中，方便复制到 SaaS/CMS 后按平台字段替换。
- 不默认把页面内容整理成 `cards`、`sections` 等 JS 对象再动态注入 DOM；普通页面的 JS 主要负责交互、动画和状态切换。
- 只有使用 React、Vite、Webpack 等工程化构建时，才把内容数据整理成对象或数组，并在入口文件、`index.html` 或数据适配层中说明如何替换 SaaS/CMS 字段。
- 如果需要配置动画或交互参数，可以使用少量 JS 配置、`data-*` 属性或 CSS 变量；不要把标题、描述、列表等页面主体内容藏进 JS。
- 不把 SaaS/CMS 平台字段名散落在动画逻辑里；如果当前只是静态还原，也要说明 HTML 中哪些位置适合换成平台字段。

## 交付说明必须包含

1. 页面还原思路。
2. 文件结构说明。
3. SaaS/CMS 套数据建议。
4. 使用到的第三方库和引入方式。
5. 验证方式，例如直接打开 `index.html` 或通过本地服务访问。
