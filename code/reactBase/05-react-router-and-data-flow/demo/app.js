const ThemeContext = React.createContext(null);

const articles = [
  { slug: "react-state", title: "React 状态驱动 UI", author: "Codex", summary: "用状态表达界面，而不是直接操作 DOM。", body: "React 的关键转变是把 UI 看作状态的结果。按钮、输入框、列表和空状态都应该由数据决定。" },
  { slug: "component-flow", title: "组件数据流", author: "Codex", summary: "父组件保存数据，子组件通过 props 和回调协作。", body: "组件通信要保持单向数据流。子组件不直接修改父组件数据，而是调用父组件传入的函数。" },
  { slug: "async-state", title: "异步状态设计", author: "Codex", summary: "loading、error、empty 都是正式 UI。", body: "真实项目不能只写成功状态。加载、失败、空列表和重试都要提前设计。" },
];

function useHashRoute() {
  const [hash, setHash] = React.useState(window.location.hash || "#/");

  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hash.replace(/^#/, "");
}

function ArticleList() {
  return (
    <>
      <h1>文章列表：Hash 模拟客户端路由</h1>
      <p>点击卡片进入详情页，URL hash 会表达当前文章。</p>
      <div className="grid">
        {articles.map((article) => (
          <article className="card" key={article.slug}>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <p className="meta">作者：{article.author}</p>
            <a className="primary" href={`#/${article.slug}`}>查看详情</a>
          </article>
        ))}
      </div>
    </>
  );
}

function ArticleDetail({ slug }) {
  const article = articles.find((item) => item.slug === slug);
  if (!article) {
    return (
      <div className="panel">
        <h1>没有找到文章</h1>
        <p>这个 slug 没有对应数据，这是详情页必须处理的状态。</p>
        <a href="#/">返回列表</a>
      </div>
    );
  }

  return (
    <article className="panel">
      <p className="meta">/{article.slug}</p>
      <h1>{article.title}</h1>
      <p>{article.body}</p>
      <a href="#/">返回列表</a>
    </article>
  );
}

function AsyncStatePanel() {
  const [state, setState] = React.useState("success");

  return (
    <section className="panel">
      <h2>异步状态演示</h2>
      <div className="states">
        {["loading", "error", "empty", "success"].map((item) => (
          <button key={item} onClick={() => setState(item)}>{item}</button>
        ))}
      </div>
      {state === "loading" && <p>加载中...</p>}
      {state === "error" && <p>请求失败，请稍后重试。</p>}
      {state === "empty" && <p>暂无数据。</p>}
      {state === "success" && <p>请求成功，数据已渲染。</p>}
    </section>
  );
}

function App() {
  const route = useHashRoute();
  const [theme, setTheme] = React.useState("light");
  const slug = route === "/" ? null : route.slice(1);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`page ${theme === "dark" ? "dark" : ""}`}>
        <section className="shell">
          <nav className="nav">
            <a href="#/">文章 SPA</a>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "浅色" : "深色"}主题
            </button>
          </nav>
          {slug ? <ArticleDetail slug={slug} /> : <ArticleList />}
          <AsyncStatePanel />
        </section>
      </div>
    </ThemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
