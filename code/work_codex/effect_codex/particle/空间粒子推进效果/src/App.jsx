import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const desktopProfile = {
  ambientCount: 4000,
  contourCount: 8600,
  pixelRatio: 1.65
};

const mobileProfile = {
  ambientCount: 4200,
  contourCount: 5000,
  pixelRatio: 1.35
};

const particleTuning = {
  // 背景粒子透明度强度：建议 0.15-1.5。越大背景散点越明显，只影响随机背景层。
  ambientOpacity: 0.72,
  // 背景粒子 alpha 上限：建议 0.08-0.45。越大单个背景圆点越实。
  ambientAlphaMax: 0.2,
  // 轮廓粒子透明度强度：建议 0.8-4。越大几何外轮廓越清晰，只影响轮廓层。
  contourOpacity: 1.2,
  // 轮廓粒子 alpha 上限：建议 0.25-0.9。越大轮廓点越亮、越有冲击。
  contourAlphaMax: 0.38,
  // 粒子柔边指数：建议 1.2-10。越大点越硬越锐，越小光晕越柔。
  haloPower: 7.42,
  // 全局滚动旋转强度：建议 -12 到 12。背景和轮廓共用，保证运动轨迹一致。
  fieldRotation: -1.18,
  // 轮廓跟随背景推进的强度：建议 0.25-1。越大越同步背景冲击，过大会冲出相机视野。
  contourTravelStrength: 0.48
};

const ambientVertexShader = `
  attribute float aSize;
  attribute float aDepth;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uFieldRotation;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec3 transformed = position;
    float phase = aSeed * 31.416;

    // 滚动时让不同深度的粒子产生不同速度，形成前后层视差。
    transformed.z += uScroll * mix(12.0, 38.0, aDepth);
    transformed.x += sin(uTime * 0.18 + phase + uScroll * 8.0) * mix(0.08, 0.52, aDepth);
    transformed.y += cos(uTime * 0.14 + phase * 0.73 + uScroll * 5.0) * mix(0.06, 0.34, aDepth);

    // 只保留非常轻的空间旋转，避免默认背景形成具象流线。
    float angle = (uScroll - 0.5) * uFieldRotation * mix(0.15, 0.8, aDepth);
    float c = cos(angle);
    float s = sin(angle);
    transformed.xz = vec2(transformed.x * c - transformed.z * s, transformed.x * s + transformed.z * c);

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    float perspective = 300.0 / max(1.0, -viewPosition.z);
    float nearBoost = mix(0.65, 2.35, aDepth);
    gl_PointSize = max(0.75, aSize * nearBoost * perspective * uPixelRatio);
    gl_Position = projectionMatrix * viewPosition;

    vColor = aColor;
    vOpacity = mix(0.22, 0.82, aDepth) * mix(0.72, 1.08, uScroll);
  }
`;

