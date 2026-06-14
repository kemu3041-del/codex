$(function () {

  /* 全局 - Resize */
  const DOM_CONTENT_RESIZE_FUNCTION = [];

  if (typeof isFrontEnv === 'function') {
    if (!isFrontEnv()) {
      //在设计器中添加类名 isFENV
      document.body.classList.add('isFENV');
    }
  }

  //引入 wow
  if (typeof WOW === 'function') {
    var wow = new WOW({
      boxClass: 'wow',
      animateClass: 'animated',
      offset: 100,
      live: true
    }).init();
    //  data-wow-delay="0.1s"
  }

  /* 注册GSAP */
  if (typeof gsap === 'object') {
    gsap.registerPlugin(ScrollTrigger);
    /* 动态刷新 */
    DOM_CONTENT_RESIZE_FUNCTION.push(() => ScrollTrigger.refresh());
  }



  /* 微信内置浏览器视频开启自动播放 */
  document.addEventListener('WeixinJSBridgeReady', function () {
    const videos = [...document.querySelectorAll('video')];
    videos.forEach(video => {
      if (video.getAttribute('autoplay') != null && video.getAttribute('src') != '') {
        video && video.play();
      }
    });
  }, false,);



  if (!placeholderSupport()) {
    $('[placeholder]').focus(function () {
      var input = $(this);
      if (input.val() == input.attr('placeholder')) {
        input.val('');
        input.removeClass('placeholder');
      }
    }).blur(function () {
      var input = $(this);
      if (input.val() == '' || input.val() == input.attr('placeholder')) {
        input.addClass('placeholder');
        input.val(input.attr('placeholder'));
      }
    }).blur();
  };

  //ie浏览器
  if (isIE()) { $('html').addClass('isIe'); }
  // 获取当前url
  var url_location = window.location.pathname;
  var arr = [];
  arr = url_location.split('/');
})

/* -------------------- IE10以下浏览器提示 */
function hiUpgrade() {
  window.AESKey = '';
  /* 判断浏览器是否支持placeholder属性 */
  function isSupportPlaceholder() { var input = document.createElement('input'); return 'placeholder' in input; };
  /* 判断是否是IE浏览器，包括Edge浏览器 */
  function IEVersion() {
    /* 取得浏览器的userAgent字符串 */
    var userAgent = navigator.userAgent;
    /* 判断是否IE浏览器 */
    var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1;
    if (isIE) {
      /* IE10 & 以下 */
      var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
      reIE.test(userAgent);
      var fIEVersion = parseFloat(RegExp["$1"]);
      if (fIEVersion < 10 || !isSupportPlaceholder()) {
        return true;
      }
    } else {
      return false;
    }
  }
  var tpl = '<div id="hi-upgrade"><div class="hi-wrap"><p class="hi-title">无法正常浏览本网站！</p><div class="hi-close">继续浏览</div><div class="hi-text1"><p>1、您的浏览器版本过低，请升级您的浏览器。</p><p>2、如果您的浏览器是最新版本，请<span>切换到极速模式</span>访问。</p><p>3、您使用的是IE10以下的浏览器，建议您<span>使用主流浏览器</span>访问。</p></div><p class="hi-text2"><span>主流浏览器下载</span></p><ul class="hi-list"><li><a href="https://www.google.cn/intl/zh-CN/chrome/" target="_blank"><div class="hi-ico1"></div><p>谷歌浏览器</p></a></li><li><a href="http://www.firefox.com.cn/download/" target="_blank"><div class="hi-ico2"></div><p>火狐浏览器</p></a></li><li><a href="http://browser.360.cn" target="_blank"><div class="hi-ico3"></div><p>UC浏览器</p></a></li><li><a href="https://www.uc.cn" target="_blank"><div class="hi-ico4"></div><p>360浏览器</p></a></li><li><a href="https://browser.qq.com" target="_blank"><div class="hi-ico5"></div><p>QQ浏览器</p></a></li><li><a href="https://ie.sogou.com" target="_blank"><div class="hi-ico6"></div><p>搜狗浏览器</p></a></li></ul></div></div>';
  if (IEVersion()) document.write(tpl);
}
hiUpgrade();
/* -------------------- */
function placeholderSupport() {
  return 'placeholder' in document.createElement('input');
}
function scrollT($Dom) {
  if ($Dom.offset()) {
    if ($(window).scrollTop() + $(window).height() >= $Dom.offset().top + 200) {
      return true;
    }
  }
}
//判断是否Firefox浏览器
function isFirefox() {
  if (navigator.userAgent.indexOf("Firefox") > -1)
    return true;
  else
    return false;
}
//判断是否IE浏览器
function isIE() {
  if (!!window.ActiveXObject || "ActiveXObject" in window)
    return true;
  else
    return false;
}

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


//鼠标延迟执行事件方法
$.fn.hoverDelay = function (options) {
  var defaults = {
    hoverDuring: 200,
    outDuring: 200,
    hoverEvent: function () {
      $.noop();
    },
    outEvent: function () {
      $.noop();
    }
  };
  var sets = $.extend(defaults, options || {});
  var hoverTimer, outTimer, that = this;
  return $(this).each(function () {
    $(this).on('mouseenter', function () {
      clearTimeout(outTimer);
      hoverTimer = setTimeout(function () { sets.hoverEvent.apply(that) }, sets.hoverDuring);
    });
    $(this).on('mouseleave', function () {
      clearTimeout(hoverTimer);
      outTimer = setTimeout(function () { sets.outEvent.apply(that) }, sets.outDuring);
    });
  });
}
/*
演示事例
$('.header .nav li').hoverDelay({
    hoverEvent: function(){
      $(this).addClass('hover');
    },
    outEvent: function(){
      $(this).removeClass('hover');
    }
  });
*/

/*
id 不能重复
<div class="shuj">
  <div><span class="numCX"  data-startval="0" data-endval="100" data-decimals="0" id="mumC3">100</span>%</div>
</div>
*/
ScrollTrigger.create({
  trigger: '.number .shuj',
  start: "0% 70%",
  end: "100% 0%",
  once: true, // 只触发一次
  onEnter: function () {
    countCX('.number .shuj');
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

// 切换按钮隐藏
document.addEventListener('readystatechange', function () {
  if (document.readyState === 'complete') {
    $('.sw_btn_all').each(function () {
      if ($(this).find('.swiper-button-disabled').length > 1) {
        $(this).hide();
      }
    });
  }
});