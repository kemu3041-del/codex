# Ellipse Layout Lesson

用于学习椭圆卡片布局的交互式教学 Demo。它把椭圆布局拆成 5 个步骤：椭圆、角度、坐标、旋转、多卡片，并提供滑块实验台让参数变化实时反映到图形上。

## 学习重点

1. 椭圆中心点通常放在画面下方，只露出上半弧线。
2. 卡片索引先转换为 `offset`，再转换为角度。
3. 角度通过椭圆公式变成坐标：

```js
x = cx + rx * Math.cos(angle)
y = cy + ry * Math.sin(angle)
```

4. 卡片旋转来自椭圆切线方向：

```js
dx = -rx * Math.sin(angle)
dy = ry * Math.cos(angle)
rotation = Math.atan2(dy, dx)
```

5. 多卡片布局就是多组不同的 `offset`，不需要逐张手写坐标。

## 交互方式

- 拖动 `rx` / `ry`：观察椭圆变宽、变高后，卡片坐标和旋转如何变化。
- 拖动 `cy`：观察椭圆中心下移后，为什么画面只显示上半段。
- 拖动左右角度：观察弧线展开范围如何影响卡片分散程度。
- 拖动左右卡片数：观察 `offset` 表和弧线上的卡片数量同步变化。
- 拖动当前 `offset` 或点击 offset 表：观察某一张卡片如何从线性位置映射到弧线坐标。
- 拖动绿色点：把“角度 -> 坐标 -> 旋转”的变化直接看出来。

## 文件结构

```text
ellipse-layout-lesson/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── README.md
```

## 验证方式

从工作区根目录启动静态服务后访问：

```text
http://127.0.0.1:5512/work_codex/effect_codex/ellipse-layout-lesson/index.html
```

点击播放、暂停、重播，或点击右侧步骤按钮逐步查看。
