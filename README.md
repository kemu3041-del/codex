# Codex 项目工作区

这个文件夹用于管理前端页面、图片转 HTML、炫酷交互动效和 SaaS/CMS 交付相关代码。

关联 GitHub 仓库：

https://github.com/kemu3041-del/codex.git

## 目录分类

```text
Codex/
├── AGENTS.md        # Codex 全局协作规则
├── README.md        # 工作区说明
├── html_codex/      # 根据图片、截图、设计稿生成 HTML
└── effect_codex/    # 平时炫酷交互、动效、Three.js/GSAP 效果沉淀
```

## 文件放置建议

- 根目录只放工作区级别文件，例如 `README.md`、`AGENTS.md`、Git 配置和少量公共说明。
- `html_codex/` 放图片转 HTML 项目，例如单页还原、产品页还原、CMS 页面模板。
- `effect_codex/` 放可复用的创意动效，例如滚动视差、3D 展示、GSAP 动效、鼠标交互。
- 每个独立项目都建议单独建子目录，避免多个效果混在一起。

## 两个分类怎么用

### html_codex

适合放：

- 根据图片生成的静态 HTML 页面
- 根据截图还原的页面结构
- 后续要复制到 SaaS/CMS 平台的 HTML/CSS/JS
- 需要按平台字段套数据的页面模板

建议结构：

```text
html_codex/
└── product-landing-01/
    ├── index.html
    ├── css/
    ├── js/
    ├── img/
    └── README.md
```

### effect_codex

适合放：

- GSAP 动效 Demo
- Three.js 场景 Demo
- 滚动交互、鼠标交互、页面转场
- 从 Awwwards、CSS Design Awards 等网站拆解出来的效果练习

建议结构：

```text
effect_codex/
└── scroll-gallery/
    ├── index.html 或 package.json
    ├── src/
    ├── public/
    └── README.md
```

## 命名规范

- 项目目录优先使用小写英文和连字符，例如 `scroll-gallery`、`three-product-viewer`、`product-landing-01`。
- 不建议继续使用中文长目录名；如果需要保留中文说明，可以写在项目 README 里。
- React 组件使用 PascalCase，例如 `HeroMotion.tsx`、`ProductScene.tsx`。
- Hooks 使用 `use` 开头，例如 `useScrollProgress.ts`。
- 数据适配和模拟数据使用语义化命名，例如 `cms-adapter.ts`、`mock-data.ts`。
- 动效文件按职责命名，例如 `timeline.ts`、`scene.ts`、`animation.css`。
- 避免使用 `test1`、`demo2`、`new-page` 这类名称。

## 每次新项目需要关注

- 项目目标：页面、组件、动效 Demo、SaaS 功能，还是 CMS 模板。
- 参考拆解：记录参考网站的视觉层级、动效节奏、交互触发和核心技术点。
- 技术选型：说明使用 React、Three.js、GSAP、CSS 或普通 HTML/JS 的原因。
- 数据接入：预留 CMS 字段、接口数据、模拟数据和配置项。
- 复用方式：尽量沉淀成组件、配置对象、Hooks 或可复用模块。
- 响应式与性能：关注移动端、资源大小、动画帧率、懒加载和销毁逻辑。
- 验证方式：记录启动命令、访问地址、核心交互和已知限制。

## SaaS 平台交付注意

- 如果最终需要把源码复制到 SaaS 平台，并按平台规则套数据展示，交付代码必须以平台能直接运行为准。
- 开发阶段可以使用 ES6+、React、Three.js、GSAP 和构建工具；交付阶段需要根据平台能力转成可用代码。
- 如果平台只支持粘贴 HTML/CSS/JS，避免直接提交 JSX、TypeScript、`import/export`、依赖 `node_modules` 的源码。
- ES6 不是完全不能用；平台和目标浏览器支持时可以使用基础 ES6 语法，但不要使用需要编译才能运行的写法。
- CMS/SaaS 数据字段要单独做适配，不要把字段名硬写死在动效核心逻辑里。

## Git 与依赖

- Node.js 项目安装依赖后生成的 `node_modules/` 不提交到 Git。
- 需要提交依赖信息时，提交 `package.json` 和对应锁文件，例如 `package-lock.json`、`pnpm-lock.yaml` 或 `yarn.lock`。
- 本地环境变量文件 `.env`、`.env.*` 默认不提交；如需提供配置模板，请使用 `.env.example`。

常用命令：

```bash
git status
git add .
git commit -m "提交说明"
git push origin main
```

如果默认分支不是 `main`，按实际分支名调整最后一条命令。

## Codex 协作规则

更完整的 Codex 协作、输出和前端实现偏好见根目录 `AGENTS.md`。
