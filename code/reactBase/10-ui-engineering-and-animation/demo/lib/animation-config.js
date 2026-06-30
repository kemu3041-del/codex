export const animationConfig = {
  enterY: 28,
  duration: 0.85,
};

export const features = [
  {
    title: "组件化结构",
    text: "Hero、功能区和内容区都拆成组件，方便后续接 CMS 字段。",
  },
  {
    title: "动效生命周期",
    text: "GSAP 初始化放进 Client Component，组件卸载时用 context.revert 清理。",
  },
  {
    title: "移动端降级",
    text: "布局使用稳定网格和 CSS 响应式规则，动画失败时内容仍然可读。",
  },
];
