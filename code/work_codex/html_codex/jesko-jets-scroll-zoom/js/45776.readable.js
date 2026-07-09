function initPreloader() {
  window.scrollTo(0, 0);
  const e = document.querySelector("[preloader]");
  if (!e) return void initPageTransitions();
  const t = sessionStorage.getItem("hasVisited") ? 1 : 3,
    o = 1e3 * t;
  (sessionStorage.setItem("hasVisited", "true"),
    initPreloaderAnimation(t),
    initPreloaderWindow(t),
    (document.body.style.overflow = "hidden"),
    document.body.setAttribute("data-lenis-prevent", ""),
    setTimeout(() => {
      initGlobe();
    }, 900),
    setTimeout(() => {
      (initPageTransitions(),
        gsap.to(e, {
          autoAlpha: 0,
          duration: 0.6,
          delay: 0.4,
          ease: "Out",
          onComplete: () => {
            ((e.style.display = "none"),
              (document.body.style.overflow = ""),
              document.body.removeAttribute("data-lenis-prevent"));
          },
        }));
    }, o));
}
function initPageTransitions() {
  function e(e = s) {
    return new Promise((t) => setTimeout(t, e));
  }
  function t() {
    ScrollTrigger.getAll().forEach((e) => e.kill());
  }
  async function o({ current: e }) {
    return gsap.to(e.container, {
      opacity: 0,
      duration: 0.6,
      delay: 0,
      ease: "InOut",
    });
  }
  async function r({ current: o }) {
    (lenis && lenis.destroy(), t(), o.container.remove(), await e());
  }
  async function n({ next: e }) {
    return (
      gsap.set(e.container, { opacity: 0 }),
      gsap.to(e.container, {
        opacity: 1,
        duration: 0.6,
        delay: 0,
        ease: "InOut",
      })
    );
  }
  async function a({ next: e }) {
    (initPreloaderHide(),
      requestAnimationFrame(() => {
        lenis && lenis.scrollTo(0, { immediate: !0 });
      }),
      t(),
      initScripts(),
      ScrollTrigger.refresh());
  }
  async function i(e) {
    (initResetWebflow(e),
      setTimeout(() => {
        initGlobe();
      }, 1e3));
  }
  const s = 0;
  barba.init({
    sync: !1,
    debug: !0,
    transitions: [
      {
        name: "slide-fade",
        once(e) {
          initScripts();
        },
        async leave(e) {
          (await o(e), await r(e));
        },
        async enter(e) {
          await n(e);
        },
        async beforeEnter(e) {
          await a(e);
        },
        async afterEnter(e) {
          await i(e);
        },
      },
    ],
  });
}
function initScripts() {
  (initLenis(),
    initThemeChange(),
    initCurrentTime(),
    initFavicon(),
    initOther(),
    initAllParallax(),
    initScrollElementsReveal(),
    initBlockReveal(),
    initHighlightText(),
    initMagneticEffect(),
    initGlobeMaskFollow(),
    initBtnCtaHover(),
    initBtnHover(),
    initNavItemHover(),
    initLinkHover(),
    initPopups(),
    initMenu(),
    initLottieAutoplay(),
    initTFTLjson(),
    initBenefitsAccordion(),
    initLoopingWords(),
    initFormSuccessToggle(),
    initFlickerShow(),
    hideLocal());
}
function initPreloaderAnimation(e) {
  const t = "preloader",
    o = document.querySelector("[preloader]");
  (o && o.classList.remove("bg-grad"),
    splitTextSetup(t),
    animateTextReveal(t, "in"),
    setTimeout(() => {
      animateTextReveal(t, "out");
    }, 1e3 * e));
  const r = document.querySelector("[preloader-bg]");
  r &&
    gsap.fromTo(
      r,
      { "--mask-size": "100% 200%", "--mask-y": "0%" },
      {
        "--mask-size": "100% 200%",
        "--mask-y": "200%",
        duration: 1.2,
        delay: e - 0.4,
        ease: "Out",
      },
    );
}
function initPreloaderWindow(e) {
  const t = document.querySelector("[preloader-window-c]");
  t &&
    gsap.fromTo(
      t,
      { yPercent: 0, scaleY: 1 },
      { yPercent: -92, scaleY: 0.5, duration: 1.2, delay: e, ease: "InOut" },
    );
  const o = document.querySelector("[preloader-knob-c]");
  o &&
    gsap.fromTo(
      o,
      { yPercent: 0 },
      { yPercent: -92, duration: 1.2, delay: e, ease: "InOut" },
    );
  const r = document.querySelector("[preloader-knob-2]");
  r &&
    gsap.fromTo(
      r,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, delay: e, ease: "InOut" },
    );
  const n = document.querySelector("[preloader-front-over]");
  n &&
    gsap.fromTo(
      n,
      { opacity: 1 },
      { opacity: 0, duration: 1.2, delay: e + 0.4, ease: "InOut" },
    );
}
function initPreloaderHide() {
  const e = document.querySelector("[preloader]");
  (e &&
    ((e.style.display = "none"),
    (e.style.opacity = "0"),
    (document.body.style.overflow = ""),
    document.body.removeAttribute("data-lenis-prevent")),
    initPreloaderWindow());
}
function initLenis() {
  (lenis && (lenis.destroy(), (lenis = null)),
    (lenis = new Lenis({
      wrapper: window,
      duration: 1.2,
      smoothWheel: !0,
      smoothTouch: !1,
      touchMultiplier: 2,
      easing: (e) => Math.min(1, 1.001 - Math.pow(2, -10 * e)),
      useOverscroll: !0,
      useControls: !0,
      useAnchor: !0,
      useRaf: !0,
      infinite: !1,
    })),
    lenis.on("scroll", ScrollTrigger.update),
    gsap.ticker.add((e) => lenis.raf(1e3 * e)),
    gsap.ticker.lagSmoothing(0),
    document.querySelectorAll("[data-lenis-scroll]").forEach((e) => {
      function t(e) {
        (o.raf(e), requestAnimationFrame(t));
      }
      const o = new Lenis({
        wrapper: e,
        duration: 0.6,
        smoothWheel: !0,
        smoothTouch: !1,
        easing: (e) => Math.min(1, 1.001 - Math.pow(2, -10 * e)),
        useOverscroll: !1,
        useControls: !1,
        useAnchor: !1,
        useRaf: !1,
        infinite: !1,
      });
      requestAnimationFrame(t);
    }));
}
function splitTextSetup(e) {
  document.querySelectorAll(`[data-reveal-text="${e}"]`).forEach((e) => {
    if (e.__splitDone) return;
    e.innerHTML = e.innerHTML.replace(/(<br\s*\/?>\s*){2}/g, "$1&zwnj;$1");
    const t = e.getAttribute("data-split-text"),
      o = ["lines", "words", "chars"].includes(t) ? t : "lines",
      r = new SplitText(e, {
        type: o,
        linesClass: "line",
        wordsClass: "word",
        charsClass: "char",
      });
    ((e.__splitType = o),
      (e.__targets =
        "words" === o ? r.words : "chars" === o ? r.chars : r.lines),
      (e.__revealTL = null),
      (e.__splitDone = !0),
      gsap.set(e, { visibility: "visible" }));
  });
}
function killTextReveal(e) {
  document.querySelectorAll(`[data-reveal-text="${e}"]`).forEach((e) => {
    e.__revealTL && (e.__revealTL.kill(), (e.__revealTL = null));
    const t = e.__targets || [];
    t.length && gsap.killTweensOf(t);
  });
}
function animateTextReveal(e, t = "in") {
  document.querySelectorAll(`[data-reveal-text="${e}"]`).forEach((e) => {
    const o = e.__splitType || e.getAttribute("data-split-text") || "lines",
      r =
        e.__targets ||
        e.querySelectorAll(
          "words" === o ? ".word" : "chars" === o ? ".char" : ".line",
        );
    if (!r || !r.length) return;
    let n = e.__revealTL;
    (n && n.kill(),
      (n = gsap.timeline({ defaults: { overwrite: "auto" } })),
      (e.__revealTL = n),
      "lines" === o &&
        ("in" === t
          ? n.fromTo(
              r,
              { filter: "blur(36px)", opacity: 0 },
              {
                filter: "blur(0px)",
                opacity: 1,
                duration: 1,
                stagger: 0.08,
                ease: "Out",
              },
            )
          : n.to(r, {
              filter: "blur(36px)",
              opacity: 0,
              duration: 0.6,
              stagger: 0.02,
              ease: "In",
            })),
      "words" === o &&
        ("in" === t
          ? n.fromTo(
              r,
              { opacity: 0, rotateX: 90 },
              {
                opacity: 1,
                rotateX: 0,
                transformOrigin: "center bottom",
                duration: 1,
                delay: 0.2,
                stagger: 0.075,
                ease: "Out",
              },
            )
          : n.to(r, {
              opacity: 0,
              rotateX: 90,
              transformOrigin: "center bottom",
              duration: 0.6,
              stagger: 0.05,
              ease: "Out",
            })),
      "chars" === o &&
        ("in" === t
          ? n.fromTo(
              r,
              { opacity: 0, rotateY: 90 },
              {
                opacity: 1,
                rotateY: 0,
                transformOrigin: "center center",
                duration: 1,
                delay: 0.2,
                stagger: 0.025,
                ease: "Out",
              },
            )
          : n.to(r, {
              opacity: 0,
              rotateY: 90,
              transformOrigin: "center center",
              duration: 0.6,
              stagger: 0.025,
              ease: "Out",
            })));
  });
}
function initScrollTriggerRefresh() {
  if (window.gsap && window.ScrollTrigger) {
    var e = window.pageYOffset || document.documentElement.scrollTop || 0,
      t = [],
      o = new Set();
    (ScrollTrigger.getAll().forEach(function (e) {
      var r = e.animation;
      r &&
        (o.has(r) ||
          (o.add(r),
          t.push({
            anim: r,
            paused: r.paused(),
            totalProgress: r.totalProgress(),
          })));
    }),
      ScrollTrigger.refresh());
    for (var r = 0; r < t.length; r++) {
      var n = t[r],
        a = n.anim;
      a &&
        (a.totalProgress(n.totalProgress, !0), n.paused ? a.pause() : a.play());
    }
    ("function" == typeof window.scrollTo && window.scrollTo(0, e),
      gsap.ticker &&
        "function" == typeof gsap.ticker.flush &&
        gsap.ticker.flush());
  }
}
function initThemeChange() {
  function e(e, o, r) {
    t.forEach((t) => {
      const n = t.offsetHeight;
      (ScrollTrigger.create({
        trigger: e,
        start: () => "top top+=" + n / 2,
        end: () => "top top+=" + (n / 2 + 1),
        onEnter: () => {
          (t.classList.add(o), t.classList.remove(r));
        },
        onLeaveBack: () => {
          (t.classList.remove(o), t.classList.add(r));
        },
        markers: !1,
      }),
        ScrollTrigger.create({
          trigger: e,
          start: () => "bottom top+=" + n / 2,
          end: () => "bottom top+=" + (n / 2 + 1),
          onEnter: () => {
            (t.classList.remove(o), t.classList.add(r));
          },
          onLeaveBack: () => {
            (t.classList.add(o), t.classList.remove(r));
          },
          markers: !1,
        }));
    });
  }
  const t = document.querySelectorAll("[theme]");
  (document.querySelectorAll('[bg="color"]').forEach((t) => {
    e(t, "theme_on-color", "theme_on-light");
  }),
    document.querySelectorAll('[bg="light"]').forEach((t) => {
      e(t, "theme_on-light", "theme_on-color");
    }));
}
function initCurrentTime() {
  function e() {
    const e = document.querySelectorAll('[clock="time"]');
    if (!e.length) return;
    const o = new Date(),
      r = new Intl.DateTimeFormat("en-GB", {
        timeZone: t,
        hour: "2-digit",
        minute: "2-digit",
        hour12: !1,
      }).format(o);
    e.forEach((e) => {
      e.textContent = r;
    });
  }
  const t = "Asia/Dubai";
  (setInterval(e, 1e3), e());
}
function initFavicon() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      function e(e) {
        return fetch(e, { mode: "cors", cache: "force-cache" })
          .then(function (e) {
            return e.ok ? e.blob() : Promise.reject(e.status);
          })
          .then(function (e) {
            return URL.createObjectURL(e);
          });
      }
      function t() {
        return Promise.all(
          n.map(function (t) {
            return e(t).catch(function () {
              return t;
            });
          }),
        ).then(function (e) {
          ((i = e), (a.href = i[0]));
        });
      }
      function o() {
        l ||
          0 === i.length ||
          (l = setInterval(function () {
            ((a.href = i[s]), (s = (s + 1) % i.length));
          }, 100));
      }
      function r() {
        l && (clearInterval(l), (l = null));
      }
      var n = [
          "https://cdn.prod.website-files.com/68b57ef5ef86011d9b251e8e/68d5b157ea29e138590eb3fe_fav_32x32.png",
          "https://cdn.prod.website-files.com/68b57ef5ef86011d9b251e8e/68d5b1f46b79fff0e28ec9d6_fav-2_32x32.png",
        ],
        a =
          document.querySelector("link[rel*='icon']") ||
          document.createElement("link");
      ((a.rel = "icon"),
        (a.type = "image/png"),
        a.parentNode || document.head.appendChild(a));
      var i = [],
        s = 0,
        l = null;
      (document.addEventListener("visibilitychange", function () {
        document.hidden ? o() : r();
      }),
        window.addEventListener("beforeunload", function () {
          i.forEach(function (e) {
            e && e.startsWith("blob:") && URL.revokeObjectURL(e);
          });
        }),
        t());
    },
  });
}
function initAllParallax() {
  if (
    (ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        gsap.utils.toArray('[parallax="img"]').forEach((e) => {
          const t = e.closest('[parallax="w"]');
          t &&
            gsap.fromTo(
              e,
              { yPercent: -30 },
              {
                yPercent: 10,
                ease: "none",
                scrollTrigger: {
                  trigger: t,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.5,
                },
              },
            );
        });
      },
    }),
    document.querySelector(".hero_scroll-area"))
  ) {
    const e = document.querySelectorAll(".link-logo");
    if (!e.length) return;
    (gsap.set(e, { y: "44vh", scale: 1.25, translateZ: 10 }),
      gsap.to(e, {
        y: "0vh",
        scale: 1,
        translateZ: 10,
        ease: "ease",
        scrollTrigger: {
          trigger: ".hero_scroll-area",
          start: "top top",
          end: "bottom bottom",
          scrub: !0,
        },
      }));
  }
  (ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      if (document.querySelector(".globe-bot-w")) {
        const e = document.querySelectorAll(".btn-cta_c");
        if (!e.length) return;
        (gsap.set(e, { y: "0", translateZ: 10 }),
          gsap.to(e, {
            y: "-16.632em",
            scale: 1,
            translateZ: 10,
            ease: "none",
            scrollTrigger: {
              trigger: ".globe-bot-w",
              start: "top bottom",
              end: "bottom bottom",
              scrub: !0,
            },
          }));
      }
    },
  }),
    ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        gsap.utils.toArray(".hero-w_bg").forEach((e) => {
          const t = gsap.timeline({
            scrollTrigger: {
              trigger: ".hero_scroll-area",
              start: "top top",
              end: "bottom bottom",
              scrub: !0,
            },
          });
          (t.fromTo(
            e,
            { scale: 1, xPercent: 0, translateZ: 100 },
            {
              scale: 6.5,
              xPercent: -2,
              translateZ: 100,
              ease: "none",
              duration: 1,
            },
            0,
          ),
            t.fromTo(
              ".hero-s",
              { scale: 1 },
              { scale: 8, ease: "none", duration: 1 },
              0,
            ),
            t.fromTo(
              "[hero-s_left]",
              { x: "0vw" },
              { x: "-50vw", ease: "none", duration: 1 },
              0,
            ),
            t.fromTo(
              "[hero-s_right]",
              { x: "0vw" },
              { x: "50vw", ease: "none", duration: 1 },
              0,
            ));
        });
      },
    }),
    ScrollTrigger.matchMedia({
      [`(max-width: ${breakPoint - 1}px)`]: function () {
        gsap.utils.toArray(".hero-w_bg").forEach((e) => {
          const t = gsap.timeline({
            scrollTrigger: {
              trigger: ".hero_scroll-area",
              start: "top top",
              end: "bottom bottom",
              scrub: !0,
            },
          });
          (t.fromTo(
            e,
            { scale: 1, xPercent: 0, translateZ: 100 },
            {
              scale: 6.5,
              xPercent: -2,
              translateZ: 100,
              ease: "none",
              duration: 1,
            },
            0,
          ),
            t.fromTo(
              ".hero-s",
              { scale: 1 },
              { scale: 8, ease: "none", duration: 1 },
              0,
            ));
        });
      },
    }),
    ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        gsap.utils.toArray(".sky-bg_hero").forEach((e) => {
          gsap.fromTo(
            e,
            { y: "0vh", translateZ: 10 },
            {
              y: "100vh",
              translateZ: 10,
              ease: "none",
              scrollTrigger: {
                trigger: ".hero_scroll-area",
                start: "top top",
                end: "bottom bottom",
                scrub: !0,
              },
            },
          );
        });
      },
    }),
    ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        gsap.utils.toArray(".about-s").forEach((e) => {
          gsap.fromTo(
            e,
            { y: "-50vh", translateZ: 10 },
            {
              y: "-200vh",
              translateZ: 10,
              ease: "none",
              scrollTrigger: {
                trigger: ".about-w",
                start: "top bottom",
                end: "bottom top",
                scrub: !0,
              },
            },
          );
        });
      },
    }),
    gsap.utils.toArray(".light-bg").forEach((e) => {
      gsap.fromTo(
        e,
        { opacity: 0, translateZ: 10 },
        {
          opacity: 1,
          translateZ: 10,
          ease: "none",
          scrollTrigger: {
            trigger: ".jet_scroll-area",
            start: "top top",
            end: "center center",
            scrub: !0,
          },
        },
      );
    }),
    ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        (gsap.utils.toArray(".jet-w, .spec-w").forEach((e) => {
          gsap.fromTo(
            e,
            { yPercent: 0, translateZ: 10 },
            {
              yPercent: 100,
              translateZ: 10,
              ease: "none",
              scrollTrigger: {
                trigger: ".jet_scroll-area",
                start: "50% center",
                end: "85% bottom",
                scrub: 1.2,
              },
            },
          );
        }),
          gsap.utils.toArray(".jet").forEach((e) => {
            gsap.fromTo(
              e,
              { scale: 1, yPercent: 0, translateZ: 10 },
              {
                scale: 0.4,
                yPercent: -15,
                translateZ: 10,
                ease: "In",
                scrollTrigger: {
                  trigger: ".jet_scroll-area",
                  start: "25% center",
                  end: "85% bottom",
                  scrub: 1.2,
                },
              },
            );
          }),
          gsap.utils.toArray(".img-jet").forEach((e) => {
            gsap.fromTo(
              e,
              { "--mask-size": "100% 150%" },
              {
                "--mask-size": "100% 0%",
                ease: "none",
                scrollTrigger: {
                  trigger: ".jet_scroll-area",
                  start: "85% bottom",
                  end: "bottom bottom",
                  scrub: !0,
                },
              },
            );
          }),
          gsap.utils.toArray(".blueprint").forEach((e) => {
            gsap.fromTo(
              e,
              { "--mask-size": "100% 0%", "--mask-y": "200%" },
              {
                "--mask-size": "100% 150%",
                "--mask-y": "50%",
                ease: "none",
                scrollTrigger: {
                  trigger: ".jet_scroll-area",
                  start: "85% bottom",
                  end: "bottom bottom",
                  scrub: !0,
                },
              },
            );
          }));
      },
    }),
    ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        gsap.utils.toArray(".globe-s_city_c").forEach((e) => {
          document.querySelector(".city-mask-trigger") &&
            gsap.fromTo(
              e,
              { yPercent: -40, translateZ: 10 },
              {
                yPercent: 0,
                translateZ: 10,
                ease: "none",
                scrollTrigger: {
                  trigger: ".city-mask-trigger",
                  start: "top bottom",
                  end: "top top",
                  scrub: !0,
                },
              },
            );
        });
      },
    }),
    document.querySelector(".city-mask-trigger") &&
      gsap.to(".globe-s_city", {
        "--mask-size": "100% 0%",
        ease: "none",
        scrollTrigger: {
          trigger: ".city-mask-trigger",
          start: "top top",
          end: "bottom top",
          scrub: !0,
        },
      }),
    ScrollTrigger.matchMedia({
      [`(min-width: ${breakPoint}px)`]: function () {
        gsap.utils.toArray(".globe-s_title").forEach((e) => {
          const t = gsap.timeline({
            scrollTrigger: {
              trigger: ".globe_scroll-area",
              start: "top top",
              end: "bottom bottom",
              scrub: !0,
            },
          });
          (t.fromTo(e, { y: "33.333em" }, { y: "0em", ease: "none" }, 0),
            t.fromTo(
              ".globe-s_bot_globe-w",
              { yPercent: 135, scale: 2, translateZ: 10 },
              { yPercent: 0, scale: 1, translateZ: 10, ease: "none" },
              0,
            ));
        });
      },
    }));
}
function initScrollElementsReveal() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      (document.querySelectorAll("[data-line-reveal='true']").forEach((e) => {
        e.innerHTML = e.innerHTML.replace(/(<br\s*\/?>\s*){2}/g, "$1&zwnj;$1");
        const t = new SplitText(e, { type: "lines", linesClass: "line" });
        (gsap
          .timeline({
            scrollTrigger: {
              trigger: e,
              start: "top bottom",
              end: "top bottom",
              toggleActions: "play none none none",
            },
          })
          .from(t.lines, {
            filter: "blur(36px)",
            opacity: 0,
            duration: 1,
            delay: 0.3,
            stagger: 0.1,
            ease: "Out",
          }),
          gsap.set(e, { visibility: "visible" }));
      }),
        document.querySelectorAll("[data-char-reveal='true']").forEach((e) => {
          e.innerHTML = e.innerHTML.replace(
            /(<br\s*\/?>\s*){2}/g,
            "$1&zwnj;$1",
          );
          const t = new SplitText(e, {
            type: "words,chars",
            linesClass: "line",
            wordsClass: "word",
            charsClass: "char",
          });
          gsap.set(t.words, { display: "inline-block", whiteSpace: "nowrap" });
          (gsap
            .timeline({
              scrollTrigger: {
                trigger: e,
                start: "top bottom",
                end: "top bottom",
                toggleActions: "play none none none",
              },
            })
            .from(t.chars, {
              filter: "blur(36px)",
              opacity: 0,
              duration: 1,
              delay: 0.3,
              stagger: 0.05,
              ease: "Out",
            }),
            gsap.set(e, { visibility: "visible" }));
        }),
        document.querySelectorAll('[data-div-reveal="true"]').forEach((e) => {
          const t = Array.from(e.children);
          t.length &&
            (gsap
              .timeline({
                scrollTrigger: {
                  trigger: e,
                  start: "top bottom",
                  end: "top bottom",
                  toggleActions: "play none none none",
                },
              })
              .from(t, {
                filter: "blur(36px)",
                opacity: 0,
                duration: 1,
                delay: 0.3,
                stagger: 0.1,
                ease: "Out",
              }),
            gsap.set(t, { visibility: "visible" }));
        }));
    },
  });
}
function initBlockReveal() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      const e = document.querySelector("[flight-404-reveal]"),
        t = document.querySelector(".header"),
        o = document.querySelector(".cta"),
        r = document.querySelector(".p-404-s_light-bg"),
        n = gsap.timeline();
      (e &&
        (gsap.set(e, { visibility: "visible" }),
        n.fromTo(
          e,
          { yPercent: 100 },
          { yPercent: 0, duration: 2.4, ease: "Out" },
          0,
        )),
        t &&
          (gsap.set(t, { visibility: "visible" }),
          n.fromTo(
            t,
            { yPercent: -100 },
            { yPercent: 0, duration: 1.2, ease: "Out" },
            0,
          )),
        o &&
          (gsap.set(o, { visibility: "visible" }),
          n.fromTo(
            o,
            { yPercent: 100 },
            { yPercent: 0, duration: 1.2, ease: "Out" },
            0,
          )),
        r &&
          (gsap.set(r, { visibility: "visible" }),
          n.fromTo(
            r,
            { opacity: 0 },
            { opacity: 1, duration: 1.2, ease: "Out" },
            0,
          )));
    },
  });
}
function initHighlightText() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      const e = Array.from(document.querySelectorAll("[data-highlight-text]"));
      e.length &&
        e.forEach((e) => {
          const t = new SplitText(e, {
            type: "words,chars",
            linesClass: "line",
            wordsClass: "word",
            charsClass: "char",
            tag: "span",
          });
          gsap.set(t.words, { display: "inline-block", whiteSpace: "nowrap" });
          const o = t.chars;
          if (!o || !o.length) return;
          const r = e.closest("[data-highlight-wrapper]") || e;
          (gsap
            .timeline({
              scrollTrigger: {
                trigger: r,
                start: "top 75%",
                end: "bottom 75%",
                scrub: !0,
              },
            })
            .from(o, {
              opacity: 0.15,
              duration: 0.6,
              ease: "Out",
              stagger: { each: 0.04 },
            }),
            gsap.set(e, { opacity: 1 }));
        });
    },
  });
}
function initMagneticEffect() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      const e = document.querySelectorAll("[data-magnetic-strength]");
      if (window.innerWidth <= 991) return;
      const t = (e, t) => {
          e &&
            (gsap.killTweensOf(e),
            (t ? gsap.set : gsap.to)(e, {
              x: "0em",
              y: "0em",
              rotate: "0deg",
              clearProps: "all",
              ...(!t && { ease: "elastic.out(1, 0.3)", duration: 1.6 }),
            }));
        },
        o = (e) => {
          const o = e.currentTarget;
          (t(o, !0),
            o
              .querySelectorAll("[data-magnetic-inner-target]")
              .forEach((e) => t(e, !0)));
        },
        r = (e) => {
          const t = e.currentTarget,
            o = t.getBoundingClientRect(),
            r = parseFloat(t.getAttribute("data-magnetic-strength")) || 25,
            n = t.querySelectorAll("[data-magnetic-inner-target]"),
            a = parseFloat(t.getAttribute("data-magnetic-strength-inner")) || r,
            i = ((e.clientX - o.left) / t.offsetWidth - 0.5) * (r / 16),
            s = ((e.clientY - o.top) / t.offsetHeight - 0.5) * (r / 16);
          (gsap.to(t, {
            x: i + "em",
            y: s + "em",
            rotate: "0.001deg",
            ease: "power4.out",
            duration: 1.6,
          }),
            n.length &&
              n.forEach((r) => {
                const n =
                    ((e.clientX - o.left) / t.offsetWidth - 0.5) * (a / 16),
                  i = ((e.clientY - o.top) / t.offsetHeight - 0.5) * (a / 16);
                gsap.to(r, {
                  x: n + "em",
                  y: i + "em",
                  rotate: "0.001deg",
                  ease: "power4.out",
                  duration: 2,
                });
              }));
        },
        n = (e) => {
          const t = e.currentTarget,
            o = t.querySelectorAll("[data-magnetic-inner-target]");
          (gsap.to(t, {
            x: "0em",
            y: "0em",
            ease: "elastic.out(1, 0.3)",
            duration: 1.6,
            clearProps: "all",
          }),
            o.length &&
              o.forEach((e) => {
                gsap.to(e, {
                  x: "0em",
                  y: "0em",
                  ease: "elastic.out(1, 0.3)",
                  duration: 2,
                  clearProps: "all",
                });
              }));
        };
      e.forEach((e) => {
        (e.addEventListener("mouseenter", o),
          e.addEventListener("mousemove", r),
          e.addEventListener("mouseleave", n));
      });
    },
  });
}
function initGlobeMaskFollow() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      const e = document.querySelector(".globe");
      e &&
        window.addEventListener("mousemove", (t) => {
          const o = 75 * (0.5 - t.clientX / window.innerWidth);
          gsap.to(e, { duration: 2.4, ease: "Out", "--mask-x": `${50 + o}%` });
        });
    },
  });
}
function initBtnCtaHover() {
  document.querySelectorAll("[hover='btn-cta']").forEach((e) => {
    const t = e.querySelectorAll("[hover='text']"),
      o = e.querySelectorAll("[hover='icon']");
    if (t.length < 2) return;
    const [r, n] = t,
      [a, i] = o,
      s = new SplitText(r, { type: "chars" }),
      l = new SplitText(n, { type: "chars" }),
      c = s.chars,
      u = l.chars;
    let d = !1;
    const g = gsap.timeline({
      paused: !0,
      onStart: () => (d = !0),
      onComplete: () => (d = !1),
    });
    (g.to(
      c,
      { yPercent: -100, opacity: 0, duration: 1, ease: "Out", stagger: 0.01 },
      0,
    ),
      g.fromTo(
        u,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1, ease: "Out", stagger: 0.01 },
        0,
      ),
      g.to(a, { xPercent: 150, yPercent: -75, duration: 1, ease: "InOut" }, 0),
      g.fromTo(
        i,
        { xPercent: -150, yPercent: 75 },
        { xPercent: 0, yPercent: 0, duration: 1, ease: "InOut" },
        0,
      ));
    (e.closest('[hover-trigger="btn-cta"]') || e).addEventListener(
      "mouseenter",
      () => {
        d ||
          (gsap.set(c, { yPercent: 0, opacity: 1 }),
          gsap.set(u, { yPercent: 100, opacity: 0 }),
          gsap.set(a, { xPercent: 0, yPercent: 0 }),
          gsap.set(i, { xPercent: -150, yPercent: 75 }),
          g.restart());
      },
    );
  });
}
function initBtnHover() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      document.querySelectorAll("[hover='btn']").forEach((e) => {
        function t() {
          (u && u.kill(),
            (u = gsap.to(l, {
              progress: 1,
              duration: 1.2,
              ease: "Out",
              overwrite: !0,
            })),
            a.forEach((e) => e.classList.remove("hover")));
        }
        function o() {
          (u && u.kill(),
            (u = gsap.to(l, {
              progress: 0,
              duration: 0.6,
              ease: "Out",
              overwrite: !0,
            })),
            a.forEach((e) => e.classList.add("hover")));
        }
        const r = e.querySelectorAll("[hover='idle']"),
          n = e.querySelectorAll("[hover='hover']"),
          a = e.querySelectorAll("[hover='text']");
        if (a.length < 2) return;
        const [i, s] = a,
          l = gsap.timeline({ paused: !0 });
        (l.to(i, { xPercent: -150, opacity: 0 }, 0),
          l.fromTo(
            s,
            { xPercent: 150, opacity: 0 },
            { xPercent: 0, opacity: 1 },
            0,
          ),
          l.to(r, { xPercent: 100 }, 0),
          l.to(n, { xPercent: 100 }, 0));
        const c = e.closest('[hover-trigger="btn"]') || e;
        let u = null;
        (c.addEventListener("mouseenter", t),
          c.addEventListener("mouseleave", o));
      });
    },
  });
}
function initNavItemHover() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      document.querySelectorAll("[hover='nav-item']").forEach((e) => {
        function t() {
          (c && c.kill(),
            (c = gsap.to(s, {
              progress: 1,
              duration: 1.2,
              ease: "Out",
              overwrite: !0,
            })),
            n.forEach((e) => e.classList.remove("hover")));
        }
        function o() {
          (c && c.kill(),
            (c = gsap.to(s, {
              progress: 0,
              duration: 0.6,
              ease: "Out",
              overwrite: !0,
            })),
            n.forEach((e) => e.classList.add("hover")));
        }
        const r = e.querySelectorAll("[hover='bg']"),
          n = e.querySelectorAll("[hover='text']");
        if (n.length < 2) return;
        const [a, i] = n,
          s = gsap.timeline({ paused: !0 });
        (s.to(a, { yPercent: -100, opacity: 0 }, 0),
          s.fromTo(
            i,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1 },
            0,
          ),
          s.to(r, { yPercent: -100 }, 0));
        const l = e.closest('[hover-trigger="nav-item"]') || e;
        let c = null;
        (l.addEventListener("mouseenter", t),
          l.addEventListener("mouseleave", o));
      });
    },
  });
}
function initLinkHover() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      document.querySelectorAll("[hover='link']").forEach((e) => {
        const t = e.querySelectorAll("[hover='text']");
        if (t.length < 2) return;
        const [o, r] = t,
          n = new SplitText(o, { type: "chars" }),
          a = new SplitText(r, { type: "chars" }),
          i = n.chars,
          s = a.chars;
        let l = !1;
        const c = gsap.timeline({
          paused: !0,
          onStart: () => (l = !0),
          onComplete: () => (l = !1),
        });
        (c.to(
          i,
          {
            yPercent: -100,
            opacity: 0,
            duration: 0.8,
            ease: "Out",
            stagger: 0.01,
          },
          0,
        ),
          c.fromTo(
            s,
            { yPercent: 100, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.8,
              ease: "Out",
              stagger: 0.01,
            },
            0,
          ));
        (e.closest('[hover-trigger="link"]') || e).addEventListener(
          "mouseenter",
          () => {
            l ||
              (gsap.set(i, { yPercent: 0, opacity: 1 }),
              gsap.set(s, { yPercent: 100, opacity: 0 }),
              c.restart());
          },
        );
      });
    },
  });
}
function initPopups() {
  (document.querySelectorAll("[pop-up-open]").forEach((e) => {
    const t = e.getAttribute("pop-up-open"),
      o = document.querySelector(`[pop-up="${t}"]`),
      r = document.querySelector(`[pop-up-main="${t}"]`),
      n = document.querySelector(`[pop-up-success="${t}"]`),
      a = document.querySelector(`[pop-up-btn-c="${t}"]`),
      i = document.querySelector(`[pop-up-over="${t}"]`),
      s = document.querySelectorAll(`[pop-up-open="${t}"]`),
      l = document.querySelectorAll(`[pop-up-close="${t}"]`);
    o &&
      i &&
      e.addEventListener("click", () => {
        (gsap.killTweensOf([o, r, n, a, i, s, l]),
          gsap.set(o, { display: "block" }),
          gsap.fromTo(
            r,
            { yPercent: 110 },
            { yPercent: 0, duration: 1, ease: "Out" },
          ),
          gsap.fromTo(
            n,
            { y: "110vh", rotate: 0 },
            { y: "0", rotate: 0, duration: 1, ease: "Out" },
          ),
          gsap.to(a, {
            y: () => {
              const e = parseFloat(getComputedStyle(r).fontSize);
              return -(r.offsetHeight - 1.667 * e) + "px";
            },
            duration: 1,
            ease: "Out",
          }),
          gsap.fromTo(
            s,
            { x: "0em", display: "flex" },
            {
              x: "3.333em",
              duration: 1,
              ease: "Out",
              onUpdate: function () {
                this.progress() >= 0 &&
                  s.forEach((e) => (e.style.display = "none"));
              },
            },
          ),
          gsap.fromTo(
            l,
            { x: "-3.333em", display: "none" },
            {
              x: "0em",
              duration: 1,
              ease: "Out",
              onUpdate: function () {
                this.progress() >= 0 &&
                  l.forEach((e) => (e.style.display = "flex"));
              },
            },
          ),
          gsap.fromTo(
            i,
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: "Out" },
          ),
          (document.body.style.overflow = "hidden"),
          document.body.setAttribute("data-lenis-prevent", ""));
      });
  }),
    document.querySelectorAll("[pop-up-close]").forEach((e) => {
      const t = e.getAttribute("pop-up-close"),
        o = document.querySelector(`[pop-up="${t}"]`),
        r = document.querySelector(`[pop-up-main="${t}"]`),
        n = document.querySelector(`[pop-up-success="${t}"]`),
        a = document.querySelector(`[pop-up-btn-c="${t}"]`),
        i = document.querySelector(`[pop-up-over="${t}"]`),
        s = document.querySelectorAll(`[pop-up-open="${t}"]`),
        l = document.querySelectorAll(`[pop-up-close="${t}"]`);
      o &&
        i &&
        e.addEventListener("click", () => {
          (gsap.killTweensOf([o, r, n, a, i, s, l]),
            gsap.to(r, {
              yPercent: 110,
              duration: 1,
              ease: "Out",
              onComplete: () => (o.style.display = "none"),
            }),
            gsap.to(n, { y: "110vh", rotate: 25, duration: 1, ease: "In" }),
            gsap.to(a, { y: 0, duration: 1, ease: "Out" }),
            gsap.to(s, {
              x: "0em",
              duration: 1,
              ease: "Out",
              onUpdate: function () {
                this.progress() >= 0 &&
                  s.forEach((e) => (e.style.display = "flex"));
              },
            }),
            gsap.to(l, {
              x: "-3.333em",
              duration: 1,
              ease: "Out",
              onUpdate: function () {
                this.progress() >= 0 &&
                  l.forEach((e) => (e.style.display = "none"));
              },
            }),
            gsap.to(i, { opacity: 0, duration: 1, ease: "Out" }),
            (document.body.style.overflow = ""),
            document.body.removeAttribute("data-lenis-prevent"));
        });
    }));
}
function initMenu() {
  ScrollTrigger.matchMedia({
    [`(max-width: ${breakPoint - 1}px)`]: function () {
      const e = {};
      document.querySelectorAll("[menu-btn]").forEach((t) => {
        function o() {
          (m && (m.kill(), (m = null)),
            gsap.killTweensOf([a, s, l, c, u, ...p]),
            (e[n] = !0),
            (document.body.style.overflow = "hidden"),
            document.body.setAttribute("data-lenis-prevent", ""),
            d.classList.add("theme_on-color"),
            gsap.set(a, { display: "block" }),
            gsap.set(p, { xPercent: -50, opacity: 0 }),
            gsap.set(s, { opacity: 0, display: "block" }),
            gsap.to(s, { opacity: 1, duration: 0.6, ease: "Out" }),
            l &&
              gsap.to(l, {
                rotate: 45,
                xPercent: -20,
                yPercent: 20,
                duration: 0.6,
                ease: "InOut",
              }),
            u &&
              gsap.to(u, {
                rotate: -45,
                xPercent: -20,
                yPercent: -20,
                duration: 0.6,
                ease: "InOut",
              }),
            c && gsap.to(c, { scaleX: 0, duration: 0.6, ease: "InOut" }),
            gsap.to(p, {
              xPercent: 0,
              opacity: 1,
              duration: 0.6,
              ease: "Out",
              stagger: 0.1,
              overwrite: "auto",
            }));
        }
        function r() {
          (gsap.killTweensOf([a, s, l, c, u, ...p]),
            (e[n] = !1),
            (m = gsap.to(p, {
              xPercent: 0,
              opacity: 0,
              duration: 0.6,
              ease: "Out",
              stagger: 0.1,
              overwrite: "auto",
              onComplete: () => {
                ((m = null),
                  e[n] ||
                    ((a.style.display = "none"),
                    (document.body.style.overflow = ""),
                    document.body.removeAttribute("data-lenis-prevent"),
                    d.classList.remove("theme_on-color")));
              },
            })),
            gsap.to(s, {
              opacity: 0,
              duration: 0.6,
              ease: "In",
              onComplete: () => (s.style.display = "none"),
            }),
            l &&
              gsap.to(l, {
                rotate: 0,
                xPercent: 0,
                yPercent: 0,
                duration: 0.6,
                ease: "InOut",
              }),
            u &&
              gsap.to(u, {
                rotate: 0,
                xPercent: 0,
                yPercent: 0,
                duration: 0.6,
                ease: "InOut",
              }),
            c && gsap.to(c, { scaleX: 1, duration: 0.6, ease: "InOut" }));
        }
        const n = t.getAttribute("menu-btn"),
          a = document.querySelector(`[menu="${n}"]`),
          i = document.querySelector(`[menu-list="${n}"]`),
          s = document.querySelector(`[menu-over="${n}"]`),
          l = document.querySelector(`[menu-ico-1="${n}"]`),
          c = document.querySelector(`[menu-ico-2="${n}"]`),
          u = document.querySelector(`[menu-ico-3="${n}"]`),
          d = document.querySelector(".header_c"),
          g = document.querySelectorAll(`[menu-close="${n}"]`);
        if (!(a && s && d && i)) return;
        const p = Array.from(i.children).filter((e) => 1 === e.nodeType);
        n in e || (e[n] = !1);
        let m = null;
        (t.addEventListener("click", () => {
          e[n] ? r() : o();
        }),
          g.forEach((t) => {
            t.addEventListener("click", () => {
              e[n] && r();
            });
          }));
      });
    },
  });
}
function initGlobe() {
  ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      function e() {
        n.width(t.offsetWidth).height(t.offsetHeight);
      }
      const t = document.querySelector("[globe-container]");
      if (!t || "function" != typeof Globe) return;
      const o = [...Array(10).keys()].map(() => ({
          startLat: 180 * (Math.random() - 0.5),
          startLng: 360 * (Math.random() - 0.5),
          endLat: 180 * (Math.random() - 0.5),
          endLng: 360 * (Math.random() - 0.5),
          color: ["#7A716E", "#7A716E"],
        })),
        r = o.flatMap((e) => [
          { lat: e.startLat, lng: e.startLng },
          { lat: e.endLat, lng: e.endLng },
        ]),
        n = Globe()(t)
          .globeImageUrl(
            "https://cdn.prod.website-files.com/68b57ef5ef86011d9b251e8e/68ba0382a28da03b24642636_globe-map.svg",
          )
          .showAtmosphere(!1)
          .backgroundColor("rgba(0,0,0,0)")
          .width(t.offsetWidth)
          .height(t.offsetHeight)
          .arcsData(o)
          .arcColor("color")
          .arcStroke(0.5)
          .arcDashLength(0.6)
          .arcDashGap(0.2)
          .arcDashAnimateTime(8e3)
          .arcsTransitionDuration(0)
          .pointsData(r)
          .pointColor(() => "#7A716E")
          .pointAltitude(0)
          .pointRadius(0.5)
          .pointResolution(8)
          .pointsTransitionDuration(0),
        a = n.globeMaterial && n.globeMaterial();
      a &&
        ((a.shininess = 0),
        window.THREE && (a.specular = new THREE.Color(0)),
        (a.needsUpdate = !0));
      const i = n.controls();
      ((i.enableZoom = !1), (i.enablePan = !1));
      const s =
        "function" == typeof i.getPolarAngle ? i.getPolarAngle() : Math.PI / 2;
      ((i.minPolarAngle = s),
        (i.maxPolarAngle = s),
        (i.autoRotate = !0),
        (i.autoRotateSpeed = 2),
        window.addEventListener("resize", e));
    },
  });
}
function initLottieAutoplay() {
  document.querySelectorAll('[data-json][play="true"]').forEach((e) => {
    lottie.loadAnimation({
      container: e,
      renderer: "svg",
      loop: !0,
      autoplay: !0,
      path: e.getAttribute("data-json"),
    });
  });
}
function initTFTLjson() {
  document.querySelectorAll(".credits").forEach((e) => {
    const t = e.querySelector(".tftl-lottie");
    if (!t) return;
    const o = lottie.loadAnimation({
      container: t,
      renderer: "svg",
      loop: !1,
      autoplay: !1,
      path: t.getAttribute("data-json"),
    });
    o.goToAndStop(0, !0);
    const r = 99,
      n = gsap.timeline({ paused: !0 });
    (n.to(
      { p: 0 },
      {
        p: 1,
        duration: 1,
        ease: "none",
        onUpdate: function () {
          const e = Math.round(this.targets()[0].p * (r - 1));
          o.goToAndStop(e, !0);
        },
      },
    ),
      e.addEventListener("mouseenter", () => {
        gsap.to(n, { progress: 0.5, duration: 1 });
      }),
      e.addEventListener("mouseleave", () => {
        gsap.to(n, { progress: 1, duration: 1 });
      }));
  });
}
function initBenefitsAccordion() {
  function e(e) {
    return {
      desc: document.querySelector(`[benefits-desc="${e}"]`),
      media: document.querySelector(`[benefits-media-item="${e}"]`),
      imgW: document.querySelector(`[benefits-img-w="${e}"]`),
      img: document.querySelector(`[benefits-img="${e}"]`),
      icon2: document.querySelector(`[benefits-icon-2="${e}"]`),
    };
  }
  function t(e) {
    ((i += 1), (e.style.zIndex = String(i)));
  }
  function o(o) {
    const { desc: r, media: n, imgW: a, img: i, icon2: l } = e(o);
    (gsap.killTweensOf([r, n, a, i, l]),
      killTextReveal(o),
      t(n),
      gsap.set(r, { height: 0, overflow: "hidden" }),
      gsap.set(a, { yPercent: 100 }),
      gsap.set(i, { yPercent: -50, scale: 2 }),
      gsap.set(l, { rotate: 0 }),
      gsap.to(r, {
        height: "auto",
        duration: 1,
        ease: "Out",
        onComplete: initScrollTriggerRefresh,
      }),
      gsap.to(a, { yPercent: 0, duration: 1, ease: "Out" }),
      gsap.to(i, { yPercent: 0, scale: 1, duration: 1, ease: "Out" }),
      gsap.to(l, { rotate: 90, duration: 0.6, ease: "InOut" }),
      splitTextSetup(o),
      animateTextReveal(o, "in"),
      (s = o));
  }
  function r(t) {
    const { desc: o, media: r, icon2: n } = e(t);
    (gsap.killTweensOf([o, r, n]),
      killTextReveal(t),
      gsap.to(o, {
        height: 0,
        duration: 1,
        ease: "Out",
        onComplete: initScrollTriggerRefresh,
      }),
      gsap.to(n, { rotate: 180, duration: 0.6, ease: "InOut" }),
      animateTextReveal(t, "out"),
      s === t && (s = null));
  }
  function n() {
    null !== s && r(s);
  }
  const a = Array.from(document.querySelectorAll("[benefits-btn]"));
  if (!a.length) return;
  let i = 1,
    s = null;
  a.forEach((t) => {
    const a = t.getAttribute("benefits-btn"),
      { desc: i, media: l } = e(a);
    i &&
      l &&
      t.addEventListener("click", () => {
        s === a ? r(a) : (n(), o(a));
      });
  });
  o(a[0].getAttribute("benefits-btn"));
}
function initLoopingWords() {
  (ScrollTrigger.matchMedia({
    [`(min-width: ${breakPoint}px)`]: function () {
      function e(e) {
        r.forEach((e) => e.classList.remove("current"));
        const t = r[e % n];
        t && t.classList.add("current");
      }
      function t() {
        const t = i + 1;
        (e(t),
          gsap.to(o, {
            yPercent: -a * t,
            duration: 0.6,
            ease: "Out",
            onComplete: function () {
              ((i = t),
                i >= n - 6 &&
                  (o.appendChild(o.children[0]),
                  i--,
                  gsap.set(o, { yPercent: -a * i }),
                  r.push(r.shift())));
            },
          }));
      }
      const o = document.querySelector("[data-looping-words-list]");
      if (!o) return;
      const r = Array.from(o.children),
        n = r.length;
      if (n < 5) return;
      const a = 100 / n;
      let i = 5;
      (gsap.set(o, { yPercent: -a * i }),
        e(i),
        gsap
          .timeline({ repeat: -1, delay: 0 })
          .call(t)
          .to({}, { duration: 0.8 }));
    },
  }),
    ScrollTrigger.matchMedia({
      [`(max-width: ${breakPoint - 1}px)`]: function () {
        function e(e) {
          gsap.set(r, { x: -i * e });
        }
        function t(e) {
          n.forEach((e) => e.classList.remove("current"));
          const t = n[e % a];
          t && t.classList.add("current");
        }
        function o() {
          const o = s + 1;
          (t(o),
            gsap.to(r, {
              x: -i * o,
              duration: 1,
              ease: "Out",
              onComplete: () => {
                ((s = o),
                  s >= a - 6 &&
                    (r.appendChild(r.children[0]),
                    s--,
                    e(s),
                    n.push(n.shift())));
              },
            }));
        }
        const r = document.querySelector("[data-looping-words-list]");
        if (!r) return;
        const n = Array.from(r.children),
          a = n.length;
        if (a < 5) return;
        let i = n[0]?.getBoundingClientRect().width || 0,
          s = 5;
        (e(s),
          t(s),
          gsap
            .timeline({ repeat: -1, delay: 0 })
            .call(o)
            .to({}, { duration: 1.2 }),
          window.addEventListener("resize", () => {
            const t = n[0]?.getBoundingClientRect().width || 0;
            t && ((i = t), e(s));
          }));
      },
    }));
}
function initOther() {
  const e = document.querySelectorAll(".year");
  if (!e.length) return;
  const t = new Date().getFullYear();
  (e.forEach((e) => {
    e.textContent = t;
  }),
    document.querySelectorAll("[data-sqm]").forEach((e) => {
      e.innerHTML = e.innerHTML.replace(
        /([mM\u043c\u041c])([2-4])/g,
        (e, t, o) => t + "<sup>" + o + "</sup>",
      );
    }),
    document.querySelectorAll("[data-form-btn]").forEach((e) => {
      e.addEventListener("click", (t) => {
        t.preventDefault();
        const o = e.closest("form");
        o && o.requestSubmit();
      });
    }));
}
function initFormSuccessToggle() {
  function e() {
    const e = "none" !== getComputedStyle(t).display;
    o.style.display = e ? "none" : "";
  }
  const t = document.querySelector(".pop-up_cta_form-block_success"),
    o = document.querySelector(".btn-cta-close_c");
  if (!t || !o) return;
  e();
  new MutationObserver(e).observe(t, {
    attributes: !0,
    attributeFilter: ["style", "class"],
  });
}
function initFlickerShow() {
  ScrollTrigger.matchMedia({
    [`(max-width: ${breakPoint - 1}px)`]: function () {
      document
        .querySelectorAll("[data-prevent-flicker='true']")
        .forEach((e) => {
          gsap.set(e, { visibility: "visible" });
        });
    },
  });
}
function initResetWebflow(e) {
  let t = new DOMParser()
    .parseFromString(e.next.html, "text/html")
    .querySelector("html")
    .getAttribute("data-wf-page");
  (document.documentElement.setAttribute("data-wf-page", t),
    window.Webflow.destroy(),
    window.Webflow.ready());
}
function hideLocal(e = document) {
  const t = location.pathname
    .split("?")[0]
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean)
    .map((e) => decodeURIComponent(e).toLowerCase());
  t.length &&
    e.querySelectorAll("[local]").forEach((e) => {
      const o = (e.getAttribute("local") || "").trim();
      if (!o) return;
      const r = o
        .replace(/^\/*|\/*$/g, "")
        .split("/")
        .filter(Boolean)
        .map((e) => e.toLowerCase());
      if (!r.length) return;
      let n = !1;
      if (1 === r.length) n = t.includes(r[0]);
      else
        for (let e = 0; e <= t.length - r.length && !n; e++)
          n = r.every((o, r) => o === t[e + r]);
      n && (e.style.display = "none");
    });
}
gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);
let lenis = null,
  breakPoint = 992,
  resizeTimeout = null;
(window.scrollTo(0, 0),
  window.addEventListener("resize", () => {
    (clearTimeout(resizeTimeout),
      (resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh(!0);
      }, 100)));
  }),
  CustomEase.create("InOut", "0.76,0,0.24,1"),
  CustomEase.create("Out", "0.25,1,0.5,1"),
  CustomEase.create("In", "0.5,0,0.75,0"),
  CustomEase.create("ease", "0.25,0.1,0.25,1"),
  CustomEase.create("Write", "0.333,0,0.667,1"),
  initPreloader());
