(function ($) {
    function getAutoHeight($el) {
      const prev = {
        position: $el.css('position'),
        visibility: $el.css('visibility'),
        display: $el.css('display'),
        height: $el.css('height'),
        maxHeight: $el.css('maxHeight'),
        overflow: $el.css('overflow')
      };
      $el.css({
        position: 'absolute',
        visibility: 'hidden',
        display: 'block',
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible'
      });
      const h = $el.height();
      $el.css(prev);
      return h;
    }
  
    $.fn.slideDownF = function (duration = 200, complete) {
      return this.each(function () {
        const $el = $(this);
        $el.stop(true, true); // 立即跳到动画终点，清空队列
  
        if ($el.is(':visible') && $el.height() !== 0) {
          complete && complete.call(this);
          return;
        }
  
        $el.css({ display: 'block', overflow: 'hidden', height: 0 });
        const targetHeight = getAutoHeight($el);
  
        $el.animate({ height: targetHeight }, duration)
          .promise()
          .always(() => {
            $el.css({ height: 'auto', overflow: '' });
            complete && complete.call($el[0]);
          });
      });
    };
  
    $.fn.slideUpF = function (duration = 200, complete) {
      return this.each(function () {
        const $el = $(this);
        $el.stop(true, true); // 立即跳到动画终点，清空队列
  
        if (!$el.is(':visible') || $el.height() === 0) {
          complete && complete.call(this);
          return;
        }
  
        const startHeight = $el.height();
        $el.css({ overflow: 'hidden', height: startHeight });
  
        $el.animate({ height: 0 }, duration)
          .promise()
          .always(() => {
            $el.css({ display: 'none', height: '', overflow: '' });
            complete && complete.call($el[0]);
          });
      });
    };
  
    $.fn.slideToggleF = function (duration = 200, complete) {
      return this.each(function () {
        const $el = $(this);
        if (!$el.is(':visible') || $el.height() === 0) {
          $el.slideDownF(duration, complete);
        } else {
          $el.slideUpF(duration, complete);
        }
      });
    };
  })(jQuery);
  