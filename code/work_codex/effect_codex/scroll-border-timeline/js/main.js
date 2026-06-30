(() => {
  const entries = [...document.querySelectorAll("[data-entry]")];
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.dataset.motionEngine = hasGsap ? "gsap" : "fallback";

  // 依赖缺失或用户要求减少动态效果时，直接展示完整路径，保证内容仍然可读。
  if (!hasGsap || reduceMotion) {
    entries.forEach((entry) => entry.classList.add("is-complete"));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  entries.forEach((entry) => {
    const horizontalLine = entry.querySelector(".route__line--horizontal i");
    const verticalLine = entry.querySelector(".route__line--vertical i");
    const corner = entry.querySelector(".route__corner");
    const contentParts = entry.querySelectorAll(
      ".history-entry__label, .history-entry h2, .history-entry li",
    );
    const drawsToRight = entry.classList.contains("history-entry--left");

    // 横线先朝外侧生长，到达拐点后再向下点亮竖线，模拟一条连续折线路径。
    gsap.set(horizontalLine, {
      scaleX: 0,
      transformOrigin: drawsToRight ? "left center" : "right center",
    });
    gsap.set(verticalLine, { scaleY: 0, transformOrigin: "center top" });
    gsap.set(contentParts, { opacity: 0.24, y: 28 });

    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: entry,
        start: "top 76%",
        end: "bottom 30%",
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    });

    timeline
      .to(contentParts, { opacity: 1, y: 0, duration: 0.28, stagger: 0.025 }, 0)
      .to(horizontalLine, { scaleX: 1, duration: 0.48 }, 0.04)
      .to(
        corner,
        {
          color: "#2b5cff",
          scale: 1.35,
          textShadow: "0 0 14px rgba(43, 92, 255, 0.55)",
          duration: 0.08,
        },
        0.49,
      )
      .to(corner, { scale: 1, duration: 0.08 }, 0.57)
      .to(verticalLine, { scaleY: 1, duration: 0.43 }, 0.56);
  });

  // 字体和视口尺寸稳定后刷新一次触发位置，避免移动端地址栏改变高度造成错位。
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
})();
