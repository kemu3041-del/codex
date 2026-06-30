# Natural Wave Card

一个静态 HTML/CSS/JS 图片文字卡片效果。底部使用 Canvas 绘制多层非规则波浪，通过随机目标点和缓慢插值模拟自然水面运动。

## 文件说明

- `index.html`：卡片内容结构，图片、标题、描述、按钮都直接写在 HTML 中，方便 SaaS/CMS 替换字段。
- `css/style.css`：页面背景、卡片视觉、响应式和按钮状态。
- `js/main.js`：Canvas 波浪动画逻辑。
- `img/coastline-card.svg`：本地演示图片，可替换成真实业务图片。

## SaaS/CMS 接入

可替换字段包括：

- 图片：`.media-wrap img` 的 `src` 与 `alt`
- 标签：`.eyebrow`
- 标题：`h1`
- 描述：`.summary`
- 链接：`.action-link` 的 `href` 与文本

动画参数集中在 `js/main.js` 的 `createLayer` 配置里，可调整颜色、层数、点位数量、波动幅度和横向漂移速度。

## 验证

直接用浏览器打开 `index.html` 即可查看效果。
