const initialConfig = {
  cx: 500,
  cy: 536,
  rx: 380,
  ry: 360,
  angleStart: 210,
  angleEnd: 330,
  visibleSideCount: 3,
  activeOffset: 0,
};

const config = { ...initialConfig };

const stepCopy = [
  {
    number: "01",
    title: "先确定一个大椭圆",
    text: "把椭圆想成一条隐藏轨道。轨道中心通常放在画面下方，只露出上半段。",
    formulaA: "cx/cy = 椭圆中心点",
    formulaB: "rx/ry = 横向半径 / 纵向半径",
  },
  {
    number: "02",
    title: "把卡片编号变成角度",
    text: "每张卡片先有一个 offset，offset 再映射到角度区间。中心卡通常对应 270°。",
    formulaA: "progress = (offset + sideCount) / (sideCount * 2)",
    formulaB: "angle = angleStart + progress * (angleEnd - angleStart)",
  },
  {
    number: "03",
    title: "用椭圆公式算坐标",
    text: "角度确定后，cos 控制横向位置，sin 控制纵向位置。你调 rx/ry 时，坐标会立刻变化。",
    formulaA: "x = cx + rx * cos(angle)",
    formulaB: "y = cy + ry * sin(angle)",
  },
  {
    number: "04",
    title: "用切线方向算旋转",
    text: "卡片要贴着弧线倾斜，就要取椭圆在当前点的切线方向，而不是手写 rotate。",
    formulaA: "dx = -rx * sin(angle)",
    formulaB: "rotation = atan2(ry * cos(angle), dx)",
  },
  {
    number: "05",
    title: "把多张卡片放到弧线上",
    text: "改变左右显示数量，可以看到 offset 表和弧线上的卡片数量同步变化。",
    formulaA: "offset = virtualIndex - trackIndex",
    formulaB: "depth = 1 - abs(offset) / visibleRange",
  },
];

const presets = {
  wide: { rx: 430, ry: 310, cy: 520, angleStart: 200, angleEnd: 340, visibleSideCount: 4, activeOffset: 0 },
  compact: { rx: 300, ry: 390, cy: 555, angleStart: 225, angleEnd: 315, visibleSideCount: 2, activeOffset: 0 },
  reset: initialConfig,
};

const nodes = {
  axisX: document.querySelector("#axisX"),
  axisY: document.querySelector("#axisY"),
  ellipsePath: document.querySelector("#ellipsePath"),
  ellipseShadow: document.querySelector(".ellipse-shadow"),
  arcPath: document.querySelector("#arcPath"),
  angleSector: document.querySelector("#angleSector"),
  angleArc: document.querySelector("#angleArc"),
  angleLabel: document.querySelector("#angleLabel"),
  projectionX: document.querySelector("#projectionX"),
  projectionY: document.querySelector("#projectionY"),
  radiusLine: document.querySelector("#radiusLine"),
  tangentLine: document.querySelector("#tangentLine"),
  centerDot: document.querySelector("#centerDot"),
  activeDot: document.querySelector("#activeDot"),
  pointLabel: document.querySelector("#pointLabel"),
  slotsLayer: document.querySelector("#slotsLayer"),
  floatingCard: document.querySelector("#floatingCard"),
  stepNumber: document.querySelector("#stepNumber"),
  stepTitle: document.querySelector("#stepTitle"),
  stepText: document.querySelector("#stepText"),
  formulaLine: document.querySelector("#formulaLine"),
  formulaLine2: document.querySelector("#formulaLine2"),
  stepButtons: [...document.querySelectorAll("[data-step]")],
  rangeInputs: [...document.querySelectorAll("[data-param]")],
  valueNodes: [...document.querySelectorAll("[data-value]")],
  statNodes: [...document.querySelectorAll("[data-stat]")],
  offsetTable: document.querySelector("#offsetTable"),
};

let timeline;
let currentStep = 0;
let isDraggingPoint = false;

function init() {
  renderGeometry({ immediate: true });
  applyStep(0, { immediate: true });
  buildTimeline();
  bindControls();
}

