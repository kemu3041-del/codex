import ResourceFilters from "../../components/ResourceFilters";
import { getResourceCards } from "../../lib/cms-adapter";

export default function ResourcesPage() {
  const resources = getResourceCards();

  return (
    <main className="page">
      <section className="hero compact">
        <p className="eyebrow">List Page</p>
        <h1>资源列表页</h1>
        <p>列表页接收适配后的 CMS 数据，再交给客户端筛选组件处理交互。</p>
      </section>
      <ResourceFilters resources={resources} />
    </main>
  );
}
