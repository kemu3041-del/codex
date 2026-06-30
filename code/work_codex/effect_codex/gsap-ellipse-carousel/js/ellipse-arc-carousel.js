(function () {
  /*
   * EllipseArcCarousel 学习重点
   * ------------------------------------------------------------
   * 这个插件没有使用真实 3D，也没有依赖 Swiper。
   * 核心就是把“线性轮播索引”转换成“椭圆上的角度”，再用 GSAP
   * 动画元素的 transform。
   *
   * 完整流程：
   * 1. 原始卡片只写一份，初始化时复制成 3 份连续轨道。
   * 2. trackIndex 表示当前轨道中心位置，可以是 12、13、14 这种连续值。
   * 3. 每张卡片用 virtualIndex - trackIndex 得到 offset。
   * 4. offset 映射到上半椭圆角度 angle。
   * 5. angle 代入椭圆公式得到 x/y。
   * 6. angle 代入切线公式得到 rotation。
   * 7. GSAP 把卡片动画到 x/y/rotation/scale/autoAlpha。
   */
  const defaults = {
    sourceSelector: "[data-ellipse-source]",
    stageSelector: "[data-ellipse-stage]",
    itemSelector: "[data-ellipse-card]",
    prevSelector: "[data-ellipse-prev]",
    nextSelector: "[data-ellipse-next]",
    titleSelector: "[data-ellipse-title]",
    indexSelector: "[data-ellipse-index]",
    startIndex: 2,
    loopCopies: 3,
    // 中心卡左右各显示几个。4 = 左 4 + 中心 1 + 右 4，共 9 张。
    visibleSideCount: 4,
    // 只使用完整椭圆的上半段。210 -> 330 会形成一条较平缓的上弧线。
    angleStart: 210,
    angleEnd: 330,
    ellipse: {
      // rx / ry 是相对舞台宽高的比例，不是固定像素，方便响应式。
      rx: 0.72,
      ry: 1.42,
      ryShort: 1.18,
      // 矮屏时用 ryShort 和 topShort，避免中心卡被顶部裁掉。
      shortHeight: 760,
      top: 0.12,
      topShort: 0.27,
    },
    motion: {
      duration: 0.72,
      dragDuration: 0.18,
      ease: "power3.inOut",
      dragEase: "power2.out",
      stagger: 0.012,
    },
    drag: {
      enabled: true,
      // 拖拽超过这个像素，才算一次有效切换。
      threshold: 42,
      // 横向拖多少像素约等于移动 1 张卡片。
      stepPixels: 180,
      resistance: 0.92,
      maxSteps: 3,
    },
    breakpoints: {
      // 断点写法模仿 Swiper：key 是最小视口宽度，命中后覆盖默认配置。
      0: {
        visibleSideCount: 2,
        angleStart: 224,
        angleEnd: 316,
        ellipse: { rx: 0.84, ry: 1.14, ryShort: 1.04, top: 0.2, topShort: 0.22 },
        drag: { stepPixels: 120 },
      },
      768: {
        visibleSideCount: 3,
        angleStart: 216,
        angleEnd: 324,
        ellipse: { rx: 0.76, ry: 1.28, ryShort: 1.12, top: 0.18, topShort: 0.24 },
      },
      1200: {
        visibleSideCount: 4,
        angleStart: 210,
        angleEnd: 330,
        ellipse: { rx: 0.72, ry: 1.42, ryShort: 1.18, top: 0.12, topShort: 0.27 },
      },
    },
  };

  class EllipseArcCarousel {
    constructor(root, options = {}) {
      if (!window.gsap) {
        throw new Error("EllipseArcCarousel requires GSAP before ellipse-arc-carousel.js.");
      }

      this.root = typeof root === "string" ? document.querySelector(root) : root;
      if (!this.root) throw new Error("EllipseArcCarousel root element not found.");

      this.options = deepMerge(deepMerge({}, defaults), options);
      this.source = this.root.querySelector(this.options.sourceSelector);
      this.stage = this.root.querySelector(this.options.stageSelector);
      this.prevButton = this.root.querySelector(this.options.prevSelector);
      this.nextButton = this.root.querySelector(this.options.nextSelector);
      this.titleNode = this.root.querySelector(this.options.titleSelector);
      this.indexNode = this.root.querySelector(this.options.indexSelector);
      this.originalItems = [...this.source.querySelectorAll(this.options.itemSelector)];
      this.copyCount = Math.max(3, this.options.loopCopies);
      this.centerCopyIndex = Math.floor(this.copyCount / 2);
      /*
       * trackIndex 不直接从 0 开始，而是从“中间副本”的 startIndex 开始。
       * 比如 9 张卡片、3 份副本、startIndex=2：
       *   左副本: 0  ~ 8
       *   中副本: 9  ~ 17
       *   右副本: 18 ~ 26
       *   初始 trackIndex = 9 + 2 = 11
       *
       * 这样往左/往右都有副本可以接住首尾循环。
       */
      this.trackIndex = this.originalItems.length * this.centerCopyIndex + this.options.startIndex;
      this.isAnimating = false;
      this.dragState = null;
      this.resizeTimer = null;

      this.buildLoopItems();
      this.bindEvents();
      this.render({ immediate: true });
    }

    buildLoopItems() {
      /*
       * 首尾 bug 的根源：只有一组 DOM 时，最后一张需要突然变成第一张的位置。
       * 解决方式：生成多份副本，让“最后 -> 第一”发生在相邻副本之间。
       * 动画结束后再无感归位到中间副本，用户看不到 DOM 复位。
       */
      this.stage.innerHTML = "";
      this.items = [];

      Array.from({ length: this.copyCount }).forEach((_, copyIndex) => {
        this.originalItems.forEach((sourceItem, itemIndex) => {
          const clone = sourceItem.cloneNode(true);
          const virtualIndex = copyIndex * this.originalItems.length + itemIndex;

          clone.dataset.realIndex = String(itemIndex);
          clone.dataset.virtualIndex = String(virtualIndex);
          clone.dataset.copyIndex = String(copyIndex);
          clone.removeAttribute("data-ellipse-card");
          clone.setAttribute("aria-hidden", "true");

          this.stage.appendChild(clone);
          this.items.push({ element: clone, itemIndex, virtualIndex });
        });
      });
    }

    bindEvents() {
      this.onPrev = () => this.prev();
      this.onNext = () => this.next();
      this.onResize = () => {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = window.setTimeout(() => this.render({ immediate: true }), 120);
      };

      this.prevButton?.addEventListener("click", this.onPrev);
      this.nextButton?.addEventListener("click", this.onNext);
      window.addEventListener("resize", this.onResize);

      if (this.options.drag.enabled) {
        this.onPointerDown = (event) => this.handlePointerDown(event);
        this.root.addEventListener("pointerdown", this.onPointerDown);
      }
    }

    next() {
      this.move(1);
    }

    prev() {
      this.move(-1);
    }

    goTo(index) {
      const realIndex = wrapIndex(index, this.originalItems.length);
      // 外部调用 goTo 时，也直接定位到中间副本，避免初始位置落在边缘副本。
      this.trackIndex = this.originalItems.length * this.centerCopyIndex + realIndex;
      this.render();
      this.normalizeAfterMotion();
    }

    move(step) {
      if (this.isAnimating || !step) return;
      this.isAnimating = true;
      /*
       * step 是“移动几张卡片”，不是像素。
       * next: step = 1，trackIndex 从 11 -> 12。
       * prev: step = -1，trackIndex 从 11 -> 10。
       * 因为 trackIndex 是连续轨道位置，所以卡片会沿弧线整体滚动。
       */
      this.trackIndex += step;
      this.render();
      window.setTimeout(() => {
        this.normalizeAfterMotion();
        this.isAnimating = false;
      }, this.getSettings().motion.duration * 1000 + 90);
    }

    render(options = {}) {
      const settings = this.getSettings();
      this.renderAt(this.trackIndex, settings, options);
      this.updateReadout();
    }

    renderAt(trackPosition, settings = this.getSettings(), options = {}) {
      const rect = this.stage.getBoundingClientRect();
      const visibleSideCount = settings.visibleSideCount;
      const angleSpan = settings.angleEnd - settings.angleStart;
      const ellipse = this.getEllipse(rect, settings);
      const duration = options.immediate ? 0 : settings.motion.duration;

      this.items.forEach((item) => {
        /*
         * offset 是整套布局最关键的中间量。
         *
         * item.virtualIndex 代表这张 DOM 卡片在“三份连续轨道”里的绝对位置。
         * trackPosition 代表当前中心点应该对准哪个轨道位置。
         *
         * offset = 0  -> 当前中心卡
         * offset = -1 -> 中心左边第 1 张
         * offset =  1 -> 中心右边第 1 张
         */
        const offset = item.virtualIndex - trackPosition;
        const isVisible = Math.abs(offset) <= visibleSideCount;
        /*
         * 不可见卡片不参与真实展示，但仍给它一个“边缘外侧”的位置。
         * 这样它下一次进入可见区时，会从弧线边缘自然滑入，不会从页面另一侧飞过来。
         */
        const renderOffset = isVisible ? offset : clamp(offset, -visibleSideCount - 1, visibleSideCount + 1);
        /*
         * 把 offset 映射到 0 ~ 1：
         * visibleSideCount = 4 时，offset 范围是 -4 ~ 4。
         *
         * offset = -4 -> slotProgress = 0
         * offset =  0 -> slotProgress = 0.5
         * offset =  4 -> slotProgress = 1
         */
        const slotProgress = (renderOffset + visibleSideCount) / (visibleSideCount * 2);
        /*
         * 再把 0 ~ 1 映射到角度区间：
         * angleStart = 210, angleEnd = 330
         *
         * slotProgress = 0   -> 210deg，左侧边缘
         * slotProgress = 0.5 -> 270deg，上方中心
         * slotProgress = 1   -> 330deg，右侧边缘
         */
        const angleDeg = settings.angleStart + slotProgress * angleSpan;
        const angle = degreeToRadian(angleDeg);
        // 椭圆坐标：x = cx + rx * cos(a)，y = cy + ry * sin(a)。
        const point = getEllipsePoint(ellipse, angle);
        // 卡片旋转跟随椭圆切线方向，所以左右两侧会自然倾斜。
        const tangentRotation = getTangentRotation(ellipse, angle);
        const distance = Math.abs(offset);
        /*
         * depth 是“视觉景深”，只负责层级和质感，不参与坐标计算。
         * 离中心越近，depth 越大；越靠边，depth 越小。
         */
        const depth = Math.max(0, 1 - distance / (visibleSideCount + 0.8));
        const scale = 0.76 + depth * 0.23;
        const alpha = isVisible ? 0.18 + depth * 0.82 : 0;

        item.element.classList.toggle("is-active", Math.abs(offset) < 0.001);
        item.element.classList.toggle("is-hidden", !isVisible);
        item.element.style.zIndex = String(Math.round(depth * 100));
        item.element.setAttribute("aria-hidden", isVisible ? "false" : "true");

        window.gsap.to(item.element, {
          // GSAP transform 属性比拼接 transform 字符串更稳定，也更容易覆盖。
          x: point.x,
          y: point.y,
          xPercent: -50,
          yPercent: -50,
          rotation: tangentRotation,
          scale,
          autoAlpha: alpha,
          duration,
          ease: options.dragging ? settings.motion.dragEase : settings.motion.ease,
          overwrite: "auto",
          delay: options.immediate ? 0 : Math.abs(offset) * settings.motion.stagger,
        });
      });
    }

    normalizeAfterMotion() {
      const count = this.originalItems.length;
      const minMiddleIndex = count * this.centerCopyIndex;
      const maxMiddleIndex = minMiddleIndex + count - 1;
      let normalizedIndex = this.trackIndex;

      /*
       * 如果 trackIndex 走到了左副本或右副本，就把它换算回中间副本。
       *
       * 例如 9 张卡片：
       *   右副本里的 18 和中副本里的 9 都代表真实第 1 张。
       *   当 trackIndex = 18 时，归位到 9，视觉结果完全一样。
       */
      if (this.trackIndex < minMiddleIndex) normalizedIndex = this.trackIndex + count;
      if (this.trackIndex > maxMiddleIndex) normalizedIndex = this.trackIndex - count;
      if (normalizedIndex === this.trackIndex) return;

      /*
       * 无感归位顺序：
       * 1. 先加 is-resetting，让 CSS 和 GSAP 当前位置不产生过渡。
       * 2. 强制一次 reflow，确保浏览器已经应用“无过渡”状态。
       * 3. 修改 trackIndex 并立即 set 到同等视觉位置。
       * 4. 两帧后恢复正常动画。
       */
      this.stage.classList.add("is-resetting");
      this.stage.offsetWidth;
      this.trackIndex = normalizedIndex;
      this.render({ immediate: true });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.stage.classList.remove("is-resetting");
        });
      });
    }

    handlePointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest("button")) return;

      const settings = this.getSettings();
      this.dragState = {
        id: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        startTrack: this.trackIndex,
        settings,
      };

      this.root.classList.add("is-dragging");
      this.root.setPointerCapture?.(event.pointerId);

      this.onPointerMove = (moveEvent) => this.handlePointerMove(moveEvent);
      this.onPointerUp = (upEvent) => this.handlePointerUp(upEvent);
      this.root.addEventListener("pointermove", this.onPointerMove);
      this.root.addEventListener("pointerup", this.onPointerUp);
      this.root.addEventListener("pointercancel", this.onPointerUp);
    }

    handlePointerMove(event) {
      if (!this.dragState || event.pointerId !== this.dragState.id) return;
      const deltaX = event.clientX - this.dragState.startX;
      const settings = this.dragState.settings;
      /*
       * 拖拽不是直接移动像素，而是把像素距离换算成“轨道偏移量”。
       *
       * deltaX < 0 表示向左拖，应该预览下一张，所以 previewOffset 为正。
       * stepPixels 越小，拖一点点就移动更多；resistance 用来减弱手感。
       */
      const previewOffset = (-deltaX / settings.drag.stepPixels) * settings.drag.resistance;
      const previewTrack = this.dragState.startTrack + previewOffset;

      this.dragState.lastX = event.clientX;
      this.renderAt(previewTrack, settings, { dragging: true });
    }

    handlePointerUp(event) {
      if (!this.dragState || event.pointerId !== this.dragState.id) return;
      const settings = this.dragState.settings;
      const deltaX = event.clientX - this.dragState.startX;
      const rawSteps = -deltaX / settings.drag.stepPixels;
      let steps = Math.round(rawSteps);

      // 拖动超过阈值但不足一整格时，也吸附到相邻一张，避免“拖了没反应”。
      if (Math.abs(deltaX) >= settings.drag.threshold && steps === 0) {
        steps = deltaX < 0 ? 1 : -1;
      }

      steps = clamp(steps, -settings.drag.maxSteps, settings.drag.maxSteps);
      this.trackIndex = this.dragState.startTrack;
      this.dragState = null;
      this.root.classList.remove("is-dragging");
      this.root.releasePointerCapture?.(event.pointerId);
      this.root.removeEventListener("pointermove", this.onPointerMove);
      this.root.removeEventListener("pointerup", this.onPointerUp);
      this.root.removeEventListener("pointercancel", this.onPointerUp);

      if (steps) {
        this.move(steps);
      } else {
        this.render();
      }
    }

    getSettings() {
      const width = window.innerWidth;
      const settings = deepMerge({}, this.options);
      const breakpoints = settings.breakpoints || {};

      /*
       * 响应式配置合并规则：
       * 按断点从小到大遍历，只要当前视口宽度 >= 断点，就把该断点配置合并进去。
       * 这和 Swiper 的 breakpoints 习惯接近。
       */
      Object.keys(breakpoints)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((minWidth) => {
          if (width >= minWidth) {
            deepMerge(settings, breakpoints[minWidth]);
          }
        });

      return settings;
    }

    getEllipse(rect, settings) {
      const isShort = rect.height < settings.ellipse.shortHeight;
      const ryRatio = isShort ? settings.ellipse.ryShort : settings.ellipse.ry;
      const topRatio = isShort ? settings.ellipse.topShort : settings.ellipse.top;
      const ry = rect.height * ryRatio;

      /*
       * 椭圆中心 cy 的计算方式容易误解：
       * 我们不是把椭圆中心放在屏幕中心，而是把“椭圆最高点”放在 topRatio 处。
       *
       * 对上半椭圆来说，最高点角度是 270deg：
       *   y = cy + ry * sin(270deg)
       *   y = cy - ry
       *
       * 如果希望最高点在 rect.height * topRatio：
       *   cy - ry = rect.height * topRatio
       *   cy = rect.height * topRatio + ry
       */
      return {
        cx: rect.width / 2,
        cy: rect.height * topRatio + ry,
        rx: rect.width * settings.ellipse.rx,
        ry,
      };
    }

    updateReadout() {
      const activeIndex = wrapIndex(Math.round(this.trackIndex), this.originalItems.length);
      const activeItem = this.originalItems[activeIndex];
      const title = activeItem.dataset.title || activeItem.querySelector("h2")?.textContent || "";

      if (this.titleNode) this.titleNode.textContent = title;
      if (this.indexNode) this.indexNode.textContent = String(activeIndex + 1).padStart(2, "0");
    }

    destroy() {
      this.prevButton?.removeEventListener("click", this.onPrev);
      this.nextButton?.removeEventListener("click", this.onNext);
      window.removeEventListener("resize", this.onResize);
      this.root.removeEventListener("pointerdown", this.onPointerDown);
      window.clearTimeout(this.resizeTimer);
      window.gsap.killTweensOf(this.items.map((item) => item.element));
      this.stage.innerHTML = "";
    }
  }

  function getEllipsePoint(ellipse, angle) {
    /*
     * 标准椭圆参数方程：
     * cx/cy 是椭圆中心点。
     * rx/ry 是横向和纵向半径。
     * angle 是弧度，不是角度，所以外面要先 degreeToRadian。
     */
    return {
      x: ellipse.cx + ellipse.rx * Math.cos(angle),
      y: ellipse.cy + ellipse.ry * Math.sin(angle),
    };
  }

  function getTangentRotation(ellipse, angle) {
    /*
     * 为什么这样算旋转？
     *
     * 椭圆方程：
     *   x = cx + rx * cos(a)
     *   y = cy + ry * sin(a)
     *
     * 对角度 a 求导，得到切线方向：
     *   dx/da = -rx * sin(a)
     *   dy/da =  ry * cos(a)
     *
     * atan2(dy, dx) 会返回这条切线相对 x 轴的角度。
     * 把这个角度给卡片 rotation，卡片就会自然贴着弧线倾斜。
     */
    const dx = -ellipse.rx * Math.sin(angle);
    const dy = ellipse.ry * Math.cos(angle);
    return radianToDegree(Math.atan2(dy, dx));
  }

  function degreeToRadian(degree) {
    return (degree * Math.PI) / 180;
  }

  function radianToDegree(radian) {
    return (radian * 180) / Math.PI;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function wrapIndex(index, total) {
    return ((index % total) + total) % total;
  }

  function deepMerge(target, source) {
    Object.keys(source || {}).forEach((key) => {
      const value = source[key];
      const isObject = value && typeof value === "object" && !Array.isArray(value);

      if (isObject) {
        target[key] = deepMerge(target[key] ? { ...target[key] } : {}, value);
      } else {
        target[key] = value;
      }
    });

    return target;
  }

  window.EllipseArcCarousel = EllipseArcCarousel;
})();
