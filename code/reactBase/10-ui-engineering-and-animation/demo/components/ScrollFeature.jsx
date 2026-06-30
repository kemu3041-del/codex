export default function ScrollFeature({ feature, index }) {
  return (
    <article className="feature" id={index === 0 ? "features" : undefined}>
      <span className="feature-index">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h2>{feature.title}</h2>
        <p>{feature.text}</p>
      </div>
    </article>
  );
}
