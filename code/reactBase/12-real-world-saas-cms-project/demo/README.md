# Demo：真实 SaaS/CMS 项目

本目录已经放置本章可运行 Next.js Demo。

已实现：

- 一个完整 SaaS/CMS 页面。
- 可替换模拟数据。
- 组件化模块。
- 基础交互。
- 动效集成。
- 交付 README。

运行方式：

- 进入本目录：`cd 12-real-world-saas-cms-project/demo`
- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 访问首页：`http://localhost:3000`

真实路由场景：

- `/`：项目首页，展示精选资源。
- `/resources`：资源列表页，支持类型筛选。
- `/resources/[slug]`：资源详情页。

CMS/SaaS 重点：

- `data/cms-content.js` 模拟 CMS 原始字段。
- `lib/cms-adapter.js` 负责字段适配。
- `docs/cms-fields.md` 说明字段映射。