const contourVertexShader = `
  attribute vec3 aStartCenter;
  attribute vec3 aEndCenter;
  attribute vec3 aColor;
  // 属性合并说明：WebGL 对 vertex attribute 数量有硬上限（多数设备 16 个）。
  // 原来 aStart/aDuration/aStartScale/aEndScale/aSize/aSeed/aArcX/aArcY/aDensity/aDepth
  // 这 10 个独立 float attribute，加上 aLocal/aStartCenter/aEndCenter/aColor 以及
  // three.js 自动注入的 position/normal/uv，会超过上限导致 shader 编译校验失败
  // （VALIDATE_STATUS false: Too many attributes），使轮廓层整体渲染失败。
  // 这里把它们打包进 vec4/vec2，并直接复用内置的 position 代替重复的 aLocal。
  attribute vec4 aTimeScale;   // x: aStart, y: aDuration, z: aStartScale, w: aEndScale
  attribute vec4 aVisual;      // x: aSize, y: aSeed, z: aArcX, w: aArcY
  attribute vec2 aExtra;       // x: aDensity, y: aDepth

  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uFieldRotation;
  uniform float uContourTravelStrength;
  uniform float uDebugMode;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float aStart = aTimeScale.x;
    float aDuration = aTimeScale.y;
    float aStartScale = aTimeScale.z;
    float aEndScale = aTimeScale.w;
    float aSize = aVisual.x;
    float aSeed = aVisual.y;
    float aArcX = aVisual.z;
    float aArcY = aVisual.w;
    float aDensity = aExtra.x;
    float aDepth = aExtra.y;

    float rawProgress = clamp((uScroll - aStart) / aDuration, 0.0, 1.0);
    float revealProgress = smoothstep(0.0, 0.18, rawProgress);
    // 0-0.18 只负责透明度显现；0.28 之后才开始放大推进，避免轮廓由小变大冒出来。
    float pushProgress = smoothstep(0.28, 1.0, rawProgress);
    float disappear = 1.0 - smoothstep(0.82, 1.0, rawProgress);
    float shellOpacity = revealProgress * disappear;

    // 几何轮廓从右侧空间进入，再沿弧线向左侧近景掠过，强化滚动推进感。
    vec3 center = mix(aStartCenter, aEndCenter, pushProgress);
    center.x += sin(pushProgress * 3.1415926) * aArcX;
    center.y += sin(pushProgress * 3.1415926) * aArcY;

    // 轮廓先按默认大小透明度显现，显现完成后才随滚动放大推进。
    // 直接复用内置 position（等价于原来的 aLocal），无需重复的属性。
    float scaleValue = mix(aStartScale, aEndScale, pow(pushProgress, 0.86));
    vec3 transformed = center + position * scaleValue;
    transformed.x += sin(uTime * 0.16 + aSeed * 18.0) * 0.035 * scaleValue;
    transformed.y += cos(uTime * 0.13 + aSeed * 11.0) * 0.025 * scaleValue;

    // 和背景粒子使用同一套全局滚动轨迹，避免轮廓层与背景层产生时差或脱节。
    // uContourTravelStrength 控制轮廓跟随幅度，避免完全套用背景 z 推进后穿过相机。
    float phase = aSeed * 31.416;
    transformed.z += uScroll * mix(12.0, 38.0, aDepth) * uContourTravelStrength;
    transformed.x += sin(uTime * 0.18 + phase + uScroll * 8.0) * mix(0.08, 0.52, aDepth) * uContourTravelStrength;
    transformed.y += cos(uTime * 0.14 + phase * 0.73 + uScroll * 5.0) * mix(0.06, 0.34, aDepth) * uContourTravelStrength;
    float angle = (uScroll - 0.5) * uFieldRotation * mix(0.15, 0.8, aDepth);
    float c = cos(angle);
    float s = sin(angle);
    transformed.xz = vec2(transformed.x * c - transformed.z * s, transformed.x * s + transformed.z * c);

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    float perspective = 310.0 / max(1.0, -viewPosition.z);
    gl_PointSize = max(0.8, aSize * perspective * uPixelRatio * mix(0.85, 1.45, pushProgress));
    if (uDebugMode > 0.5) {
      // 调试模式：无视 aSize/透视/pushProgress，强制给一个肉眼可见的固定大小。
      gl_PointSize = 16.0 * uPixelRatio;
    }
    gl_Position = projectionMatrix * viewPosition;

    vColor = aColor;
    vOpacity = shellOpacity * aDensity * mix(1.25, 1.7, pushProgress);
    if (uDebugMode > 0.5) {
      vOpacity = 1.0;
    }
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  uniform float uOpacityStrength;
  uniform float uAlphaMax;
  uniform float uHaloPower;
  // 调试开关：>0.5 时无视所有透明度/密度计算，强制输出实心亮色点，
  // 用来排查"点到底有没有被画出来" vs "点画出来了但alpha算成0"。
  uniform float uDebugMode;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5) discard;

    if (uDebugMode > 0.5) {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
      return;
    }

    float core = 1.0 - smoothstep(0.0, 0.14, distanceToCenter);
    // halo 控制的是 每个粒子圆点从中心到边缘的透明度衰减形状，也就是粒子的“光晕/柔边”。
    //distanceToCenter是gl_PointCoord到圆点中心的距离，0.0表示中心，0.5表示圆点边缘。
    // uHaloPower 修改范围 1.2-10：越小光晕越软，越大中心越硬、边缘越锐。
    float halo = pow(1.0 - smoothstep(0.05, 0.5, distanceToCenter), uHaloPower);
    vec3 color = mix(vColor, vec3(1.0), core * 0.16);
    // uOpacityStrength 和 uAlphaMax 由背景/轮廓两个材质分别传入，透明度互不影响。
    float alpha = clamp((halo + core * 0.32) * vOpacity * uOpacityStrength, 0.0, uAlphaMax);
    gl_FragColor = vec4(color * 1.18, alpha);
  }
`;

