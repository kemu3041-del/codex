import { getSectionCenters } from './scroll-math.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const timelineConfig = {
  sectionSelector: '.particle-story-section',
  animatedSelector: '[data-story-animate]',
  copyStart: 'top 88%',
  copyEnd: 'bottom 12%',
  scrub: 0.45,
  enterY: 54,
  exitY: -42,
  ...window.PARTICLE_STORY_TIMELINE
};

gsap.registerPlugin(ScrollTrigger);

const sections = gsap.utils.toArray(timelineConfig.sectionSelector);
const progressCurrent = document.getElementById('story-progress-current');
const progressTotal = document.getElementById('story-progress-total');
const progressBar = document.getElementById('story-progress-bar');
let modelScrollTrigger = null;
let storyVisibilityTrigger = null;

function setProgress(index) {
  const current = Math.min(sections.length, index + 1);
  progressCurrent.textContent = String(current).padStart(2, '0');
  progressTotal.textContent = String(sections.length).padStart(2, '0');
  progressBar.style.transform = `scaleX(${current / sections.length})`;
}

function getModelIndex(section, fallbackIndex) {
  const modelIndex = Number(section.dataset.modelIndex);
  return Number.isFinite(modelIndex) ? modelIndex : fallbackIndex;
}

function getModelX(section, fallbackX = 0) {
  const modelX = Number(section.dataset.modelX);
  return Number.isFinite(modelX) ? modelX : fallbackX;
}

function getShapeIndex(section, fallbackIndex = 0) {
  const shapeIndex = Number(section.dataset.shapeIndex);
  return Number.isFinite(shapeIndex) ? shapeIndex : fallbackIndex;
}

function exposeMorphState(
  fromIndex,
  toIndex,
  progress,
  storyProgress,
  modelX,
  fromShapeIndex,
  toShapeIndex,
  shapeProgress
) {
  document.documentElement.dataset.particleFrom = String(fromIndex);
  document.documentElement.dataset.particleTo = String(toIndex);
  document.documentElement.dataset.particleProgress = progress.toFixed(4);
  document.documentElement.dataset.particleStoryProgress = storyProgress.toFixed(4);
  document.documentElement.dataset.particleModelTargetX = modelX.toFixed(2);
  document.documentElement.dataset.particleShapeFrom = String(fromShapeIndex);
  document.documentElement.dataset.particleShapeTo = String(toShapeIndex);
  document.documentElement.dataset.particleShapeProgress = shapeProgress.toFixed(4);
}

function applyMorph(
  fromIndex,
  toIndex,
  progress,
  storyProgress = progress,
  modelX = 0,
  fromShapeIndex = 0,
  toShapeIndex = fromShapeIndex,
  shapeProgress = 0
) {
  exposeMorphState(fromIndex, toIndex, progress, storyProgress, modelX, fromShapeIndex, toShapeIndex, shapeProgress);
  window.dispatchEvent(new CustomEvent('particle-story-morph', {
    detail: {
      fromIndex,
      toIndex,
      progress,
      storyProgress,
      modelX,
      fromShapeIndex,
      toShapeIndex,
      shapeProgress
    }
  }));
}

