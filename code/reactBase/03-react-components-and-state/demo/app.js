const initialTodos = [
  { id: 1, title: "把 HTML 卡片改成组件", done: true },
  { id: 2, title: "理解 props 从父组件传入", done: false },
  { id: 3, title: "用受控表单新增任务", done: false },
];

function TodoForm({ onAdd }) {
  const [title, setTitle] = React.useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="输入一个学习任务"
      />
      <button type="submit">新增</button>
    </form>
  );
}

function TodoItem({ todo, onToggle }) {
  return (
    <li className={`item ${todo.done ? "done" : ""}`}>
      <span className="title">{todo.title}</span>
      <button className="ghost" onClick={() => onToggle(todo.id)}>
        {todo.done ? "设为未完成" : "完成"}
      </button>
    </li>
  );
}

function App() {
  const [todos, setTodos] = React.useState(initialTodos);
  const [filter, setFilter] = React.useState("全部");

  function addTodo(title) {
    setTodos([{ id: Date.now(), title, done: false }, ...todos]);
  }

  function toggleTodo(id) {
    setTodos(todos.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
  }

  const visibleTodos = todos.filter((todo) => {
    if (filter === "未完成") return !todo.done;
    if (filter === "已完成") return todo.done;
    return true;
  });

  return (
    <div className="page">
      <section className="panel">
        <h1>待办事项：Props、State 和组件通信</h1>
        <p>父组件保存 todos，子组件通过回调通知父组件更新状态。</p>
        <TodoForm onAdd={addTodo} />
        <div className="filters">
          {["全部", "未完成", "已完成"].map((item) => (
            <button key={item} className={filter === item ? "active" : "ghost"} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        {visibleTodos.length > 0 ? (
          <ul className="list">
            {visibleTodos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />)}
          </ul>
        ) : (
          <div className="empty">当前筛选条件下没有任务</div>
        )}
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
