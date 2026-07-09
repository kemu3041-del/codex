// 计算章节中心与视口中心重合时的页面滚动位置。
export function getSectionCenterScroll(
  section,
  scrollY = window.scrollY,
  viewportHeight = window.innerHeight
) {
  // getBoundingClientRect 返回视口坐标，加上当前滚动值后才是页面绝对坐标。
  const sectionDocumentTop = section.getBoundingClientRect().top + scrollY;
  // 使用页面绝对坐标后，main 上下增加任意内容都不会改变模型切换时机。
  return sectionDocumentTop + section.offsetHeight / 2 - viewportHeight / 2;
}

// 批量计算时使用箭头函数隔离 Array.map 自动传入的 index 和原数组参数。
export function getSectionCenters(
  sections,
  scrollY = window.scrollY,
  viewportHeight = window.innerHeight
) {
  // 显式传递滚动值和视口高度，确保每个章节使用同一套页面坐标环境。
  return sections.map((section) => getSectionCenterScroll(section, scrollY, viewportHeight));
}
