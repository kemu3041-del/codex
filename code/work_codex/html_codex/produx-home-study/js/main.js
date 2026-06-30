/* =========================================================
   PRODUX homepage study interactions
   No framework, no build step. Each block can be reused alone.
   ========================================================= */

const header = document.querySelector("[data-header]");
const cursorLabel = document.querySelector(".cursor-label");
const revealItems = [...document.querySelectorAll(".reveal")];
const parallaxItems = [...document.querySelectorAll(".image-parallax")];
const projectCards = [...document.querySelectorAll("[data-cursor]")];

let cursorTarget = { x: 0, y: 0 };
let cursorCurrent = { x: 0, y: 0 };
let ticking = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateScrollState() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  header.classList.toggle("is-compact", scrollTop > 120);

  updateParallax();
}

function updateParallax() {
  const viewportHeight = window.innerHeight;

  parallaxItems.forEach((item) => {
    const image = item.querySelector("img");
    if (!image) return;

    const speed = Number(item.dataset.parallax || 0.08);
    const rect = item.getBoundingClientRect();
    const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
    const normalized = centerOffset / viewportHeight;

    // Keep the parallax distance small so the image never leaves its frame.
    const y = clamp(normalized * speed * -160, -26, 26);
    image.style.setProperty("--parallax-y", `${y}px`);
  });
}

function requestScrollUpdate() {
  if (ticking) return;

  ticking = true;
  requestAnimationFrame(() => {
    updateScrollState();
    ticking = false;
  });
}

function setupReveal() {
  revealItems.forEach((item, index) => {
    // Small stagger per section keeps the reveal readable without extra markup.
    item.style.setProperty("--reveal-delay", `${(index % 3) * 0.08}s`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupCursorLabel() {
  if (!cursorLabel || window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("mousemove", (event) => {
    cursorTarget.x = event.clientX + 18;
    cursorTarget.y = event.clientY + 18;
  });

  projectCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      cursorLabel.textContent = card.dataset.cursor || "View project";
      cursorLabel.classList.add("is-visible");
    });

    card.addEventListener("mouseleave", () => {
      cursorLabel.classList.remove("is-visible");
    });
  });

  animateCursorLabel();
}

function animateCursorLabel() {
  cursorCurrent.x += (cursorTarget.x - cursorCurrent.x) * 0.16;
  cursorCurrent.y += (cursorTarget.y - cursorCurrent.y) * 0.16;

  cursorLabel.style.setProperty("--cursor-x", `${cursorCurrent.x}px`);
  cursorLabel.style.setProperty("--cursor-y", `${cursorCurrent.y}px`);

  requestAnimationFrame(animateCursorLabel);
}

function setupProjectKeyboardFocus() {
  projectCards.forEach((card) => {
    const link = card.querySelector("a");
    if (!link) return;

    link.addEventListener("focus", () => card.classList.add("is-focused"));
    link.addEventListener("blur", () => card.classList.remove("is-focused"));
  });
}

function init() {
  setupReveal();
  setupCursorLabel();
  setupProjectKeyboardFocus();
  updateScrollState();

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
}

init();
