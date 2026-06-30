# Demo：产品展示动效页

本目录已经放置本章可运行 Next.js Demo。

已实现：

- 响应式 Hero。
- GSAP 入场动画。
- 滚动触发内容区。
- 可配置文案和图片。

运行方式：

- 进入本目录：`cd 10-ui-engineering-and-animation/demo`
- 安装依赖：`npm install`
- 启动开发服务：`npm run dev`
- 访问：`http://localhost:3000`

核心内容：

- `ProductHero.jsx` 是 Client Component，使用 GSAP 入场动画。
- `context.revert()` 负责组件卸载清理。
- `ScrollFeature.jsx` 展示组件化内容区。
- `lib/animation-config.js` 保存动效配置和内容数据。
