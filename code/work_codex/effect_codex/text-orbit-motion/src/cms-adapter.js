export const defaultOrbitContent = {
  eyebrow: '3D Text Orbit',
  title: '文字环绕运动',
  description: '用真实 3D 轨道处理文字透视、前后穿插和空间遮挡，适合联系入口、品牌口号、活动主视觉和产品发布页首屏。',
  ringPhrase: 'Content',
  theme: {
    background: '#050305',
    accent: '#ff0f5b',
    accentDeep: '#65001f',
    text: '#f7f4f5'
  },
  motion: {
    speed: 0.22,
    tilt: 0.04
  }
};

const layoutDefaults = {
  gap: 0.18,
  minCount: 6,
  maxCount: 32,
  minRadius: 1.6,
  maxRadius: 5.0,
  targetRadius: 2.8,
  charWidth: 0.095,
  cjkWidth: 0.14,
};

function normalizeText(value, fallback = defaultOrbitContent.ringPhrase) {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  return text || fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function mergeObject(defaultValue, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultValue;
  return {
    ...defaultValue,
    ...value,
  };
}

/**
 * 根据文字字符串自动计算 ringCopies 和 ringRadius
 *
 * 原理：
 * - createTextTexture 用 190px 字体在 1024px 宽 canvas 上渲染
 * - createCurvedPanelGeometry 的 width=1.45 对应 3D 世界单位
 * - 文字在 canvas 中的宽度比例 × 1.45 ≈ 文字在 3D 中的实际宽度
 * - 圆周 = count × (textWidth3D + gap3D)
 * - radius = 圆周 / (2π)
 *
 * @param {string} phrase       - 要显示的文字
 * @param {object} [opts]
 * @param {number} [opts.gap]          - 面板间距（3D单位），默认 0.18
 * @param {number} [opts.minCount]     - 最少副本数，默认 6
 * @param {number} [opts.maxCount]     - 最多副本数，默认 32
 * @param {number} [opts.minRadius]    - 最小半径，默认 1.6
 * @param {number} [opts.maxRadius]    - 最大半径，默认 5.0
 * @param {number} [opts.targetRadius] - 目标视觉半径，默认 2.8
 * @param {number} [opts.charWidth]    - 每字符宽度系数，默认 0.095（Latin）
 * @param {number} [opts.cjkWidth]     - CJK字符宽度系数，默认 0.14
 */
export function computeRingLayout(phrase, opts = {}) {
  const {
    gap,
    minCount,
    maxCount,
    minRadius,
    maxRadius,
    targetRadius,
    charWidth,
    cjkWidth,
  } = {
    ...layoutDefaults,
    ...opts,
  };
  const normalizedPhrase = normalizeText(phrase);

  // 区分 CJK 字符（宽字符）和 Latin 字符
  const cjkRegex = /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/g;
  const cjkCount = (normalizedPhrase.match(cjkRegex) || []).length;
  const latinCount = Array.from(normalizedPhrase).length - cjkCount;

  // 估算文字在 3D 空间中的视觉宽度
  const textWidth3D = latinCount * charWidth + cjkCount * cjkWidth;

  // 面板单元宽度（文字宽 + 左右留白 + 间距）
  const unitWidth = textWidth3D + gap;

  // 以「视觉饱满」为目标：圆周刚好放下这些副本且略有留白
  // 理想 count 让文字之间有约 15% 的空隙比例
  const FILL_RATIO = 0.82; // 文字占圆周的比例，剩余是间距
  // 从 radius 倒推：先定一个「舒适半径」再算 count
  // 策略：迭代找最优 count，使得 radius 在合理范围内
  let bestCount = minCount;
  let bestRadius = minRadius;

  for (let count = minCount; count <= maxCount; count++) {
    const circumference = (count * unitWidth) / FILL_RATIO;
    const radius = circumference / (2 * Math.PI);

    if (radius > maxRadius) break; // 再增加也超出了

    // 找到第一个让 radius 落在舒适区间的 count
    if (radius >= minRadius) {
      bestCount = count;
      bestRadius = radius;
      // 继续往上找，直到 radius 超过目标半径就停（视觉最佳区间）
      if (radius >= targetRadius) break;
    }
  }

  // 半径取两位小数，count 保持整数
  return {
    ringCopies: bestCount,
    ringRadius: Math.round(bestRadius * 20) / 20, // 精确到 0.05
  };
}

/**
 * 将 CMS 原始数据 merge 进自动计算的布局参数
 */
export function mapCmsOrbitContent(cmsData = {}) {
  const source = cmsData && typeof cmsData === 'object' ? cmsData : {};
  const merged = {
    ...defaultOrbitContent,
    ...source,
    ringPhrase: normalizeText(source.ringPhrase),
    theme: mergeObject(defaultOrbitContent.theme, source.theme),
    motion: {
      speed: clampNumber(source.motion?.speed, 0, 1.2, defaultOrbitContent.motion.speed),
      tilt: clampNumber(source.motion?.tilt, -0.35, 0.35, defaultOrbitContent.motion.tilt),
    },
  };

  // 自动计算布局，手动指定的优先
  const layout = computeRingLayout(merged.ringPhrase);
  merged.ringCopies = Math.round(clampNumber(
    source.ringCopies,
    layoutDefaults.minCount,
    layoutDefaults.maxCount,
    layout.ringCopies
  ));
  merged.ringRadius = clampNumber(
    source.ringRadius,
    layoutDefaults.minRadius,
    layoutDefaults.maxRadius,
    layout.ringRadius
  );

  return merged;
}
