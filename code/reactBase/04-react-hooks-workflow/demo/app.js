const allLessons = [
  { id: 1, type: "状态", title: "useState 管理 Tab 和输入框" },
  { id: 2, type: "副作用", title: "useEffect 模拟异步加载" },
  { id: 3, type: "复用", title: "useToggle 封装弹窗开关" },
  { id: 4, type: "副作用", title: "清理定时器和监听" },
];

function useToggle(initialValue = false) {
  const [value, setValue] = React.useState(initialValue);
  const toggle = () => setValue((current) => !current);
  return [value, toggle];
}

function LessonList({ keyword }) {
  const [status, setStatus] = React.useState("loading");
  const [lessons, setLessons] = React.useState([]);

  React.useEffect(() => {
    setStatus("loading");
    const timer = window.setTimeout(() => {
      const nextLessons = allLessons.filter((lesson) => lesson.title.includes(keyword) || lesson.type.includes(keyword));
      setLessons(nextLessons);
      setStatus("success");
    }, 600);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  if (status === "loading") return <p className="muted">加载中...</p>;
  if (lessons.length === 0) return <p className="muted">没有匹配的 Hooks 练习</p>;

  return (
    <ul className="list">
      {lessons.map((lesson) => (
        <li className="item" key={lesson.id}>
          <strong>{lesson.type}</strong>
          <p>{lesson.title}</p>
        </li>
      ))}
    </ul>
  );
}

function App() {
  const [tab, setTab] = React.useState("练习");
  const [keyword, setKeyword] = React.useState("");
  const [isOpen, toggleOpen] = useToggle(false);

  return (
    <div className="page">
      <section className="shell">
        <h1>Hooks 工作流：状态、副作用和复用</h1>
        <p>这个 Demo 同时使用 useState、useEffect 和自定义 useToggle。</p>
        <div className="toolbar">
          {["练习", "说明", "复盘"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
          <button onClick={toggleOpen}>打开弹窗</button>
        </div>
        <div className="panel">
          {tab === "练习" && (
            <>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索：状态 / 副作用 / 复用" />
              <LessonList keyword={keyword.trim()} />
            </>
          )}
          {tab === "说明" && <p>副作用适合数据请求、计时器、监听和第三方库初始化。</p>}
          {tab === "复盘" && <p>能在渲染中直接计算的内容，不要为了“同步”再放进 useEffect。</p>}
        </div>
      </section>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>useToggle 弹窗</h2>
            <p>弹窗开关逻辑被封装成自定义 Hook，可以在多个组件中复用。</p>
            <button className="active" onClick={toggleOpen}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
