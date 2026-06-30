# Text Orbit Motion

## 实现思路

这个 Demo 做的是真正的 3D 圆柱文字环。圆环文案会按文字长度自动计算复制数量和半径，每个文字块使用弯曲文字面片，像参考图里的图片圆环一样围绕中心物体形成纵深。中心红色触手从圆环中间穿过，前排文字保持白色，后排文字保持灰色可见。

## 技术拆解

- 布局：首屏全屏舞台，左下角保留简短信息和暂停控制。
- 动画：整个 3D 文字环缓慢绕 Y 轴旋转，暂停按钮可停止运动。
- 3D：文字使用 CanvasTexture 写入短语，再映射到自定义弯曲面片上，按 Y 轴 360 度分布；中心红色有机体使用 TubeGeometry、TorusGeometry 和小吸盘 Mesh 组合，不依赖外部模型。
- 交互：按钮控制暂停/继续，系统开启 reduced-motion 时降低持续动画。
- 数据：`src/cms-adapter.js` 中保留字段映射，后续可接 CMS/SaaS 数据。

## 文件结构

```text
text-orbit-motion/
├── index.html
├── package.json
├── README.md
└── src/
    ├── App.jsx
    ├── cms-adapter.js
    ├── main.jsx
    └── styles.css
```

## CMS/SaaS 接入建议

工程化平台可以直接使用当前 React 源码。需要替换内容时，优先改 `src/cms-adapter.js`：

- `title`：主标题。
- `description`：说明文案。
- `ringPhrase`：圆柱文字环重复文案，默认 `Content`。
- `ringCopies`：环绕复制数量，不填时按文字长度自动计算。
- `ringRadius`：圆柱半径，不填时按文字长度自动计算。
- `theme`：背景、主色、文字色。
- `motion.speed`：圆环旋转速度。
- `motion.tilt`：圆环倾斜角。

如果目标平台只能粘贴 HTML/CSS/JS，需要先执行 `npm run build`，再把构建产物按平台静态资源规则上传。

## 验证方式

```bash
npm install
npm run dev
```

访问终端输出的本地地址，检查文字是否绕中心物体持续环绕、按钮是否能暂停/继续、移动端是否没有横向滚动。
