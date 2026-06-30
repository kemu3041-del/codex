import { messages } from "../../../lib/message-store";

export async function GET() {
  return Response.json({ messages });
}

export async function POST(request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const content = String(body.content || "").trim();

  if (!name) {
    return Response.json({ message: "姓名不能为空" }, { status: 400 });
  }

  if (content.length < 5) {
    return Response.json({ message: "留言内容至少 5 个字" }, { status: 400 });
  }

  const nextMessage = {
    id: Date.now(),
    name,
    content,
    createdAt: new Date().toISOString(),
  };

  messages.unshift(nextMessage);
  return Response.json({ message: nextMessage }, { status: 201 });
}
