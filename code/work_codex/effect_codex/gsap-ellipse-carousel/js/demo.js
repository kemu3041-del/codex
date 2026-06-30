window.addEventListener("DOMContentLoaded", () => {
  window.gsap.defaults({ ease: "power3.inOut" });

  window.arcCarousel = new window.EllipseArcCarousel("[data-ellipse-carousel]", {
    startIndex: 0,
    visibleSideCount: 4,
    motion: {
      duration: 0.72,
      dragDuration: 0.18,
      ease: "power3.inOut",
      dragEase: "power2.out",
      stagger: 0.01,
    },
    drag: {
      enabled: true,
      threshold: 44,
      stepPixels: 180,
      resistance: 0.9,
      maxSteps: 2,
    },
    breakpoints: {
      0: {
        visibleSideCount: 1,
        angleStart: 224,
        angleEnd: 316,
        drag: { stepPixels: 118, threshold: 34 },
      },
      768: {
        visibleSideCount: 3,
        angleStart: 216,
        angleEnd: 324,
        drag: { stepPixels: 150 },
      },
      1200: {
        visibleSideCount: 4,
        angleStart: 210,
        angleEnd: 330,
        drag: { stepPixels: 180 },
      },
    },
  });
});
