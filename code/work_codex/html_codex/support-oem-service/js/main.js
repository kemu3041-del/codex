(function () {
  var root = document.querySelector("[data-flow]");
  if (!root) return;

  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var step04 = root.querySelector(".step-04");
  var step04Button = step04 ? step04.querySelector(".step-badge") : null;

  function setStep04Open(isOpen) {
    if (!step04 || !step04Button) return;
    step04.classList.toggle("is-open", isOpen);
    step04Button.setAttribute("aria-expanded", String(isOpen));
  }

  if (step04Button) {
    step04Button.addEventListener("click", function (event) {
      event.preventDefault();
      setStep04Open(!step04.classList.contains("is-open"));
    });

    document.addEventListener("click", function (event) {
      if (!step04.contains(event.target)) {
        setStep04Open(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setStep04Open(false);
        step04Button.blur();
      }
    });
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !window.gsap) {
    root.classList.add("is-complete");
    return;
  }

  var steps = Array.prototype.slice.call(root.querySelectorAll("[data-step]"));
  var segments = Array.prototype.slice.call(root.querySelectorAll(".flow-segment"));

  gsap.set(segments, {
    strokeDasharray: 1,
    strokeDashoffset: 1,
    opacity: 0
  });

  gsap.set(root.querySelector(".flow-title"), {
    autoAlpha: 0,
    y: 16
  });

  steps.forEach(function (step) {
    gsap.set(step, { autoAlpha: 1 });
    gsap.set(step.querySelector(".step-badge"), {
      autoAlpha: 0,
      scale: .58
    });
    gsap.set(step.querySelector(".step-arrows"), {
      autoAlpha: 0,
      x: step.classList.contains("step-03") ? 0 : 16,
      y: step.classList.contains("step-06") ? 16 : 0
    });
    gsap.set(step.querySelector(".step-connector"), {
      autoAlpha: 0,
      scale: .55,
      transformOrigin: "50% 50%"
    });
    gsap.set(step.querySelector(".step-label"), {
      autoAlpha: 0,
      y: step.classList.contains("step-01") || step.classList.contains("step-02") ? 10 : -10
    });
  });

  var timeline = gsap.timeline({
    delay: .25,
    defaults: {
      ease: "power2.out"
    },
    onComplete: function () {
      root.classList.add("is-complete");
    }
  });

  timeline.to(root.querySelector(".flow-title"), {
    autoAlpha: 1,
    y: 0,
    duration: .55
  }, .28);

  // 每个步骤按“弧线 -> 箭头 -> 编号 -> 三点连接 -> 标题”的固定顺序入场。
  steps.forEach(function (step, index) {
    var label = "step-" + index;
    var segment = segments[index];
    var arrow = step.querySelector(".step-arrows");
    var badge = step.querySelector(".step-badge");
    var connector = step.querySelector(".step-connector");
    var title = step.querySelector(".step-label");

    timeline.addLabel(label, index === 0 ? 0 : ">-=0.06");
    timeline.to(segment, {
      strokeDashoffset: 0,
      opacity: 1,
      duration: .72
    }, label);
    timeline.to(arrow, {
      autoAlpha: .86,
      x: 0,
      y: 0,
      duration: .3
    }, label + "+=.34");
    timeline.to(badge, {
      autoAlpha: 1,
      scale: 1,
      duration: .38,
      ease: "back.out(1.85)"
    }, label + "+=.46");
    timeline.to(connector, {
      autoAlpha: 1,
      scale: 1,
      duration: .28
    }, label + "+=.66");
    timeline.to(title, {
      autoAlpha: 1,
      y: 0,
      duration: .34
    }, label + "+=.78");
  });
})();
