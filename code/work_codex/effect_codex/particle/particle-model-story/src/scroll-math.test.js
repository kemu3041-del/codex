// 使用 Node 内置测试验证章节坐标计算，不需要额外引入测试框架。
import test from 'node:test';
// 严格断言确保上方存在普通内容时仍能得到准确的页面滚动位置。
import assert from 'node:assert/strict';
// 导入生产环境实际使用的章节中心计算函数。
import { getSectionCenterScroll, getSectionCenters } from './scroll-math.js';

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
