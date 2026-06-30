# Scroll Curve Highlight

参考 [MokN](https://www.mokn.io/) 第二屏的滚动叙事方式，做了一个“曲线高光 + 发光节点 + 内容引导呈现”的 GSAP 静态 Demo。

## 效果目标

适合安全、数据链路、产品流程、时间线叙事类页面：用户滚动时，暗色曲线被红色高光逐步点亮，发光节点沿路径移动，并驱动右侧内容块和底部步骤卡片依次出现。

## 技术拆解

- 布局：`sticky` 舞台固定在视口内，外层 `section` 提供 430vh 的滚动距离。
- 滚动控制：使用 GSAP `ScrollTrigger` 获取 `scrub` 后的滚动进度，统一驱动路径、圆点、光晕和内容状态。
- 曲线：SVG `path` 画暗线，JS 根据路径采样点生成已点亮的红色路径，避免圆点和高光线错位。
- 高光点：圆点沿曲线路径移动，同时驱动一个大范围红色光晕；光晕经过卡片时叠加出局部高光。
- 内容：步骤卡片和主信息面板通过阈值激活，和曲线进度同步。
- 视觉：黑色背景、细网格噪点、红色边框和白色发光点模拟参考站的安全产品氛围。

## 文件结构

```text
scroll-curve-highlight/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── README.md
```

## CMS/SaaS 接入建议

这是普通 HTML/GSAP 静态 Demo，主体内容应直接放在 `index.html` 中，不需要把标题、描述、步骤列表整理成 JS 对象再动态注入。接入 CMS/SaaS 时，优先替换 HTML 中的主信息面板和 `.story-step` 内容；JS 只保留进度阈值、动画状态和路径计算。

- `title`：主标题或每一步标题。
- `description`：每一步说明文案。
- `threshold`：触发进度，范围 `0-1`。
- `accentColor`：高光色，默认红色。
- `pathD`：如果平台允许配置 SVG 路径，可以给不同页面换曲线路径。

如果平台只支持粘贴 HTML/CSS/JS，本 Demo 不依赖构建工具、不使用模块语法。GSAP 和 ScrollTrigger 默认引用工作区根目录公共插件：

```html
<script src="../../../js/gsap.min.js"></script>
<script src="../../../js/ScrollTrigger.min.js"></script>
```

交付到 SaaS/CMS 时，可以按平台规则替换成平台资源地址、CDN 地址或上传后的静态资源地址。

## 复用方式

后续可以把 SVG 路径、触发阈值、主题色抽成效果配置；标题、说明、步骤卡片等内容仍建议保留在 HTML 中。只有迁移到 React/Vue/Vite 等工程化版本时，再把步骤内容整理成数组或组件 props，并把 `ScrollTrigger.create()` 放进组件生命周期，在卸载时调用 `ScrollTrigger.kill()` 或 `gsap.context().revert()`。

## 注意事项

- 移动端已做重排，但复杂路径在窄屏会放大平移，正式项目建议单独设计移动端路径。
- 大量叠加发光和纹理会增加绘制成本，低端设备可以关闭背景网格或降低 `filter` 强度。
- 如果内容长度不固定，需要检查右侧信息面板和底部步骤卡片的高度，避免遮挡。

## 验证方式

直接打开 `index.html`，向下滚动查看曲线点亮、发光点移动、内容切换和步骤卡片激活。
