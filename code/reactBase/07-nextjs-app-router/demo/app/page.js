export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">App Router Scene</p>
        <h1>用真实课程场景理解 Next.js 路由</h1>
        <p>
          这个 Demo 包含单页面首页、课程列表页和课程详情页。你可以从首页进入列表，再进入动态详情。
        </p>
        <div className="actions">
          <a className="button primary" href="/courses">进入课程列表</a>
          <a className="button" href="/courses/react-components">查看 React 组件课</a>
        </div>
      </section>
    </main>
  );
}
