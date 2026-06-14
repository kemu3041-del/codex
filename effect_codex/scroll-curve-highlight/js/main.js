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
let ticking = false;

tracePath.style.strokeDasharray = pathLength;
tracePath.style.strokeDashoffset = pathLength;

function buildPathSampler(pathElement) {
  if (
    pathElement &&
    typeof pathElement.getTotalLength === "function" &&
    typeof pathElement.getPointAtLength === "function"
  ) {
    return {
      length: pathElement.getTotalLength(),
      pointAt(distance) {
        return pathElement.getPointAtLength(clamp(distance, 0, this.length));
      },
    };
  }

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
      let index = 1;

      while (index < distances.length && distances[index] < target) {
        index += 1;
      }

      const startDistance = distances[index - 1] || 0;
      const endDistance = distances[index] || startDistance + 1;
      const localProgress = (target - startDistance) / (endDistance - startDistance);
      const start = points[index - 1] || points[0];
      const end = points[index] || start;

      return {
        x: start.x + (end.x - start.x) * localProgress,
        y: start.y + (end.y - start.y) * localProgress,
      };
    },
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

function getScrollProgress() {
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

function updateScene() {
  const progress = getScrollProgress();
  const drawLength = pathLength * progress;
  const point = pathSampler.pointAt(drawLength);

  tracePath.style.strokeDashoffset = pathLength - drawLength;
  signalDot.setAttribute("cx", point.x);
  signalDot.setAttribute("cy", point.y);

  routeNodes.forEach((node) => {
    const isActive = progress >= Number(node.dataset.node) - 0.015;
    node.classList.toggle("is-active", isActive);
  });

  stepCards.forEach((card) => {
    const threshold = Number(card.dataset.step);
    const isActive = progress >= threshold - 0.02;
    card.classList.toggle("is-active", isActive);
  });

  floatCard.classList.toggle("is-lit", progress > 0.04);
  signalPanel.style.setProperty("--title-glow", progress > 0.28 ? "0.55" : "0.16");
  signalPanel.style.setProperty("--glow-x", `${Math.round(progress * 100)}%`);
  progressValue.textContent = `${Math.round(progress * 100)}%`;
  progressBar.style.setProperty("--progress", `${Math.round(progress * 100)}%`);
  updateCopy(progress);
}

function requestUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateScene();
    ticking = false;
  });
}

placeStaticNodes();
updateScene();

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", () => {
  placeStaticNodes();
  requestUpdate();
});
