const story = document.querySelector(".curve-story");
const routePath = document.querySelector("#routePath");
const tracePath = document.querySelector("#tracePath");
const signalDot = document.querySelector("#signalDot");
const routeNodes = [...document.querySelectorAll("[data-node]")];
const stepCards = [...document.querySelectorAll("[data-step]")];
const floatCard = document.querySelector("[data-float-card]");
const activeTitle = document.querySelector("#activeTitle");
const activeText = document.querySelector("#activeText");
const progressValue = document.querySelector("#progressValue");
const progressBar = document.querySelector(".progress-readout");
const signalPanel = document.querySelector(".signal-panel");
const signalAura = document.querySelector("#signalAura");
const hasGsap = Boolean(window.gsap && window.ScrollTrigger);

document.documentElement.dataset.motionEngine = hasGsap ? "gsap" : "fallback";

const stageCopy = [
  {
    threshold: 0,
    title: "Credential found in the wild",
    text: "The curve starts as a dim route. As the visitor scrolls, the red signal reveals what happens next.",
  },
  {
    threshold: 0.28,
    title: "The attacker enters the decoy",
    text: "A believable bait surface catches the login attempt before it reaches a real system.",
  },
  {
    threshold: 0.52,
    title: "Noise becomes a useful signal",
    text: "Validation logic turns the glowing point into a clear security event instead of another raw log.",
  },
  {
    threshold: 0.76,
    title: "The response starts earlier",
    text: "The final reveal gives the team enough context to reset credentials and investigate the source.",
  },
];

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const pathSampler = buildPathSampler(routePath);
const pathLength = pathSampler.length;
let currentCopyIndex = 0;

tracePath.setAttribute("d", pathSampler.pathAt(0));

