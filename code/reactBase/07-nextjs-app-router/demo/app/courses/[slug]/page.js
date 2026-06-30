import { notFound } from "next/navigation";
import FavoriteButton from "../../../components/FavoriteButton";
import { courses } from "../../../data/courses";

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = courses.find((item) => item.slug === slug);
  return {
    title: course ? course.title : "课程不存在",
  };
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const course = courses.find((item) => item.slug === slug);

  if (!course) {
    notFound();
  }

  return (
    <article className="detail">
      <p className="eyebrow">Detail Page</p>
      <div className="detail-head">
        <div>
          <span className="badge">{course.level}</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        <FavoriteButton courseTitle={course.title} />
      </div>
      <div className="meta large">
        <span>{course.duration}</span>
        <span>{course.lessons} 节课</span>
        <span>{course.audience}</span>
      </div>
      <section className="outline">
        <h2>课程大纲</h2>
        <ol>
          {course.outline.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>
    </article>
  );
}
