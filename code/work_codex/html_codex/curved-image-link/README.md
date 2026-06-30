# Curved Image Link Layout

静态 HTML/CSS 示例，用于实现两张图片之间的外轮廓包围和曲线连接布局。

## 使用方式

- 直接打开 `index.html`。
- 替换图片：修改 `.image-node img` 的 `src`。
- 修改标题：修改图片后面的 `span`。
- 修改大小：调整 `.image-link` 上的 `--left-size`、`--right-size`。
- 修改间距：调整 `.image-link` 上的 `--gap` 或使用现有 class。
- 修改外轮廓：调整 `--outline-offset`、`--line`。外圈不是完整圆角矩形，靠连接线的一侧由 SVG 自动留开口。
- 修改曲线形态：调整 `--connector-spread`、`--connector-waist`，或者修改 `js/main.js` 里的 `buildRailPath()`。

## CMS/SaaS 字段建议

- 左侧图片：`leftImage`
- 左侧标题：`leftTitle`
- 右侧图片：`rightImage`
- 右侧标题：`rightTitle`
- 左右尺寸：`leftSize`、`rightSize`
- 连接线颜色：`lineColor`

## 技术说明

布局由 CSS Flex 控制，图片、标题仍写在 HTML。外框和中间收腰连接由同一个 SVG path 一笔画出，JS 会根据两个图片外框的真实位置计算路径：左框右侧开口、上连接线、右框外圈、下连接线、左框外圈连续闭合。

连接线使用 `C` 贝塞尔曲线，左右外框保持普通直边和圆角；整体仍由单个 SVG path 绘制，避免多个 path 在连接处叠加。
