export default function ArticleNotFound() {
  return (
    <main className="page">
      <section className="empty">
        <p className="eyebrow">Not Found</p>
        <h1>文章不存在</h1>
        <p>详情页找不到数据时不能空白，需要给出明确反馈。</p>
        <a className="button" href="/articles">返回列表</a>
      </section>
    </main>
  );
}
