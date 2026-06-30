# React + Next.js 成熟开发者训练营

这个文件夹用于系统学习 React 和 Next.js，目标不是只会写几个组件，而是把你从 HTML/CSS/JS 前端，训练成能独立完成现代 React 项目、Next.js 应用、SaaS/CMS 模板和真实业务页面的开发者。

## 你现在的位置

你已经会：

- HTML 结构和语义。
- CSS 页面布局、视觉样式和响应式处理。
- JavaScript DOM 操作、事件绑定和基础交互。
- 静态页面、动效 Demo、SaaS/CMS 粘贴型代码交付。

你接下来要补齐：

- React 的组件化思维。
- 状态、数据流、Hooks 和副作用管理。
- Next.js 的路由、渲染、服务端能力和工程化工作流。
- 从页面开发到真实项目交付的完整流程。

## 学习方式

每个阶段都按这个顺序推进：

1. 先理解概念：知道为什么 React/Next.js 要这样设计。
2. 再对照旧经验：把 HTML/CSS/JS 写法转换成 React/Next.js 写法。
3. 然后做小练习：每章必须有可运行的小任务。
4. 最后做小项目：用真实业务页面或 SaaS/CMS 场景收尾。
5. 每阶段复盘：记录易错点、最佳实践和下一步目标。

## 推荐学习顺序

先读：

- `agent.md`：后续让 Codex 帮你生成课程、练习、代码时遵循的规则。
- `00-learning-plan.md`：完整路线图。

然后按目录顺序学习：

1. `01-js-to-react-thinking/`
2. `02-react-foundation/`
3. `03-react-components-and-state/`
4. `04-react-hooks-workflow/`
5. `05-react-router-and-data-flow/`
6. `06-nextjs-foundation/`
7. `07-nextjs-app-router/`
8. `08-nextjs-data-fetching/`
9. `09-nextjs-api-and-fullstack/`
10. `10-ui-engineering-and-animation/`
11. `11-project-workflow-and-quality/`
12. `12-real-world-saas-cms-project/`

## 每阶段必须产出

每个章节后续都应该包含：

- `notes.md`：概念讲解和重点总结。
- `practice.md`：练习任务和验收标准。
- `practice/`：拆分后的练习文件夹，后续可按 `exercise-01.md`、`exercise-02.md` 继续扩展。
- `demo/`：可运行代码。
- `review.md`：阶段复盘、问题记录和优化方向。

## 训练目标

完成这套学习后，你应该能做到：

- 看懂 React 项目目录和组件关系。
- 独立创建 React 组件、管理状态、处理表单和交互。
- 使用 Hooks 组织复杂页面逻辑。
- 使用 Next.js App Router 开发页面、布局、动态路由和服务端数据。
- 理解服务端渲染、静态生成、客户端组件和服务端组件的区别。
- 把设计稿或参考站拆解为组件、数据结构、动画和交互。
- 做出适合 SaaS/CMS 交付的 React/Next.js 页面方案。
- 具备成熟前端开发者的项目启动、调试、验证、复盘能力。

## 验证方式

当前阶段只初始化学习文档和目录，不创建 React 或 Next.js 工程。

你可以用下面方式确认结构：

```bash
find . -maxdepth 2 -type d | sort
ls -la
```

## Demo 运行方式

第 1-5 章是 React 入门静态 Demo：

- 进入对应章节的 `demo/`。
- 直接用浏览器打开 `index.html`。
- 这些 Demo 使用 React CDN，需要网络能访问 CDN。

第 6-12 章是 Next.js Demo：

- 进入对应章节的 `demo/`。
- 执行 `npm install`。
- 执行 `npm run dev`。
- 打开 `http://localhost:3000`。

第 7 章 App Router Demo 已按真实路由场景创建：

- `/`：单页面首页。
- `/courses`：列表页。
- `/courses/[slug]`：详情页。

第 12 章 SaaS/CMS Demo 也包含真实路由：

- `/`：项目首页。
- `/resources`：资源列表页。
- `/resources/[slug]`：资源详情页。
