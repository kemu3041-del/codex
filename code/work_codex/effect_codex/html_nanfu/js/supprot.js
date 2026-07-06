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
  var routeWhiteFilter = "brightness(0) invert(1)";

  function createRouteWhiteLayer(route) {
    var whiteRoute = route.cloneNode(false);
    whiteRoute.className = route.className.replace(/\broute-layer\b/g, "route-white-layer");
    whiteRoute.setAttribute("aria-hidden", "true");
    whiteRoute.style.zIndex = 5;
    whiteRoute.style.filter = routeWhiteFilter;
    whiteRoute.style.pointerEvents = "none";
    route.insertAdjacentElement("afterend", whiteRoute);
    gsap.set(whiteRoute, { autoAlpha: 1 });
    return whiteRoute;
  }

  gsap.set([baseLine, title], { autoAlpha: 0 });
  groups.forEach(function (group, index) {
    gsap.set(group.querySelector(".route-layer"), {
      autoAlpha: 0,
      filter: "none"
    });
    gsap.set(group.querySelector(".badge-layer"), {
      autoAlpha: 0,
      transformOrigin: "50% 50%"
    });
    gsap.set(group.querySelector(".dot-layer"), {
      autoAlpha: 0,
      transformOrigin: "50% 50%"
    });
    gsap.set(group.querySelector(".arrow-layer"), {
      autoAlpha: 0,
      x: index === 0 || index === 1 || index === 2 ? "-12" : "12"
    });
    gsap.set(group.querySelector(".step-text"), {
      autoAlpha: 0,
    });
  });

  var timeline = gsap.timeline({
    delay: .1,
    defaults: { ease: "power2.out" },
    onComplete: function () {
      stage.classList.add("is-complete");
    }
  });

  timeline.to(baseLine, {
    autoAlpha: 1,
    duration: .1
  });

  timeline.to(title, {
    autoAlpha: 1,
    duration: .3
  }, "+=.5");

  // 每组切图按固定节奏入场：色带图层 -> 编号 -> 三点连接线 -> 标题。
  groups.forEach(function (group, index) {
    var route = group.querySelector(".route-layer"); //流线
    var whiteRoute = createRouteWhiteLayer(route); //白色流线遮罩层
    var arrow = group.querySelector(".arrow-layer"); //箭头
    var badge = group.querySelector(".badge-layer"); //数字
    var dots = group.querySelector(".dot-layer");//点
    var stepTitle = group.querySelector(".step-text");//标题

    timeline.add("step-" + (index + 1), index === 0 ? ">-=0.05" : ">-=0.01");

    timeline.fromTo(route, {
      autoAlpha: 0
    }, {
      autoAlpha: 1,
      ease: "power1.inOut",
      duration: 0.3
    });

    timeline.fromTo(whiteRoute, {
      autoAlpha: 1
    }, {
      autoAlpha: 0,
      ease: "power1.inOut",
      duration: 0.3
    }, "<");

    timeline.to(arrow, {
      autoAlpha: 1,
      x: 0,
      duration: .1
    }, "step-" + (index + 1) + "+=.3");

    timeline.to(badge, {
      autoAlpha: 1,
      duration: .3
    }, "step-" + (index + 1) + "+=.40");

    timeline.to(dots, {
      autoAlpha: 1,
      duration: .3
    }, "step-" + (index + 1) + "+=.43");

    timeline.to(stepTitle, {
      autoAlpha: 1,
      duration: .3
    }, "step-" + (index + 1) + "+=.44");
  });
})();


$(function () {
  // 遍历每一个 class 为 js_swiper 的元素
  $('.js_swiper').each(function (index, element) {
    // 找到当前轮播图容器的父级（例如 .technology 或 .Proof）
    // 这样可以确保导航按钮只控制它属于的那个轮播图
    var $container = $(element);
    var $parent = $container.closest('.supcon3');

    // 初始化 Swiper
    new Swiper(element, {
      slidesPerView: 3,
      spaceBetween: 10,
      loop: false,
      // 核心优化：仅在当前父级容器下寻找按钮
      navigation: {
        nextEl: $parent.find('.swiper-button-next')[0],
        prevEl: $parent.find('.swiper-button-prev')[0],
      },
      breakpoints: {
        500: {
          slidesPerView: 1,
          spaceBetween: 10
        },
        800: {
          slidesPerView: 2,
          spaceBetween: 10
        }
      }
    });
  });
})
