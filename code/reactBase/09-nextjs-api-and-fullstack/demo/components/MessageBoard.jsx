"use client";

import { useEffect, useState } from "react";

export default function MessageBoard() {
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ name: "", content: "" });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadMessages() {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/messages");
      const data = await response.json();
      setMessages(data.messages);
      setStatus("success");
    } catch {
      setError("留言加载失败");
      setStatus("error");
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "提交失败");
        setStatus("success");
        return;
      }

      setMessages((current) => [data.message, ...current]);
      setForm({ name: "", content: "" });
      setStatus("success");
    } catch {
      setError("网络异常，提交失败");
      setStatus("success");
    }
  }

  return (
    <section className="board">
      <form className="form" onSubmit={handleSubmit}>
        <label>
          姓名
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          留言
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={status === "submitting"}>{status === "submitting" ? "提交中..." : "提交留言"}</button>
      </form>

      <div className="messages">
        <div className="list-head">
          <h2>留言列表</h2>
          <button type="button" onClick={loadMessages}>刷新</button>
        </div>
        {status === "loading" && <p>加载中...</p>}
        {status === "error" && <p className="error">{error}</p>}
        {status !== "loading" && messages.length === 0 && <p>暂无留言</p>}
        {messages.map((message) => (
          <article className="message" key={message.id}>
            <strong>{message.name}</strong>
            <p>{message.content}</p>
            <time>{new Date(message.createdAt).toLocaleString("zh-CN")}</time>
          </article>
        ))}
      </div>
    </section>
  );
}
