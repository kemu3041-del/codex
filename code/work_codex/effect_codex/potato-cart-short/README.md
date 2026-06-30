# 土豆 15 秒卡通短片

## 实现思路

这是一个适合抖音竖屏预览的 9:16 卡通动画 Demo。故事拆成 4 个镜头：拉车出场、泥路颠簸掉土豆、土豆醒来、土豆跑进树林。

## 技术拆解

- 画面比例：`9:16`
- 时长：15 秒时间线
- 技术：普通 HTML/CSS/JS + GSAP
- 素材方式：CSS/SVG 风格的 DOM 图形，不依赖图片和模型
- 字幕：直接写在 `index.html`，方便替换

## 文件结构

```text
potato-cart-short/
├── DESIGN.md
├── README.md
├── index.html
├── css/
│   └── style.css
└── js/
    └── main.js
```

## CMS/SaaS 接入建议

- 字幕字段：替换 `#caption1` 到 `#caption4` 的文本。
- 主题字段：可在 `css/style.css` 中调整天空、泥路、土豆、树林等颜色。
- 动画配置：如需调整节奏，改 `js/main.js` 中 GSAP 时间点。
- 平台只支持粘贴 HTML/CSS/JS 时，保留 GSAP 引入，并改成平台资源路径或 CDN。

## 验证方式

在工作区根目录启动本地服务：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://localhost:4173/work_codex/effect_codex/potato-cart-short/
```

当前环境缺少 `ffmpeg`，并且 HyperFrames CLI 需要 Node.js 22+，所以本轮交付的是可播放动画源文件；导出 MP4 时需要先补齐 Node 22+ 和 ffmpeg。
