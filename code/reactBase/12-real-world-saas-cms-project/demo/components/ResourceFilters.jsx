"use client";

import { useMemo, useState } from "react";

export default function ResourceFilters({ resources }) {
  const [type, setType] = useState("全部");
  const types = ["全部", ...Array.from(new Set(resources.map((resource) => resource.type)))];
  const visibleResources = useMemo(() => {
    return type === "全部" ? resources : resources.filter((resource) => resource.type === type);
  }, [resources, type]);

  return (
    <section>
      <div className="filters">
        {types.map((item) => (
          <button key={item} className={type === item ? "active" : ""} onClick={() => setType(item)}>
            {item}
          </button>
        ))}
      </div>
      {visibleResources.length > 0 ? (
        <div className="grid">
          {visibleResources.map((resource) => (
            <article className="card" key={resource.slug}>
              <span className="badge">{resource.type}</span>
              <h2>{resource.title}</h2>
              <p>{resource.summary}</p>
              <a className="button primary" href={`/resources/${resource.slug}`}>查看详情</a>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">暂无资源</div>
      )}
    </section>
  );
}
