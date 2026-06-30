# Demo：课程中心路由

本目录已经放置本章可运行 Next.js Demo。

已实现：

- `/courses`
- `/courses/[slug]`
- 课程模块 layout。
- 收藏按钮 Client Component。
- loading、error、not-found。

运行方式：

- 进入本目录：`cd 07-nextjs-app-router/demo`
- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 访问首页：`http://localhost:3000`

真实路由场景：

- `/`：单页面首页，引导进入课程中心。
- `/courses`：课程列表页。
- `/courses/[slug]`：课程详情页。
- `/courses/not-exist`：触发详情页 not-found。

核心知识点：

- 嵌套 `app/courses/layout.js`。
- 动态路由 `[slug]`。
- `loading.js` 和 `not-found.js`。
- `FavoriteButton.jsx` 使用 `"use client"`，页面主体保持服务端组件。
