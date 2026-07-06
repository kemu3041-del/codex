$(window).on('load', function() {
new WOW().init();
});


if($(window).width()>998){
    $('.header .h_top .m_nav li').hover(function(){
        $(this).children('.sub_nav').stop().slideDown()
        
    },function(){
        $(this).children('.sub_nav').stop().slideUp()
        
    })
}else{
    $('.header .h_top .m_nav .nav_icon').on('click',function(){
        if($(this).parent('li').hasClass('on')){
            $(this).parent('li').removeClass('on')
            $(this).siblings('.sub_nav').stop().slideUp()
            $(this).find("svg").css('transform','rotate(0deg)')
          }else{
            $(this).parent('li').addClass('on')
            $(this).parent('li').siblings().removeClass('on')
            $(this).parent('li').siblings().children('.sub_nav').stop().slideUp()
            $(this).siblings(".sub_nav").slideDown()
            $(this).find("svg").css('transform','rotate(180deg)')
            $(this).parent('li').siblings().find("svg").css('transform','rotate(0deg)')
          }
    })
}



var scrollTop
    $('.header .u-menu').on('click',function () {
        $(this).toggleClass('on')
        $('.header .h_top .m_nav').slideToggle()
        if($(this).hasClass('on')){
            $('.header').addClass('on')
        }else{
            if(scrollTop<10){
                $('.header').removeClass('on')
            }
            
        }
    })
    var dqt=0;
    $(window).scroll(function() {
        scrollTop= document.documentElement.scrollTop || document.body.scrollTop;
       if(scrollTop>10){
            $('.header').addClass('on')
           
            if(dqt<scrollTop){
                //向上
                if(!$('.header .u-menu').hasClass('on')){
                    $('.header').css('top','-120px')
                }
            }else{
                //向下
                $('.header').css('top','0')
            }

       }else{
            if(!$('.header .u-menu').hasClass('on')){
                $('.header').removeClass('on')
            }

            $('.header').css('top','0')
            
       }
       
       setTimeout(function () { dqt = scrollTop; }, 0)
    })

function scrollToTop(duration = 750) {
    let easeingFunction = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    let originScrollY = pageYOffset;
    let originScrollX = pageXOffset;
    let originTime = Date.now();
    let passedTime = 0;
    console.log(duration)
    let _scrollToTop = () => {
        if (passedTime < duration) {
            passedTime = Date.now() - originTime;
            requestAnimationFrame(_scrollToTop);
            scrollTo(originScrollX, originScrollY * (1 - easeingFunction(passedTime / duration)));
        }
    };
    _scrollToTop();
}
$('.bnt_top').on('click', function () {
    scrollToTop()
})


//面包屑
var jsonStr = $("#navData").html();
var navData = JSON.parse(jsonStr);
console.log(pageObj.name)
var keyword = (typeof nameData !== "undefined" && nameData) ? nameData : pageObj.name;

function findPath(data, keyword) {
  
  for (let i = 0; i < data.length; i++) {
    let node = data[i];
    if (node.navName === keyword) {
      return [node];
    }
    if (node.children && node.children.length) {
      let subPath = findPath(node.children, keyword);
      if (subPath) {
        return [node].concat(subPath);
      }
    }
  }
  return null;
}

var path = findPath(navData, keyword);

if (path) {
  var parentPath = path.slice(0, -1);
  var current = path[path.length - 1];

  let html = "";

  // 父级面包屑
  parentPath.forEach(item => {
    if (item.url && item.url.trim() !== "") {
      html += `
        <li class="p_breadcrumbItem">
          <a href="${item.url}">
            <span class="text-secondary p_title">${item.navName}</span>
          </a>
        </li>
      `;
    } else {
      html += `
        <li class="p_breadcrumbItem">
          <span class="text-secondary p_title">${item.navName}</span>
        </li>
      `;
    }
  });

  // 当前节点
  if (typeof titData !== "undefined" && titData.trim() !== "") {
    // 有 titData
    if (current.url && current.url.trim() !== "") {
      html += `
        <li class="p_breadcrumbItem">
          <a href="${current.url}">
            <span class="text-secondary p_title">${current.navName}</span>
          </a>
        </li>
      `;
    } else {
      html += `
        <li class="p_breadcrumbItem">
          <span class="text-secondary p_title">${current.navName}</span>
        </li>
      `;
    }

    html += `
      <li class="p_breadcrumbItem">
        <span class="text-secondary p_title">${titData}</span>
      </li>
    `;
  } else {
    // 没有 titData
    html += `
      <li class="p_breadcrumbItem">
        <span class="text-secondary p_title">${current.navName}</span>
      </li>
    `;
  }

  $(".breadcrumbs .p_breadcrumb li:first").after(html);
}