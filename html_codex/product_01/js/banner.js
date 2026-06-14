$(function () {
    $(".js_banner .text h3").lettering();
    $(".js_banner .text .p").lettering();
    $(".js_banner .text .js_textEn").lettering("words");
    if ($(window).width() < 768) {
        $('.js_banner .pc_img').remove();
    } else {
        $('.js_banner .mo_img').remove();
    }
    var interleaveOffset = 0.9;
    var swiperOptions = {
        loop: false,
        speed: 1000,
        autoplay: {
            delay: 5000,
        },
        grabCursor: true,
        watchSlidesProgress: true,
        mousewheelControl: true,
        keyboardControl: true,
        watchOverflow: true,
        pagination: {
            el: '.js_banner .swiper-pagination',
            clickable: true
        },
        on: {
            init: function (swiper) {
                if ($('.js_banner').find('.swiper-slide').length === 1 && $('.js_banner').find('video').length === 1) {
                    $('.js_banner').find('video').get(0).loop = true;
                    swiper.autoplay.stop();
                }
                if ($('.js_banner').find('.swiper-slide-active').length === 1 && !IsMo()) {
                    swiper.autoplay.stop();
                }
                this.emit('transitionEnd');
            },
            progress: function () {
                var swiper = this;
                swiper.slides.forEach(slide => {
                    const inner = slide.querySelector('.slide-inner');
                    if (!inner) return;
                    const slideProgress = slide.progress;
                    const innerOffset = swiper.width * interleaveOffset;
                    const innerTranslate = slideProgress * innerOffset;
                    inner.style.transform = `translate3d(${innerTranslate}px, 0, 0)`;
                });
            },
            touchStart: function () {
                var swiper = this;
                swiper.slides.forEach(slide => {
                    slide.style.transition = "";
                })
            },
            setTransition: function (swiper, transtion) {
                var swiper = this;
                swiper.slides.forEach(slide => {
                    const inner = slide.querySelector('.slide-inner');
                    if (!inner) return;
                    slide.style.transition = transtion + "ms";
                    inner.style.transition =
                        transtion + "ms";
                })
            },
            transitionEnd: function () {
                gsap.set(".js_banner .swiper-slide .text span", {
                    opacity: 0,
                    transform: 'translateY(25px)',
                });
                gsap.to(".js_banner .swiper-slide-active .text span", {
                    opacity: 1,
                    transform: 'translateY(0)',
                    stagger: 0.05,
                    duration: 0.3,
                    ease: "none",
                });
                handleVideoSlide(this);
            }
        }
    };
    var banner_swiper = new Swiper(".js_banner .swiper", swiperOptions);
    function handleVideoSlide(swiper) {
        const $swiperEl = $(swiper.el);
        const $activeSlide = $swiperEl.find('.swiper-slide-active');
        const $video = $activeSlide.find('video');
        const video = $video.get(0);
        const $cover = $activeSlide.find('.slide-inner');
        const isMobileEnv = IsMo();
        // 统一重置所有视频状态、封面显示
        $swiperEl.find('.swiper-slide').each(function () {
            const $slide = $(this);
            const v = $slide.find('video').get(0);
            const $s = $slide.find('.slide-inner');
            if (v) {
                v.pause();
                v.currentTime = 0;
            }
            if ($s.length) $s.show();
        });
        if (video) {
            if (isMobileEnv) {
                // 移动端封面点击打开弹窗播放
                $cover.off('click').on('click', () => {
                    swiper.autoplay.stop();
                    openVideoModal(video, swiper, $cover);
                });
            } else {
                swiper.autoplay.stop();
                // PC端自动播放并隐藏封面
                $cover.off('click');
                video.currentTime = 0;
         
                video.play().then(() => {
                    $cover.hide();
                }).catch(() => {
                    $cover.show();
                    swiper.slideNext();
                    swiper.autoplay.start();
                });
            }
            // 视频播放完成后
            $video.off('ended').on('ended', () => {
                $cover.show();
                if (swiper.isEnd && !swiper.params.loop) {
                    swiper.slideTo(0);
                } else {
                    swiper.slideNext();
                }
                swiper.autoplay.start();
            });
            // 播放出错处理
            $video.off('error').on('error', () => {
                $cover.show();
                swiper.slideNext();
                swiper.autoplay.start();
            });
        } else {
            // 非视频 slide，正常轮播
            swiper.autoplay.start();
        }
    }
    function openVideoModal(video, swiper, $cover) {
        let $modal = $('#videoModal');
        if (!$modal.length) {
            $modal = $(`
    <div id="videoModal" style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    ">
        <div class="video_close" style="
        position: absolute;
        top: 0; right: 0;
        padding: 20px;
        cursor: pointer;
        color: #fff;font-size: 2rem;
        ">&times;</div>
        <video style="max-width: 96vw;" controls  muted webkit-playsinline="true" playsinline="true" x5-video-player-type="h5" x5-video-player-fullscreen="false" preload="auto" x-webkit-airplay="true" airplay="allow" x5-playsinline="true"></video>
    </div>
    `);
            $('body').append($modal);
        }
        const $modalVideo = $modal.find('video');
        $modalVideo.attr('src', video.src);
        $modalVideo[0].currentTime = 0;
        $modalVideo[0].play();
        $modal.show();
        if ($cover?.length) $cover.hide();
        $modalVideo.off('ended').on('ended', () => {
            $modal.hide();
            swiper.slideNext();
            swiper.autoplay.start();
        });
        $modal.off('click').on('click', function (e) {
            if (e.target === this) {
                $modal.hide();
                $cover.show();
                $modalVideo[0].pause();
                swiper.autoplay.start();
            }
        });
        $modal.off('click').on('click', '.video_close', function (e) {
            if (e.target === this) {
                $modal.hide();
                $cover.show();
                $modalVideo[0].pause();
                swiper.autoplay.start();
            }
        });
    }
    if (IsMo()) { $('body').addClass('touch_body_banner') }
    function IsMo() {
        const ua = navigator.userAgent;
        // iPad 系列（包括 Pro/Air/Mini）
        if (/iPad/i.test(ua)) return true;
        // iPhone / Android / Windows Phone
        if (/iPhone|Android|Windows Phone/i.test(ua)) return true;
        // 其他触摸屏设备，但排除 Windows 触摸屏
        if ('ontouchstart' in document.documentElement &&
            window.matchMedia("(pointer: coarse)").matches &&
            !/Windows/i.test(ua)) {
            return true;
        }
        return false;
    }

})