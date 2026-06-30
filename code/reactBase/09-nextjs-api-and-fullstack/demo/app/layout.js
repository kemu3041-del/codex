import "./globals.css";

export const metadata = {
  title: "留言板全栈 Demo",
  description: "Next.js Route Handler 和表单提交",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
