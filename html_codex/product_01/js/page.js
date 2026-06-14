$(function(){


    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

})

function animateElements(selector, config = {}) {
    gsap.utils.toArray(selector).forEach((element) => {
        // 清除旧的 ScrollTrigger 实例
        if (element._trigger) {
            element._trigger.kill(true);
        }

        // 创建新的 ScrollTrigger 实例
        const trigger = ScrollTrigger.create({
            trigger: element,
            start: config.start || 'top 95%',
            end: config.end || 'bottom 20%',
            toggleActions: config.toggleActions || 'play none play reverse',
            toggleClass:'active',
            onEnter: () => {
                gsap.fromTo(element,
                    { opacity: 0, y: 100 },
                    { opacity: 1, y: 0, duration: config.duration || 1, ease: config.ease || 'power1.inOut' }
                );
            }
        });

        // 保存到元素的属性中，以便后续清除
        element._trigger = trigger;
    });
}

// // 使用默认配置 
// animateElements('.my-element'); 

// // 自定义动画配置 
// animateElements('.my-element', { 
// start: 'top 80%', 
// end: 'bottom 10%', 
// duration: 1.5, 
// ease: 'power2.out', 
// toggleActions: 'play none none reverse' 
// });

