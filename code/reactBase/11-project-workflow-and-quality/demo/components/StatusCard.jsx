export default function StatusCard({ metric }) {
  return (
    <article className="card">
      <span className="label">{metric.label}</span>
      <strong>{metric.value}</strong>
      <p>{metric.description}</p>
    </article>
  );
}
