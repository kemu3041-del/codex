# Demo：留言板全栈小项目

本目录已经放置本章可运行 Next.js Demo。

已实现：

- 留言列表。
- 留言表单。
- GET 接口。
- POST 接口。
- 服务端校验。

运行方式：

- 进入本目录：`cd 09-nextjs-api-and-fullstack/demo`
- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 访问：`http://localhost:3000/messages`

真实场景：

- `/messages`：留言板页面。
- `/api/messages`：GET 获取留言，POST 新增留言。
- `MessageBoard.jsx`：客户端表单和请求状态。

核心交互：

- 加载留言。
- 提交留言。
- 服务端字段校验。
- 成功、失败、提交中状态。
