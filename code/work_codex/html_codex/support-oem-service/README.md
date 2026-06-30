# Support OEM Service

根据 1920px 设计稿还原的 OEM Process Flow 静态页面，适合复制到 SaaS/CMS 平台中作为普通 HTML/CSS/JS 模块使用。

## 文件结构

```text
support-oem-service/
├── index.html
├── css/
│   └── style.css
└── js/
    └── main.js
```

## 技术说明

- 主体内容写在 `index.html`，标题、步骤名、弹窗文案都可以直接替换成 CMS 字段。
- 流程弧线使用内联 SVG，保证缩放后仍然清晰。
- 入场动画使用本地公共库 `../../../js/gsap.min.js`，避免 CDN 失败影响预览。
- 04 的弹窗默认隐藏，支持鼠标移入、键盘聚焦和点击切换。

## CMS 套数据建议

- 步骤标题：替换 `.step-label` 文本。
- 步骤编号：替换 `.step-badge` 文本和 `aria-label`。
- 04 弹窗：替换 `#mass-production-card h2` 和图标区域。
- 主题色：优先改 `css/style.css` 顶部的 CSS 变量和 SVG gradient。

## 验证方式

直接打开 `index.html`，或在当前项目目录启动本地静态服务后访问页面。重点检查：

- 01 到 06 是否按弧线、箭头、编号、三点、标题递进入场。
- 鼠标移入 04 是否出现下方弹窗。
- 小屏下页面主体是否可横向滑动查看完整流程。
