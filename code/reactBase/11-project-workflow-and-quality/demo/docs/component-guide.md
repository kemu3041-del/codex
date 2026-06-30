# 组件说明：StatusCard

## 用途

`StatusCard` 用于展示项目质量指标，例如组件数量、数据来源、文档状态。

## Props

- `metric.label`：指标名称。
- `metric.value`：指标值。
- `metric.description`：指标说明。

## 复用建议

- 如果指标来自接口，把接口数据转换成 `metric` 结构后再传给组件。
- 不要让组件自己请求数据，保持展示组件职责清晰。