function seededRandom(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function randomRange(seed, min, max) {
  return THREE.MathUtils.lerp(min, max, seededRandom(seed));
}

function pickParticleColor(seed) {
  const gold = new THREE.Color('#d8df77');
  const white = new THREE.Color('#f0f7ed');
  const green = new THREE.Color('#42c956');
  const deep = new THREE.Color('#0a2919');
  const colorPick = seededRandom(seed * 9.31);
  const color = new THREE.Color();

  if (colorPick < 0.28) {
    color.copy(gold).lerp(white, seededRandom(seed * 4.9) * 0.2);
  } else if (colorPick < 0.64) {
    color.copy(white).lerp(green, seededRandom(seed * 6.4) * 0.18);
  } else {
    color.copy(green).lerp(deep, seededRandom(seed * 8.7) * 0.58);
  }

  return color;
}

function sphericalShellPoint(seed, radius = 1) {
  const theta = seededRandom(seed * 2.1) * Math.PI * 2;
  const vertical = randomRange(seed * 3.2, -1, 1);
  const ring = Math.sqrt(Math.max(0.001, 1 - vertical * vertical));
  return new THREE.Vector3(
    Math.cos(theta) * ring * radius,
    vertical * radius,
    Math.sin(theta) * ring * radius
  );
}

function peanutShellPoint(seed) {
  const lobeSide = seededRandom(seed * 5.8) > 0.5 ? 1 : -1;
  const point = sphericalShellPoint(seed, 1);
  point.x = point.x * 0.9 + lobeSide * 0.82;
  point.y *= 1.12;
  point.z *= 0.78;

  // 中间收腰让两个独立高密度区看起来像花生形外轮廓。
  const pinch = 1 - Math.exp(-Math.abs(point.x) * 1.35) * 0.42;
  point.y *= pinch;
  point.z *= pinch;
  return point;
}

function torusShellPoint(seed) {
  const majorAngle = seededRandom(seed * 7.2) * Math.PI * 2;
  const minorAngle = seededRandom(seed * 8.6) * Math.PI * 2;
  const majorRadius = 1.25;
  const minorRadius = 0.32;
  return new THREE.Vector3(
    (majorRadius + Math.cos(minorAngle) * minorRadius) * Math.cos(majorAngle),
    Math.sin(minorAngle) * minorRadius * 1.45,
    (majorRadius + Math.cos(minorAngle) * minorRadius) * Math.sin(majorAngle) * 0.72
  );
}

function ellipsoidShellPoint(seed) {
  const point = sphericalShellPoint(seed, 1);
  point.x *= 1.6;
  point.y *= 0.86;
  point.z *= 0.62;
  return point;
}

function arcShellPoint(seed) {
  const angle = randomRange(seed * 10.2, -0.18, Math.PI * 1.28);
  const radius = randomRange(seed * 11.4, 0.82, 1.2);
  const thickness = randomRange(seed * 12.9, -0.18, 0.18);
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * 1.08,
    thickness
  );
}

function createContourPoint(type, seed) {
  if (type === 'peanut') return peanutShellPoint(seed);
  if (type === 'torus') return torusShellPoint(seed);
  if (type === 'ellipsoid') return ellipsoidShellPoint(seed);
  if (type === 'arc') return arcShellPoint(seed);
  return sphericalShellPoint(seed);
}

