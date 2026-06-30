export default function CoursesLayout({ children }) {
  return (
    <main className="page">
      <div className="section-nav">
        <span>课程模块 Layout</span>
        <a href="/courses">全部课程</a>
        <a href="/courses/next-app-router">App Router</a>
      </div>
      {children}
    </main>
  );
}
