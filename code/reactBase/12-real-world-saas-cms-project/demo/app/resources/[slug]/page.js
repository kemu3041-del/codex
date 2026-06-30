import { notFound } from "next/navigation";
import { getResourceBySlug, getResourceCards } from "../../../lib/cms-adapter";

export function generateStaticParams() {
  return getResourceCards().map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resource = getResourceBySlug(slug);
  return {
    title: resource ? resource.title : "资源不存在",
  };
}

export default async function ResourceDetailPage({ params }) {
  const { slug } = await params;
  const resource = getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  return (
    <main className="page">
      <article className="detail">
        <span className="badge">{resource.type}</span>
        <h1>{resource.title}</h1>
        <p className="summary">{resource.summary}</p>
        <dl className="meta-grid">
          <div><dt>适用场景</dt><dd>{resource.scene}</dd></div>
          <div><dt>优先级</dt><dd>{resource.priority}</dd></div>
          <div><dt>CMS 字段</dt><dd>{resource.cmsFields.join("、")}</dd></div>
        </dl>
        <section className="body">
          <h2>交付说明</h2>
          <p>{resource.deliveryNote}</p>
        </section>
        <a className="button" href="/resources">返回资源列表</a>
      </article>
    </main>
  );
}