function buildAmbientData(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const depths = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const seed = index + 1;
    const depth = Math.pow(seededRandom(seed * 2.17), 0.52);
    const color = pickParticleColor(seed);
    const nearParticle = seededRandom(seed * 3.71) > 0.82;
    const xSpread = nearParticle ? 21 : 18;
    const ySpread = nearParticle ? 10 : 8.2;
    const zMin = nearParticle ? -18 : -38;
    const zMax = nearParticle ? 6 : -4;

    // 默认环境层保持随机散落，只靠深度和尺寸形成空间感，不生成具象形体。
    positions[offset] = randomRange(seed * 4.3, -xSpread, xSpread);
    positions[offset + 1] = randomRange(seed * 6.4, -ySpread, ySpread);
    positions[offset + 2] = randomRange(seed * 7.8, zMin, zMax);
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
    /*
    sizes[index] = randomRange(seed * 8.91, 最小粒子, 普通粒子的最大基础值) + Math.pow(seededRandom(seed * 9.2), 8) * 少量大颗粒/虚化颗粒的增强值;
    0.028：最小粒子
    0.11：普通粒子的最大基础值
    0.42：少量大颗粒/虚化颗粒的增强值
    */ 

    sizes[index] = randomRange(seed * 8.91, 0.528, 0.91) + Math.pow(seededRandom(seed * 9.2), 8) * 0.82;
    depths[index] = depth;
    seeds[index] = seededRandom(seed * 10.4);
  }

  return { positions, colors, sizes, depths, seeds };
}

