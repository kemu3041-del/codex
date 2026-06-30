import { courses } from "../../data/courses";

export const metadata = {
  title: "课程列表",
};

export default function CoursesPage() {
  return (
    <section>
      <p className="eyebrow">List Page</p>
      <h1>课程列表页</h1>
      <p>这个页面展示所有课程，是典型的列表页场景。</p>
      <div className="course-grid">
        {courses.map((course) => (
          <article className="course-card" key={course.slug}>
            <span className="badge">{course.level}</span>
            <h2>{course.title}</h2>
            <p>{course.summary}</p>
            <div className="meta">
              <span>{course.duration}</span>
              <span>{course.lessons} 节课</span>
            </div>
            <a className="button primary" href={`/courses/${course.slug}`}>查看详情</a>
          </article>
        ))}
      </div>
    </section>
  );
}
