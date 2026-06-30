(function () {
  var stage = document.getElementById("potatoStage");
  var replayButton = document.getElementById("replayButton");

  function showScene(sceneNumber, time) {
    ["#scene1", "#scene2", "#scene3", "#scene4"].forEach(function (selector, index) {
      tl.set(selector, {
        opacity: index + 1 === sceneNumber ? 1 : 0,
        zIndex: index + 1 === sceneNumber ? 10 : 1
      }, time);
    });
  }

  function captionIn(selector, time) {
    tl.fromTo(selector, {
      opacity: 0,
      y: 22,
      scale: 0.96
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.34,
      ease: "back.out(1.8)"
    }, time);
  }

  function captionOut(selector, time) {
    tl.to(selector, {
      opacity: 0,
      y: -12,
      duration: 0.22,
      ease: "power1.in"
    }, time);
  }

  function mudTransition(nextScene, time) {
    tl.set("#transitionMud", { opacity: 1 }, time);
    tl.fromTo("#transitionMud i", {
      scale: 0,
      rotation: -18
    }, {
      scale: 4.2,
      rotation: 12,
      duration: 0.34,
      stagger: 0.035,
      ease: "back.in(1.4)"
    }, time);
    showScene(nextScene, time + 0.32);
    tl.to("#transitionMud i", {
      scale: 0,
      rotation: 24,
      duration: 0.42,
      stagger: 0.03,
      ease: "expo.out"
    }, time + 0.43);
    tl.set("#transitionMud", { opacity: 0 }, time + 0.94);
  }

  var tl = gsap.timeline({
    paused: true,
    defaults: { force3D: true }
  });

  window.potatoShortTimeline = tl;
  document.documentElement.dataset.potatoTimeline = "ready";
  showScene(1, 0);

  tl.from(".sun", { scale: 0.7, opacity: 0, duration: 0.55, ease: "elastic.out(1, 0.6)" }, 0.12);
  tl.from(".cloud-a", { x: -80, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.2);
  tl.from(".cloud-b", { x: 90, opacity: 0, duration: 0.7, ease: "sine.out" }, 0.26);
  tl.from("#scene1 .hills", { y: 70, opacity: 0, duration: 0.68, ease: "power2.out" }, 0.28);
  tl.from("#scene1 .road", { y: 110, duration: 0.58, ease: "back.out(1.3)" }, 0.36);
  tl.from("#cartGroup", { x: 420, y: 10, rotation: -4, duration: 0.72, ease: "expo.out" }, 0.54);
  captionIn("#caption1", 0.82);
  tl.to("#cartGroup", { x: -26, duration: 2.5, ease: "none" }, 1.2);
  tl.to("#cartGroup", { y: -9, rotation: 1.4, duration: 0.28, repeat: 7, yoyo: true, ease: "sine.inOut" }, 1.2);
  tl.to("#scene1 .wheel", { rotation: 540, duration: 2.5, ease: "none" }, 1.2);
  tl.to(".cloud-a", { x: 28, duration: 10.5, ease: "none" }, 1.0);
  tl.to(".cloud-b", { x: -38, duration: 11, ease: "none" }, 1.0);
  captionOut("#caption1", 3.36);
  mudTransition(2, 3.58);

  tl.from("#scene2 .bump", { scaleX: 0.2, opacity: 0, duration: 0.38, ease: "back.out(2)" }, 4.16);
  tl.from("#bumpyCart", { x: 360, rotation: -3, duration: 0.58, ease: "expo.out" }, 4.22);
  captionIn("#caption2", 4.48);
  tl.to("#bumpyCart", { x: -32, duration: 2.25, ease: "none" }, 4.58);
  tl.to("#bumpyCart", { y: -24, rotation: -7, duration: 0.18, ease: "power2.out" }, 5.42);
  tl.to("#bumpyCart", { y: 6, rotation: 4, duration: 0.2, ease: "bounce.out" }, 5.6);
  tl.fromTo("#fallingPotato", {
    x: -28,
    y: -130,
    rotation: -70,
    scale: 0.9
  }, {
    x: 36,
    y: 178,
    rotation: 310,
    scale: 1.05,
    duration: 1.05,
    ease: "bounce.out"
  }, 5.36);
  tl.to("#impactLines", { opacity: 1, duration: 0.08 }, 6.17);
  tl.fromTo("#impactLines i", {
    scaleY: 0.2,
    y: 10
  }, {
    scaleY: 1,
    y: 0,
    duration: 0.2,
    stagger: 0.04,
    ease: "back.out(2)"
  }, 6.17);
  tl.to("#impactLines", { opacity: 0, duration: 0.2 }, 6.74);
  captionOut("#caption2", 7.08);
  mudTransition(3, 7.28);

  tl.from("#scene3 .close-ground", { y: 130, duration: 0.55, ease: "power3.out" }, 7.9);
  tl.from(".leaf-a", { x: -70, y: 30, rotation: -40, opacity: 0, duration: 0.5, ease: "back.out(1.6)" }, 8.04);
  tl.from(".leaf-b", { x: 70, y: 20, rotation: 30, opacity: 0, duration: 0.5, ease: "circ.out" }, 8.1);
  tl.from("#awakePotato", { y: 150, scale: 0.62, rotation: -12, duration: 0.7, ease: "elastic.out(1, 0.5)" }, 8.18);
  tl.fromTo("#awakePotato .eye", { scaleY: 0.04 }, { scaleY: 1, duration: 0.24, ease: "back.out(4)" }, 8.84);
  tl.from("#awakePotato .mouth", { scaleX: 0.1, opacity: 0, duration: 0.28, ease: "power4.out" }, 8.98);
  tl.from("#awakePotato .cheek", { scale: 0, opacity: 0, duration: 0.28, stagger: 0.05, ease: "back.out(2.8)" }, 9.08);
  captionIn("#caption3", 9.18);
  tl.to("#awakePotato", { y: -22, duration: 0.45, repeat: 3, yoyo: true, ease: "sine.inOut" }, 9.38);
  tl.to("#sparkles i", { opacity: 1, scale: 1.25, rotation: 90, duration: 0.32, stagger: 0.07, ease: "back.out(2)" }, 9.32);
  tl.to("#sparkles i", { opacity: 0, scale: 0.35, duration: 0.26, stagger: 0.04, ease: "power2.in" }, 10.52);
  captionOut("#caption3", 10.92);
  mudTransition(4, 11.08);

  tl.from(".tree", { y: 100, scale: 0.78, opacity: 0, duration: 0.65, stagger: 0.08, ease: "back.out(1.5)" }, 11.66);
  tl.from(".forest-path", { y: 120, opacity: 0, duration: 0.52, ease: "power3.out" }, 11.84);
  tl.from("#runningPotato", { x: -190, y: 70, rotation: -45, duration: 0.58, ease: "expo.out" }, 11.95);
  captionIn("#caption4", 12.2);
  tl.to("#runningPotato", {
    x: 255,
    y: -120,
    rotation: 14,
    scale: 0.56,
    duration: 2.12,
    ease: "power1.inOut"
  }, 12.38);
  tl.to("#runningPotato", { y: "-=28", duration: 0.22, repeat: 8, yoyo: true, ease: "sine.inOut" }, 12.38);
  tl.to("#runningPotato .run-leg-left", { rotation: -35, duration: 0.16, repeat: 12, yoyo: true, ease: "sine.inOut" }, 12.36);
  tl.to("#runningPotato .run-leg-right", { rotation: 35, duration: 0.16, repeat: 12, yoyo: true, ease: "sine.inOut" }, 12.36);
  tl.to("#finishBurst i", { opacity: 1, scale: 1.6, rotation: 160, duration: 0.3, stagger: 0.045, ease: "back.out(2)" }, 14.08);
  tl.to("#finishBurst i", { opacity: 0, scale: 0.3, duration: 0.22, stagger: 0.02, ease: "power2.in" }, 14.52);
  tl.to("#caption4", { opacity: 0, y: -12, duration: 0.3, ease: "power1.in" }, 14.58);
  tl.to(stage, { filter: "brightness(0.94)", duration: 0.28, ease: "sine.inOut" }, 14.7);

  replayButton.addEventListener("click", function () {
    gsap.set(stage, { filter: "none" });
    tl.restart();
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tl.pause(9.2);
  } else {
    tl.play(0);
  }
})();