// 轮廓几何体事件配置：
// 每一个对象代表一个“隐形几何体粒子轮廓”的出现、显现、推进、放大、离场过程。
// 滚动总进度 uScroll 范围是 0-1，start/duration 决定这个轮廓在哪一段滚动里出现。
// 坐标采用 Three.js 空间坐标：[x, y, z]，x 左负右正，y 下负上正，z 越负越远、越接近 0/正值越靠近镜头。
// 后续 peanut / torus / ellipsoid / arc 的参数含义和 sphere 完全一致。
const contourEvents = [
  {
    // 几何轮廓类型：sphere=球形壳层；peanut=花生形；torus=环形；ellipsoid=椭球；arc=弧形片段。
    type: 'sphere',

    // 出现起点：表示滚动到 6% 时开始进入这个轮廓事件。
    // 建议范围 0-1。数值越小越早出现；相邻轮廓的 start 可以略微重叠，画面会更连续。
    start: 0.06,

    // 持续时长：表示这个轮廓占用 42% 的滚动区间。
    // 实际结束位置约等于 start + duration。数值越大，轮廓显现和放大的过程越慢。
    // 建议范围 0.18-0.5；太短会闪现，太长会拖慢节奏。
    duration: 0.42,

    // 粒子数量占比：当前形状使用 contourCount 总粒子数的 24%。
    // 所有 countRatio 加起来建议接近 1；越大该轮廓越密，越小越稀疏。
    countRatio: 0.24,

    // 起始中心点：[x, y, z]。
    // x=5.8 表示偏右出现；y=-0.8 表示略偏下；z=-18 表示在远处深度空间里出现。
    // 想让轮廓从右侧来：x 设为正数；想更远出现：z 设为更负，例如 -22、-28。
    startCenter: [5.8, -0.8, -18],

    // 结束中心点：[x, y, z]。
    // x=-12.8 表示推进后偏向左侧/屏幕外；y=1.2 表示略向上；z=2.6 表示非常靠近镜头。
    // z 越接近镜头，透视放大越强；太大可能直接穿过相机导致看不见。
    endCenter: [-12.8, 1.2, 2.6],

    // 初始整体尺寸：轮廓刚显现时的几何体大小。
    // 注意：这不是单个粒子圆点大小，而是整个球形轮廓的半径缩放。
    // 数值越大，刚出现时轮廓越大；建议 1.5-7，过大容易首屏只看到局部边缘。
    startScale: 6.85,

    // 结束整体尺寸：滚动推进后轮廓最终放大的整体大小。
    // 数值越大，越容易占满屏幕并形成冲击感；建议 6-16。
    // 如果想要“冲出屏幕”的近景效果，主要调大这个值。
    endScale: 12.8,

    // 横向弧线偏移：控制推进过程中 x 方向额外弧线运动。
    // 负数表示中段向左弯，正数表示中段向右弯；绝对值越大弧线越明显。
    // 建议 -6 到 6。想弱化“转圈感”，就把绝对值调小。
    arcX: -3.2,

    // 纵向弧线偏移：控制推进过程中 y 方向额外弧线运动。
    // 正数表示中段向上拱，负数表示中段向下压；绝对值越大上下摆动越明显。
    // 建议 -4 到 4。太大会像物体绕场飞行。
    arcY: 1.45,

    // 粒子密度配置：只影响这个轮廓“哪里密、哪里疏、断裂多少”。
    // visibleRatio 建议 0.35-0.9：越小整体可见粒子越少。
    // clusterStrength 建议 0.4-1.8：越大局部团块越明显。
    // holeRatio 建议 0-0.45：越大随机空洞越多。
    densityProfile: { visibleRatio: 0.56, clusterStrength: 1.25, holeRatio: 0.18 }
  },
  {
    type: 'peanut',
    start: 0.22,
    duration: 0.36,
    countRatio: 0.24,
    startCenter: [8.6, 2.2, -20],
    endCenter: [-7.4, -1.2, 2.8],
    startScale: 5.7,
    endScale: 10.2,
    arcX: -4.1,
    arcY: -2.25,
    densityProfile: { visibleRatio: 0.82, clusterStrength: 1.55, holeRatio: 0.08 }
  },
  {
    type: 'torus',
    start: 0.44,
    duration: 0.32,
    countRatio: 0.18,
    startCenter: [9.4, -2.0, -21],
    endCenter: [-1.8, 4.8, 2.8],
    startScale: 5.55,
    endScale: 9.6,
    arcX: -3.3,
    arcY: 2.6,
    densityProfile: { visibleRatio: 0.44, clusterStrength: 1.1, holeRatio: 0.28 }
  },
  {
    type: 'ellipsoid',
    start: 0.6,
    duration: 0.31,
    countRatio: 0.18,
    startCenter: [7.8, 3.5, -21],
    endCenter: [-14.5, 1.4, 3.0],
    startScale: 5.8,
    endScale: 12.2,
    arcX: -3.8,
    arcY: -1.6,
    densityProfile: { visibleRatio: 0.72, clusterStrength: 1.7, holeRatio: 0.12 }
  },
  {
    type: 'arc',
    start: 0.76,
    duration: 0.28,
    countRatio: 0.16,
    startCenter: [8.8, -3.4, -21],
    endCenter: [-8.8, 3.2, 3.2],
    startScale: 6.0,
    endScale: 13.4,
    arcX: -4.4,
    arcY: 2.4,
    densityProfile: { visibleRatio: 0.5, clusterStrength: 1.35, holeRatio: 0.22 }
  }
];

