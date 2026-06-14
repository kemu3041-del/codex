# html_codex

这个目录用于存放“根据图片、截图、设计稿生成 HTML”的项目。

## 适合放这里的内容

- 图片生成 HTML
- 截图还原页面
- 静态页面模板
- 后续要复制到 SaaS/CMS 平台套数据的页面

## 推荐结构

```text
html_codex/
└── product-landing-01/
    ├── index.html
    ├── css/
    ├── js/
    ├── img/
    └── README.md
```

## 注意

- 优先交付平台能直接运行的 HTML/CSS/JS。
- 如果 SaaS 平台只支持复制源码，不要直接提交 JSX、TypeScript、`import/export` 或依赖 `node_modules` 的源码。
- 每个项目 README 里建议记录：来源图片、还原思路、数据字段、验证方式。
