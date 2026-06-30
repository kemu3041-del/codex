import SearchBox from "../../components/SearchBox";
import { getArticles } from "../../lib/articles";

export const revalidate = 60;

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Server Fetch + Client Search</p>
        <h1>内容资讯列表页</h1>
        <p>文章列表在服务端准备，搜索框在客户端处理用户输入。</p>
      </section>
      <SearchBox articles={articles} />
    </main>
  );
}
