const products = [
  {
    id: 1,
    icon: "UI",
    title: "响应式产品卡片",
    description: "把静态 HTML 卡片改成 React 组件，先理解 JSX 和组件。",
    detail: "这个练习重点不是复杂样式，而是理解 UI 由状态决定。",
  },
  {
    id: 2,
    icon: "JS",
    title: "状态驱动按钮",
    description: "点击收藏按钮后，React 根据 state 自动更新文案和样式。",
    detail: "不要 querySelector 按钮再改文字，应该修改 state。",
  },
  {
    id: 3,
    icon: "DOM",
    title: "详情展开收起",
    description: "用条件渲染替代手动 display none。",
    detail: "当 showDetail 为 true 时显示详情，为 false 时不渲染。",
  },
];

function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [showDetail, setShowDetail] = React.useState(false);

  return (
    <article className="card">
      <div className="visual" aria-hidden="true">{product.icon}</div>
      <div className="content">
        <h2>{product.title}</h2>
        <p>{product.description}</p>
        <div className="actions">
          <button
            className={isFavorite ? "favorite" : ""}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            {isFavorite ? "已收藏" : "收藏"}
          </button>
          <button className="secondary" onClick={() => setShowDetail(!showDetail)}>
            {showDetail ? "收起详情" : "查看详情"}
          </button>
        </div>
        {showDetail && <div className="details">{product.detail}</div>}
      </div>
    </article>
  );
}

function App() {
  return (
    <div className="page">
      <section className="shell">
        <p className="eyebrow">Chapter 01</p>
        <h1>从操作 DOM 转向状态驱动 UI</h1>
        <p className="lead">
          点击按钮时，不直接找 DOM 改内容，而是改变组件状态。React 会根据当前状态重新计算界面。
        </p>
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
