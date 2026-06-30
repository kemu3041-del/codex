# 07 Next.js App Router

## 学习目标

这一章掌握 Next.js App Router 的核心页面组织能力，包括嵌套路由、动态路由、加载状态、错误状态和组件边界。

## 核心概念

- 文件夹就是路由段。
- `page.js` 是页面。
- `layout.js` 是共享布局。
- `[slug]` 是动态路由。
- `loading.js` 是加载状态。
- `error.js` 是错误边界。
- `not-found.js` 是 404 状态。
- 默认组件是 Server Component。
- 使用浏览器交互时需要 Client Component。

## Server Component 和 Client Component

Server Component 适合：

- 读取服务端数据。
- 渲染静态内容。
- 不需要浏览器事件的组件。

Client Component 适合：

- 点击、输入、拖拽等交互。
- 使用 `useState`、`useEffect`。
- 使用浏览器 API。
- 使用需要 DOM 的动画库。

## 本章重点

- 默认优先服务端组件。
- 只有需要交互时才加 `"use client"`。
- 路由状态要完整：loading、error、not-found。
- 动态路由要处理不存在的数据。

