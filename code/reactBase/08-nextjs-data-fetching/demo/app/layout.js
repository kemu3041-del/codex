import "./globals.css";

export const metadata = {
  title: "内容资讯数据 Demo",
  description: "Next.js 服务端请求和客户端搜索示例",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <a className="brand" href="/articles">内容资讯</a>
          <nav>
            <a href="/articles">列表</a>
            <a href="/articles/react-state-ui">示例详情</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
