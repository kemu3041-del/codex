import MessageBoard from "../../components/MessageBoard";

export default function MessagesPage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Route Handler</p>
        <h1>留言板：页面调用自己的 API</h1>
        <p>这个 Demo 使用 `/api/messages` 提供 GET 和 POST，前端表单负责提交和状态反馈。</p>
      </section>
      <MessageBoard />
    </main>
  );
}
