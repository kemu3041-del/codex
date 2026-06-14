# Scroll Curve Highlight

参考 [MokN](https://www.mokn.io/) 第二屏的滚动叙事方式，做了一个“曲线高光 + 发光节点 + 内容引导呈现”的静态 Demo。

## 效果目标

适合安全、数据链路、产品流程、时间线叙事类页面：用户滚动时，暗色曲线被红色高光逐步点亮，发光节点沿路径移动，并驱动右侧内容块和底部步骤卡片依次出现。

## 技术拆解

- 布局：`sticky` 舞台固定在视口内，外层 `section` 提供 430vh 的滚动距离。
- 曲线：SVG `path` 画暗线，第二条同路径用 `stroke-dashoffset` 做高光绘制。
- 高光点：JS 使用 `getPointAtLength()` 按滚动进度计算发光点坐标。
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

可把 `js/main.js` 里的 `stageCopy` 和 HTML 中的 `.story-step` 改成 CMS 字段：

- `title`：主标题或每一步标题。
- `description`：每一步说明文案。
- `threshold`：触发进度，范围 `0-1`。
- `accentColor`：高光色，默认红色。
- `pathD`：如果平台允许配置 SVG 路径，可以给不同页面换曲线路径。

如果平台只支持粘贴 HTML/CSS/JS，本 Demo 不依赖构建工具、不使用模块语法，可以直接拆分粘贴。

## 复用方式

后续可以把 SVG 路径、步骤数据、主题色抽成配置对象；如果迁移到 React/Vue，只需要把 `updateScene()` 放进组件生命周期，并在卸载时移除 `scroll/resize` 监听。

## 注意事项

- 移动端已做重排，但复杂路径在窄屏会放大平移，正式项目建议单独设计移动端路径。
- 大量叠加发光和纹理会增加绘制成本，低端设备可以关闭背景网格或降低 `filter` 强度。
- 如果内容长度不固定，需要检查右侧信息面板和底部步骤卡片的高度，避免遮挡。

## 验证方式

直接打开 `index.html`，向下滚动查看曲线点亮、发光点移动、内容切换和步骤卡片激活。
