import "./globals.css";

export const metadata = {
  title: "Next.js 学习首页",
  description: "第一个 Next.js App Router Demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <a className="brand" href="/">React Next 学习营</a>
          <span>Chapter 06</span>
        </header>
        {children}
        <footer className="site-footer">Next.js 基础：page、layout、public、globals.css</footer>
      </body>
    </html>
  );
}
