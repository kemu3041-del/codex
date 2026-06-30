export default function ResourceNotFound() {
  return (
    <main className="page">
      <section className="empty">
        <h1>资源不存在</h1>
        <p>CMS 数据里没有这个资源，详情页要给出明确反馈。</p>
        <a className="button primary" href="/resources">返回列表</a>
      </section>
    </main>
  );
}