function buildTimeline() {
  timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.inOut" },
    onUpdate: syncStepFromTimeline,
  });

  timeline
    .add(() => applyStep(0), 0)
    .fromTo(".ellipse-path", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, 0)
    .fromTo(".ellipse-shadow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, 0.1)
    .fromTo([nodes.axisX, nodes.axisY], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.2)
    .addLabel("step-1", 1.1)
    .add(() => applyStep(1), "step-1")
    .fromTo([nodes.angleSector, nodes.angleArc, nodes.angleLabel], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, stagger: 0.08 }, "step-1")
    .addLabel("step-2", 2.1)
    .add(() => applyStep(2), "step-2")
    .fromTo([nodes.projectionX, nodes.projectionY, nodes.radiusLine, nodes.activeDot, nodes.pointLabel], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, stagger: 0.06 }, "step-2")
    .addLabel("step-3", 3.15)
    .add(() => applyStep(3), "step-3")
    .fromTo(nodes.tangentLine, { autoAlpha: 0, scaleX: 0.1, transformOrigin: "center center" }, { autoAlpha: 1, scaleX: 1, duration: 0.5 }, "step-3")
    .addLabel("step-4", 4.15)
    .add(() => applyStep(4), "step-4")
    .fromTo(".slot-group", { autoAlpha: 0, scale: 0.72 }, { autoAlpha: 1, scale: 1, duration: 0.56, stagger: { amount: 0.38, from: "center" } }, "step-4")
    .to({}, { duration: 0.7 });
}

function bindControls() {
  document.querySelector("[data-control='play']").addEventListener("click", () => timeline.play());
  document.querySelector("[data-control='pause']").addEventListener("click", () => timeline.pause());
  document.querySelector("[data-control='restart']").addEventListener("click", () => timeline.restart());

  nodes.stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.step);
      timeline.pause();
      timeline.tweenTo(`step-${step}`, { duration: 0.45, ease: "power3.inOut" });
      applyStep(step);
    });
  });

  nodes.rangeInputs.forEach((input) => {
    input.addEventListener("input", () => {
      config[input.dataset.param] = Number(input.value);
      clampDependentValues(input.dataset.param);
      renderGeometry();
    });
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      Object.assign(config, presets[button.dataset.preset]);
      syncInputsFromConfig();
      renderGeometry();
    });
  });

  nodes.activeDot.addEventListener("pointerdown", (event) => {
    isDraggingPoint = true;
    nodes.activeDot.setPointerCapture?.(event.pointerId);
    timeline.pause();
  });
  nodes.activeDot.addEventListener("pointermove", (event) => {
    if (!isDraggingPoint) return;
    updateActiveOffsetFromPointer(event);
  });
  nodes.activeDot.addEventListener("pointerup", (event) => {
    isDraggingPoint = false;
    nodes.activeDot.releasePointerCapture?.(event.pointerId);
  });
  nodes.activeDot.addEventListener("pointercancel", () => {
    isDraggingPoint = false;
  });
}

