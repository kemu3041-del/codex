# PRODUX local mirror

## 技术分析

- 原站地址：`https://www.produx.design/`
- 部署平台：Vercel。响应头包含 `server: Vercel`、`x-vercel-cache`、`x-nextjs-prerender`。
- 前端框架：Next.js App Router。HTML 内有 React Flight 数据 `self.__next_f`，响应头有 `vary: rsc, next-router-state-tree...`。
- 构建方式：Next/Turbopack。静态资源路径为 `/_next/static/chunks/...`，并出现 `turbopack-*.js` chunk。
- 样式：Tailwind 风格原子类编译产物，主 CSS 为 `/_next/static/chunks/0b0pxfpuhgk7~.css`。
- 动效：客户端 chunk 中可见 GSAP、ScrollTrigger、Three.js/WebGL shader、Lenis/路由转场等逻辑。
- 图片：使用 Next Image 运行时优化接口 `/_next/image?url=...`，本地 server 已模拟这个接口读取原图。

## 文件说明

- `index.html`：原站首页 SSR 镜像，保留原始 Next/React Flight 数据。
- `clone.html`：可稳定本地运行的首页复刻版，使用已下载素材和纯 HTML/CSS/JS。
- `server.mjs`：本地静态服务器，补了 `/_next/image`、`cookie.png` 和 `_rsc` 降级处理。
- `tools/mirror-site.mjs`：下载脚本，用来重新抓取首页、主要路由和静态资源。
- `_next/`、`images/`、`videos/`、`fonts/`、`SEO/`：下载下来的静态资源。
- `work/`、`studio/`、`journal/`、`contact/` 等：已抓取的主要路由 HTML。

## 运行方式

```bash
cd /Users/wangbin/Desktop/工作/Codex/code/work_codex/html_codex/produx-design-mirror
node server.mjs
```

访问：

- 稳定本地复刻版：`http://127.0.0.1:4177/clone.html`
- 原始首页镜像：`http://127.0.0.1:4177/`

## 已知限制

- 原站不是纯静态站，Next 客户端依赖 RSC 和运行时路由状态；直接运行原始 `index.html` 可能进入 Next 错误边界。
- `clone.html` 是为了本地学习和视觉拆解做的稳定展示版，保留首页结构、素材、字体和基础动效，但不是原站完整交互源码。
- 作品详情页图片资源已下载较多，但项目详情的 Next 路由/RSC 没有完整重建。
