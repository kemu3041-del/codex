# Audience Cards Section

根据参考图还原的目标用户卡片区块，使用普通 HTML/CSS/JS 实现，可直接作为 SaaS/CMS 页面片段改造。

## 页面还原思路

- 背景拆成黑色舞台、细竖向边界线、红粉色径向光、噪点层和超大半透明文字。
- 卡片按截图分为白色、红粉渐变、半透明黑色和深色四类，桌面端使用绝对定位制造错落层级。
- 平板端改成两列网格，手机端改成单列，保证响应式下文字不重叠、页面不横向滚动。

## 文件结构

```text
audience-cards-section/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── img/
└── README.md
```

## SaaS/CMS 套数据建议

- 卡片标题：替换每个 `.audience-card h2`。
- 卡片序号：替换 `.card-index`。
- 第二张卡片说明：替换 `.card-note`。
- 背景大字：替换 `.ambient-word` 文案，或在平台中按主题隐藏。
- 主题色：在 `css/style.css` 的 `:root` 中修改 `--hot`、`--hot-strong`、`--line`。

## 第三方库

未使用第三方库。`js/main.js` 只负责入场状态和鼠标光感增强，可以按平台要求删除，页面静态样式仍可正常显示。

## 验证方式

- 直接打开 `index.html`。
- 或在项目目录启动本地服务后访问页面。
- 重点检查桌面端错落布局、平板两列布局、手机单列布局，以及 hover 时卡片浮起效果。