function buildContourData(totalCount) {
  const positions = new Float32Array(totalCount * 3);
  const startCenters = new Float32Array(totalCount * 3);
  const endCenters = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  // 打包属性：timeScale(aStart,aDuration,aStartScale,aEndScale) / visual(aSize,aSeed,aArcX,aArcY) / extra(aDensity,aDepth)
  const timeScale = new Float32Array(totalCount * 4);
  const visual = new Float32Array(totalCount * 4);
  const extra = new Float32Array(totalCount * 2);
  let cursor = 0;

  contourEvents.forEach((event, eventIndex) => {
    const count = eventIndex === contourEvents.length - 1
      ? totalCount - cursor
      : Math.floor(totalCount * event.countRatio);

    for (let localIndex = 0; localIndex < count && cursor < totalCount; localIndex += 1) {
      const offset3 = cursor * 3;
      const offset4 = cursor * 4;
      const offset2 = cursor * 2;
      const seed = (eventIndex + 1) * 10000 + localIndex + 1;
      const local = createContourPoint(event.type, seed);
      const color = pickParticleColor(seed);
      const densityProfile = event.densityProfile || { visibleRatio: 0.68, clusterStrength: 1.2, holeRatio: 0.14 };
      const clusterA = Math.sin(local.x * 3.8 + local.y * 2.1 + local.z * 2.7 + eventIndex * 1.7);
      const clusterB = Math.sin(local.x * 8.4 - local.y * 5.6 + seededRandom(seed * 2.2) * 6.28);
      const clusterValue = THREE.MathUtils.clamp((clusterA * 0.62 + clusterB * 0.38 + 1) * 0.5, 0, 1);
      const clusterMask = Math.pow(clusterValue, 1.0 / densityProfile.clusterStrength);
      const visibleGate = densityProfile.visibleRatio * 0.72 + clusterMask * 0.34;
      const isVisible = seededRandom(seed * 14.7) < visibleGate && seededRandom(seed * 16.9) > densityProfile.holeRatio;

      // 轮廓不再均匀铺满壳层：事件级 visibleRatio 控制整体点量，
      // clusterMask 生成局部密集岛，holeRatio 生成随机空洞和断裂。
      const density = isVisible
        ? THREE.MathUtils.clamp(randomRange(seed * 3.3, 0.22, 0.82) + clusterMask * 0.55, 0.05, 1.35)
        : randomRange(seed * 3.7, 0.0, 0.035);

      positions[offset3] = local.x;
      positions[offset3 + 1] = local.y;
      positions[offset3 + 2] = local.z;
      startCenters.set(event.startCenter, offset3);
      endCenters.set(event.endCenter, offset3);
      colors[offset3] = color.r;
      colors[offset3 + 1] = color.g;
      colors[offset3 + 2] = color.b;

      timeScale[offset4] = event.start + randomRange(seed * 4.2, -0.018, 0.018);
      timeScale[offset4 + 1] = event.duration + randomRange(seed * 5.1, -0.018, 0.025);
      timeScale[offset4 + 2] = event.startScale * randomRange(seed * 6.2, 0.92, 1.12);
      timeScale[offset4 + 3] = event.endScale * randomRange(seed * 7.4, 0.88, 1.14);

      /*
      size = randomRange(seed * 8.5, 轮廓粒子最小值, 轮廓粒子普通最大值) + Math.pow(seededRandom(seed * 9.8), 7.5) * 少量大颗粒增强  ;
      0.04：轮廓粒子最小值
      0.15：轮廓粒子普通最大值
      0.38：少量大颗粒增强
      */
      visual[offset4] = (
        randomRange(seed * 8.5, 0.04, 0.95)
        + Math.pow(seededRandom(seed * 9.8), 7.5) * 0.28
      ) * THREE.MathUtils.lerp(0.78, 1.16, clusterMask);
      visual[offset4 + 1] = seededRandom(seed * 10.8);
      visual[offset4 + 2] = event.arcX * randomRange(seed * 11.8, 0.78, 1.2);
      visual[offset4 + 3] = event.arcY * randomRange(seed * 12.8, 0.72, 1.18);

      extra[offset2] = density;
      // 轮廓粒子深度参数用于复用背景层同一套滚动轨迹，建议范围 0-1。
      extra[offset2 + 1] = randomRange(seed * 13.8, 0.42, 0.96);

      cursor += 1;
    }
  });

  return {
    positions,
    startCenters,
    endCenters,
    colors,
    timeScale,
    visual,
    extra
  };
}

function useScrollProgress() {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const next = maxScroll > 0 ? THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1) : 0;
      progressRef.current = next;
      setProgress(next);
      frameId = 0;
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return [progress, progressRef];
}

