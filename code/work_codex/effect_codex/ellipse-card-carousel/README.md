# Radial Image Card Carousel

参考 Osmo 风格的扇形图片卡片布局：卡片沿上半椭圆分布，卡片自身会跟随弧线切线方向旋转，并支持左右切换。

## 实现思路

1. 当前卡片固定在弧线最高点，也就是 `270deg`。
2. 可见卡片被映射到 `210deg ~ 330deg`，只显示椭圆上半部分。
3. 每张卡片先算循环相对距离 `offset`，再把 `offset` 转成角度。
4. 首尾循环使用 3 份卡片副本做连续轨道，用户看到的是滚动接续，不会看到最后一张从左侧拉到右侧。
5. 通过椭圆公式算位置：

```js
x = cx + rx * Math.cos(angle)
y = cy + ry * Math.sin(angle)
```

6. 图片卡片的旋转不是固定写死，而是来自椭圆切线：

```js
dx = -rx * Math.sin(angle)
dy = ry * Math.cos(angle)
rotation = Math.atan2(dy, dx)
```

## 技术拆解

- `index.html`：保留全屏舞台、卡片容器、左右按钮、底部学习提示，以及静态卡片内容。
- `css/style.css`：负责黑底、卡片视觉、裁切窗口、按钮和响应式。
- `js/main.js`：负责读取已有卡片 DOM、三份副本轨道、椭圆坐标、切线旋转、循环轮播。

## CMS/SaaS 接入

这是普通 HTML/JS 静态效果，卡片标题、图片、标签和链接应直接写在 `index.html` 的卡片结构里，不需要在 `js/main.js` 顶部维护 `cards` 数组再动态注入。接入 CMS/SaaS 时，优先把 HTML 中每张卡片替换为平台循环字段。建议字段：

- `title`：卡片标题
- `image`：真实缩略图地址
- `tag`：分类或资源类型
- `href`：点击跳转
- `theme`：用于控制卡片强调色或背景

如果平台有真实图片，把 `.card-visual` 改成 `<img>`，保留 `.orbit-card` 上的旋转和坐标逻辑即可。

只有迁移成 React/Vite 等工程化版本时，才建议把这些卡片整理成 `cards` 数组，通过组件渲染。

## 验证

访问 `index.html`，点击左右按钮或键盘左右方向键。桌面显示中心卡 + 左右各 4 张，小屏显示中心卡 + 左右各 2 张。
