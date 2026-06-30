(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = document.querySelectorAll("[data-wave-card]");

  cards.forEach(function (card) {
    var canvas = card.querySelector("[data-wave-canvas]");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var width = 0;
    var height = 0;
    var deviceRatio = Math.min(window.devicePixelRatio || 1, 2);
    var animationFrame = 0;
    var layers = [];

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function createPoint(index, total, baseY, variance) {
      return {
        xRatio: index / (total - 1),
        current: baseY + randomBetween(-variance, variance),
        target: baseY + randomBetween(-variance, variance),
        speed: randomBetween(0.006, 0.018),
        drift: randomBetween(-0.55, 0.55)
      };
    }

    function createLayer(options) {
      var points = [];
      for (var i = 0; i < options.totalPoints; i += 1) {
        points.push(createPoint(i, options.totalPoints, options.baseY, options.variance));
      }

      return {
        fill: options.fill,
        alpha: options.alpha,
        baseY: options.baseY,
        variance: options.variance,
        horizontalShift: randomBetween(-18, 18),
        horizontalSpeed: options.horizontalSpeed,
        retargetAt: 0,
        points: points
      };
    }

    function buildLayers() {
      // 多层透明水面叠加，能减少单层曲线的规律感。
      layers = [
        createLayer({
          fill: "#b5e4db",
          alpha: 0.78,
          baseY: height * 0.28,
          variance: height * 0.08,
          totalPoints: 8,
          horizontalSpeed: 0.26
        }),
        createLayer({
          fill: "#4fb5ab",
          alpha: 0.64,
          baseY: height * 0.39,
          variance: height * 0.11,
          totalPoints: 9,
          horizontalSpeed: -0.18
        }),
        createLayer({
          fill: "#0e7567",
          alpha: 0.9,
          baseY: height * 0.52,
          variance: height * 0.14,
          totalPoints: 7,
          horizontalSpeed: 0.12
        })
      ];
    }

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      deviceRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * deviceRatio);
      canvas.height = Math.round(height * deviceRatio);
      ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
      buildLayers();
      render(performance.now());
    }

    function retargetLayer(layer, now) {
      if (now < layer.retargetAt) return;

      layer.retargetAt = now + randomBetween(700, 1400);
      layer.points.forEach(function (point, index) {
        var edgeDamping = index === 0 || index === layer.points.length - 1 ? 0.42 : 1;
        point.target = layer.baseY + randomBetween(-layer.variance, layer.variance) * edgeDamping;
        point.speed = randomBetween(0.006, 0.018);
        point.drift = randomBetween(-0.65, 0.65);
      });
    }

    function drawLayer(layer, now) {
      retargetLayer(layer, now);

      ctx.save();
      ctx.globalAlpha = layer.alpha;
      ctx.fillStyle = layer.fill;
      ctx.beginPath();
      ctx.moveTo(-40, height + 40);

      layer.horizontalShift += layer.horizontalSpeed;
      if (layer.horizontalShift > 44 || layer.horizontalShift < -44) {
        layer.horizontalSpeed *= -1;
      }

      var firstPoint = layer.points[0];
      ctx.lineTo(-40, firstPoint.current);

      for (var i = 0; i < layer.points.length - 1; i += 1) {
        var point = layer.points[i];
        var nextPoint = layer.points[i + 1];

        // 点位朝随机目标缓慢插值，叠加轻微漂移，避免固定周期导致的规则感。
        point.current += (point.target - point.current) * point.speed + Math.sin(now * 0.0011 + i * 1.7) * point.drift;
        nextPoint.current += (nextPoint.target - nextPoint.current) * nextPoint.speed;

        var x = point.xRatio * width + layer.horizontalShift;
        var nextX = nextPoint.xRatio * width + layer.horizontalShift;
        var midX = (x + nextX) * 0.5;
        var midY = (point.current + nextPoint.current) * 0.5;

        ctx.quadraticCurveTo(x, point.current, midX, midY);
      }

      var lastPoint = layer.points[layer.points.length - 1];
      ctx.quadraticCurveTo(width + 32, lastPoint.current, width + 40, lastPoint.current + 18);
      ctx.lineTo(width + 40, height + 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function render(now) {
      ctx.clearRect(0, 0, width, height);

      var gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(255, 250, 241, 0)");
      gradient.addColorStop(0.32, "rgba(255, 250, 241, 0.16)");
      gradient.addColorStop(1, "rgba(6, 63, 67, 0.1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      layers.forEach(function (layer) {
        drawLayer(layer, now);
      });
    }

    function animate(now) {
      render(now);
      animationFrame = window.requestAnimationFrame(animate);
    }

    resizeCanvas();

    if (!prefersReducedMotion) {
      animationFrame = window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("beforeunload", function () {
      window.cancelAnimationFrame(animationFrame);
    });
  });
})();
