# edu_codex

教学类可视化业务工作区，用于长期沉淀多学科、多年龄段、多形态的互动教学项目。

## 目录说明

- `curriculum-map/`：课程长期规划、知识点地图、年级阶段映射。
- `subjects/`：按学科沉淀知识点和案例。
- `modules/`：具体页面、互动课件、可视化 Demo。
- `components/`：可复用教学组件，例如步骤条、拖拽验证、几何画板、时间线。
- `lesson-templates/`：课程脚本模板、项目模板、字段模板。
- `research-notes/`：教学方法、竞品拆解、参考案例。
- `assets/`：公共图片、图标、音频、视频和其他素材。

## 新项目建议

新项目优先放在 `modules/` 下，例如：

```text
edu_codex/modules/fraction-visual-lab/
edu_codex/modules/science-water-cycle/
edu_codex/modules/chinese-poem-imagery/
```

如果只是沉淀知识点规划，放到 `curriculum-map/` 或 `subjects/`。
