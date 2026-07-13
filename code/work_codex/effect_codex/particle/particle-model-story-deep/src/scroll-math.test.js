// 使用 Node 内置测试验证章节坐标计算，不需要额外引入测试框架。
import test from 'node:test';
// 严格断言确保上方存在普通内容时仍能得到准确的页面滚动位置。
import assert from 'node:assert/strict';
// 导入生产环境实际使用的章节中心计算函数。
import { getPinnedStoryState, getSectionCenterScroll, getSectionCenters } from './scroll-math.js';

// main 上方存在 1000px 内容时，不能继续使用 section.offsetTop 作为页面坐标。
test('章节中心使用页面绝对坐标计算', () => {
  // 模拟当前已滚动 400px，section 顶部距离视口顶部 600px。
  const section = {
    offsetHeight: 800,
    getBoundingClientRect: () => ({ top: 600 })
  };

  // 页面顶部位置为 600 + 400，章节中心再减去半个 700px 视口。
  assert.equal(getSectionCenterScroll(section, 400, 700), 1050);
});

// 批量计算必须显式传递页面环境，不能让 Array.map 的 index 覆盖 scrollY。
test('批量计算章节中心时不会混入 Array.map 的额外参数', () => {
  // 两个章节分别位于当前视口下方 600px 和 1400px。
  const sections = [600, 1400].map((top) => ({
    offsetHeight: 800,
    getBoundingClientRect: () => ({ top })
  }));

  // 当前滚动 400px、视口高度 700px 时，应得到两个有效的绝对滚动位置。
  assert.deepEqual(getSectionCenters(sections, 400, 700), [1050, 1850]);
});

// pinned 沉浸板块不再依赖真实章节中心点，而是用一段固定滚动距离驱动所有场景状态。
test('pinned 区域根据滚动位置计算段落与段间进度', () => {
  const state = getPinnedStoryState({
    scrollY: 1600,
    stageTop: 1000,
    viewportHeight: 800,
    sectionCount: 4,
    sectionsPerViewport: 1
  });

  assert.deepEqual(state, {
    progress: 0.1875,
    fromIndex: 0,
    toIndex: 1,
    segmentProgress: 0.75,
    activeIndex: 0,
    scrollDistance: 3200
  });
});

// 第四段需要拥有自己的 pinned 停留距离，不能刚进入就释放 pin 和隐藏背景。
test('pinned 区域给最后段落保留完整停留区', () => {
  const state = getPinnedStoryState({
    scrollY: 3800,
    stageTop: 1000,
    viewportHeight: 800,
    sectionCount: 4,
    sectionsPerViewport: 1
  });

  assert.equal(state.progress, 0.875);
  assert.equal(state.fromIndex, 3);
  assert.equal(state.toIndex, 3);
  assert.equal(state.segmentProgress, 1);
  assert.equal(state.activeIndex, 3);
  assert.equal(state.scrollDistance, 3200);
});
