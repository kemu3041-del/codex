import LearningCard from "../components/LearningCard";

const stages = [
  {
    title: "页面入口",
    text: "app/page.js 就是首页，访问 / 时会渲染这个文件。",
  },
  {
    title: "共享布局",
    text: "app/layout.js 会包裹页面内容，适合放页头、页脚和全局结构。",
  },
  {
    title: "静态资源",
    text: "public/ 目录中的资源可以通过 /资源名 直接访问。",
  },
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Next.js Foundation</p>
          <h1>第一个 Next.js 单页面 Demo</h1>
          <p>
            这个示例先不做复杂交互，只让你看清 Next.js 最小项目由哪些文件组成。
          </p>
        </div>
        <div className="visual" aria-label="Next.js 文件结构示意">
          <span>app</span>
          <span>page.js</span>
          <span>layout.js</span>
        </div>
      </section>

      <section className="grid" aria-label="学习阶段">
        {stages.map((stage) => (
          <LearningCard key={stage.title} title={stage.title} text={stage.text} />
        ))}
      </section>
    </main>
  );
}
