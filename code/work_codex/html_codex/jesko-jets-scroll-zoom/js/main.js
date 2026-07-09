(function () {
  var hasGsap = window.gsap && window.ScrollTrigger;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!hasGsap || reduceMotion) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // if (window.Lenis) {
  //   var lenis = new Lenis({
  //     lerp: 0.08,
  //     wheelMultiplier: 0.9,
  //     touchMultiplier: 1.15
  //   });

  //   lenis.on("scroll", ScrollTrigger.update);

  //   gsap.ticker.add(function (time) {
  //     lenis.raf(time * 1000);
  //   });

  //   gsap.ticker.lagSmoothing(0);
  // }

  var isMobile = window.matchMedia("(max-width: 720px)").matches;
  var foregroundScale = isMobile ? 2.65 : 3.85;
  var copyShift = isMobile ? 70 : 150;

  gsap.set([".hero-front", ".hero-front-over"], {
    transformOrigin: "50% 50%",
    force3D: true
  });

  gsap.set(".hero-back", {
    transformOrigin: "50% 50%",
    force3D: true
  });

  // The foreground window scales faster than the rear image, creating the
  // airplane-window push-in seen on the reference site.
  var heroTimeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".hero-scroll",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.85
    }
  });

  heroTimeline
    .to(".hero-back", { scale: isMobile ? 1.18 : 1.1, yPercent: isMobile ? -4 : -2 }, 0)
    .to(".sky-bg-hero", { scale: isMobile ? 1.28 : 1.18, yPercent: isMobile ? -10 : -7 }, 0)
    .to([".hero-front", ".hero-front-over"], { scale: foregroundScale }, 0)
    .to(".sky-glow", { scale: isMobile ? 1.6 : 1.35, opacity: 0.2 }, 0)
    .to(".ambient-vignette", { opacity: 0.88 }, 0)
    .to(".headline-left", { x: -copyShift, opacity: 0 }, 0.03)
    .to(".headline-right", { x: copyShift, opacity: 0 }, 0.03)
    .to([".hero-note", ".scroll-cue"], { y: 58, opacity: 0 }, 0.08)
    .to(".book-flight", { y: 84, opacity: 0 }, 0.16);

  var revealItems = gsap.utils.toArray(".content-section > *");

  revealItems.forEach(function (item) {
    gsap.from(item, {
      y: 36,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        once: true
      }
    });
  });
})();
