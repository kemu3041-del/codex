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

// pinned 沉浸板块使用固定滚动距离驱动内部段落，不依赖每个 section 的真实页面坐标。
export function getPinnedStoryState({
  scrollY,
  stageTop,
  viewportHeight,
  sectionCount,
  sectionsPerViewport = 1
}) {
  const safeSectionCount = Math.max(1, Math.round(sectionCount || 1));
  const safeViewportHeight = Math.max(1, viewportHeight || 1);
  const safeSectionsPerViewport = Math.max(0.5, sectionsPerViewport || 1);
  const transitionCount = Math.max(1, safeSectionCount - 1);
  // 每个段落都保留一个视口高度的 pinned 停留区，最后一段不会被挤到 pin 释放边界。
  const scrollDistance = safeSectionCount * safeViewportHeight * safeSectionsPerViewport;
  const rawProgress = (scrollY - stageTop) / scrollDistance;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const sectionProgress = progress * safeSectionCount;
  const activeIndex = Math.min(safeSectionCount - 1, Math.floor(sectionProgress));
  const localProgress = activeIndex >= safeSectionCount - 1
    ? 1
    : sectionProgress - activeIndex;
  const fromIndex = Math.min(transitionCount, activeIndex);
  const toIndex = activeIndex >= safeSectionCount - 1
    ? safeSectionCount - 1
    : Math.min(safeSectionCount - 1, fromIndex + 1);
  const segmentProgress = activeIndex >= safeSectionCount - 1 ? 1 : localProgress;

  return {
    progress,
    fromIndex,
    toIndex,
    segmentProgress,
    activeIndex,
    scrollDistance
  };
}
