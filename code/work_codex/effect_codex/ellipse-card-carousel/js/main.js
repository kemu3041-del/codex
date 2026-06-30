const cards = [
  { title: "Pixelate Image Render Effect", visual: "visual-pixel" },
  { title: "Directional List Hover", visual: "visual-list" },
  { title: "Flick Cards Slider", visual: "visual-stack" },
  { title: "Face Follow Cursor (Mascot)", visual: "visual-mascot" },
  { title: "Locomotive Smooth Scroll Setup", visual: "visual-scroll" },
  { title: "Logo Wall Cycle", visual: "visual-logo" },
  { title: "Falling 2D Objects (MatterJS)", visual: "visual-matter" },
  { title: "3D Image Carousel", visual: "visual-carousel" },
  { title: "Momentum Based Hover (Inertia)", visual: "visual-momentum" },
];

const stage = document.querySelector("#cardStage");
const activeTitle = document.querySelector("#activeTitle");
const activeNumber = document.querySelector("#activeNumber");
const controls = document.querySelectorAll("[data-direction]");

const loopCopyCount = 3;
const centerCopyIndex = 1;
const initialCardIndex = 2;
let trackIndex = cards.length * centerCopyIndex + initialCardIndex;
let isAnimating = false;

function createCardElements() {
  /*
   * 为了让首尾切换看起来是“滚动”而不是“跳到另一侧”，这里生成 3 份卡片：
   * - 中间这一份负责正常展示；
   * - 左右两份负责跨首尾时继续接上；
   * - 动画结束后再把 trackIndex 无感归回中间份。
   */
  stage.innerHTML = Array.from({ length: loopCopyCount })
    .flatMap((_, copyIndex) => {
      return cards.map((card, index) => ({
        ...card,
        index,
        copyIndex,
        virtualIndex: copyIndex * cards.length + index,
      }));
    })
    .map((card) => {
      return `
        <article
          class="orbit-card"
          data-card-index="${card.index}"
          data-virtual-index="${card.virtualIndex}"
          data-copy-index="${card.copyIndex}"
        >
          <div class="card-visual ${card.visual}" aria-hidden="true"></div>
          <div class="card-info">
            <p class="card-title">${card.title}</p>
            <span class="card-index">${String(card.index + 1).padStart(2, "0")}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCarousel() {
  const stageRect = stage.getBoundingClientRect();
  const visibleSideCount = getVisibleSideCount();

  /*
   * 参考页的核心思想：
   * 不要手写每张卡片的 left/top/rotate。
   * 先把每张卡片分配到椭圆上半部分的一个角度，再由角度推导坐标和旋转。
   */
  const ellipse = {
    cx: stageRect.width / 2,
    rx: stageRect.width * 0.72,
    ry: stageRect.height * (stageRect.height < 760 ? 1.18 : 1.42),
  };
  ellipse.cy = getArcTopY(stageRect.height) + ellipse.ry;

  document.querySelectorAll(".orbit-card").forEach((element) => {
    const index = Number(element.dataset.cardIndex);
    const virtualIndex = Number(element.dataset.virtualIndex);
    const offset = virtualIndex - trackIndex;
    const isVisible = Math.abs(offset) <= visibleSideCount;

    if (!isVisible) {
      hideCard(element, offset);
      return;
    }

    /*
     * 只显示上半个椭圆：
     * - 左侧边缘约 210deg
     * - 顶部中心是 270deg
     * - 右侧边缘约 330deg
     *
     * offset = 0 时，slotProgress = 0.5，angle = 270deg，所以当前卡在最高点。
     */
    const slotProgress = (offset + visibleSideCount) / (visibleSideCount * 2);
    const angleDeg = 210 + slotProgress * 120;
    const angle = degreeToRadian(angleDeg);

    const x = ellipse.cx + ellipse.rx * Math.cos(angle);
    const y = ellipse.cy + ellipse.ry * Math.sin(angle);

    /*
     * 图片卡片的旋转角度来自椭圆切线方向。
     * 椭圆参数方程：
     *   x = cx + rx * cos(a)
     *   y = cy + ry * sin(a)
     * 对 a 求导得到切线方向：
     *   dx = -rx * sin(a)
     *   dy =  ry * cos(a)
     * atan2(dy, dx) 就是卡片应该跟随弧线倾斜的角度。
     */
    const tangentRotation = getTangentRotation(ellipse, angle);

    /*
     * depth 只处理视觉层级：越靠近中心越大、越亮、越靠前。
     * 这和布局坐标分离，后续换成 CMS 数据也不会影响椭圆算法。
     */
    const distance = Math.abs(offset);
    const depth = 1 - distance / (visibleSideCount + 0.75);
    const scale = 0.76 + depth * 0.22;
    const opacity = 0.22 + depth * 0.78;

    element.classList.toggle("is-active", offset === 0);
    element.classList.remove("is-hidden");
    element.style.setProperty("--x", `${x}px`);
    element.style.setProperty("--y", `${y}px`);
    element.style.setProperty("--rotation", `${tangentRotation.toFixed(2)}deg`);
    element.style.setProperty("--scale", scale.toFixed(3));
    element.style.setProperty("--card-opacity", opacity.toFixed(3));
    element.style.setProperty("--saturation", (0.65 + depth * 0.45).toFixed(3));
    element.style.setProperty("--brightness", (0.66 + depth * 0.34).toFixed(3));
    element.style.zIndex = String(Math.round(depth * 100));
    element.setAttribute("aria-hidden", "false");
  });

  updateActiveCopy();
}

function hideCard(element, offset) {
  /*
   * 不在弧形窗口内的卡片直接淡出。
   * 注意：这里不再把它们强行塞到另一侧，否则首尾循环时会看到“最左拉到最右”。
   */
  element.classList.remove("is-active");
  element.classList.add("is-hidden");
  element.style.setProperty("--x", "50vw");
  element.style.setProperty("--y", "92vh");
  element.style.setProperty("--rotation", "0deg");
  element.style.setProperty("--scale", "0.68");
  element.style.setProperty("--card-opacity", "0");
  element.style.setProperty("--saturation", "0.5");
  element.style.setProperty("--brightness", "0.54");
  element.style.zIndex = "0";
  element.setAttribute("aria-hidden", "true");
}

function getVisibleSideCount() {
  /*
   * 桌面参考截图横向空间很宽，所以中心卡 + 左右各 4 张。
   * 小屏幕只保留中心卡 + 左右各 2 张，减少堆叠遮挡。
   */
  return window.innerWidth < 780 ? 2 : 4;
}

function getArcTopY(stageHeight) {
  /*
   * 参考图是很宽的横屏，高度较矮时，如果仍用固定比例，顶部卡片会被裁掉。
   * 所以矮屏把椭圆最高点下移；高屏保留更靠上的大弧线空间。
   */
  return stageHeight < 760 ? stageHeight * 0.27 : stageHeight * 0.12;
}

function getTangentRotation(ellipse, angle) {
  const dx = -ellipse.rx * Math.sin(angle);
  const dy = ellipse.ry * Math.cos(angle);
  return radianToDegree(Math.atan2(dy, dx));
}

function moveCarousel(direction) {
  if (isAnimating) return;
  isAnimating = true;

  const step = direction === "next" ? 1 : -1;
  trackIndex += step;
  renderCarousel();

  window.setTimeout(() => {
    normalizeTrackIndex();
    isAnimating = false;
  }, 720);
}

function normalizeTrackIndex() {
  /*
   * 轨道走到左/右副本后，把它瞬间挪回中间副本。
   * 因为三份副本在视觉上等价，且这里会临时关闭 transition，所以用户看不到归位动作。
   */
  const minMiddleIndex = cards.length * centerCopyIndex;
  const maxMiddleIndex = minMiddleIndex + cards.length - 1;
  let normalizedIndex = trackIndex;

  if (trackIndex < minMiddleIndex) normalizedIndex = trackIndex + cards.length;
  if (trackIndex > maxMiddleIndex) normalizedIndex = trackIndex - cards.length;
  if (normalizedIndex === trackIndex) return;

  stage.classList.add("is-jump-resetting");
  stage.offsetWidth;
  trackIndex = normalizedIndex;
  renderCarousel();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      stage.classList.remove("is-jump-resetting");
    });
  });
}

function updateActiveCopy() {
  const activeIndex = getRealCardIndex(trackIndex);
  activeTitle.textContent = cards[activeIndex].title;
  activeNumber.textContent = String(activeIndex + 1).padStart(2, "0");
}

function getRealCardIndex(index) {
  return ((index % cards.length) + cards.length) % cards.length;
}

function degreeToRadian(degree) {
  return (degree * Math.PI) / 180;
}

function radianToDegree(radian) {
  return (radian * 180) / Math.PI;
}

controls.forEach((button) => {
  button.addEventListener("click", () => {
    moveCarousel(button.dataset.direction);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") moveCarousel("prev");
  if (event.key === "ArrowRight") moveCarousel("next");
});

window.addEventListener("resize", renderCarousel);

createCardElements();
renderCarousel();
