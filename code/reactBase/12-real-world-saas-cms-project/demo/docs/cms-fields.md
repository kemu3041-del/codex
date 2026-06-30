# CMS 字段说明

## 字段来源

原始字段放在 `data/cms-content.js`，模拟 CMS 返回的数据。

## 适配层

`lib/cms-adapter.js` 把 CMS 字段转换成组件需要的结构：

- `moduleTitle` -> `title`
- `moduleType` -> `type`
- `moduleSummary` -> `summary`
- `targetScene` -> `scene`
- `fields` -> `cmsFields`

## 为什么要有适配层

真实 SaaS/CMS 项目中，后台字段命名不一定适合组件直接使用。适配层可以隔离平台字段变化，避免组件被平台字段污染。

