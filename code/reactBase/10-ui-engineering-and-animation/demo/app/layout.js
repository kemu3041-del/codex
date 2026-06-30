import "./globals.css";

export const metadata = {
  title: "产品展示动效页",
  description: "Next.js + GSAP UI 工程化 Demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
