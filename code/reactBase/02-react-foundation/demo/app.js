const courses = [
  { id: "react-basic", title: "React 基础", level: "入门", time: "2 小时", description: "学习 JSX、组件和列表渲染。" },
  { id: "state-flow", title: "状态和数据流", level: "进阶", time: "3 小时", description: "理解 props、state 和组件通信。" },
  { id: "next-intro", title: "Next.js 入门", level: "入门", time: "2.5 小时", description: "认识 App Router 和文件系统路由。" },
  { id: "animation", title: "React 动效工程", level: "进阶", time: "4 小时", description: "把 GSAP 动画接入组件生命周期。" },
];

function CourseCard({ course }) {
  return (
    <article className="card">
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <div className="meta">
        <span className="badge">{course.level}</span>
        <span className="badge">{course.time}</span>
      </div>
    </article>
  );
}

function App() {
  const [level, setLevel] = React.useState("全部");
  const levels = ["全部", "入门", "进阶"];
  const visibleCourses = level === "全部" ? courses : courses.filter((course) => course.level === level);

  return (
    <div className="page">
      <section className="shell">
        <div className="header">
          <div>
            <h1>课程列表：组件组合和数组渲染</h1>
            <p>这一章练习用数组生成重复 UI，用条件渲染处理空状态。</p>
          </div>
          <div className="filters" aria-label="课程筛选">
            {levels.map((item) => (
              <button key={item} className={item === level ? "active" : ""} onClick={() => setLevel(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {visibleCourses.length > 0 ? (
          <div className="grid">
            {visibleCourses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <div className="empty">暂无课程</div>
        )}
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
