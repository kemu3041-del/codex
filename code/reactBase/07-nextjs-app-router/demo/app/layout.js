import "./globals.css";

export const metadata = {
  title: "课程中心 App Router Demo",
  description: "Next.js App Router 单页、列表页、详情页示例",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <a className="brand" href="/">课程中心</a>
          <nav>
            <a href="/">首页</a>
            <a href="/courses">课程列表</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
