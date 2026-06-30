(function () {
  function toNumber(value, fallback) {
    var parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function point(value) {
    return Math.round(value * 10) / 10;
  }

  function buildRailCommands(startX, endX, sideY, waistY) {
    var width = endX - startX;
    var sidePullY = sideY + (waistY - sideY) * 0.72;
    var enterX = startX + width * 0.27;
    var leaveX = endX - width * 0.27;

    return [
      "C", point(startX), point(sidePullY), point(startX + width * 0.08), point(waistY), point(enterX), point(waistY),
      "C", point(startX + width * 0.42), point(waistY), point(endX - width * 0.42), point(waistY), point(leaveX), point(waistY),
      "C", point(endX - width * 0.08), point(waistY), point(endX), point(sidePullY), point(endX), point(sideY)
    ].join(" ");
  }

  function buildReverseRailCommands(startX, endX, sideY, waistY) {
    var width = endX - startX;
    var sidePullY = sideY + (waistY - sideY) * 0.72;
    var enterX = startX + width * 0.27;
    var leaveX = endX - width * 0.27;

    return [
      "C", point(endX), point(sidePullY), point(endX - width * 0.08), point(waistY), point(leaveX), point(waistY),
      "C", point(endX - width * 0.42), point(waistY), point(startX + width * 0.42), point(waistY), point(enterX), point(waistY),
      "C", point(startX + width * 0.08), point(waistY), point(startX), point(sidePullY), point(startX), point(sideY)
    ].join(" ");
  }

  function buildRightBoxCommands(box, topOpenY, bottomOpenY) {
    var x = box.x;
    var y = box.y;
    var width = box.width;
    var height = box.height;
    var right = x + width;
    var bottom = y + height;
    var radius = Math.min(box.radius, width / 2, height / 2);

    return [
      "L", point(x), point(y + radius),
      "Q", point(x), point(y), point(x + radius), point(y),
      "L", point(right - radius), point(y),
      "Q", point(right), point(y), point(right), point(y + radius),
      "L", point(right), point(bottom - radius),
      "Q", point(right), point(bottom), point(right - radius), point(bottom),
      "L", point(x + radius), point(bottom),
      "Q", point(x), point(bottom), point(x), point(bottom - radius),
      "L", point(x), point(bottomOpenY)
    ].join(" ");
  }

  function buildLeftBoxCommands(box, topOpenY, bottomOpenY) {
    var x = box.x;
    var y = box.y;
    var width = box.width;
    var height = box.height;
    var right = x + width;
    var bottom = y + height;
    var radius = Math.min(box.radius, width / 2, height / 2);

    return [
      "L", point(right), point(bottom - radius),
      "Q", point(right), point(bottom), point(right - radius), point(bottom),
      "L", point(x + radius), point(bottom),
      "Q", point(x), point(bottom), point(x), point(bottom - radius),
      "L", point(x), point(y + radius),
      "Q", point(x), point(y), point(x + radius), point(y),
      "L", point(right - radius), point(y),
      "Q", point(right), point(y), point(right), point(y + radius),
      "L", point(right), point(topOpenY)
    ].join(" ");
  }

  function buildUnifiedPath(left, right, topSideY, bottomSideY, waist) {
    var startX = left.x + left.width;
    var endX = right.x;
    var centerY = (topSideY + bottomSideY) / 2;

    return [
      "M", point(startX), point(topSideY),
      buildRailCommands(startX, endX, topSideY, centerY - waist / 2),

      buildRightBoxCommands(right, topSideY, bottomSideY),

      buildReverseRailCommands(startX, endX, bottomSideY, centerY + waist / 2),

      buildLeftBoxCommands(left, topSideY, bottomSideY)
    ].join(" ");
  }

  function updateConnector(link) {
    var frames = link.querySelectorAll(".image-frame");
    var svg = link.querySelector(".connector-frame");
    var path = link.querySelector(".connector-path");

    if (frames.length < 2 || !svg || !path) {
      return;
    }

    var linkBox = link.getBoundingClientRect();
    var leftBox = frames[0].getBoundingClientRect();
    var rightBox = frames[1].getBoundingClientRect();
    var styles = getComputedStyle(link);
    var outlineOffset = toNumber(styles.getPropertyValue("--outline-offset"), 7);
    var spreadRatio = toNumber(styles.getPropertyValue("--connector-spread"), 0.42);
    var waist = toNumber(styles.getPropertyValue("--connector-waist"), 8);

    var leftX = leftBox.left - linkBox.left - outlineOffset;
    var leftY = leftBox.top - linkBox.top - outlineOffset;
    var leftWidth = leftBox.width + outlineOffset * 2;
    var leftHeight = leftBox.height + outlineOffset * 2;
    var rightX = rightBox.left - linkBox.left - outlineOffset;
    var rightY = rightBox.top - linkBox.top - outlineOffset;
    var rightWidth = rightBox.width + outlineOffset * 2;
    var rightHeight = rightBox.height + outlineOffset * 2;
    var centerY = (leftBox.top - linkBox.top + leftBox.height / 2 + rightBox.top - linkBox.top + rightBox.height / 2) / 2;
    var spread = Math.min(leftBox.height, rightBox.height) * spreadRatio;
    var topSideY = centerY - spread / 2;
    var bottomSideY = centerY + spread / 2;

    svg.setAttribute("viewBox", "0 0 " + point(linkBox.width) + " " + point(linkBox.height));
    svg.setAttribute("preserveAspectRatio", "none");

    path.setAttribute("d", buildUnifiedPath(
      {
        x: leftX,
        y: leftY,
        width: leftWidth,
        height: leftHeight,
        radius: Math.min(leftWidth, leftHeight) * 0.25
      },
      {
        x: rightX,
        y: rightY,
        width: rightWidth,
        height: rightHeight,
        radius: Math.min(rightWidth, rightHeight) * 0.25
      },
      topSideY,
      bottomSideY,
      waist
    ));
  }

  function updateAllConnectors() {
    document.querySelectorAll(".image-link").forEach(updateConnector);
  }

  window.addEventListener("load", updateAllConnectors);
  window.addEventListener("resize", updateAllConnectors);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateAllConnectors);
  }
})();
