import StatusCard from "../components/StatusCard";
import { projectMetrics } from "../data/projectMetrics";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Project Workflow</p>
        <h1>规范化 React/Next.js 项目模板</h1>
        <p>这个 Demo 演示成熟项目的基本目录：页面、组件、数据、文档分开管理。</p>
      </section>
      <section className="grid">
        {projectMetrics.map((metric) => (
          <StatusCard key={metric.label} metric={metric} />
        ))}
      </section>
      <section className="checklist">
        <h2>交付前检查</h2>
        <ul>
          <li>开发服务能启动。</li>
          <li>构建命令能通过。</li>
          <li>组件职责和 props 说明清晰。</li>
          <li>移动端布局没有溢出。</li>
        </ul>
      </section>
    </main>
  );
}
