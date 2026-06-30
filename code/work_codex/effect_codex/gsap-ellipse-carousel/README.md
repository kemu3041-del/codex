# GSAP Ellipse Arc Carousel

GSAP 版本的上半椭圆卡片轮播。它做成了可复用插件 `EllipseArcCarousel`，支持类似 Swiper 的响应式断点配置、按钮切换、拖拽切换，并用三份轨道副本解决首尾循环展示 bug。

## 实现思路

1. HTML 中只写一份原始卡片，插件初始化时克隆成 3 份轨道。
2. 当前轨道位置使用连续数值 `trackIndex`，切换时只改变轨道位置。
3. 卡片根据 `virtualIndex - trackIndex` 得到相对槽位，再映射到上半椭圆角度。
4. 用椭圆公式算坐标：

```js
x = cx + rx * Math.cos(angle)
y = cy + ry * Math.sin(angle)
```

5. 图片卡片的旋转来自椭圆切线：

```js
dx = -rx * Math.sin(angle)
dy = ry * Math.cos(angle)
rotation = Math.atan2(dy, dx)
```

6. 最后一张切到第一张时，视觉上走到相邻副本；动画结束后瞬间归回中间副本，归位时关闭过渡，所以页面里看不到跳动。

## 配置示例

```js
new EllipseArcCarousel("[data-ellipse-carousel]", {
  startIndex: 2,
  visibleSideCount: 4,
  angleStart: 210,
  angleEnd: 330,
  drag: {
    enabled: true,
    threshold: 44,
    stepPixels: 180,
    maxSteps: 2,
  },
  breakpoints: {
    0: { visibleSideCount: 2, angleStart: 224, angleEnd: 316 },
    768: { visibleSideCount: 3, angleStart: 216, angleEnd: 324 },
    1200: { visibleSideCount: 4, angleStart: 210, angleEnd: 330 },
  },
});
```

## 文件结构

```text
gsap-ellipse-carousel/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── ellipse-arc-carousel.js
│   └── demo.js
└── README.md
```

## SaaS/CMS 接入

- 静态平台：复制 `index.html` 里的卡片结构、`style.css`、`ellipse-arc-carousel.js` 和初始化配置。
- CMS 字段：标题、缩略图、链接、分类、主题色可以写到 HTML 或 `data-*` 上。
- 如果换真实图片，把 `.arc-card__visual` 替换为 `<img>`，保留外层 `.arc-card`，坐标和旋转仍由插件控制。

## 验证

访问 `index.html`，可以点击左右按钮，也可以按住卡片区域横向拖拽。桌面默认中心卡 + 左右各 4 张；`768px` 以上左右各 3 张；移动端左右各 2 张。