function renderGeometry(options = {}) {
  const activeAngle = getAngleForOffset(config.activeOffset);
  const activePoint = getEllipsePoint(activeAngle);
  const tangent = getTangentPoints(activeAngle, 120);
  const rotation = getTangentRotation(activeAngle);

  nodes.ellipsePath.setAttribute("cx", config.cx);
  nodes.ellipsePath.setAttribute("cy", config.cy);
  nodes.ellipsePath.setAttribute("rx", config.rx);
  nodes.ellipsePath.setAttribute("ry", config.ry);
  nodes.ellipseShadow.setAttribute("cx", config.cx);
  nodes.ellipseShadow.setAttribute("cy", config.cy);
  nodes.ellipseShadow.setAttribute("rx", config.rx);
  nodes.ellipseShadow.setAttribute("ry", config.ry);
  nodes.arcPath.setAttribute("d", describeArc(config.cx, config.cy, config.rx, config.ry, config.angleStart, config.angleEnd));

  nodes.axisX.setAttribute("x1", config.cx);
  nodes.axisX.setAttribute("y1", config.cy);
  nodes.axisX.setAttribute("x2", config.cx + config.rx);
  nodes.axisX.setAttribute("y2", config.cy);
  nodes.axisY.setAttribute("x1", config.cx);
  nodes.axisY.setAttribute("y1", config.cy);
  nodes.axisY.setAttribute("x2", config.cx);
  nodes.axisY.setAttribute("y2", config.cy - config.ry);
  nodes.centerDot.setAttribute("cx", config.cx);
  nodes.centerDot.setAttribute("cy", config.cy);

  nodes.angleSector.setAttribute("d", describeSector(config.cx, config.cy, 108, 180, activeAngle));
  nodes.angleArc.setAttribute("d", describeArc(config.cx, config.cy, 108, 108, 180, activeAngle));
  nodes.angleLabel.textContent = `angle = ${Math.round(activeAngle)}°`;

  nodes.activeDot.setAttribute("cx", activePoint.x);
  nodes.activeDot.setAttribute("cy", activePoint.y);
  nodes.radiusLine.setAttribute("x1", config.cx);
  nodes.radiusLine.setAttribute("y1", config.cy);
  nodes.radiusLine.setAttribute("x2", activePoint.x);
  nodes.radiusLine.setAttribute("y2", activePoint.y);
  nodes.projectionX.setAttribute("x1", activePoint.x);
  nodes.projectionX.setAttribute("y1", activePoint.y);
  nodes.projectionX.setAttribute("x2", activePoint.x);
  nodes.projectionX.setAttribute("y2", config.cy);
  nodes.projectionY.setAttribute("x1", activePoint.x);
  nodes.projectionY.setAttribute("y1", activePoint.y);
  nodes.projectionY.setAttribute("x2", config.cx);
  nodes.projectionY.setAttribute("y2", activePoint.y);
  nodes.tangentLine.setAttribute("x1", tangent.x1);
  nodes.tangentLine.setAttribute("y1", tangent.y1);
  nodes.tangentLine.setAttribute("x2", tangent.x2);
  nodes.tangentLine.setAttribute("y2", tangent.y2);

  const cardVars = {
    left: `${activePoint.x / 10}%`,
    top: `${activePoint.y / 6.2}%`,
    rotation,
    duration: options.immediate ? 0 : 0.22,
    ease: "power2.out",
  };
  gsap.to(nodes.floatingCard, cardVars);

  drawSlots();
  updateLiveValues(activeAngle, activePoint, rotation);
  syncInputsFromConfig();
}

function drawSlots() {
  nodes.slotsLayer.innerHTML = "";
  nodes.offsetTable.innerHTML = "";

  for (let offset = -config.visibleSideCount; offset <= config.visibleSideCount; offset += 1) {
    const angle = getAngleForOffset(offset);
    const point = getEllipsePoint(angle);
    const rotation = getTangentRotation(angle);
    const isActive = offset === config.activeOffset;

    const group = createSvgElement("g", {
      class: "slot-group",
      "data-offset": String(offset),
      transform: `translate(${point.x} ${point.y}) rotate(${rotation})`,
      opacity: currentStep >= 4 ? 1 : 0,
    });
    const card = createSvgElement("rect", {
      class: `slot-card${isActive ? " is-center" : ""}`,
      x: -42,
      y: -26,
      width: 84,
      height: 52,
      rx: 8,
    });
    const text = createSvgElement("text", {
      class: "slot-text",
      x: 0,
      y: 0,
    });

    text.textContent = offset === 0 ? "center" : String(offset);
    group.append(card, text);
    group.addEventListener("click", () => {
      config.activeOffset = offset;
      renderGeometry();
    });
    nodes.slotsLayer.appendChild(group);

    const row = document.createElement("button");
    row.type = "button";
    row.className = `offset-row${isActive ? " is-active" : ""}`;
    row.innerHTML = `<span>${offset}</span><span>${Math.round(angle)}deg</span><span>${Math.round(rotation)}deg</span>`;
    row.addEventListener("click", () => {
      config.activeOffset = offset;
      renderGeometry();
    });
    nodes.offsetTable.appendChild(row);
  }
}

function applyStep(step, options = {}) {
  currentStep = step;
  const copy = stepCopy[step];
  const duration = options.immediate ? 0 : 0.25;

  nodes.stepNumber.textContent = copy.number;
  nodes.stepTitle.textContent = copy.title;
  nodes.stepText.textContent = copy.text;
  nodes.formulaLine.textContent = copy.formulaA;
  nodes.formulaLine2.textContent = copy.formulaB;
  nodes.stepButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.step) === step);
  });

  gsap.to(".slot-group", { autoAlpha: step >= 4 ? 1 : 0, duration });
  gsap.fromTo(
    [nodes.stepTitle, nodes.stepText, nodes.formulaLine, nodes.formulaLine2],
    { y: options.immediate ? 0 : 8, autoAlpha: options.immediate ? 1 : 0.65 },
    { y: 0, autoAlpha: 1, duration, stagger: 0.035 },
  );
}