function syncModelToScroll() {
  if (sections.length === 0) return;

  const scrollPosition = window.scrollY;
  // 统一批量计算页面绝对坐标，避免 Array.map 的 index 被误当成 window.scrollY。
  const centers = getSectionCenters(sections);
  const lastIndex = sections.length - 1;
  const storyProgress = lastIndex > 0
    ? gsap.utils.clamp(0, 1, gsap.utils.mapRange(centers[0], centers[lastIndex], 0, 1, scrollPosition))
    : 0;

  if (scrollPosition <= centers[0]) {
    const modelIndex = getModelIndex(sections[0], 0);
    const shapeIndex = getShapeIndex(sections[0], 0);
    applyMorph(modelIndex, modelIndex, 0, 0, getModelX(sections[0]), shapeIndex, shapeIndex, 0);
    setProgress(0);
    return;
  }

  if (scrollPosition >= centers[lastIndex]) {
    const modelIndex = getModelIndex(sections[lastIndex], lastIndex);
    const shapeIndex = getShapeIndex(sections[lastIndex], lastIndex);
    applyMorph(modelIndex, modelIndex, 1, 1, getModelX(sections[lastIndex]), shapeIndex, shapeIndex, 1);
    setProgress(lastIndex);
    return;
  }

  for (let index = 0; index < lastIndex; index += 1) {
    if (scrollPosition >= centers[index] && scrollPosition < centers[index + 1]) {
      const progress = gsap.utils.mapRange(
        centers[index],
        centers[index + 1],
        0,
        1,
        scrollPosition
      );
      const fromModelIndex = getModelIndex(sections[index], index);
      const toModelIndex = getModelIndex(sections[index + 1], index + 1);
      const modelX = gsap.utils.interpolate(
        getModelX(sections[index]),
        getModelX(sections[index + 1]),
        progress
      );
      const fromShapeIndex = getShapeIndex(sections[index], index);
      const toShapeIndex = getShapeIndex(sections[index + 1], index + 1);
      // 只在章节交界附近交叉淡入淡出，避免整段滚动都同时显示两个背景形状。
      const shapeProgress = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.36, 0.64, 0, 1, progress));
      applyMorph(
        fromModelIndex,
        toModelIndex,
        progress,
        storyProgress,
        modelX,
        fromShapeIndex,
        toShapeIndex,
        shapeProgress
      );
      setProgress(progress < 0.5 ? index : index + 1);
      return;
    }
  }
}

function createStoryVisibilityTrigger() {
  const storyContent = document.getElementById('particle-story-content');

  // 粒子 Canvas 使用 fixed 定位，因此通过 main 的可见状态限制它只出现在叙事区域。
  storyVisibilityTrigger = ScrollTrigger.create({
    trigger: storyContent,
    start: 'top bottom',
    end: 'bottom top',
    onToggle(self) {
      document.documentElement.classList.toggle('particle-story-active', self.isActive);
    },
    onRefresh(self) {
      document.documentElement.classList.toggle('particle-story-active', self.isActive);
    }
  });
}

function createCopyTimelines() {
  sections.forEach((section) => {
    const animatedItems = section.querySelectorAll(timelineConfig.animatedSelector);
    const enterDuration = Number(section.dataset.copyIn) || 0.2;
    const exitDuration = Number(section.dataset.copyOut) || 0.22;
    const holdDuration = Math.max(0.05, 1 - enterDuration - exitDuration);

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: timelineConfig.copyStart,
        end: timelineConfig.copyEnd,
        scrub: timelineConfig.scrub
      }
    })
      .fromTo(animatedItems, {
        autoAlpha: 0,
        y: timelineConfig.enterY
      }, {
        autoAlpha: 1,
        y: 0,
        stagger: enterDuration / Math.max(animatedItems.length, 1),
        duration: enterDuration,
        ease: 'power2.out'
      })
      .to(animatedItems, { duration: holdDuration })
      .to(animatedItems, {
        autoAlpha: 0,
        y: timelineConfig.exitY,
        duration: exitDuration,
        ease: 'power2.in'
      });
  });
}

function createModelTimeline() {
  modelScrollTrigger = ScrollTrigger.create({
    trigger: document.getElementById('particle-story-content'),
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: syncModelToScroll,
    onRefresh: syncModelToScroll
  });
}

function initializeTimeline() {
  // 显隐触发器在动态效果降级时仍需运行，避免静态 Logo 覆盖普通页面内容。
  createStoryVisibilityTrigger();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(timelineConfig.animatedSelector, { autoAlpha: 1, y: 0 });
    return;
  }

  createCopyTimelines();
  createModelTimeline();
  ScrollTrigger.refresh();
  syncModelToScroll();
}

window.addEventListener('particle-story-ready', syncModelToScroll);
window.addEventListener('resize', syncModelToScroll, { passive: true });
initializeTimeline();

window.destroyParticleStoryTimeline = function () {
  storyVisibilityTrigger?.kill();
  modelScrollTrigger?.kill();
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  window.removeEventListener('particle-story-ready', syncModelToScroll);
  window.removeEventListener('resize', syncModelToScroll);
  document.documentElement.classList.remove('particle-story-active');
  delete window.destroyParticleStoryTimeline;
};
