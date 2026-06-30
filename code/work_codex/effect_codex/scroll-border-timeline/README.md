# Scroll Border Timeline

参考 PIOCOMM 历史页的交替年份布局，实现一个滚动时横线、拐点、竖线依次高亮的 GSAP 时间轴 Demo。

## 实现思路

1. **效果目标**：用一条交替左右的折线路径连接年份，让滚动方向与时间阅读顺序一致。
2. **布局拆解**：每个年份是独立 `article`，内容左右交替；路径由横线、加号拐点和竖线三部分组成。
3. **技术选型**：静态内容使用 HTML，布局使用 CSS；GSAP + ScrollTrigger 负责滚动进度、线条生长和内容显现。
4. **动画顺序**：年份进入视口后先显现内容，横线沿阅读方向展开，拐点闪亮，最后竖线向下延伸。
5. **移动端**：内容改为单列，保留两侧交替竖线，减少横向留白。
6. **无障碍降级**：系统开启“减少动态效果”或 GSAP 加载失败时，完整路径直接可见。

## 文件结构

```text
scroll-border-timeline/
├── index.html
├── css/style.css
├── js/main.js
└── README.md
```

## SaaS/CMS 接入

这是无需构建的普通 HTML/CSS/JS 版本。接入平台时：

- 年份、标签和事件列表：直接替换 `index.html` 中每个 `.history-entry` 的内容。
- 年份数量：复制或删除整个 `.history-entry`；左右方向类名交替使用 `history-entry--left` / `history-entry--right`。
- 主题色：修改 `css/style.css` 顶部的 `--accent`、`--accent-bright`、`--ink` 等变量。
- 动画触发：在 `js/main.js` 中调整 `start`、`end` 和 `scrub`。
- GSAP 资源：当前引用工作区公共文件 `../../../js/gsap.min.js` 和 `../../../js/ScrollTrigger.min.js`；复制到 SaaS 后应替换成平台资源地址或 CDN 地址。

## 复用与注意事项

- 可以把单个 `.history-entry` 封装为 CMS 循环模板，但动画逻辑无需绑定具体字段。
- 竖线长度随条目高度自动延伸；如果单条内容很多，需要同步增加条目最小高度。
- 动画只修改 `transform`、`opacity` 和颜色，避免滚动中频繁触发布局计算。
- 正式上线前建议根据品牌字体重新校准年份字号和行高。

## 验证方式

直接打开 `index.html`，向下滚动检查：横线点亮 → 加号拐点高亮 → 竖线点亮；反向滚动时动画应按相反顺序还原。
