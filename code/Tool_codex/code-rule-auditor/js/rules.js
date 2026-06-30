(function () {
  const spacingValues = [200, 150, 140, 130, 120, 110, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20];
  const fontValues = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 70, 80];

  function buildDefaultClasses() {
    const classes = new Set();
    fontValues.forEach((value) => classes.add(`fnt${value}`));
    ["pt", "pb", "mt", "mb"].forEach((prefix) => {
      spacingValues.forEach((value) => classes.add(`${prefix}${value}`));
    });
    return classes;
  }

  function normalizeList(value) {
    return String(value || "")
      .split(/[\n,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeCssValue(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\s*!important$/i, "")
      .replace(/;$/, "")
      .toLowerCase();
  }

  function stripCssComments(cssText) {
    return String(cssText || "").replace(/\/\*[\s\S]*?\*\//g, "");
  }

  function getLineNumber(text, index) {
    return String(text || "").slice(0, index).split("\n").length;
  }

  function extractCssBlocks(cssText) {
    const css = stripCssComments(cssText);
    const blocks = [];

    function walk(fragment, offset) {
      let cursor = 0;
      while (cursor < fragment.length) {
        const openIndex = fragment.indexOf("{", cursor);
        if (openIndex === -1) break;

        const selectorStart = Math.max(fragment.lastIndexOf("}", openIndex), fragment.lastIndexOf(";", openIndex)) + 1;
        const selector = fragment.slice(selectorStart, openIndex).trim();
        let depth = 1;
        let closeIndex = openIndex + 1;

        while (closeIndex < fragment.length && depth > 0) {
          const char = fragment[closeIndex];
          if (char === "{") depth += 1;
          if (char === "}") depth -= 1;
          closeIndex += 1;
        }

        const body = fragment.slice(openIndex + 1, closeIndex - 1);
        if (body.includes("{")) {
          walk(body, offset + openIndex + 1);
        } else if (selector) {
          blocks.push({
            selector,
            body,
            startIndex: offset + openIndex + 1,
          });
        }
        cursor = closeIndex;
      }
    }

    walk(css, 0);
    return blocks;
  }

  function parseDeclarations(body) {
    return String(body || "")
      .split(";")
      .map((chunk) => {
        const colonIndex = chunk.indexOf(":");
        if (colonIndex === -1) return null;
        return {
          property: chunk.slice(0, colonIndex).trim().toLowerCase(),
          value: normalizeCssValue(chunk.slice(colonIndex + 1)),
        };
      })
      .filter((item) => item && item.property && item.value);
  }

  function extractCommonCssBaseline(cssText) {
    const classes = new Set();
    const allowedValues = {};
    const blocks = extractCssBlocks(cssText);

    blocks.forEach((block) => {
      const classMatches = block.selector.match(/\.[_a-zA-Z][-\w]*/g) || [];
      classMatches.forEach((item) => classes.add(item.slice(1)));

      parseDeclarations(block.body).forEach((decl) => {
        if (!allowedValues[decl.property]) allowedValues[decl.property] = new Set();
        allowedValues[decl.property].add(decl.value);
      });
    });

    return { classes, allowedValues };
  }

  function mergeBaselines(base, next) {
    const classes = new Set(base.classes);
    const allowedValues = {};

    Object.entries(base.allowedValues).forEach(([property, values]) => {
      allowedValues[property] = new Set(values);
    });

    next.classes.forEach((className) => classes.add(className));
    Object.entries(next.allowedValues).forEach(([property, values]) => {
      if (!allowedValues[property]) allowedValues[property] = new Set();
      values.forEach((value) => allowedValues[property].add(value));
    });

    return { classes, allowedValues };
  }

  function createDefaultBaseline() {
    const classes = buildDefaultClasses();
    const allowedValues = {
      "font-size": new Set(fontValues.map((value) => `${value}px`)),
      "margin-top": new Set(spacingValues.map((value) => `${value}px`)),
      "margin-bottom": new Set(spacingValues.map((value) => `${value}px`)),
      "padding-top": new Set(spacingValues.map((value) => `${value}px`)),
      "padding-bottom": new Set(spacingValues.map((value) => `${value}px`)),
      color: new Set(["#333", "#999", "#aaa"]),
      "background-color": new Set(["#ededed", "transparent"]),
      "border-radius": new Set(["0", "3px"]),
    };
    return { classes, allowedValues };
  }

  window.CodeAuditRules = {
    fontValues,
    spacingValues,
    normalizeList,
    normalizeCssValue,
    extractCssBlocks,
    parseDeclarations,
    getLineNumber,
    extractCommonCssBaseline,
    mergeBaselines,
    createDefaultBaseline,
  };
})();
