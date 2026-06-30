import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "../../../lib/articles";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return {
    title: article ? article.title : "文章不存在",
  };
}

export default async function ArticleDetailPage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="page">
      <article className="article-detail">
        <p className="eyebrow">Detail</p>
        <h1>{article.title}</h1>
        <p className="meta">{article.category} · {article.date}</p>
        <p className="summary">{article.summary}</p>
        <div className="body">
          {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <a className="button" href="/articles">返回列表</a>
      </article>
    </main>
  );
}
