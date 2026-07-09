# Jesko Jets Scroll Zoom Demo

静态 HTML/CSS/JS 复刻 Jesko Jets 首屏舷窗视觉，并实现滚动时前景舷窗放大的空间推进效果。

## 文件结构

```text
jesko-jets-scroll-zoom/
├── index.html
├── css/style.css
├── js/main.js
└── README.md
```

## 资源与依赖

- 页面图片使用 Jesko Jets 官网 Webflow CDN 的 WebP 资源。
- 动画依赖工作区公共插件：
  - `../../../js/lenis.min.js`
  - `../../../js/gsap.min.js`
  - `../../../js/ScrollTrigger.min.js`
- 当前效果没有强依赖 SplitText、Lottie、CustomEase；如需做官网那种逐字入场，再补对应库。

## SaaS/CMS 接入

- 首屏标题、描述、电话、邮箱、按钮和下方内容都在 `index.html` 中，可直接替换为平台字段。
- 舷窗图片地址在 `index.html` 的 `.hero-stage` 内，如平台要求本地资源，下载后替换 `src` 即可。
- 蓝天背景在 `.sky-bg` 内，包含天空底图和两张云层图，云层通过 CSS `@keyframes clouds-marquee` 循环移动。
- 滚动强度在 `js/main.js` 里调整 `foregroundScale`；移动端和桌面端分开控制。

## 验证

直接打开 `index.html`，或在本目录启动静态服务后访问页面。核心验证点：

1. 首屏舷窗、左右大标题、底部说明和按钮层级正常。
2. 向下滚动时，舷窗前景层放大并压过文字。
3. 后续内容随滚动出现，移动端不产生横向滚动。