function useDeviceProfile() {
  const [profile, setProfile] = useState(() => (
    window.matchMedia('(max-width: 760px)').matches ? mobileProfile : desktopProfile
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setProfile(media.matches ? mobileProfile : desktopProfile);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return profile;
}

function AmbientParticles({ profile, scrollRef }) {
  const materialRef = useRef(null);
  const { gl } = useThree();
  const data = useMemo(() => buildAmbientData(profile.ambientCount), [profile.ambientCount]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPixelRatio: { value: Math.min(gl.getPixelRatio(), profile.pixelRatio) },
    uFieldRotation: { value: particleTuning.fieldRotation },
    uOpacityStrength: { value: particleTuning.ambientOpacity },
    uAlphaMax: { value: particleTuning.ambientAlphaMax },
    uHaloPower: { value: particleTuning.haloPower },
    uDebugMode: { value: 0.0 }
  }), [gl, profile.pixelRatio]);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = THREE.MathUtils.damp(uniforms.uScroll.value, scrollRef.current, 4.2, delta);
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = uniforms.uTime.value;
      materialRef.current.uniforms.uScroll.value = uniforms.uScroll.value;
    }
  });

  return (
    <points frustumCulled={false} renderOrder={1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-aDepth" args={[data.depths, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={ambientVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ContourParticles({ profile, scrollRef }) {
  const materialRef = useRef(null);
  const { gl } = useThree();
  const data = useMemo(() => buildContourData(profile.contourCount), [profile.contourCount]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPixelRatio: { value: Math.min(gl.getPixelRatio(), profile.pixelRatio) },
    uFieldRotation: { value: particleTuning.fieldRotation },
    uContourTravelStrength: { value: particleTuning.contourTravelStrength },
    uOpacityStrength: { value: particleTuning.contourOpacity },
    uAlphaMax: { value: particleTuning.contourAlphaMax },
    uHaloPower: { value: particleTuning.haloPower },
    // TODO 调试完成后改回 0.0：1.0 会强制轮廓粒子变成固定大小的亮粉色实心点，方便排查可见性问题。
    uDebugMode: { value: 0.0 }
  }), [gl, profile.pixelRatio]);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = THREE.MathUtils.damp(uniforms.uScroll.value, scrollRef.current, 4.2, delta);
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = uniforms.uTime.value;
      materialRef.current.uniforms.uScroll.value = uniforms.uScroll.value;
    }
  });

  return (
    <points frustumCulled={false} renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aStartCenter" args={[data.startCenters, 3]} />
        <bufferAttribute attach="attributes-aEndCenter" args={[data.endCenters, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aTimeScale" args={[data.timeScale, 4]} />
        <bufferAttribute attach="attributes-aVisual" args={[data.visual, 4]} />
        <bufferAttribute attach="attributes-aExtra" args={[data.extra, 2]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={contourVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CameraRig({ scrollRef }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const progress = scrollRef.current;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, THREE.MathUtils.lerp(1.35, -1.85, progress), 3.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, THREE.MathUtils.lerp(0.25, 0.65, progress), 3.2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, THREE.MathUtils.lerp(14.2, 6.5, progress), 3.2, delta);
    camera.lookAt(THREE.MathUtils.lerp(0.6, -1.4, progress), 0.2, -9.5);
  });

  return null;
}

function ParticleScene({ profile, scrollRef }) {
  return (
    <Canvas
      camera={{ position: [0.8, 0.2, 13.5], fov: 48, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, profile.pixelRatio]}
    >
      <color attach="background" args={['#07391f']} />
      <fog attach="fog" args={['#07391f', 9, 36]} />
      {profile.ambientCount > 0 && <AmbientParticles profile={profile} scrollRef={scrollRef} />}
      {profile.contourCount > 0 && <ContourParticles profile={profile} scrollRef={scrollRef} />}
      <CameraRig scrollRef={scrollRef} />
    </Canvas>
  );
}

function App() {
  const profile = useDeviceProfile();
  const [, scrollRef] = useScrollProgress();

  return (
    <main className="particle-page">
      <div className="particle-stage" aria-hidden="true">
        <ParticleScene profile={profile} scrollRef={scrollRef} />
        <div className="particle-vignette" />
      </div>
    </main>
  );
}

export default App;