function buildPathSampler(pathElement) {
  const points = samplePathData(pathElement.getAttribute("d"));
  const distances = [0];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    distances[index] =
      distances[index - 1] + Math.hypot(current.x - previous.x, current.y - previous.y);
  }

  const length = distances[distances.length - 1] || 1;

  return {
    length,
    pointAt(distance) {
      const target = clamp(distance, 0, length);
      const segment = findSegment(distances, target);
      const start = points[segment.index - 1] || points[0];
      const end = points[segment.index] || start;

      return {
        x: start.x + (end.x - start.x) * segment.progress,
        y: start.y + (end.y - start.y) * segment.progress,
      };
    },
    pathAt(distance) {
      const target = clamp(distance, 0, length);
      const segment = findSegment(distances, target);
      const end = this.pointAt(target);
      const visiblePoints = points.slice(0, segment.index);

      return [
        `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`,
        ...visiblePoints.slice(1).map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
        `L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
      ].join(" ");
    },
  };
}

function findSegment(distances, target) {
  let index = 1;

  while (index < distances.length && distances[index] < target) {
    index += 1;
  }

  const startDistance = distances[index - 1] || 0;
  const endDistance = distances[index] || startDistance + 1;

  return {
    index,
    progress: (target - startDistance) / (endDistance - startDistance),
  };
}

function samplePathData(pathData) {
  const tokens = pathData.match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
  const points = [];
  let index = 0;
  let current = { x: 0, y: 0 };

  const readPoint = () => {
    const point = {
      x: Number(tokens[index]),
      y: Number(tokens[index + 1]),
    };
    index += 2;
    return point;
  };

  while (index < tokens.length) {
    const command = tokens[index];
    index += 1;

    if (command === "M") {
      current = readPoint();
      points.push(current);
    }

    if (command === "L") {
      current = readPoint();
      points.push(current);
    }

    if (command === "C") {
      const start = current;
      const controlA = readPoint();
      const controlB = readPoint();
      const end = readPoint();

      for (let step = 1; step <= 42; step += 1) {
        points.push(cubicPoint(start, controlA, controlB, end, step / 42));
      }

      current = end;
    }
  }

  return points;
}

function cubicPoint(start, controlA, controlB, end, progress) {
  const inverse = 1 - progress;
  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * progress * controlA.x +
      3 * inverse * progress ** 2 * controlB.x +
      progress ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * progress * controlA.y +
      3 * inverse * progress ** 2 * controlB.y +
      progress ** 3 * end.y,
  };
}

function placeStaticNodes() {
  routeNodes.forEach((node) => {
    const nodeProgress = Number(node.dataset.node);
    const point = pathSampler.pointAt(pathLength * nodeProgress);
    node.setAttribute("cx", point.x);
    node.setAttribute("cy", point.y);
  });
}

function getFallbackScrollProgress() {
  const rect = story.getBoundingClientRect();
  const scrollable = story.offsetHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return clamp(-rect.top / scrollable);
}

function updateCopy(progress) {
  const nextIndex = stageCopy.reduce((activeIndex, item, index) => {
    return progress >= item.threshold ? index : activeIndex;
  }, 0);

  if (nextIndex === currentCopyIndex) return;
  currentCopyIndex = nextIndex;
  activeTitle.textContent = stageCopy[nextIndex].title;
  activeText.textContent = stageCopy[nextIndex].text;
}

function renderScene(progress) {
  const traceProgress = getTraceProgress(progress);
  const drawLength = pathLength * traceProgress;
  const point = pathSampler.pointAt(drawLength);

  gsapSet(tracePath, { attr: { d: pathSampler.pathAt(drawLength) } });
  gsapSet(signalDot, { attr: { cx: point.x, cy: point.y } });
  updateSignalAura(point, traceProgress);

  routeNodes.forEach((node) => {
    const isActive = traceProgress >= Number(node.dataset.node) - 0.015;
    node.classList.toggle("is-active", isActive);
  });

  stepCards.forEach((card) => {
    const threshold = Number(card.dataset.step);
    const isActive = progress >= threshold - 0.02;
    card.classList.toggle("is-active", isActive);
  });

  floatCard.classList.toggle("is-lit", progress > 0.04);
  gsapSet(signalPanel, {
    "--title-glow": progress > 0.28 ? 0.55 : 0.16,
    "--glow-x": `${Math.round(progress * 100)}%`,
  });
  progressValue.textContent = `${Math.round(progress * 100)}%`;
  gsapSet(progressBar, { "--progress": `${Math.round(progress * 100)}%` });
  updateCopy(progress);
}

function updateSignalAura(point, traceProgress) {
  const stageRect = story.querySelector(".sticky-stage").getBoundingClientRect();
  const svgRect = routePath.ownerSVGElement.getBoundingClientRect();
  const panelRect = signalPanel.getBoundingClientRect();
  const screenPoint = {
    x: svgRect.left + (point.x / 1440) * svgRect.width,
    y: svgRect.top + (point.y / 900) * svgRect.height,
  };
  const stagePoint = {
    x: screenPoint.x - stageRect.left,
    y: screenPoint.y - stageRect.top,
  };
  const distanceToPanel = getDistanceToRect(screenPoint, panelRect);
  const panelGlowStrength = clamp(1 - distanceToPanel / 280);
  const auraOpacity = traceProgress > 0.015 ? 0.18 + panelGlowStrength * 0.56 : 0;

  gsapSet(signalAura, {
    "--aura-x": `${stagePoint.x.toFixed(1)}px`,
    "--aura-y": `${stagePoint.y.toFixed(1)}px`,
    "--aura-opacity": auraOpacity.toFixed(3),
  });
  gsapSet(signalPanel, {
    "--aura-card-x": `${(screenPoint.x - panelRect.left).toFixed(1)}px`,
    "--aura-card-y": `${(screenPoint.y - panelRect.top).toFixed(1)}px`,
    "--panel-glow-strength": panelGlowStrength.toFixed(3),
  });
  signalPanel.classList.toggle("is-card-lit", panelGlowStrength > 0.08);
}

function getDistanceToRect(point, rect) {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(dx, dy);
}

function getTraceProgress(scrollProgress) {
  if (scrollProgress < 0.2) {
    return scrollProgress * 0.9;
  }

  if (scrollProgress < 0.52) {
    return 0.18 + ((scrollProgress - 0.2) / 0.32) * 0.19;
  }

  return 0.37 + ((scrollProgress - 0.52) / 0.48) * 0.63;
}

function gsapSet(target, vars) {
  if (hasGsap) {
    window.gsap.set(target, vars);
    return;
  }

  if (vars.attr) {
    Object.entries(vars.attr).forEach(([key, value]) => target.setAttribute(key, value));
  }

  Object.entries(vars).forEach(([key, value]) => {
    if (key !== "attr") {
      target.style.setProperty(key, value);
    }
  });
}

function initGsapScroll() {
  window.gsap.registerPlugin(window.ScrollTrigger);
  window.gsap.defaults({ ease: "none" });

  window.ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => renderScene(self.progress),
    onRefresh: (self) => renderScene(self.progress),
  });

  window.addEventListener("resize", () => {
    placeStaticNodes();
    window.ScrollTrigger.refresh();
  });
}

function initFallbackScroll() {
  let ticking = false;

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      renderScene(getFallbackScrollProgress());
      ticking = false;
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    placeStaticNodes();
    requestUpdate();
  });
}

placeStaticNodes();
renderScene(0);

if (hasGsap) {
  initGsapScroll();
} else {
  initFallbackScroll();
}
