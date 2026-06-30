# Demo：内容资讯数据项目

本目录已经放置本章可运行 Next.js Demo。

已实现：

- 服务端文章列表。
- 详情页。
- 客户端搜索。
- loading、error、empty。
- 环境变量配置。

运行方式：

- 进入本目录：`cd 08-nextjs-data-fetching/demo`
- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 访问列表页：`http://localhost:3000/articles`

真实路由场景：

- `/articles`：服务端渲染文章列表。
- `/articles/[slug]`：文章详情页。
- 客户端搜索框放在 `components/SearchBox.jsx`。

核心知识点：

- Server Component 负责首屏数据。
- Client Component 负责输入和筛选。
- `.env.local.example` 演示环境变量位置。
