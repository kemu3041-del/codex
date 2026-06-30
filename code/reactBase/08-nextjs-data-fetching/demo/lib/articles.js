const articles = [
  {
    slug: "react-state-ui",
    title: "用状态驱动 UI",
    category: "React",
    date: "2026-06-18",
    summary: "从 DOM 操作切换到状态驱动，是学习 React 的第一道门槛。",
    body: [
      "React 页面不是靠手动修改 DOM 更新，而是通过状态变化重新计算 UI。",
      "按钮文案、详情展开、列表筛选都应该由状态或数据决定。",
    ],
  },
  {
    slug: "next-server-fetch",
    title: "Next.js 服务端请求",
    category: "Next.js",
    date: "2026-06-18",
    summary: "首屏内容适合放在服务端请求中，让页面更快得到完整 HTML。",
    body: [
      "在 App Router 中，Server Component 可以直接 await 数据。",
      "对于文章列表、商品详情这类首屏内容，服务端请求通常比客户端 useEffect 更合适。",
    ],
  },
  {
    slug: "client-search-state",
    title: "客户端搜索状态",
    category: "Data Flow",
    date: "2026-06-18",
    summary: "用户输入、筛选、排序通常属于客户端交互。",
    body: [
      "搜索输入框需要 useState，因此应该放在 Client Component 中。",
      "页面主体可以继续保持服务端渲染，把交互组件下沉到局部。",
    ],
  },
];

export async function getArticles() {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return articles;
}

export async function getArticleBySlug(slug) {
  const allArticles = await getArticles();
  return allArticles.find((article) => article.slug === slug);
}
