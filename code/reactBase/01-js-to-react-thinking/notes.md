# 01 从 JS DOM 思维到 React 思维

## 学习目标

这一章解决一个核心问题：不要再把页面更新理解成“找到 DOM，然后改 DOM”，而是理解成“数据变化后，React 重新计算 UI”。

## 核心概念

- JSX：看起来像 HTML，但本质是 JavaScript 表达式。
- 组件：返回 UI 的函数，可以复用、组合和传入数据。
- state：组件内部会变化的数据。
- 事件：React 用 `onClick`、`onChange` 这类驼峰写法绑定事件。
- UI = state 的结果：页面显示什么，由当前状态决定。

## 和 HTML/CSS/JS 的对应关系

以前你会这样想：

- HTML 写结构。
- CSS 写样式。
- JS 用 `querySelector` 找元素。
- 点击后手动改 `innerHTML`、`className` 或 `style`。

React 中要这样想：

- JSX 写结构。
- CSS 仍然写样式。
- JS 负责维护状态。
- 状态变化后，React 自动更新对应 UI。

## 关键转变

不要问：“我要改哪个 DOM？”

要问：“这个 UI 由哪个状态决定？”

例如收藏按钮：

- 旧思路：点击后找到按钮，改文字和 class。
- React 思路：维护 `isFavorite`，按钮文字和 class 都由它决定。

## 本章重点

- JSX 不是字符串模板。
- React 事件不是直接写小写 DOM 事件。
- 不要在 React 中默认使用 `document.querySelector` 解决常规 UI。
- 先设计状态，再写交互。

