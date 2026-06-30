export default function CourseNotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">Not Found</p>
      <h1>课程不存在</h1>
      <p>当前 slug 没有匹配课程，真实项目中详情页必须处理这种情况。</p>
      <a className="button primary" href="/courses">返回课程列表</a>
    </section>
  );
}
