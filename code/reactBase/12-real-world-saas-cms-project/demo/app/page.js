import { getResourceCards } from "../lib/cms-adapter";

export default function HomePage() {
  const resources = getResourceCards().slice(0, 3);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">SaaS/CMS Project</p>
        <h1>可配置内容资源中心</h1>
        <p>这个真实项目 Demo 演示 CMS 字段、数据适配、列表页和详情页如何协作。</p>
        <a className="button primary" href="/resources">进入资源列表</a>
      </section>
      <section className="grid">
        {resources.map((resource) => (
          <article className="card" key={resource.slug}>
            <span className="badge">{resource.type}</span>
            <h2>{resource.title}</h2>
            <p>{resource.summary}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
