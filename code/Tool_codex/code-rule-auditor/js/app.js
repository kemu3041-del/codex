(function () {
  const { useMemo, useState } = React;
  const h = React.createElement;
  const rules = window.CodeAuditRules;

  const AUDIT_RULE_CONFIG = {
    selectors: {
      title: ".title,.page-title,.main-title,.section-title,.mod-title,.tit,.title-main",
      subtitle: ".subtitle,.sub-title,.page-subtitle,.section-subtitle,.subtit,.sub_tit,.subtitle-text",
      button: "button,.btn,.button,.btn-main,.btn-primary,.btn-secondary,[class*='btn'],[class*='button']",
    },
    systemDefaults: {
      requiredClasses: "title,subtitle",
      prefixes: "fnt,mt,mb,pt,pb",
      headingTags: "h1,h2,h3,h4,h5,h6",
      cssProperties: "font-size,margin-top,margin-bottom,padding-top,padding-bottom,color,background-color,border-radius",
    },
    designerFields: [
      { key: "allowedFontSizes", label: "允许字号值", type: "textarea", unit: "px", defaultValue: "16,18,22,24,32,36,48", placeholder: "例如：16,18,22,36,48" },
      { key: "allowedColors", label: "允许颜色值", type: "textarea", defaultValue: "#333,#666,#999,#fff,#000", placeholder: "例如：#333,#666,#999,#fff" },
      { key: "allowedSpacing", label: "允许间距值", type: "textarea", unit: "px", defaultValue: "20,25,30,40,50,60,80,100,120", placeholder: "例如：20,30,60,80,120" },
      { key: "allowedButtonRadius", label: "允许按钮圆角", type: "textarea", unit: "px", defaultValue: "4,6,8,10,999", placeholder: "例如：4,6,8,999" },
      { key: "titleFont", label: "标题字号", type: "number", unit: "px", defaultValue: "36" },
      { key: "titleColor", label: "标题颜色", type: "color", defaultValue: "#333", pickerFallback: "#333333" },
      { key: "subtitleFont", label: "副标题字号", type: "number", unit: "px", defaultValue: "22" },
      { key: "subtitleColor", label: "副标题颜色", type: "color", defaultValue: "#999", pickerFallback: "#999999" },
      { key: "titleSubtitleSpacing", label: "标题到副标题间距", type: "number", unit: "px", defaultValue: "30" },
    ],
    designerRules: [
      {
        name: "标题",
        selector: "title",
        raw: "标题：字号 {titleFont}px，颜色 {titleColor}",
        checks: [
          { property: "font-size", operator: "=", field: "titleFont", valueType: "number", unit: "px" },
          { property: "color", operator: "=", field: "titleColor", valueType: "color" },
        ],
      },
      {
        name: "副标题",
        selector: "subtitle",
        raw: "副标题：字号 {subtitleFont}px，颜色 {subtitleColor}",
        checks: [
          { property: "font-size", operator: "=", field: "subtitleFont", valueType: "number", unit: "px" },
          { property: "color", operator: "=", field: "subtitleColor", valueType: "color" },
        ],
      },
      {
        name: "标题到副标题",
        selector: "title",
        nextSelector: "subtitle",
        raw: "标题到副标题间距：{titleSubtitleSpacing}px",
        checks: [
          { property: "margin-bottom", operator: "=", field: "titleSubtitleSpacing", valueType: "number", unit: "px" },
        ],
      },
    ],
  };

  const DEFAULT_FORM = {
    ...AUDIT_RULE_CONFIG.systemDefaults,
    ...Object.fromEntries(AUDIT_RULE_CONFIG.designerFields.map((field) => [field.key, field.defaultValue])),
  };

  function readFile(file) {
    const filePath = file.webkitRelativePath || file.name;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: filePath,
        baseName: file.name,
        type: file.type,
        size: file.size,
        text: String(reader.result || ""),
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, "utf-8");
    });
  }

  function classifyFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
    if (name.endsWith(".css")) return "css";
    return "other";
  }

  function isAuditableSourceFile(file) {
    const name = file.name.toLowerCase();
    if (name.includes(".min.")) return false;
    return /\.(?:html?|css)$/i.test(name);
  }

  function makeCounter() {
    return {
      total: 0,
      items: new Map(),
      allowedTotal: 0,
      unknownTotal: 0,
      unknownItems: new Map(),
    };
  }

  function increment(map, key, amount) {
    map.set(key, (map.get(key) || 0) + (amount || 1));
  }

  function normalizeSpacingValue(value) {
    const normalized = rules.normalizeCssValue(value);
    if (!normalized || normalized === "auto") return "";
    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return `${normalized}px`;
    if (/^-?\d+(?:\.\d+)?px$/.test(normalized)) return normalized;
    return "";
  }

  function normalizeFontValue(value) {
    const normalized = rules.normalizeCssValue(value);
    if (!normalized) return "";
    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return `${normalized}px`;
    if (/^-?\d+(?:\.\d+)?px$/.test(normalized)) return normalized;
    return "";
  }

  function normalizeColorValue(value) {
    const normalized = rules.normalizeCssValue(value);
    if (!normalized) return "";
    const shortMatch = normalized.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (shortMatch) return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`.toLowerCase();
    if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toLowerCase();
    return normalized;
  }

  function normalizeRadiusValue(value) {
    const normalized = rules.normalizeCssValue(value);
    if (!normalized) return "";
    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return `${normalized}px`;
    if (/^-?\d+(?:\.\d+)?px$/.test(normalized)) return normalized;
    return "";
  }

  function parseSpacingValues(value) {
    return rules.normalizeList(value)
      .map(normalizeSpacingValue)
      .filter(Boolean);
  }

  function parseFontValues(value) {
    return rules.normalizeList(value)
      .map(normalizeFontValue)
      .filter(Boolean);
  }

  function parseColorValues(value) {
    return rules.normalizeList(value)
      .map(normalizeColorValue)
      .filter(Boolean);
  }

  function parseRadiusValues(value) {
    return rules.normalizeList(value)
      .map(normalizeRadiusValue)
      .filter(Boolean);
  }

  function isSpacingProperty(property) {
    return /^margin(?:-(?:top|right|bottom|left))?$/.test(property)
      || /^padding(?:-(?:top|right|bottom|left))?$/.test(property);
  }

  function isColorProperty(property) {
    return property === "color" || property === "background-color" || property === "border-color";
  }

  function expandSpacingDeclaration(property, value) {
    if (!isSpacingProperty(property)) return [];

    const values = String(value || "")
      .split(/\s+/)
      .map(normalizeSpacingValue)
      .filter(Boolean);

    if (!values.length) return [];

    if (property === "margin" || property === "padding") {
      return values.map((item) => ({ property, value: item }));
    }

    const normalized = normalizeSpacingValue(value);
    return normalized ? [{ property, value: normalized }] : [];
  }

  function expandRadiusDeclaration(property, value) {
    if (!/border(?:-(?:top-left|top-right|bottom-right|bottom-left))?-radius/.test(property)) return [];

    return String(value || "")
      .split("/")
      .map((part) => part.trim())
      .join(" ")
      .split(/\s+/)
      .map(normalizeRadiusValue)
      .filter(Boolean)
      .map((item) => ({ property, value: item }));
  }

  function createSpacingAudit(allowedValues) {
    return {
      allowedValues,
      total: 0,
      allowedTotal: 0,
      extraTotal: 0,
      usedValues: new Map(),
      extraValues: new Map(),
      byProperty: {},
    };
  }

  function createValueAudit(allowedValues) {
    return {
      allowedValues,
      total: 0,
      allowedTotal: 0,
      extraTotal: 0,
      usedValues: new Map(),
      extraValues: new Map(),
      byProperty: {},
    };
  }

  function createButtonAudit(settings) {
    return {
      total: 0,
      elements: new Map(),
      cssSelectors: new Map(),
      fontAudit: createValueAudit(settings.allowedFontValues),
      colorAudit: createValueAudit(settings.allowedColorValues),
      spacingAudit: createSpacingAudit(settings.allowedSpacingValues),
      radiusAudit: createValueAudit(settings.allowedRadiusValues),
    };
  }

  function recordAuditValue(audit, property, value, source) {
    if (!value) return;
    audit.total += 1;

    const isAllowed = audit.allowedValues.has(value);
    if (isAllowed) audit.allowedTotal += 1;
    else audit.extraTotal += 1;

    if (!audit.byProperty[property]) audit.byProperty[property] = makeCounter();
    const bucket = audit.byProperty[property];
    bucket.total += 1;
    increment(bucket.items, value);
    if (isAllowed) bucket.allowedTotal += 1;
    else {
      bucket.unknownTotal += 1;
      increment(bucket.unknownItems, value);
    }

    const targetMap = isAllowed ? audit.usedValues : audit.extraValues;
    if (!targetMap.has(value)) {
      targetMap.set(value, {
        total: 0,
        properties: new Map(),
        sources: [],
      });
    }

    const item = targetMap.get(value);
    item.total += 1;
    increment(item.properties, property);
    if (source && item.sources.length < 6) item.sources.push(source);
  }

  function recordSpacingValue(audit, property, value, source) {
    recordAuditValue(audit, property, value, source);
  }

  function resolveSelector(selector) {
    return AUDIT_RULE_CONFIG.selectors[selector] || selector || "*";
  }

  function buildConditionFromConfig(check, form) {
    const value = check.value === undefined ? form[check.field] : check.value;
    if (check.valueType === "number") {
      const number = Number(value);
      if (!Number.isFinite(number)) return null;
      return {
        property: check.property,
        operator: check.operator,
        expected: `${number}${check.unit || ""}`,
      };
    }

    if (check.valueType === "color") {
      const color = rules.normalizeCssValue(value);
      if (!color) return null;
      return {
        property: check.property,
        operator: check.operator,
        expected: color,
      };
    }

    const normalized = rules.normalizeCssValue(value);
    if (!normalized) return null;
    return {
      property: check.property,
      operator: check.operator,
      expected: normalized,
    };
  }

  function formatRuleText(template, form) {
    return String(template || "").replace(/\{(\w+)\}/g, (_, key) => form[key] || "");
  }

  function buildDesignerRules(form) {
    return AUDIT_RULE_CONFIG.designerRules
      .map((ruleConfig) => ({
        name: ruleConfig.name,
        selector: resolveSelector(ruleConfig.selector),
        nextSelector: ruleConfig.nextSelector ? resolveSelector(ruleConfig.nextSelector) : "",
        conditions: ruleConfig.checks.map((check) => buildConditionFromConfig(check, form)).filter(Boolean),
        raw: formatRuleText(ruleConfig.raw, form),
      }))
      .filter((item) => item.conditions.length);
  }

  function buildSettings(form) {
    return {
      requiredClasses: rules.normalizeList(form.requiredClasses),
      prefixes: rules.normalizeList(form.prefixes),
      headingTags: rules.normalizeList(form.headingTags).map((item) => item.toLowerCase()),
      cssProperties: rules.normalizeList(form.cssProperties).map((item) => item.toLowerCase()),
      allowedSpacingValues: new Set(parseSpacingValues(form.allowedSpacing)),
      allowedFontValues: new Set(parseFontValues(form.allowedFontSizes)),
      allowedColorValues: new Set(parseColorValues(form.allowedColors)),
      allowedRadiusValues: new Set(parseRadiusValues(form.allowedButtonRadius)),
      designRules: buildDesignerRules(form),
    };
  }

  function buildStyleRulesFromCss(cssText, fileName) {
    return rules.extractCssBlocks(cssText).map((block) => ({
      selector: block.selector,
      declarations: rules.parseDeclarations(block.body),
      file: fileName,
      line: rules.getLineNumber(cssText, block.startIndex),
    }));
  }

  function extractInlineStyleRules(doc, fileName) {
    return Array.from(doc.querySelectorAll("style"))
      .map((styleElement) => buildStyleRulesFromCss(styleElement.textContent || "", `${fileName} <style>`))
      .flat();
  }

  function safeMatches(element, selector) {
    try {
      return selector === "*" || element.matches(selector);
    } catch (error) {
      return false;
    }
  }

  function applyUtilityClassStyle(className, style) {
    const match = className.match(/^(fnt|mt|mb|pt|pb)(\d+)$/);
    if (!match) return;

    const value = `${match[2]}px`;
    const propertyMap = {
      fnt: "font-size",
      mt: "margin-top",
      mb: "margin-bottom",
      pt: "padding-top",
      pb: "padding-bottom",
    };
    style[propertyMap[match[1]]] = value;
  }

  function getUtilitySpacingDeclaration(className) {
    const match = className.match(/^(mt|mb|pt|pb)(\d+)$/);
    if (!match) return null;

    const propertyMap = {
      mt: "margin-top",
      mb: "margin-bottom",
      pt: "padding-top",
      pb: "padding-bottom",
    };

    return {
      property: propertyMap[match[1]],
      value: `${match[2]}px`,
    };
  }

  function getUtilityFontDeclaration(className) {
    const match = className.match(/^fnt(\d+)$/);
    if (!match) return null;

    return {
      property: "font-size",
      value: `${match[1]}px`,
    };
  }

  function selectorLooksLikeButton(selector) {
    return /\bbutton\b|\.btn\b|\.btn[-_a-z0-9]*|\.[-_a-z0-9]*button[-_a-z0-9]*/i.test(selector);
  }

  function getElementStyle(element, styleRules) {
    const style = {};

    Array.from(element.classList || []).forEach((className) => {
      applyUtilityClassStyle(className, style);
    });

    styleRules.forEach((rule) => {
      if (!safeMatches(element, rule.selector)) return;
      rule.declarations.forEach((decl) => {
        style[decl.property] = decl.value;
      });
    });

    if (element.hasAttribute("style")) {
      rules.parseDeclarations(element.getAttribute("style") || "").forEach((decl) => {
        style[decl.property] = decl.value;
      });
    }

    return style;
  }

  function recordButtonStyleValues(report, style, source) {
    if (style["font-size"]) {
      recordAuditValue(report.buttonAudit.fontAudit, "font-size", normalizeFontValue(style["font-size"]), source);
    }

    ["color", "background-color", "border-color"].forEach((property) => {
      if (style[property]) {
        recordAuditValue(report.buttonAudit.colorAudit, property, normalizeColorValue(style[property]), source);
      }
    });

    Object.entries(style).forEach(([property, value]) => {
      if (isSpacingProperty(property)) {
        expandSpacingDeclaration(property, value).forEach((spacing) => {
          recordSpacingValue(report.buttonAudit.spacingAudit, spacing.property, spacing.value, source);
        });
      }

      expandRadiusDeclaration(property, value).forEach((radius) => {
        recordAuditValue(report.buttonAudit.radiusAudit, radius.property, radius.value, source);
      });
    });
  }

  function normalizeCompareValue(value) {
    const normalized = rules.normalizeCssValue(value);
    return normalized.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, "#$1$1$2$2$3$3");
  }

  function parsePx(value) {
    const match = String(value || "").match(/^(-?\d+(?:\.\d+)?)px$/);
    return match ? Number(match[1]) : null;
  }

  function compareCondition(actual, condition) {
    if (!actual) {
      return condition.operator === "="
        ? { pass: false, skipped: false, text: `缺少 ${condition.property}` }
        : { pass: true, skipped: true, text: `未设置 ${condition.property}` };
    }

    const actualValue = normalizeCompareValue(actual);
    const expectedValue = normalizeCompareValue(condition.expected);

    if (condition.operator === "=") {
      return {
        pass: actualValue === expectedValue,
        skipped: false,
        text: `${condition.property}: ${actualValue}，期望 ${expectedValue}`,
      };
    }

    const actualPx = parsePx(actualValue);
    const expectedPx = parsePx(expectedValue);
    if (actualPx === null || expectedPx === null) {
      return {
        pass: false,
        skipped: false,
        text: `${condition.property}: ${actualValue}，无法和 ${expectedValue} 做大小比较`,
      };
    }

    const pass = condition.operator === "<=" ? actualPx <= expectedPx : actualPx >= expectedPx;
    return {
      pass,
      skipped: false,
      text: `${condition.property}: ${actualValue}，要求 ${condition.operator}${expectedValue}`,
    };
  }

  function getElementLabel(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const className = element.className ? `.${String(element.className).trim().replace(/\s+/g, ".")}` : "";
    return `${tag}${id}${className}`;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function lineNumberAt(text, index) {
    if (index < 0) return 1;
    return String(text || "").slice(0, index).split("\n").length;
  }

  function findElementLine(sourceText, element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id;
    if (id) {
      const idPattern = new RegExp(`<${tag}\\b[^>]*\\bid=(["'])${escapeRegExp(id)}\\1`, "i");
      const idMatch = sourceText.search(idPattern);
      if (idMatch >= 0) return lineNumberAt(sourceText, idMatch);
    }

    const classList = Array.from(element.classList || []);
    for (const className of classList) {
      const classPattern = new RegExp(`<${tag}\\b[^>]*\\bclass=(["'])[^"']*\\b${escapeRegExp(className)}\\b[^"']*\\1`, "i");
      const classMatch = sourceText.search(classPattern);
      if (classMatch >= 0) return lineNumberAt(sourceText, classMatch);
    }

    const tagPattern = new RegExp(`<${tag}\\b`, "i");
    const tagMatch = sourceText.search(tagPattern);
    return tagMatch >= 0 ? lineNumberAt(sourceText, tagMatch) : 1;
  }

  function makeCodeContext(file, lineNumber) {
    const lines = String(file.text || "").split(/\r?\n/);
    const target = Math.max(1, Math.min(lineNumber || 1, lines.length || 1));
    const start = Math.max(1, target - 3);
    const end = Math.min(lines.length || 1, target + 3);
    const snippet = [];

    for (let line = start; line <= end; line += 1) {
      snippet.push({
        number: line,
        text: lines[line - 1] || "",
        highlight: line === target,
      });
    }

    return {
      fileName: file.name,
      line: target,
      language: classifyFile(file),
      lines: snippet,
    };
  }

  function getIssueMergeKey(issue) {
    if (issue.context) {
      const highlightedLine = (issue.context.lines || []).find((line) => line.highlight);
      const sourceText = highlightedLine ? String(highlightedLine.text || "").trim() : "";
      return [issue.context.fileName, issue.context.line, sourceText].join("|");
    }

    return [issue.file || "", issue.target || issue.detail || ""].join("|");
  }

  function addIssue(report, issue) {
    const mergeKey = getIssueMergeKey(issue);
    const existing = report.issues.find((item) => getIssueMergeKey(item) === mergeKey);

    if (existing) {
      if (issue.level === "danger") existing.level = "danger";
      if (!existing.target && issue.target) existing.target = issue.target;
      if (issue.target && !String(existing.detail || "").includes(issue.target)) {
        existing.detail = `${issue.target} · ${existing.detail}`;
      }
      if (!existing.types.includes(issue.type)) {
        existing.types.push(issue.type);
        existing.type = existing.types.join(" / ");
      }
      if (!existing.messages.includes(issue.message)) {
        existing.messages.push(issue.message);
        existing.message = `${existing.messages.length} 个问题`;
      }
      return;
    }

    report.issues.push({
      id: `issue-${report.issues.length + 1}`,
      ...issue,
      types: [issue.type],
      messages: [issue.message],
    });
  }

  function analyzeDesignRules(doc, file, styleRules, settings, report) {
    const elements = Array.from(doc.querySelectorAll("*"));

    settings.designRules.forEach((designRule) => {
      if (!report.designRuleResults[designRule.name]) {
        report.designRuleResults[designRule.name] = {
          name: designRule.name,
          raw: designRule.raw,
          matched: 0,
          passed: 0,
          failed: 0,
          conditions: designRule.conditions,
        };
      }

      const result = report.designRuleResults[designRule.name];
      const matchedElements = elements.filter((element) => safeMatches(element, designRule.selector));

      matchedElements.forEach((element) => {
        if (designRule.nextSelector) {
          const nextElement = element.nextElementSibling;
          if (!nextElement || !safeMatches(nextElement, designRule.nextSelector)) return;
        }

        result.matched += 1;
        const style = getElementStyle(element, styleRules);
        const checks = designRule.conditions.map((condition) => ({
          condition,
          ...compareCondition(style[condition.property], condition),
        }));
        const failedChecks = checks.filter((check) => !check.pass && !check.skipped);

        if (failedChecks.length) {
          const line = findElementLine(file.text, element);
          result.failed += 1;
          failedChecks.forEach((check) => {
            addIssue(report, {
              level: "danger",
              type: "设计规则不匹配",
              message: `${designRule.name}：${check.text}`,
              file: file.name,
              target: getElementLabel(element),
              detail: `${getElementLabel(element)} · ${designRule.raw}`,
              context: makeCodeContext(file, line),
            });
          });
        } else {
          result.passed += 1;
        }
      });
    });
  }

  function analyzeHtmlFile(file, settings, report) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(file.text, "text/html");
    const elements = Array.from(doc.querySelectorAll("*"));
    const styleRules = report.styleRules.concat(extractInlineStyleRules(doc, file.name));
    const buttonSelector = resolveSelector("button");

    settings.headingTags.forEach((tagName) => {
      const count = doc.getElementsByTagName(tagName).length;
      report.headings[tagName] = (report.headings[tagName] || 0) + count;
      report.headingTotal += count;
    });

    elements.forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      if (tagName === "button") report.buttons.native += 1;

      if (safeMatches(element, buttonSelector)) {
        const line = findElementLine(file.text, element);
        const label = getElementLabel(element);
        report.buttonAudit.total += 1;
        increment(report.buttonAudit.elements, label);
        recordButtonStyleValues(report, getElementStyle(element, styleRules), {
          file: file.name,
          line,
          detail: label,
        });
      }

      if (element.hasAttribute("style")) {
        const line = findElementLine(file.text, element);
        report.inlineStyleTotal += 1;
        const styleText = element.getAttribute("style") || "";
        rules.parseDeclarations(styleText).forEach((decl) => {
          increment(report.inlineStyleProps, decl.property);
          expandSpacingDeclaration(decl.property, decl.value).forEach((spacing) => {
            recordSpacingValue(report.spacingAudit, spacing.property, spacing.value, {
              file: file.name,
              line,
              detail: `${tagName} style="${styleText}"`,
            });
          });
          if (decl.property === "font-size") {
            recordAuditValue(report.fontAudit, decl.property, normalizeFontValue(decl.value), {
              file: file.name,
              line,
              detail: `${tagName} style="${styleText}"`,
            });
          }
          if (isColorProperty(decl.property)) {
            recordAuditValue(report.colorAudit, decl.property, normalizeColorValue(decl.value), {
              file: file.name,
              line,
              detail: `${tagName} style="${styleText}"`,
            });
          }
          if (settings.cssProperties.includes(decl.property)) {
            addIssue(report, {
              level: "warn",
              type: "HTML 内联样式",
              message: `${tagName} 使用了内联 ${decl.property}: ${decl.value}`,
              file: file.name,
              target: getElementLabel(element),
              detail: styleText,
              context: makeCodeContext(file, line),
            });
          }
        });
      }

      Array.from(element.classList || []).forEach((className) => {
        const utilityFont = getUtilityFontDeclaration(className);
        if (utilityFont) {
          const line = findElementLine(file.text, element);
          recordAuditValue(report.fontAudit, utilityFont.property, utilityFont.value, {
            file: file.name,
            line,
            detail: `.${className}`,
          });
        }

        const utilitySpacing = getUtilitySpacingDeclaration(className);
        if (utilitySpacing) {
          const line = findElementLine(file.text, element);
          recordSpacingValue(report.spacingAudit, utilitySpacing.property, utilitySpacing.value, {
            file: file.name,
            line,
            detail: `.${className}`,
          });
        }

        if (/btn|button/i.test(className)) {
          increment(report.buttons.classBased, className);
          if (tagName === "a") report.buttons.linkLike += 1;
        }

        increment(report.classUsage, className);
        settings.prefixes.forEach((prefix) => {
          const pattern = new RegExp(`^${prefix}\\d+$`);
          if (!pattern.test(className)) return;

          if (!report.utilityByPrefix[prefix]) report.utilityByPrefix[prefix] = makeCounter();
          const bucket = report.utilityByPrefix[prefix];
          bucket.total += 1;
          increment(bucket.items, className);

          if (report.baseline.classes.has(className)) {
            bucket.allowedTotal += 1;
          } else {
            const line = findElementLine(file.text, element);
            bucket.unknownTotal += 1;
            increment(bucket.unknownItems, className);
            addIssue(report, {
              level: "danger",
              type: "非 common.css 工具类",
              message: `发现 ${className}，当前规范库里没有这个 class`,
              file: file.name,
              target: getElementLabel(element),
              detail: `<${tagName} class="${element.className}">`,
              context: makeCodeContext(file, line),
            });
          }
        });
      });
    });

    analyzeDesignRules(doc, file, styleRules, settings, report);
  }

  function analyzeCssFile(file, settings, report) {
    const blocks = rules.extractCssBlocks(file.text);

    blocks.forEach((block) => {
      const declarations = rules.parseDeclarations(block.body);
      declarations.forEach((decl) => {
        expandSpacingDeclaration(decl.property, decl.value).forEach((spacing) => {
          const line = rules.getLineNumber(file.text, block.startIndex);
          recordSpacingValue(report.spacingAudit, spacing.property, spacing.value, {
            file: file.name,
            line,
            detail: `${block.selector} { ${decl.property}: ${decl.value}; }`,
          });
        });
        if (decl.property === "font-size") {
          const line = rules.getLineNumber(file.text, block.startIndex);
          recordAuditValue(report.fontAudit, decl.property, normalizeFontValue(decl.value), {
            file: file.name,
            line,
            detail: `${block.selector} { ${decl.property}: ${decl.value}; }`,
          });
        }
        if (isColorProperty(decl.property)) {
          const line = rules.getLineNumber(file.text, block.startIndex);
          recordAuditValue(report.colorAudit, decl.property, normalizeColorValue(decl.value), {
            file: file.name,
            line,
            detail: `${block.selector} { ${decl.property}: ${decl.value}; }`,
          });
        }
        if (selectorLooksLikeButton(block.selector)) {
          const line = rules.getLineNumber(file.text, block.startIndex);
          increment(report.buttonAudit.cssSelectors, block.selector);
          recordButtonStyleValues(report, { [decl.property]: decl.value }, {
            file: file.name,
            line,
            detail: `${block.selector} { ${decl.property}: ${decl.value}; }`,
          });
        }

        if (!settings.cssProperties.includes(decl.property)) return;

        if (!report.cssByProperty[decl.property]) report.cssByProperty[decl.property] = makeCounter();
        const bucket = report.cssByProperty[decl.property];
        bucket.total += 1;
        increment(bucket.items, decl.value);

        const allowedSet = report.baseline.allowedValues[decl.property] || new Set();
        const isAllowed = allowedSet.has(rules.normalizeCssValue(decl.value));
        if (isAllowed) {
          bucket.allowedTotal += 1;
        } else {
          const line = rules.getLineNumber(file.text, block.startIndex);
          bucket.unknownTotal += 1;
          increment(bucket.unknownItems, decl.value);
          addIssue(report, {
            level: "warn",
            type: "CSS 裸值不在规范库",
            message: `${decl.property}: ${decl.value}`,
            file: file.name,
            target: block.selector,
            detail: `${block.selector}，约第 ${line} 行`,
            context: makeCodeContext(file, line),
          });
        }
      });
    });
  }

  function analyzeRequiredClasses(files, settings, report) {
    report.requiredClassResults = settings.requiredClasses.map((className) => {
      const count = report.classUsage.get(className) || 0;
      return {
        className,
        count,
        missing: count === 0,
      };
    });

    if (!report.htmlFileTotal) return;

    report.requiredClassResults
      .filter((item) => item.missing)
      .forEach((item) => {
        addIssue(report, {
          level: "danger",
          type: "缺少指定类名",
          message: `页面中未发现 .${item.className}`,
          file: files.filter((file) => classifyFile(file) === "html").map((file) => file.name).join("、") || "HTML",
          detail: `必需类名：.${item.className}`,
          context: null,
        });
      });
  }

  function buildReport(files, baseline, settings) {
    const report = {
      settings,
      baseline,
      files: files.map((file) => ({ name: file.name, kind: classifyFile(file) })),
      htmlFileTotal: files.filter((file) => classifyFile(file) === "html").length,
      classUsage: new Map(),
      requiredClassResults: [],
      utilityByPrefix: {},
      cssByProperty: {},
      styleRules: files
        .filter((file) => classifyFile(file) === "css")
        .map((file) => buildStyleRulesFromCss(file.text, file.name))
        .flat(),
      designRuleResults: {},
      headings: {},
      headingTotal: 0,
      buttons: {
        native: 0,
        linkLike: 0,
        classBased: new Map(),
      },
      inlineStyleTotal: 0,
      inlineStyleProps: new Map(),
      spacingAudit: createSpacingAudit(settings.allowedSpacingValues),
      fontAudit: createValueAudit(settings.allowedFontValues),
      colorAudit: createValueAudit(settings.allowedColorValues),
      buttonAudit: createButtonAudit(settings),
      issues: [],
      createdAt: new Date().toISOString(),
    };

    settings.prefixes.forEach((prefix) => {
      report.utilityByPrefix[prefix] = makeCounter();
    });

    files.forEach((file) => {
      const kind = classifyFile(file);
      if (kind === "html") analyzeHtmlFile(file, settings, report);
      if (kind === "css") analyzeCssFile(file, settings, report);
    });

    analyzeRequiredClasses(files, settings, report);

    return report;
  }

  function mapToRows(map, limit) {
    const getCount = (item) => (typeof item === "number" ? item : item.total || 0);
    return Array.from(map.entries())
      .sort((a, b) => getCount(b[1]) - getCount(a[1]) || a[0].localeCompare(b[0]))
      .slice(0, limit || 12);
  }

  function serializeReport(report) {
    const mapObject = (map) => Object.fromEntries(map.entries());
    const utilityByPrefix = {};
    Object.entries(report.utilityByPrefix).forEach(([prefix, bucket]) => {
      utilityByPrefix[prefix] = {
        total: bucket.total,
        unique: bucket.items.size,
        allowedTotal: bucket.allowedTotal,
        unknownTotal: bucket.unknownTotal,
        items: mapObject(bucket.items),
        unknownItems: mapObject(bucket.unknownItems),
      };
    });

    const cssByProperty = {};
    Object.entries(report.cssByProperty).forEach(([property, bucket]) => {
      cssByProperty[property] = {
        total: bucket.total,
        unique: bucket.items.size,
        allowedTotal: bucket.allowedTotal,
        unknownTotal: bucket.unknownTotal,
        items: mapObject(bucket.items),
        unknownItems: mapObject(bucket.unknownItems),
      };
    });

    const serializeAuditItems = (map) => Object.fromEntries(Array.from(map.entries()).map(([value, item]) => [value, {
      total: item.total,
      properties: mapObject(item.properties),
      sources: item.sources,
    }]));

    const serializeValueAudit = (audit) => ({
      allowedValues: Array.from(audit.allowedValues),
      total: audit.total,
      allowedTotal: audit.allowedTotal,
      extraTotal: audit.extraTotal,
      usedValues: serializeAuditItems(audit.usedValues),
      extraValues: serializeAuditItems(audit.extraValues),
    });

    return {
      createdAt: report.createdAt,
      settings: report.settings,
      files: report.files,
      requiredClassResults: report.requiredClassResults,
      designRuleResults: report.designRuleResults,
      headings: report.headings,
      headingTotal: report.headingTotal,
      buttons: {
        native: report.buttons.native,
        linkLike: report.buttons.linkLike,
        classBased: mapObject(report.buttons.classBased),
      },
      buttonAudit: {
        total: report.buttonAudit.total,
        elements: mapObject(report.buttonAudit.elements),
        cssSelectors: mapObject(report.buttonAudit.cssSelectors),
        fontAudit: serializeValueAudit(report.buttonAudit.fontAudit),
        colorAudit: serializeValueAudit(report.buttonAudit.colorAudit),
        spacingAudit: serializeValueAudit(report.buttonAudit.spacingAudit),
        radiusAudit: serializeValueAudit(report.buttonAudit.radiusAudit),
      },
      inlineStyleTotal: report.inlineStyleTotal,
      inlineStyleProps: mapObject(report.inlineStyleProps),
      spacingAudit: serializeValueAudit(report.spacingAudit),
      fontAudit: serializeValueAudit(report.fontAudit),
      colorAudit: serializeValueAudit(report.colorAudit),
      utilityByPrefix,
      cssByProperty,
      issues: report.issues,
    };
  }

  function expandHexColor(value) {
    const color = String(value || "").trim();
    const shortMatch = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (shortMatch) return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`.toLowerCase();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : "";
  }

  function downloadReport(report) {
    const data = JSON.stringify(serializeReport(report), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code-audit-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function demoFiles() {
    return [
      {
        id: `demo-html-${Date.now()}`,
        name: "demo-page.html",
        type: "text/html",
        size: 0,
        text: `
<section class="pt120 pb120">
  <div class="wrap">
    <h1 class="fnt48 mb40">页面标题</h1>
    <h2 class="fnt32 mb25">板块标题</h2>
    <p class="fnt18 mb30" style="color:#666;font-size:17px;">这里是一段说明。</p>
    <a class="btn-main mt36">按钮</a>
  </div>
</section>
        `,
      },
      {
        id: `demo-css-${Date.now()}`,
        name: "demo-style.css",
        type: "text/css",
        size: 0,
        text: `
.custom-title { font-size: 31px; margin-bottom: 42px; color: #666; }
.btn-main { padding-top: 18px; padding-bottom: 18px; border-radius: 10px; background-color: #111; }
        `,
      },
    ];
  }

  function Metric({ label, value, help }) {
    return h("article", { className: "metric" },
      h("span", { className: "metric-label" }, label),
      h("strong", null, value),
      h("small", null, help),
    );
  }

  function Pill({ children, type }) {
    return h("span", { className: `pill ${type || ""}`.trim() }, children);
  }

  function Field({ label, children }) {
    return [
      h("label", { className: "field-label", key: "label" }, label),
      h("div", { key: "field" }, children),
    ];
  }

  function DesignerField({ field, value, onChange }) {
    if (field.type === "textarea") {
      return h(Field, { label: field.label },
        h("div", { className: "unit-input stacked-input" },
          h("textarea", {
            className: "textarea compact-textarea",
            rows: 3,
            value,
            placeholder: field.placeholder || "例如：20,30,60,120",
            onChange: (event) => onChange(field.key, event.target.value),
          }),
          field.unit ? h("span", null, field.unit) : null,
        ),
      );
    }

    if (field.type === "color") {
      const pickerValue = expandHexColor(value) || field.pickerFallback || "#000000";
      return h(Field, { label: field.label },
        h("div", { className: "color-input-row" },
          h("input", {
            className: "text-input",
            value,
            onChange: (event) => onChange(field.key, event.target.value),
            onBlur: (event) => {
              const color = expandHexColor(event.target.value);
              if (color) onChange(field.key, color);
            },
          }),
          h("input", {
            className: "color-picker",
            type: "color",
            value: pickerValue,
            onChange: (event) => onChange(field.key, event.target.value),
            "aria-label": `选择${field.label}`,
          }),
        ),
      );
    }

    return h(Field, { label: field.label },
      h("div", { className: "unit-input" },
        h("input", {
          className: "text-input",
          type: field.type || "text",
          min: field.type === "number" ? "0" : undefined,
          value,
          onChange: (event) => onChange(field.key, event.target.value),
        }),
        field.unit ? h("span", null, field.unit) : null,
      ),
    );
  }

  function IssueCode({ context }) {
    if (!context) return h("div", { className: "issue-code empty-code" }, "没有找到可定位源码片段");

    return h("div", { className: "issue-code" },
      h("div", { className: "issue-code-head" }, `${context.fileName} · 第 ${context.line} 行`),
      h("pre", null,
        context.lines.map((line) => h("code", {
          key: line.number,
          className: line.highlight ? "source-line highlight" : "source-line",
        },
          h("span", { className: "line-number" }, String(line.number).padStart(4, " ")),
          h("span", { className: "line-text" }, line.text || " "),
        )),
      ),
    );
  }

  function IssuesView({ issues, expandedIssues, onToggleIssue, onExport, canExport }) {
    if (!issues.length) {
      return h("div", { className: "empty-state" },
        h("h2", null, "暂无明显问题"),
        h("p", null, "当前规则下没有发现非规范工具类、CSS 裸值或内联样式问题。"),
      );
    }

    return h(React.Fragment, null,
      h("div", { className: "toolbar-row" },
        h("p", { className: "hint" }, "点击需处理/需确认的问题，可展开源码片段并查看标注行。"),
        h("button", { className: "btn secondary small", type: "button", disabled: !canExport, onClick: onExport }, "导出 JSON"),
      ),
      h("div", { className: "issue-list" },
        issues.slice(0, 300).map((issue) => {
          const opened = expandedIssues.has(issue.id);
          const messages = issue.messages && issue.messages.length ? issue.messages : [issue.message];
          return h("article", { className: `issue-item ${issue.level === "danger" ? "danger" : ""}`, key: issue.id },
            h("button", {
              className: "issue-toggle",
              type: "button",
              onClick: () => onToggleIssue(issue.id),
              "aria-expanded": opened,
            },
              h("span", { className: "issue-title" },
                h("span", null, issue.type),
                h(Pill, { type: issue.level === "danger" ? "danger" : "warn" }, issue.level === "danger" ? "需处理" : "需确认"),
              ),
              messages.length > 1
                ? h("ul", { className: "issue-message-list" }, messages.map((message) => h("li", { key: message }, message)))
                : h("span", { className: "issue-meta" }, messages[0]),
              h("span", { className: "issue-meta" }, `${issue.file} · ${issue.detail}`),
            ),
            opened ? h(IssueCode, { context: issue.context }) : null,
          );
        }),
      ),
    );
  }

  function App() {
    const [files, setFiles] = useState([]);
    const [baseline, setBaseline] = useState(() => rules.createDefaultBaseline());
    const [baselineHint, setBaselineHint] = useState("当前使用内置 common.css 规范：fnt、mt、mb、pt、pb。");
    const [form, setForm] = useState(DEFAULT_FORM);
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedIssues, setExpandedIssues] = useState(() => new Set());

    const settings = useMemo(() => buildSettings(form), [form]);
    const report = useMemo(() => buildReport(files, baseline, settings), [files, baseline, settings]);

    const utilityTotal = Object.values(report.utilityByPrefix).reduce((sum, item) => sum + item.total, 0);
    const designResults = Object.values(report.designRuleResults);
    const designFailed = designResults.reduce((sum, item) => sum + item.failed, 0);
    const designMatched = designResults.reduce((sum, item) => sum + item.matched, 0);

    const updateForm = (key, value) => {
      setForm((current) => ({ ...current, [key]: value }));
      setExpandedIssues(new Set());
    };

    const handleSourceFiles = async (event) => {
      const selected = Array.from(event.target.files || []);
      const sourceFiles = selected.filter(isAuditableSourceFile);
      const loaded = await Promise.all(sourceFiles.map(readFile));
      setFiles((current) => current.concat(loaded));
      event.target.value = "";
    };

    const handleCommonCss = async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const loaded = await readFile(file);
      const extracted = rules.extractCommonCssBaseline(loaded.text);
      setBaseline(rules.mergeBaselines(rules.createDefaultBaseline(), extracted));
      setBaselineHint(`已载入 ${file.name}：${extracted.classes.size} 个 class，${Object.keys(extracted.allowedValues).length} 类 CSS 属性值。`);
      event.target.value = "";
    };

    const removeFile = (fileId) => {
      setFiles((current) => current.filter((file) => file.id !== fileId));
      setExpandedIssues(new Set());
    };

    const toggleIssue = (issueId) => {
      setExpandedIssues((current) => {
        const next = new Set(current);
        if (next.has(issueId)) next.delete(issueId);
        else next.add(issueId);
        return next;
      });
    };

    const tabs = [
      ["overview", "总览"],
      ["design", "设计规则"],
      ["classes", "Class 统计"],
      ["css", "CSS 裸值"],
      ["issues", "问题清单"],
    ];

    return h("main", { className: "app-shell" },
      h("header", { className: "topbar" },
        h("div", null,
          h("p", { className: "eyebrow" }, "Code Rule Auditor"),
          h("h1", null, "页面规范质检工具"),
          h("p", { className: "topbar-desc" }, "上传 HTML / CSS，按设计规则和 common.css 基础规范实时检查。"),
        ),
        h("div", { className: "topbar-actions" },
          h("button", { className: "btn secondary", type: "button", onClick: () => setFiles(demoFiles()) }, "载入示例"),
          h("button", { className: "btn primary", type: "button", onClick: () => setActiveTab("issues") }, "查看问题"),
        ),
      ),
      h("section", { className: "workspace" },
        h("aside", { className: "config-panel", "aria-label": "规则配置" },
          h("section", { className: "panel-section" },
            h("h2", null, "上传文件夹"),
            h("label", { className: "upload-box", htmlFor: "sourceFiles" },
              h("span", { className: "upload-title" }, "选择项目文件夹"),
              h("span", { className: "upload-desc" }, "自动筛选 .html、.htm、.css，并忽略 .min 压缩插件文件"),
              h("input", {
                id: "sourceFiles",
                type: "file",
                multiple: true,
                webkitdirectory: "",
                directory: "",
                onChange: handleSourceFiles,
              }),
            ),
            h("div", { className: "file-list" },
              files.length
                ? files.map((file) => h("span", { className: "file-chip", key: file.id },
                    h("span", null, `${file.name} · ${classifyFile(file).toUpperCase()}`),
                    h("button", { className: "remove-file", type: "button", onClick: () => removeFile(file.id), "aria-label": `移除 ${file.name}` }, "×"),
                  ))
                : "尚未选择文件夹",
            ),
          ),
          h("section", { className: "panel-section" },
            h("h2", null, "规范来源"),
            h("label", { className: "upload-box compact", htmlFor: "commonCssFile" },
              h("span", { className: "upload-title" }, "上传 common.css"),
              h("span", { className: "upload-desc" }, "可选，用于提取允许 class 和 CSS 属性值"),
              h("input", { id: "commonCssFile", type: "file", accept: ".css,text/css", onChange: handleCommonCss }),
            ),
            h("p", { className: "hint" }, baselineHint),
          ),
          h("section", { className: "panel-section" },
            h("h2", null, "规则定义"),
            h("label", { className: "field-label", htmlFor: "requiredClassInput" }, "必需类名"),
            h("input", {
              id: "requiredClassInput",
              className: "text-input",
              value: form.requiredClasses,
              placeholder: "例如：title,subtitle",
              onChange: (event) => updateForm("requiredClasses", event.target.value),
            }),
            h("label", { className: "field-label", htmlFor: "prefixInput" }, "工具类前缀"),
            h("input", { id: "prefixInput", className: "text-input", value: form.prefixes, onChange: (event) => updateForm("prefixes", event.target.value) }),
            h("label", { className: "field-label", htmlFor: "headingInput" }, "标题标签"),
            h("input", { id: "headingInput", className: "text-input", value: form.headingTags, onChange: (event) => updateForm("headingTags", event.target.value) }),
            h("label", { className: "field-label", htmlFor: "propertyInput" }, "CSS 属性检查"),
            h("textarea", { id: "propertyInput", className: "textarea", rows: 4, value: form.cssProperties, onChange: (event) => updateForm("cssProperties", event.target.value) }),
            h("h2", { className: "subsection-title" }, "设计师规则"),
            h("div", { className: "rule-form" },
              AUDIT_RULE_CONFIG.designerFields.map((field) => h(DesignerField, {
                key: field.key,
                field,
                value: form[field.key],
                onChange: updateForm,
              })),
            ),
            h("p", { className: "hint" }, "设计师只填数值。工具内部会自动识别 .title .subtitle 常见标题类名，以及 button / btn / button 类按钮。"),
            h("div", { className: "inline-advice", "aria-label": "质检建议" },
              h("h2", null, "质检建议"),
              h("ul", { className: "compact-list" },
                h("li", null, "板块间距优先使用 pt / pb / mt / mb。"),
                h("li", null, "字号优先使用 fnt12 至 fnt80。"),
                h("li", null, "页面标题结构应保留 h1 到 h3 的层级。"),
                h("li", null, "问题清单可展开源码片段，快速定位需处理位置。"),
              ),
            ),
          ),
        ),
        h("section", { className: "result-panel", "aria-live": "polite" },
          h("div", { className: "summary-grid" },
            h(Metric, { label: "待检查文件", value: files.length, help: "HTML / CSS" }),
            h(Metric, { label: "规范工具类", value: utilityTotal, help: "fnt / mt / mb / pt / pb" }),
            h(Metric, { label: "疑似非规范", value: report.issues.length, help: "需人工确认" }),
            h(Metric, { label: "标题标签", value: report.headingTotal, help: "h1-h6 总量" }),
          ),
          h("div", { className: "tabs", role: "tablist", "aria-label": "结果分类" },
            tabs.map(([key, label]) => h("button", {
              className: activeTab === key ? "tab active" : "tab",
              type: "button",
              key,
              onClick: () => setActiveTab(key),
            }, label)),
          ),
          activeTab === "overview" ? h(OverviewTab, { report, designResults, designFailed, designMatched, files }) : null,
          activeTab === "design" ? h(DesignTab, { report }) : null,
          activeTab === "classes" ? h(ClassTab, { report }) : null,
          activeTab === "css" ? h(CssTab, { report }) : null,
          activeTab === "issues" ? h("section", { className: "tab-panel active" },
            h(IssuesView, {
              issues: report.issues,
              expandedIssues,
              onToggleIssue: toggleIssue,
              onExport: () => downloadReport(report),
              canExport: files.length > 0,
            }),
          ) : null,
        ),
      ),
    );
  }

  function OverviewTab({ report, designResults, designFailed, designMatched, files }) {
    if (!files.length) {
      return h("section", { className: "tab-panel active" },
        h("div", { className: "empty-state" },
          h("h2", null, "上传页面后自动检查"),
          h("p", null, "工具会在浏览器本地读取文件，不上传到服务器。修改设计规则数值后，结果会实时重新计算。"),
        ),
      );
    }

    const headingPills = Object.entries(report.headings).map(([tag, count]) => h(Pill, { key: tag }, `${tag}: ${count}`));
    const classPills = Object.entries(report.utilityByPrefix).map(([prefix, bucket]) => h(Pill, { key: prefix, type: bucket.unknownTotal ? "warn" : "ok" }, `${prefix}: ${bucket.total} 次 / 非规范 ${bucket.unknownTotal}`));
    const inlineProps = mapToRows(report.inlineStyleProps, 8).map(([prop, count]) => h(Pill, { key: prop, type: "warn" }, `${prop}: ${count}`));
    const buttonPills = mapToRows(report.buttons.classBased, 12).map(([className, count]) => h(Pill, { key: className }, `${className}: ${count}`));
    const topClasses = mapToRows(report.classUsage, 18).map(([className, count]) => h(Pill, { key: className }, `${className}: ${count}`));
    const requiredClassPills = report.requiredClassResults.map((item) => h(Pill, {
      key: item.className,
      type: item.missing ? "danger" : "ok",
    }, `.${item.className}: ${item.count}`));
    const valueSummary = report.settings.cssProperties
      .map((property) => {
        const bucket = report.cssByProperty[property];
        if (!bucket || !bucket.items.size) return null;
        return h("div", { className: "value-group", key: property },
          h("strong", null, property),
          h("div", { className: "pill-row" }, mapToRows(bucket.items, 10).map(([value, count]) => h(Pill, { key: `${property}-${value}` }, `${value}: ${count}`))),
        );
      })
      .filter(Boolean);

    return h("section", { className: "tab-panel active" },
      h("div", { className: "result-stack" },
        h(ResultCard, { title: "设计规则检查", hint: "按设计师给定标准验收具体元素" },
          h("div", { className: "pill-row" },
            h(Pill, null, `规则数: ${designResults.length}`),
            h(Pill, null, `命中元素: ${designMatched}`),
            h(Pill, { type: designFailed ? "danger" : "ok" }, `异常: ${designFailed}`),
          ),
        ),
        h(ResultCard, { title: "必需类名检查", hint: "检查页面 HTML 是否出现指定 class，例如 .title / .subtitle" },
          h("div", { className: "pill-row" },
            requiredClassPills.length ? requiredClassPills : h("span", { className: "hint" }, "未配置必需类名"),
          ),
        ),
        h(ResultCard, { title: "字号值对比", hint: "罗列页面实际出现的 font-size，并对比设计师允许值" },
          h(AuditValuePills, { audit: report.fontAudit, emptyText: "页面未发现字号值" }),
        ),
        h(ResultCard, { title: "颜色值对比", hint: "罗列页面实际出现的 color / background-color / border-color" },
          h(AuditValuePills, { audit: report.colorAudit, emptyText: "页面未发现颜色值" }),
        ),
        h(ResultCard, { title: "间距值对比", hint: "罗列页面实际出现的 margin / padding 值，并标出额外值" },
          h(AuditValuePills, { audit: report.spacingAudit, emptyText: "页面未发现间距值" }),
        ),
        h(ButtonAuditCard, { report }),
        h(ResultCard, { title: "工具类命中", hint: "按规则前缀统计总次数" }, h("div", { className: "pill-row" }, classPills.length ? classPills : h("span", { className: "hint" }, "暂无匹配"))),
        h(ResultCard, { title: "标题结构", hint: "统计语义标题标签" }, h("div", { className: "pill-row" }, headingPills.length ? headingPills : h("span", { className: "hint" }, "暂无标题"))),
        h(ResultCard, { title: "内联样式", hint: "建议沉淀到 class 或 common.css" }, h("div", { className: "pill-row" }, h(Pill, { type: report.inlineStyleTotal ? "warn" : "ok" }, `style 属性: ${report.inlineStyleTotal}`), inlineProps)),
        h(ResultCard, { title: "按钮线索", hint: "统计 button 标签和含 btn / button 的 class" }, h("div", { className: "pill-row" }, h(Pill, null, `button 标签: ${report.buttons.native}`), h(Pill, null, `a 按钮类: ${report.buttons.linkLike}`), buttonPills.length ? buttonPills : h("span", { className: "hint" }, "暂无按钮类"))),
        h(ResultCard, { title: "高频 class", hint: "用于判断哪些规则值得沉淀" }, h("div", { className: "pill-row" }, topClasses.length ? topClasses : h("span", { className: "hint" }, "暂无 class"))),
        h(ResultCard, { title: "出现值汇总", hint: "弱化沉淀功能，只罗列 CSS 中出现过的值" }, h("div", { className: "value-summary" }, valueSummary.length ? valueSummary : h("span", { className: "hint" }, "暂无可汇总的 CSS 属性值"))),
      ),
    );
  }

  function ResultCard({ title, hint, children }) {
    return h("article", { className: "result-card" },
      h("header", null, h("h3", null, title), h("span", { className: "hint" }, hint)),
      h("div", { className: "result-card-body" }, children),
    );
  }

  function AuditValuePills({ audit, emptyText }) {
    const usedRows = mapToRows(audit.usedValues, 18);
    const extraRows = mapToRows(audit.extraValues, 18);
    const allowedRows = Array.from(audit.allowedValues).sort((a, b) => parsePx(a) - parsePx(b) || a.localeCompare(b));

    return h("div", { className: "audit-value-grid" },
      h("div", { className: "value-group" },
        h("strong", null, `设计允许值（${allowedRows.length}）`),
        h("div", { className: "pill-row" }, allowedRows.length ? allowedRows.map((value) => h(Pill, { key: value, type: "ok" }, value)) : h("span", { className: "hint" }, "未填写允许值")),
      ),
      h("div", { className: "value-group" },
        h("strong", null, `页面已使用（${audit.allowedTotal} 次）`),
        h("div", { className: "pill-row" }, usedRows.length ? usedRows.map(([value, item]) => h(Pill, { key: value }, `${value}: ${item.total}`)) : h("span", { className: "hint" }, emptyText || "暂无命中")),
      ),
      h("div", { className: "value-group" },
        h("strong", null, `页面多出来（${audit.extraValues.size} 个值 / ${audit.extraTotal} 次）`),
        h("div", { className: "pill-row" }, extraRows.length ? extraRows.map(([value, item]) => h(Pill, { key: value, type: "danger" }, `${value}: ${item.total}`)) : h("span", { className: "hint" }, "没有额外值")),
      ),
    );
  }

  function CompactAuditGroup({ title, audit, emptyText }) {
    const usedRows = mapToRows(audit.usedValues, 10);
    const extraRows = mapToRows(audit.extraValues, 10);

    return h("div", { className: "button-audit-group" },
      h("strong", null, title),
      h("div", { className: "pill-row" },
        h(Pill, null, `规范内 ${audit.allowedTotal}`),
        h(Pill, { type: audit.extraTotal ? "danger" : "ok" }, `额外 ${audit.extraValues.size} 个 / ${audit.extraTotal} 次`),
      ),
      h("div", { className: "pill-row" },
        usedRows.length
          ? usedRows.map(([value, item]) => h(Pill, { key: `${title}-used-${value}` }, `${value}: ${item.total}`))
          : h("span", { className: "hint" }, emptyText || "暂无规范内命中"),
      ),
      extraRows.length ? h("div", { className: "pill-row" },
        extraRows.map(([value, item]) => h(Pill, { key: `${title}-extra-${value}`, type: "danger" }, `${value}: ${item.total}`)),
      ) : null,
    );
  }

  function ButtonAuditCard({ report }) {
    const selectors = mapToRows(report.buttonAudit.cssSelectors, 10);
    const elements = mapToRows(report.buttonAudit.elements, 10);

    return h(ResultCard, { title: "按钮样式对比", hint: "自动识别 button / btn / button 类，检查按钮字号、颜色、内边距、圆角" },
      h("div", { className: "button-audit-grid" },
        h("div", { className: "value-group button-audit-overview" },
          h("strong", null, "按钮线索"),
          h("div", { className: "pill-row" },
            h(Pill, null, `按钮元素: ${report.buttonAudit.total}`),
            h(Pill, null, `按钮 CSS 选择器: ${report.buttonAudit.cssSelectors.size}`),
          ),
          h("div", { className: "pill-row" },
            elements.length
              ? elements.map(([name, count]) => h(Pill, { key: `button-element-${name}` }, `${name}: ${count}`))
              : h("span", { className: "hint" }, "暂无按钮元素"),
          ),
          selectors.length ? h("div", { className: "pill-row" },
            selectors.map(([selector, count]) => h(Pill, { key: `button-selector-${selector}` }, `${selector}: ${count}`)),
          ) : null,
        ),
        h(CompactAuditGroup, { title: "按钮字号", audit: report.buttonAudit.fontAudit, emptyText: "按钮未发现字号" }),
        h(CompactAuditGroup, { title: "按钮颜色", audit: report.buttonAudit.colorAudit, emptyText: "按钮未发现颜色" }),
        h(CompactAuditGroup, { title: "按钮内边距", audit: report.buttonAudit.spacingAudit, emptyText: "按钮未发现 padding / margin" }),
        h(CompactAuditGroup, { title: "按钮圆角", audit: report.buttonAudit.radiusAudit, emptyText: "按钮未发现 border-radius" }),
      ),
    );
  }

  function DesignTab({ report }) {
    const designRows = Object.values(report.designRuleResults).map((row) => ({
      key: `design-${row.name}`,
      name: row.name,
      matched: row.matched,
      passed: row.passed,
      failed: row.failed,
      conditionText: row.conditions.map((condition) => `${condition.property}${condition.operator}${condition.expected}`).join("；"),
    }));
    const requiredRows = report.requiredClassResults.map((item) => ({
      key: `required-${item.className}`,
      name: `必需类名 .${item.className}`,
      matched: item.count,
      passed: item.missing ? 0 : 1,
      failed: item.missing ? 1 : 0,
      conditionText: `HTML 中必须出现 .${item.className}`,
    }));
    const rows = requiredRows.concat(designRows);

    return h("section", { className: "tab-panel active" },
      h("div", { className: "table-wrap" },
        h("table", null,
          h("thead", null, h("tr", null, ["规则", "命中元素", "通过", "异常", "检查条件"].map((item) => h("th", { key: item }, item)))),
          h("tbody", null,
            rows.length ? rows.map((row) => h("tr", { key: row.key },
              h("td", null, row.name),
              h("td", null, row.matched),
              h("td", null, row.passed),
              h("td", null, row.failed),
              h("td", { className: "code" }, row.conditionText),
            )) : h("tr", null, h("td", { colSpan: 5 }, "暂无设计规则")),
          ),
        ),
      ),
    );
  }

  function ClassTab({ report }) {
    return h("section", { className: "tab-panel active" },
      h("div", { className: "table-wrap" },
        h("table", null,
          h("thead", null, h("tr", null, ["规则", "总次数", "不同 class", "规范内", "疑似非规范"].map((item) => h("th", { key: item }, item)))),
          h("tbody", null, Object.entries(report.utilityByPrefix).map(([prefix, bucket]) => {
            const unknown = mapToRows(bucket.unknownItems, 8).map(([name, count]) => `${name}(${count})`).join("、") || "-";
            return h("tr", { key: prefix },
              h("td", { className: "code" }, `${prefix}\\d+`),
              h("td", null, bucket.total),
              h("td", null, bucket.items.size),
              h("td", null, bucket.allowedTotal),
              h("td", null, unknown),
            );
          })),
        ),
      ),
    );
  }

  function CssTab({ report }) {
    return h("section", { className: "tab-panel active" },
      h("div", { className: "table-wrap" },
        h("table", null,
          h("thead", null, h("tr", null, ["CSS 属性", "总次数", "不同值", "规范内", "疑似非规范"].map((item) => h("th", { key: item }, item)))),
          h("tbody", null, report.settings.cssProperties.map((property) => {
            const bucket = report.cssByProperty[property] || makeCounter();
            const unknown = mapToRows(bucket.unknownItems, 8).map(([value, count]) => `${value}(${count})`).join("、") || "-";
            return h("tr", { key: property },
              h("td", { className: "code" }, property),
              h("td", null, bucket.total),
              h("td", null, bucket.items.size),
              h("td", null, bucket.allowedTotal),
              h("td", null, unknown),
            );
          })),
        ),
      ),
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
