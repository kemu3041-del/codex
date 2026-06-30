(function () {
  var stage = document.querySelector("[data-flow]");
  if (!stage) return;

  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var hotspots = Array.prototype.slice.call(stage.querySelectorAll(".hotspot"));

  function closeAll() {
    hotspots.forEach(function (hotspot) {
      hotspot.closest(".flow-group").classList.remove("is-open");
      hotspot.setAttribute("aria-expanded", "false");
    });
  }

  hotspots.forEach(function (hotspot) {
    hotspot.addEventListener("click", function (event) {
      event.preventDefault();
      var group = hotspot.closest(".flow-group");
      var shouldOpen = !group.classList.contains("is-open");
      closeAll();
      group.classList.toggle("is-open", shouldOpen);
      hotspot.setAttribute("aria-expanded", String(shouldOpen));
    });
  });

  if (hotspots.length) {
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".flow-group")) {
        closeAll();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeAll();
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      }
    });
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !window.gsap) {
    stage.classList.add("is-complete");
    return;
  }

  var baseLine = stage.querySelector(".layer-base");
  var title = stage.querySelector(".center-title");
  var groups = Array.prototype.slice.call(stage.querySelectorAll(".flow-group"));

  gsap.set([baseLine, title], { autoAlpha: 0 });
  groups.forEach(function (group) {
    gsap.set(group.querySelector(".route-layer"), {
      autoAlpha: 0,
      clipPath: "inset(0 100% 0 0)"
    });
    gsap.set(group.querySelector(".badge-layer"), {
      autoAlpha: 0,
      scale: .72,
      transformOrigin: "50% 50%"
    });
    gsap.set(group.querySelector(".dot-layer"), {
      autoAlpha: 0,
      scale: .72,
      transformOrigin: "50% 50%"
    });
    gsap.set(group.querySelector(".arrow-layer"), {
      autoAlpha: 0,
      x: 12
    });
    gsap.set(group.querySelector(".step-text"), {
      autoAlpha: 0,
      y: 10
    });
  });

  var timeline = gsap.timeline({
    delay: .25,
    defaults: { ease: "power2.out" },
    onComplete: function () {
      stage.classList.add("is-complete");
    }
  });

  timeline.to(baseLine, {
    autoAlpha: .92,
    duration: .45
  });

  timeline.to(title, {
    autoAlpha: 1,
    y: 0,
    duration: .5
  }, "-=.18");

  // 每组切图按固定节奏入场：色带图层 -> 编号 -> 三点连接线 -> 标题。
  groups.forEach(function (group, index) {
    var route = group.querySelector(".route-layer");
    var arrow = group.querySelector(".arrow-layer");
    var badge = group.querySelector(".badge-layer");
    var dots = group.querySelector(".dot-layer");
    var stepTitle = group.querySelector(".step-text");
    var fromSide = index === 3 || index === 4 || index === 5 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";

    timeline.add("step-" + (index + 1), index === 0 ? ">-=0.05" : ">-=0.1");
    timeline.fromTo(route, {
      autoAlpha: 0,
      clipPath: fromSide
    }, {
      autoAlpha: 1,
      clipPath: "inset(0 0% 0 0)",
      duration: .62
    }, "step-" + (index + 1));

    timeline.to(arrow, {
      autoAlpha: 1,
      x: 0,
      duration: .24
    }, "step-" + (index + 1) + "+=.34");

    timeline.to(badge, {
      autoAlpha: 1,
      scale: 1,
      duration: .32,
      ease: "back.out(1.85)"
    }, "step-" + (index + 1) + "+=.48");

    timeline.to(dots, {
      autoAlpha: 1,
      scale: 1,
      duration: .24
    }, "step-" + (index + 1) + "+=.64");

    timeline.to(stepTitle, {
      autoAlpha: 1,
      y: 0,
      duration: .3
    }, "step-" + (index + 1) + "+=.76");
  });
})();
