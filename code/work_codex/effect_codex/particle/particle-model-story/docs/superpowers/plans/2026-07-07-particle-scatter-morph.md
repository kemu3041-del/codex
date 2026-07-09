# Particle Scatter Morph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将相邻模型的线性粒子变形改为随滚动可逆的 `40% 打散 / 20% 漂浮 / 40% 汇聚` 三阶段过渡。

**Architecture:** `story-timeline.js` 继续只提供相邻模型索引和原始滚动进度。`config.js` 校验阶段边界，`App.jsx` 把边界作为 Shader uniform；顶点 Shader 使用固定粒子随机方向构造稳定散点场，并分段插值旧模型、散点场和新模型。

**Tech Stack:** React 19、React Three Fiber、Three.js GLSL Shader、GSAP ScrollTrigger、Vite。

## Global Constraints

- 普通滚动，不增加滚动吸附或自动播放。
- 文案 HTML 结构和 GSAP 文案时间轴保持不变。
- 正向与反向滚动必须使用同一确定性粒子轨迹。
- 阶段默认值固定为 `scatterEnd: 0.4`、`gatherStart: 0.6`，并在 `index.html` 暴露。
- 新增的空间数学和配置校验必须有中文注释。

---

### Task 1: 阶段配置校验

**Files:**
- Modify: `particle/particle-model-story/src/config.js`
- Modify: `particle/particle-model-story/index.html`
- Create: `particle/particle-model-story/src/config.test.js`

**Interfaces:**
- Consumes: `window.PARTICLE_STORY_CONFIG.morphPhases`
- Produces: `getStoryConfig().morphPhases: { scatterEnd: number, gatherStart: number }`

- [ ] **Step 1: 写失败测试**

使用 Node `node:test` 验证默认值、有效外部配置和错误顺序回退：

```js
assert.deepEqual(getStoryConfig().morphPhases, { scatterEnd: 0.4, gatherStart: 0.6 });
assert.deepEqual(readConfig({ scatterEnd: 0.3, gatherStart: 0.75 }), { scatterEnd: 0.3, gatherStart: 0.75 });
assert.deepEqual(readConfig({ scatterEnd: 0.8, gatherStart: 0.2 }), { scatterEnd: 0.4, gatherStart: 0.6 });
```

- [ ] **Step 2: 确认测试因缺少配置失败**

Run: `node --test src/config.test.js`
Expected: FAIL，`morphPhases` 为 `undefined`。

- [ ] **Step 3: 实现最小配置合并与校验**

在默认配置中加入两个边界，深合并外部配置；把值限制在 `0.05 ~ 0.95`，当 `scatterEnd >= gatherStart` 时整体回退默认配置。在 `index.html` 加入带中文说明的对应配置。

- [ ] **Step 4: 确认配置测试通过**

Run: `node --test src/config.test.js`
Expected: 3 tests passed，0 failed。

### Task 2: Shader 三阶段粒子轨迹

**Files:**
- Modify: `particle/particle-model-story/src/App.jsx`

**Interfaces:**
- Consumes: `config.morphPhases.scatterEnd`、`config.morphPhases.gatherStart`
- Produces: Shader uniforms `uScatterEnd`、`uGatherStart`

- [ ] **Step 1: 增加阶段 uniforms**

在 Shader 声明两个浮点 uniform，并在 React uniforms 对象中读取已校验配置。

- [ ] **Step 2: 用稳定散点场替换直接模型插值**

核心 GLSL 计算固定为：

```glsl
float scatterProgress = smoothstep(0.0, uScatterEnd, uTransition);
float gatherProgress = smoothstep(uGatherStart, 1.0, uTransition);
vec3 scatterPosition = fromPosition + direction * scatterDistance + tangent * curlDistance;
vec3 transformed = mix(fromPosition, scatterPosition, scatterProgress);
transformed = mix(transformed, toPosition, gatherProgress);
```

颜色、尺寸和透明度分别沿打散阶段与汇聚阶段过渡，防止第二个模型在 60% 之前提前显形。中段时间漂移只作用于散开权重。

- [ ] **Step 3: 运行配置测试与生产构建**

Run: `node --test src/config.test.js && npm run build`
Expected: tests 通过且 Vite build exit 0。

### Task 3: 单次浏览器关键路径验证

**Files:**
- Verify: `particle/particle-model-story/index.html`

**Interfaces:**
- Consumes: HTML 调试属性 `data-particle-progress`
- Produces: 一张中段散开状态截图和控制台结果

- [ ] **Step 1: 启动一次开发服务器**

Run: `npm run dev -- --host 127.0.0.1`
Expected: Vite 输出可访问本地地址。

- [ ] **Step 2: 验证最短滚动路径**

只打开首页一次，依次滚动到第一、二章节中心之间约 20%、50%、80%：20% 应仅部分打散；50% 应完全散开且无清晰模型；80% 应仅部分汇聚第二模型。然后反向滚动确认状态连续，并检查控制台无错误。

- [ ] **Step 3: 截图并关闭浏览器和服务**

只保留一张 50% 中段散点状态截图，随后关闭验证会话。
