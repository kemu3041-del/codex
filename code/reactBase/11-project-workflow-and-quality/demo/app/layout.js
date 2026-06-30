import "./globals.css";

export const metadata = {
  title: "规范化项目模板",
  description: "Next.js 项目目录和质量工作流 Demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
