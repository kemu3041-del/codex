document.addEventListener("DOMContentLoaded", function () {

    ScrollTrigger.create({
        trigger: '.number',
        start: "0% 70%",
        end: "100% 0%",
        once: true, // 只触发一次
        onEnter: function () {
            countCX('.number');
        }
    });
    function countCX(selector) {
        $(selector).find('.numCX').each(function () {
            var id = $(this).attr('id');
            var decimals = $(this).attr('data-decimals');
            var startVal = $(this).attr('data-startVal');
            var endVal = $(this).attr('data-endVal');
            var duration = $(this).attr('data-speed');
            new CountUp(id, startVal, endVal, decimals, duration, {
                useEasing: true,
            }).start();
        });
    };


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

        const aboutThree = document.querySelector(".aboutThree");
        const pinnedBackground = document.querySelector(".aboutThree__pin-bg");

        if (aboutThree && pinnedBackground) {
            // 背景层由 GSAP 设置样式，样式表保持原状；pin 仅在 aboutThree 区间内生效。
            gsap.set(aboutThree, {
                position: "relative",
                isolation: "isolate",
                backgroundImage: "none",
            });
            gsap.set(pinnedBackground, {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100vh",
                backgroundImage: 'url("img/about/about5.jpg")',
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center bottom",
                pointerEvents: "none",
                zIndex: 0,
            });
            gsap.set(aboutThree.querySelectorAll(".puTitle, .con"), {
                position: "relative",
                zIndex: 1,
            });

            ScrollTrigger.create({
                trigger: aboutThree,
                start: "top top",
                end: "bottom bottom",
                pin: pinnedBackground,
                pinSpacing: false,
                invalidateOnRefresh: true,
            });
        }

        // 所有年份共用一个滚动时间轴，避免相邻条目的独立 ScrollTrigger 区间互相重叠。
        const historyTimeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: ".history",
                start: "top 76%",
                end: "bottom 50%",
                scrub: 1,
                invalidateOnRefresh: true,
                markers: true, // 开发时可开启，查看触发区间
            },
        });

        entries.forEach((entry) => {
            const horizontalLine = entry.querySelector(".route__line--horizontal i");
            const verticalLine = entry.querySelector(".route__line--vertical i");
            const corner = entry.querySelector(".route__corner");
            const contentParts = entry.querySelectorAll(
                ".history-entry h2, .history-entry .p",
            );
            // 横线先朝外侧生长，到达拐点后再向下点亮竖线，模拟一条连续折线路径。
            gsap.set(horizontalLine, { scaleX: 0 });
            gsap.set(verticalLine, { scaleY: 0, transformOrigin: "center top" });
            gsap.set(contentParts, { opacity: 0.24, y: 28 });

            // 新条目从上一条竖线完成的位置开始，确保顺序为：横线 → 竖线 → 下一条横线。
            const segmentStart = historyTimeline.duration();

            historyTimeline
                .to(contentParts, { opacity: 1, y: 0, duration: 0.28, stagger: 0.025 }, segmentStart)
                .to(horizontalLine, { scaleX: 1, duration: 0.48 }, segmentStart + 0.04)
                .to(
                    corner,
                    {
                        color: "#2b5cff",
                        scale: 1.35,
                        textShadow: "0 0 14px rgba(43, 92, 255, 0.55)",
                        duration: 0.08,
                    },
                    segmentStart + 0.49,
                )
                .to(corner, { scale: 1, duration: 0.08 }, segmentStart + 0.57)
                .to(verticalLine, { scaleY: 1, duration: 0.43 }, segmentStart + 0.56);
        });

        // 字体和视口尺寸稳定后刷新一次触发位置，避免移动端地址栏改变高度造成错位。
        window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    })();

})
