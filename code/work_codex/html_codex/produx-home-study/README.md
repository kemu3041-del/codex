# PRODUX homepage study

## 页面还原思路

这个版本只仿首页，不复刻原站 Next.js/Three.js 的复杂运行时。重点保留可学习的前端结构：

1. 大号品牌字标作为第一视觉信号。
2. 深色背景 + 灰白文字 + 酸绿色点缀，形成强对比。
3. 首屏左右分栏，左侧品牌主张，右侧真实品牌图。
4. 项目区使用两列错位网格，图片承担主要视觉说服力。
5. 滚动进度、入场 reveal、图片轻视差、项目 hover 跟随标签作为核心动效。
6. logo 墙、方法论、口号大段、客户评价补全首页节奏。

## 技术拆解

- `index.html`：主体内容直接写在 HTML，方便 SaaS/CMS 后续字段替换。
- `css/style.css`：按模块分段，包含设计变量、导航、hero、项目网格、logo 墙、响应式和动画状态。
- `js/main.js`：只处理交互，不负责注入页面主体内容。
- `img/`：从原站镜像中筛选出的首页素材。
- `fonts/`：本地字体文件，避免依赖远程资源。

## JS 关键逻辑

- `IntersectionObserver`：控制 `.reveal` 元素进入视口后显示。
- `updateScrollState()`：更新顶部进度条和导航缩小状态。
- `updateParallax()`：根据图片位置计算小幅度视差，避免图片离开容器。
- `setupCursorLabel()`：桌面端项目卡片 hover 时显示跟随标签。

## SaaS/CMS 套数据建议

可替换字段：

- Hero：`eyebrow`、`title`、`intro`、`hero image`。
- Analysis：三条拆解卡片标题与描述。
- Projects：项目图、项目名、标签、描述、链接。
- Logos：客户 logo 图片与 alt 文案。
- Method：方法论编号、标题、描述。
- Reviews：头像、姓名、评价内容。

如果平台只支持粘贴 HTML/CSS/JS，可以直接复制三个文件内容；如果支持静态资源管理，把 `img/` 和 `fonts/` 上传后替换路径即可。

## 验证方式

直接打开 `index.html` 可以运行。也可以启动本地服务：

```bash
cd /Users/wangbin/Desktop/工作/Codex/code/work_codex/html_codex/produx-home-study
python3 -m http.server 4178
```

访问 `http://127.0.0.1:4178/`。

## 已知限制

- 这是学习版仿页，不包含原站的 WebGL shader 图片扰动和 Next.js 页面转场。
- 为了代码可读，动效使用原生 JS + CSS transition 实现，没有引入 GSAP。
