
// 1. 定义判断函数
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

// 2. 定义核心逻辑函数
function handleTouchBody() {
    // window.innerWidth 获取当前窗口的宽度
    const windowWidth = window.innerWidth;
    const body = document.body;

    if (IsMo() || windowWidth <= 1200) {
        body.classList.add('touch_body');
    } else {
        body.classList.remove('touch_body');
    }
}

// 3. 监听逻辑
// 页面加载完成时执行
document.addEventListener('DOMContentLoaded', handleTouchBody);

// 监听窗口大小改变 (加入防抖，避免频繁触发)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        handleTouchBody();
    }, 150); // 150ms 后执行逻辑
});

$(function () {

    function handleScrollBehavior(options) {
        const {
            headerSelector,
            hideClass,
            whiteClass,
            hideThreshold
        } = options;

        const header = document.querySelector(headerSelector);
        if (!header) {
            console.error('Header element not found:', headerSelector);
            return;
        }

        let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 监听滚动事件
        window.addEventListener('scroll', function () {
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // 导航栏隐藏/显示逻辑
            if (currentScrollTop > hideThreshold) {
                if (currentScrollTop > lastScrollTop) {
                    // 向下滚动
                    header.classList.add(hideClass);
                    header.classList.add(whiteClass);

                } else {
                    // 向上滚动
                    header.classList.remove(hideClass);
                }
            } else {
                // 在顶部阈值内
                header.classList.remove(hideClass);
                header.classList.remove(whiteClass);
            }
            lastScrollTop = currentScrollTop;
        });
    }


    // 导航滚动隐藏方法
    handleScrollBehavior({
        headerSelector: '.header', //导航栏的CSS选择器
        hideClass: 'hideHeader', // 隐藏导航栏的CSS类
        hideThreshold: 50, //触发隐藏的滚动距离（像素）
        whiteClass: 'scrollHeader', //导航栏变白的CSS类
    });

    var windowW = $(window).width();
    var oindex = 0;


    if (!IsMo() && windowW > 1200) {
        //鼠标移入导航栏时展开
        $('.nav li').mouseenter(function () {

            oindex = $(this).index();
            $(this).addClass('hover').siblings().removeClass('hover');

            let $target = $('.nav-bg .nav-list').eq(oindex);
            if ($target.find('dl').length > 0) {

                let targetHeight = $target.outerHeight(true);
                $('.header .nav-bg').css({ 'height': targetHeight });

                $('.nav-bg .nav-list').not($target).removeClass('nav_show');
                if (!$target.hasClass('nav_show')) {
                    $target.addClass('nav_show');
                }

                $('.nav-submenu__cover').addClass('active');
            } else {
                $('.header .nav-bg').css({ 'height': '0vh' });
                $('.nav-bg .nav-list').removeClass('nav_show');
                $('.nav-submenu__cover').removeClass('active');
            }

        })
        // 鼠标移出导航栏时收起
        $('.header .nav_con').mouseleave(function () {
            $('.nav li').removeClass('hover');
            $('.header .nav-bg').css({ 'height': '0vh' });
            $('.nav-bg .nav-list').removeClass('nav_show');
            $('.nav-submenu__cover').removeClass('active');
        });

        //判断是否有 .img
        $('.nav-bg .nav-list').each(function (index) {
            if (!$(this).find('.img').length > 0) {
                $(this).addClass('has_no_img');
            }
        })
    }
    if (IsMo() || windowW < 1200) {

        $('.header .nav li').each(function () {
            if ($(this).find('.mo_nav .p').length) {
                $(this).addClass('has_two')
            } else {
                $(this).find('.mo_nav').remove();
            }
        })
        $('.header .nav .p').each(function () {
            if ($(this).find('.three_nav p').length) {
                $(this).addClass('has_three')
            } else {
                $(this).find('.three_nav').remove();
            }
        })

        $('.header .nav li .TWnavBtn').click(function (e) {
            e.stopPropagation();
            let $this = $(this).parents('li');
            $this.addClass('hover').siblings().removeClass('hover');

            $('.header .nav li').find('.mo_nav').stop().slideUp(500);

            if ($this.find('.mo_nav').length > 0) {
                if ($this.find('.mo_nav').css('display') == 'none') {
                    $this.find('.mo_nav').stop().slideDown(500);
                } else {
                    $this.removeClass('hover');
                }
            }
        });
        $('.header .nav .p .THnavBtn').click(function (e) {
            e.stopPropagation();
            let $this = $(this).parents('.p');
            $this.addClass('hover').siblings().removeClass('hover');

            $('.header .nav .p').find('.three_nav').stop().slideUp(500);

            if ($this.find('.three_nav').length > 0) {
                if ($this.find('.three_nav').css('display') == 'none') {
                    $this.find('.three_nav').stop().slideDown(500);
                } else {
                    $this.removeClass('hover');
                }
            }
        });
        $('.header .nav_con').click(function () {
            $('.header .nav li').removeClass('hover');
            $('.header .mo_nav').stop().slideUp(500);
            $('.header .three_nav').stop().slideUp(500);
        })

    }



    $('.nav_btn').click(function () {
        $(this).toggleClass('click');
        $('.header').toggleClass('bg');
        var toggN = $(this).parent().find('.nav_con');
        if (toggN.css('display') == 'none') {
            toggN.slideDown();
        } else {
            toggN.slideUp();
            $('.header .nav li').removeClass('hover');
            $('.header .mo_nav').stop().slideUp(500);
            $('.header .three_nav').stop().slideUp(500);
        }

    });


    //搜索
    var searchBox = $('.search-drop-down');
    $('.header .search').on('click', function () {
        searchBox.slideDown(500);
    });
    $('.search-drop-down #close').on('click', function () {
        searchBox.slideUp();
        searchBox.find('input').val('')
    });

    //输入框验证
    const searchInput = document.querySelector("#search");
    const errorMsg = document.querySelector(".errorMsg");

    // 清除危险字符
    function sanitizeInput(value) {
        // 包含: < > ' " ; -- ( ) { } [ ] % = +
        return value.replace(/[<>'"();{}[\]%=+]/g, "");
    }
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const oldValue = e.target.value;
            const newValue = sanitizeInput(oldValue);

            if (oldValue !== newValue) {
                e.target.value = newValue;
                e.target.style.borderColor = "#d9534f"; // 红色边框
                errorMsg.classList.add("show");
            } else {
                e.target.style.borderColor = "#ffffff"; // 绿色边框
                errorMsg.classList.remove("show");
            }
        });
    }

    function performSearch() {
        const val = searchInput.value.trim();
        
        if (val === "") {
            layer.msg("请输入搜索关键词"); // 假设你还在用 layer
            searchInput.focus();
            return;
        }

        // 最终清理一遍危险字符
        const cleanVal = sanitizeInput(val);
        
        // encodeURIComponent 确保中文和特殊字符在 URL 中合法
        window.location.href = `/search.html?keyword=${encodeURIComponent(cleanVal)}`;
    }
    $('#search-btn').on('click', function (e) {
        e.preventDefault();
        performSearch();
    });

    // 2. 监听回车键 (在 searchInput 上)
    if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
            // 13 是回车键的 keyCode
            if (e.key === "Enter" || e.keyCode === 13) {
                e.preventDefault(); // 阻止表单默认提交行为
                performSearch();
            }
        });
    }


})