function syncStepFromTimeline() {
  if (!timeline) return;
  const time = timeline.time();
  const nextStep = time >= 4.15 ? 4 : time >= 3.15 ? 3 : time >= 2.1 ? 2 : time >= 1.1 ? 1 : 0;

  if (nextStep !== currentStep) {
    applyStep(nextStep);
  }
}

function updateActiveOffsetFromPointer(event) {
  const svg = document.querySelector(".diagram");
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
  const angle = normalizeDegree(radianToDegree(Math.atan2((svgPoint.y - config.cy) / config.ry, (svgPoint.x - config.cx) / config.rx)));
  const clampedAngle = clamp(angle, config.angleStart, config.angleEnd);
  const progress = (clampedAngle - config.angleStart) / (config.angleEnd - config.angleStart || 1);
  const rawOffset = Math.round(progress * config.visibleSideCount * 2 - config.visibleSideCount);

  config.activeOffset = clamp(rawOffset, -config.visibleSideCount, config.visibleSideCount);
  renderGeometry();
}

function updateLiveValues(angle, point, rotation) {
  const values = {
    angle: `${Math.round(angle)}°`,
    x: String(Math.round(point.x)),
    y: String(Math.round(point.y)),
    rotation: `${Math.round(rotation)}°`,
  };

  nodes.statNodes.forEach((node) => {
    node.textContent = values[node.dataset.stat];
  });
  nodes.valueNodes.forEach((node) => {
    node.textContent = config[node.dataset.value];
  });
}

function syncInputsFromConfig() {
  nodes.rangeInputs.forEach((input) => {
    input.value = config[input.dataset.param];
    if (input.dataset.param === "activeOffset") {
      input.min = -config.visibleSideCount;
      input.max = config.visibleSideCount;
    }
  });
}

function clampDependentValues(changedParam) {
  if (changedParam === "visibleSideCount") {
    config.activeOffset = clamp(config.activeOffset, -config.visibleSideCount, config.visibleSideCount);
  }

  if (config.angleEnd <= config.angleStart + 30) {
    config.angleEnd = config.angleStart + 30;
  }
}

function getAngleForOffset(offset) {
  const progress = (offset + config.visibleSideCount) / (config.visibleSideCount * 2);
  return config.angleStart + progress * (config.angleEnd - config.angleStart);
}

function getEllipsePoint(angleDeg) {
  const angle = degreeToRadian(angleDeg);
  return {
    x: config.cx + config.rx * Math.cos(angle),
    y: config.cy + config.ry * Math.sin(angle),
  };
}

function getTangentRotation(angleDeg) {
  const angle = degreeToRadian(angleDeg);
  const dx = -config.rx * Math.sin(angle);
  const dy = config.ry * Math.cos(angle);
  return radianToDegree(Math.atan2(dy, dx));
}

function getTangentPoints(angleDeg, length) {
  const point = getEllipsePoint(angleDeg);
  const angle = degreeToRadian(angleDeg);
  const dx = -config.rx * Math.sin(angle);
  const dy = config.ry * Math.cos(angle);
  const size = Math.hypot(dx, dy) || 1;
  const ux = dx / size;
  const uy = dy / size;

  return {
    x1: point.x - ux * length,
    y1: point.y - uy * length,
    x2: point.x + ux * length,
    y2: point.y + uy * length,
  };
}

function describeArc(cx, cy, rx, ry, startAngle, endAngle) {
  const start = getEllipsePointFor(cx, cy, rx, ry, startAngle);
  const end = getEllipsePointFor(cx, cy, rx, ry, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${rx} ${ry} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
  const start = getEllipsePointFor(cx, cy, radius, radius, startAngle);
  const end = getEllipsePointFor(cx, cy, radius, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function getEllipsePointFor(cx, cy, rx, ry, angleDeg) {
  const angle = degreeToRadian(angleDeg);
  return {
    x: cx + rx * Math.cos(angle),
    y: cy + ry * Math.sin(angle),
  };
}

function createSvgElement(tagName, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function normalizeDegree(degree) {
  return ((degree % 360) + 360) % 360;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function degreeToRadian(degree) {
  return (degree * Math.PI) / 180;
}

function radianToDegree(radian) {
  return (radian * 180) / Math.PI;
}

init();
