# 07 阶段复盘

## 必须掌握

- 能使用 App Router 创建多级页面。
- 能创建动态路由。
- 能使用嵌套 layout。
- 能理解 Server Component 和 Client Component 边界。
- 能处理 loading、error、not-found。

## 自查问题

- 当前组件真的需要 `"use client"` 吗？
- 动态路由参数是否处理完整？
- 找不到数据时是否有明确反馈？
- 嵌套 layout 是否只影响对应模块？

## 常见卡点

- 整个页面都加 `"use client"`。
- 在 Server Component 中使用 `useState`。
- 动态详情没有处理不存在的 slug。

## 下一章准备

下一章学习 Next.js 数据请求和渲染策略。

