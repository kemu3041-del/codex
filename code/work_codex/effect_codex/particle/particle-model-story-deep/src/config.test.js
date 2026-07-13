// 使用 Node 内置测试能力验证滚动阶段配置，避免为了少量配置校验额外引入测试框架。
import test from 'node:test';
// 使用严格断言，确保配置对象的数值和结构都完全符合预期。
import assert from 'node:assert/strict';
// 导入真实配置入口，测试外部 HTML 配置与默认配置的最终合并结果。
import { getStoryConfig } from './config.js';

// 模拟浏览器全局对象，供配置模块读取 index.html 暴露的配置。
globalThis.window = { PARTICLE_STORY_CONFIG: {} };

// 用指定阶段配置执行一次真实配置解析，减少每个测试中的重复设置逻辑。
function readMorphPhases(morphPhases) {
  // 每次都替换外部配置，确保测试之间不会共享可变状态。
  window.PARTICLE_STORY_CONFIG = morphPhases ? { morphPhases } : {};
  // 只返回本组测试关注的阶段边界。
  return getStoryConfig().morphPhases;
}

// 未配置时必须采用设计确认的 40% / 20% / 40% 默认节奏。
test('未配置时使用默认打散与汇聚边界', () => {
  // 默认 0.4 到 0.6 之间形成完整散点停留阶段。
  assert.deepEqual(readMorphPhases(), { scatterEnd: 0.4, gatherStart: 0.6 });
});

// 合法配置应该原样进入 Shader，便于不同项目调整滚动节奏。
test('接受顺序正确的自定义阶段边界', () => {
  // 30% 打散完成、75% 开始汇聚会产生更长的散点停留阶段。
  assert.deepEqual(readMorphPhases({ scatterEnd: 0.3, gatherStart: 0.75 }), {
    scatterEnd: 0.3,
    gatherStart: 0.75
  });
});

// 错误顺序会让阶段重叠，因此必须整体回退而不是静默产生跳变。
test('阶段顺序错误时回退默认边界', () => {
  // scatterEnd 晚于 gatherStart 时恢复设计默认值。
  assert.deepEqual(readMorphPhases({ scatterEnd: 0.8, gatherStart: 0.2 }), {
    scatterEnd: 0.4,
    gatherStart: 0.6
  });
});

// pinned 模式是长页面内沉浸板块的滚动契约，配置层需要给时间轴脚本稳定入口。
test('合并 pinned 舞台与三层环境粒子配置', () => {
  // 只覆盖中景数量时，远景和前景应继续保留默认参数。
  window.PARTICLE_STORY_CONFIG = {
    stageMode: 'pinned',
    sectionsPerViewport: 1.25,
    environment: {
      layers: {
        mid: { countRatio: 0.5, speed: 1.4 }
      }
    }
  };

  const config = getStoryConfig();

  assert.equal(config.stageMode, 'pinned');
  assert.equal(config.sectionsPerViewport, 1.25);
  assert.equal(config.environment.layers.mid.countRatio, 0.5);
  assert.equal(config.environment.layers.mid.speed, 1.4);
  assert.equal(typeof config.environment.layers.far.countRatio, 'number');
  assert.equal(typeof config.environment.layers.near.sizeScale, 'number');
});
