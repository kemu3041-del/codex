# 06 Next.js 基础

## 学习目标

这一章理解 Next.js 是什么，以及它和普通 React 项目的区别。

## 核心概念

- Next.js 是基于 React 的应用框架。
- App Router 使用 `app/` 目录组织页面。
- `page.js` 表示一个页面。
- `layout.js` 表示共享布局。
- `public/` 放静态资源。
- Next.js 可以在服务端生成页面。

## 和 React SPA 的区别

React SPA：

- 浏览器加载一个入口。
- 页面切换主要发生在客户端。
- 数据通常在浏览器请求。

Next.js：

- 文件系统生成路由。
- 页面可以在服务端渲染或静态生成。
- 数据可以在服务端请求。
- 更适合内容站、SaaS 页面、SEO 页面和全栈能力。

## 基础目录理解

常见结构：

- `app/page.js`：首页。
- `app/layout.js`：全局布局。
- `app/globals.css`：全局样式。
- `components/`：通用组件。
- `public/`：图片、图标等静态资源。

## 本章重点

- 理解 App Router 的约定。
- 会创建页面和布局。
- 会启动开发服务。
- 会区分普通 React 组件和 Next.js 页面文件。

