import "./globals.css";

export const metadata = {
  title: "SaaS/CMS 资源中心",
  description: "真实 SaaS/CMS 数据适配项目 Demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <a className="brand" href="/">ContentOps</a>
          <nav>
            <a href="/">首页</a>
            <a href="/resources">资源列表</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
