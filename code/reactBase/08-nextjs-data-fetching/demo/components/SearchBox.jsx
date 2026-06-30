"use client";

import { useMemo, useState } from "react";

export default function SearchBox({ articles }) {
  const [keyword, setKeyword] = useState("");
  const visibleArticles = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return articles;
    return articles.filter((article) => {
      return [article.title, article.summary, article.category].some((text) => text.toLowerCase().includes(value));
    });
  }, [articles, keyword]);

  return (
    <section>
      <div className="search-row">
        <label htmlFor="keyword">客户端搜索</label>
        <input
          id="keyword"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="输入 React、Next、数据..."
        />
      </div>
      {visibleArticles.length > 0 ? (
        <div className="article-grid">
          {visibleArticles.map((article) => (
            <article className="article-card" key={article.slug}>
              <span className="badge">{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <p className="meta">{article.date}</p>
              <a className="button primary" href={`/articles/${article.slug}`}>阅读详情</a>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">没有匹配内容</div>
      )}
    </section>
  );
}
