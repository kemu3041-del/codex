(function () {
  const els = {
    imageInput: document.getElementById("imageInput"),
    uploadBox: document.getElementById("uploadBox"),
    projectName: document.getElementById("projectName"),
    pageType: document.getElementById("pageType"),
    outputMode: document.getElementById("outputMode"),
    assetPath: document.getElementById("assetPath"),
    includeReference: document.getElementById("includeReference"),
    addCmsHints: document.getElementById("addCmsHints"),
    generateBtn: document.getElementById("generateBtn"),
    resetBtn: document.getElementById("resetBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    copyBtn: document.getElementById("copyBtn"),
    metricGrid: document.getElementById("metricGrid"),
    palette: document.getElementById("palette"),
    previewStage: document.getElementById("previewStage"),
    imageMeta: document.getElementById("imageMeta"),
    statusPill: document.getElementById("statusPill"),
    codeInfo: document.getElementById("codeInfo"),
    codeOutput: document.getElementById("codeOutput"),
    tabs: Array.from(document.querySelectorAll(".tab")),
  };

  const state = {
    image: null,
    analysis: null,
    activeTab: "html",
    output: { html: "", css: "", js: "" },
  };

  function sanitizeSlug(value) {
    const safe = String(value || "design-page")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return safe || "design-page";
  }

  function toTitle(value) {
    return sanitizeSlug(value)
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Design Page";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
  }

  function hexToRgb(hex) {
    const normalized = String(hex || "").replace("#", "");
    if (normalized.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mixColor(hex, targetHex, weight) {
    const from = hexToRgb(hex);
    const to = hexToRgb(targetHex);
    const ratio = clamp(weight, 0, 1);
    return rgbToHex(
      Math.round(from.r * (1 - ratio) + to.r * ratio),
      Math.round(from.g * (1 - ratio) + to.g * ratio),
      Math.round(from.b * (1 - ratio) + to.b * ratio)
    );
  }

  function luminance(r, g, b) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function saturation(r, g, b) {
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    if (max === min) return 0;
    const lightness = (max + min) / 2;
    return (max - min) / (1 - Math.abs(2 * lightness - 1));
  }

  function analyzePalette(image) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const maxSide = 180;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const buckets = new Map();
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let samples = 0;
    let edgeScore = 0;

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha < 128) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
        const current = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
        current.count += 1;
        current.r += r;
        current.g += g;
        current.b += b;
        buckets.set(key, current);

        totalR += r;
        totalG += g;
        totalB += b;
        samples += 1;

        if (x + 2 < canvas.width) {
          const nextIdx = (y * canvas.width + x + 2) * 4;
          edgeScore += Math.abs(r - data[nextIdx]) + Math.abs(g - data[nextIdx + 1]) + Math.abs(b - data[nextIdx + 2]);
        }
      }
    }

    const palette = Array.from(buckets.values())
      .map((item) => {
        const r = Math.round(item.r / item.count);
        const g = Math.round(item.g / item.count);
        const b = Math.round(item.b / item.count);
        return {
          hex: rgbToHex(r, g, b),
          count: item.count,
          luminance: luminance(r, g, b),
          saturation: saturation(r, g, b),
        };
      })
      .sort((a, b) => b.count - a.count);

    const primaryPalette = [];
    palette.forEach((item) => {
      const isClose = primaryPalette.some((saved) => colorDistance(saved.hex, item.hex) < 54);
      if (!isClose && primaryPalette.length < 6) primaryPalette.push(item);
    });

    const avgR = Math.round(totalR / Math.max(samples, 1));
    const avgG = Math.round(totalG / Math.max(samples, 1));
    const avgB = Math.round(totalB / Math.max(samples, 1));
    const averageLuminance = luminance(avgR, avgG, avgB);
    const visualDensity = edgeScore / Math.max(samples, 1);

    return {
      palette: primaryPalette.length ? primaryPalette : [{ hex: rgbToHex(avgR, avgG, avgB), luminance: averageLuminance, saturation: 0.2 }],
      averageColor: rgbToHex(avgR, avgG, avgB),
      averageLuminance,
      visualDensity,
    };
  }

  function colorDistance(hexA, hexB) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return Math.sqrt(
      Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
    );
  }

  function inferPageType(width, height, visualDensity) {
    const ratio = width / height;
    if (ratio < 0.78) return "mobile";
    if (visualDensity > 88 && ratio > 1.05) return "dashboard";
    if (ratio > 1.35) return "landing";
    return "section";
  }

  function getResolvedType() {
    if (!state.analysis) return "landing";
    return els.pageType.value === "auto" ? state.analysis.inferredType : els.pageType.value;
  }

  function getTypeLabel(type) {
    return {
      landing: "落地页",
      dashboard: "看板",
      mobile: "移动端",
      section: "CMS 模块",
    }[type] || "页面";
  }

  function getToneLabel(value) {
    if (value < 0.38) return "深色基调";
    if (value > 0.72) return "浅色基调";
    return "中性基调";
  }

  function pickThemeColors() {
    const palette = state.analysis ? state.analysis.palette : [];
    const sorted = palette.length ? palette : [
      { hex: "#f5f7f6", luminance: 0.92, saturation: 0.05 },
      { hex: "#17211f", luminance: 0.12, saturation: 0.18 },
      { hex: "#0f8f88", luminance: 0.42, saturation: 0.74 },
    ];
    const light = sorted.filter((item) => item.luminance > 0.68).sort((a, b) => b.count - a.count)[0];
    const dark = sorted.filter((item) => item.luminance < 0.34).sort((a, b) => b.count - a.count)[0];
    const saturated = sorted
      .filter((item) => item.saturation > 0.2 && item.luminance > 0.18 && item.luminance < 0.82)
      .sort((a, b) => b.saturation - a.saturation)[0];

    const background = light ? light.hex : mixColor(sorted[0].hex, "#ffffff", 0.78);
    const text = dark ? dark.hex : "#17211f";
    const accent = saturated ? saturated.hex : "#0f8f88";

    return {
      background,
      surface: mixColor(background, "#ffffff", 0.66),
      surfaceSoft: mixColor(background, "#ffffff", 0.36),
      text,
      muted: mixColor(text, background, 0.46),
      accent,
      accentStrong: mixColor(accent, "#000000", 0.18),
      accentSoft: mixColor(accent, background, 0.82),
      line: mixColor(text, background, 0.8),
    };
  }

  function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const image = new Image();
      image.onload = () => {
        const paletteData = analyzePalette(image);
        const ratio = image.naturalWidth / image.naturalHeight;
        state.image = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          width: image.naturalWidth,
          height: image.naturalHeight,
        };
        state.analysis = {
          ...paletteData,
          ratio,
          inferredType: inferPageType(image.naturalWidth, image.naturalHeight, paletteData.visualDensity),
        };
        if (els.assetPath.value === "./design.jpg" || els.assetPath.value === "./design.png") {
          els.assetPath.value = `./${file.name}`;
        }
        renderPreview();
        renderAnalysis();
        generateAll();
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function renderPreview() {
    if (!state.image) return;
    els.previewStage.innerHTML = "";
    const img = document.createElement("img");
    img.className = "design-preview";
    img.src = state.image.dataUrl;
    img.alt = state.image.name;
    els.previewStage.appendChild(img);
    els.imageMeta.textContent = `${state.image.name} · ${state.image.width} x ${state.image.height}px · ${formatBytes(state.image.size)}`;
    els.statusPill.textContent = "已分析";
    els.statusPill.classList.add("ready");
    els.generateBtn.disabled = false;
    els.downloadBtn.disabled = false;
    els.copyBtn.disabled = false;
  }

  function renderAnalysis() {
    if (!state.analysis || !state.image) return;
    const ratio = state.analysis.ratio;
    const ratioLabel = ratio > 1 ? `${ratio.toFixed(2)}:1 横向` : `1:${(1 / ratio).toFixed(2)} 纵向`;
    const type = getResolvedType();
    const metrics = [
      { label: "尺寸", value: `${state.image.width} x ${state.image.height}` },
      { label: "比例", value: ratioLabel },
      { label: "明暗", value: getToneLabel(state.analysis.averageLuminance) },
      { label: "建议", value: getTypeLabel(type) },
    ];

    els.metricGrid.innerHTML = metrics.map((item) => `
      <div class="metric">
        <small>${escapeHtml(item.label)}</small>
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    `).join("");

    els.palette.innerHTML = state.analysis.palette.map((item) => `
      <div class="swatch">
        <div class="swatch-color" style="background:${item.hex}"></div>
        <span>${item.hex}</span>
      </div>
    `).join("");
  }

  function formatBytes(size) {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / 1024 / 1024).toFixed(2)}MB`;
  }

  function generateAll() {
    if (!state.image || !state.analysis) return;
    const settings = getSettings();
    const theme = pickThemeColors();
    const htmlBody = buildHtmlBody(settings, theme);
    state.output = {
      html: settings.outputMode === "cms" ? htmlBody : buildFullHtml(settings, htmlBody),
      css: buildCss(settings, theme),
      js: buildJs(settings),
    };
    renderAnalysis();
    updateCodeOutput();
  }

  function getSettings() {
    const slug = sanitizeSlug(els.projectName.value);
    const type = getResolvedType();
    return {
      slug,
      title: toTitle(slug),
      type,
      typeLabel: getTypeLabel(type),
      outputMode: els.outputMode.value,
      assetPath: els.assetPath.value.trim() || "./design.jpg",
      includeReference: els.includeReference.checked,
      addCmsHints: els.addCmsHints.checked,
      image: state.image,
      analysis: state.analysis,
    };
  }

  function buildFullHtml(settings, htmlBody) {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(settings.title)}</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
${indent(htmlBody, 4)}
    <script src="./app.js"></script>
  </body>
</html>`;
  }

  function buildHtmlBody(settings) {
    const hint = settings.addCmsHints ? "  <!-- CMS: 替换标题、描述、按钮链接、图片路径和列表内容。 -->\n" : "";
    const reference = settings.includeReference ? buildReferenceHtml(settings) : "";
    const content = {
      landing: buildLandingHtml(settings),
      dashboard: buildDashboardHtml(settings),
      mobile: buildMobileHtml(settings),
      section: buildSectionHtml(settings),
    }[settings.type];

    return `<main class="${settings.slug}" data-design-type="${settings.type}">
${hint}${reference}${content}
</main>`;
  }

  function buildReferenceHtml(settings) {
    return `  <figure class="${settings.slug}__reference" aria-label="设计图参考">
    <img src="${escapeHtml(settings.assetPath)}" alt="上传的设计图参考" />
    <figcaption>${settings.image.width} x ${settings.image.height}px · ${settings.typeLabel}</figcaption>
  </figure>
`;
  }

  function buildLandingHtml(settings) {
    return `  <header class="${settings.slug}__nav">
    <a class="${settings.slug}__brand" href="#">Brand</a>
    <nav aria-label="主导航">
      <a href="#features">Highlights</a>
      <a href="#details">Details</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <section class="${settings.slug}__hero">
    <div class="${settings.slug}__hero-copy">
      <p class="${settings.slug}__eyebrow">Design matched structure</p>
      <h1>把设计图拆成可维护的页面结构</h1>
      <p class="${settings.slug}__lead">这里替换为页面主卖点。结构已预留标题、副标题、按钮、媒体区域和内容卡片，方便接入 CMS 字段。</p>
      <div class="${settings.slug}__actions">
        <a class="${settings.slug}__button ${settings.slug}__button--primary" href="#">主要操作</a>
        <a class="${settings.slug}__button" href="#">查看详情</a>
      </div>
    </div>
    <div class="${settings.slug}__hero-media">
      <img src="${escapeHtml(settings.assetPath)}" alt="页面主视觉" />
    </div>
  </section>

  <section class="${settings.slug}__feature-grid" id="features">
    <article>
      <span>01</span>
      <h2>布局层级</h2>
      <p>根据上传图比例生成首屏和内容网格，后续可继续细化成真实页面。</p>
    </article>
    <article>
      <span>02</span>
      <h2>色彩变量</h2>
      <p>主色、背景、文字和边框已整理成 CSS 变量，方便统一替换。</p>
    </article>
    <article>
      <span>03</span>
      <h2>交互预留</h2>
      <p>JS 中保留入场状态和按钮事件绑定位置，适合继续接真实数据。</p>
    </article>
  </section>`;
  }

  function buildDashboardHtml(settings) {
    return `  <header class="${settings.slug}__dashboard-head">
    <div>
      <p class="${settings.slug}__eyebrow">Overview</p>
      <h1>业务数据看板</h1>
    </div>
    <button class="${settings.slug}__button ${settings.slug}__button--primary" type="button">导出数据</button>
  </header>

  <section class="${settings.slug}__kpis" aria-label="核心指标">
    <article><span>访问量</span><strong>128,640</strong><small>较上周 +12.4%</small></article>
    <article><span>转化率</span><strong>8.72%</strong><small>目标完成 91%</small></article>
    <article><span>线索数</span><strong>3,486</strong><small>新增 420</small></article>
    <article><span>客单价</span><strong>¥ 2,186</strong><small>稳定增长</small></article>
  </section>

  <section class="${settings.slug}__dashboard-grid">
    <article class="${settings.slug}__chart-block">
      <div class="${settings.slug}__block-head">
        <h2>趋势分析</h2>
        <span>近 30 天</span>
      </div>
      <div class="${settings.slug}__chart-bars" aria-hidden="true">
        <i style="height:46%"></i><i style="height:68%"></i><i style="height:52%"></i><i style="height:78%"></i><i style="height:88%"></i><i style="height:64%"></i><i style="height:92%"></i>
      </div>
    </article>
    <article class="${settings.slug}__table-block">
      <div class="${settings.slug}__block-head">
        <h2>模块清单</h2>
        <span>待接入 CMS</span>
      </div>
      <ul>
        <li><span>首屏主视觉</span><strong>已映射</strong></li>
        <li><span>指标卡片</span><strong>待替换</strong></li>
        <li><span>趋势图表</span><strong>待接入</strong></li>
      </ul>
    </article>
  </section>`;
  }

  function buildMobileHtml(settings) {
    return `  <section class="${settings.slug}__phone">
    <header class="${settings.slug}__mobile-head">
      <button type="button" aria-label="返回">‹</button>
      <strong>页面标题</strong>
      <button type="button" aria-label="菜单">☰</button>
    </header>

    <div class="${settings.slug}__mobile-hero">
      <img src="${escapeHtml(settings.assetPath)}" alt="移动端主视觉" />
      <div>
        <p class="${settings.slug}__eyebrow">Mobile module</p>
        <h1>适配移动端的内容结构</h1>
        <p>这里替换为移动端首屏说明，重点控制文字行数和触摸按钮尺寸。</p>
      </div>
    </div>

    <div class="${settings.slug}__mobile-list">
      <article><span>01</span><strong>核心卖点</strong><p>短文案说明，保持两到三行。</p></article>
      <article><span>02</span><strong>行动入口</strong><p>适合跳转表单、详情或外部链接。</p></article>
      <article><span>03</span><strong>补充信息</strong><p>用于承接 CMS 列表字段。</p></article>
    </div>

    <button class="${settings.slug}__button ${settings.slug}__button--primary" type="button">立即操作</button>
  </section>`;
  }

  function buildSectionHtml(settings) {
    return `  <section class="${settings.slug}__module">
    <div class="${settings.slug}__module-copy">
      <p class="${settings.slug}__eyebrow">CMS section</p>
      <h1>可复制到 SaaS/CMS 的页面模块</h1>
      <p class="${settings.slug}__lead">标题、描述、按钮和图片都保持在 HTML 中，适合平台源码区直接替换字段。</p>
      <a class="${settings.slug}__button ${settings.slug}__button--primary" href="#">配置按钮</a>
    </div>
    <div class="${settings.slug}__module-media">
      <img src="${escapeHtml(settings.assetPath)}" alt="模块图片" />
    </div>
  </section>

  <section class="${settings.slug}__feature-grid">
    <article><h2>字段一</h2><p>替换为 CMS 标题和描述。</p></article>
    <article><h2>字段二</h2><p>替换为 CMS 标题和描述。</p></article>
    <article><h2>字段三</h2><p>替换为 CMS 标题和描述。</p></article>
  </section>`;
  }

  function buildCss(settings, theme) {
    const slug = settings.slug;
    const isMobile = settings.type === "mobile";
    const maxWidth = isMobile ? "430px" : settings.type === "dashboard" ? "1280px" : "1180px";

    return `:root {
  --page-bg: ${theme.background};
  --surface: ${theme.surface};
  --surface-soft: ${theme.surfaceSoft};
  --text: ${theme.text};
  --muted: ${theme.muted};
  --line: ${theme.line};
  --accent: ${theme.accent};
  --accent-strong: ${theme.accentStrong};
  --accent-soft: ${theme.accentSoft};
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text);
  background: var(--page-bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
}

img {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

.${slug} {
  width: min(${maxWidth}, calc(100% - 32px));
  margin: 0 auto;
  padding: ${isMobile ? "18px 0 28px" : "28px 0 56px"};
}

.${slug}__reference {
  margin: 0 0 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
}

.${slug}__reference img {
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  background: #fff;
}

.${slug}__reference figcaption {
  padding: 10px 14px;
  color: var(--muted);
  font-size: 13px;
}

.${slug}__eyebrow {
  margin: 0 0 10px;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.${slug} h1,
.${slug} h2,
.${slug} p {
  margin: 0;
}

.${slug} h1 {
  font-size: 44px;
  line-height: 1.08;
}

.${slug} h2 {
  font-size: 20px;
  line-height: 1.25;
}

.${slug}__lead,
.${slug} p {
  color: var(--muted);
}

.${slug}__button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 18px;
  background: var(--surface);
  color: var(--text);
  font-weight: 760;
  transition: transform 0.18s ease, background 0.18s ease;
}

.${slug}__button:hover {
  transform: translateY(-1px);
}

.${slug}__button--primary {
  border-color: transparent;
  background: var(--accent);
  color: #fff;
}

${buildTypeCss(settings, theme)}

.${slug} [data-reveal] {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.${slug} .is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 760px) {
  .${slug} {
    width: min(100% - 24px, ${maxWidth});
  }

  .${slug} h1 {
    font-size: 32px;
  }

  .${slug}__nav,
  .${slug}__hero,
  .${slug}__module,
  .${slug}__dashboard-head,
  .${slug}__dashboard-grid {
    grid-template-columns: 1fr;
  }

  .${slug}__nav nav {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
  }
}`;
  }

  function buildTypeCss(settings) {
    const slug = settings.slug;

    if (settings.type === "dashboard") {
      return `.${slug}__dashboard-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 20px;
}

.${slug}__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.${slug}__kpis article,
.${slug}__chart-block,
.${slug}__table-block {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
}

.${slug}__kpis article {
  display: grid;
  gap: 6px;
  padding: 18px;
}

.${slug}__kpis span,
.${slug}__kpis small,
.${slug}__block-head span {
  color: var(--muted);
  font-size: 13px;
}

.${slug}__kpis strong {
  font-size: 28px;
}

.${slug}__dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 18px;
}

.${slug}__chart-block,
.${slug}__table-block {
  padding: 20px;
}

.${slug}__block-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.${slug}__chart-bars {
  display: flex;
  height: 260px;
  gap: 12px;
  align-items: end;
}

.${slug}__chart-bars i {
  flex: 1;
  min-width: 22px;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, var(--accent), var(--accent-soft));
}

.${slug}__table-block ul {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.${slug}__table-block li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  padding: 12px 0;
}

@media (max-width: 900px) {
  .${slug}__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}`;
    }

    if (settings.type === "mobile") {
      return `.${slug}__phone {
  max-width: 430px;
  margin: 0 auto;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 12px;
  background: var(--surface);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.${slug}__mobile-head {
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  min-height: 46px;
}

.${slug}__mobile-head button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.${slug}__mobile-head strong {
  text-align: center;
}

.${slug}__mobile-hero {
  display: grid;
  gap: 18px;
  margin-top: 12px;
}

.${slug}__mobile-hero img {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  object-fit: cover;
}

.${slug}__mobile-list {
  display: grid;
  gap: 12px;
  margin: 22px 0;
}

.${slug}__mobile-list article {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 4px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: var(--surface-soft);
}

.${slug}__mobile-list span {
  grid-row: span 2;
  color: var(--accent-strong);
  font-weight: 820;
}

.${slug}__phone .${slug}__button {
  width: 100%;
}`;
    }

    if (settings.type === "section") {
      return `.${slug}__module {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(380px, 1.1fr);
  gap: 32px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 30px;
  background: var(--surface);
}

.${slug}__module-copy {
  display: grid;
  gap: 18px;
}

.${slug}__module-media img {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  object-fit: cover;
}

.${slug}__feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.${slug}__feature-grid article {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
  background: var(--surface);
}`;
    }

    return `.${slug}__nav {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
}

.${slug}__brand {
  font-weight: 900;
}

.${slug}__nav nav {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  color: var(--muted);
  font-size: 14px;
}

.${slug}__hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
  gap: 36px;
  align-items: center;
  min-height: 540px;
}

.${slug}__hero-copy {
  display: grid;
  gap: 18px;
}

.${slug}__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.${slug}__hero-media {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: var(--surface);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.12);
}

.${slug}__hero-media img {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 6px;
  object-fit: cover;
}

.${slug}__feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.${slug}__feature-grid article {
  display: grid;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
  background: var(--surface);
}

.${slug}__feature-grid span {
  color: var(--accent-strong);
  font-weight: 850;
}`;
  }

  function buildJs(settings) {
    const slug = settings.slug;
    return `(function () {
  const root = document.querySelector(".${slug}");
  if (!root) return;

  const revealItems = root.querySelectorAll("section, article, .${slug}__hero-copy, .${slug}__hero-media");
  revealItems.forEach((item) => item.setAttribute("data-reveal", ""));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest(".${slug}__button");
    if (!button) return;
    // 在这里接入 SaaS/CMS 的跳转、埋点或弹窗逻辑。
  });
})();`;
  }

  function indent(text, spaces) {
    const prefix = " ".repeat(spaces);
    return text.split("\n").map((line) => line ? `${prefix}${line}` : line).join("\n");
  }

  function updateCodeOutput() {
    els.codeOutput.value = state.output[state.activeTab] || "";
    const lines = els.codeOutput.value ? els.codeOutput.value.split("\n").length : 0;
    els.codeInfo.textContent = state.output[state.activeTab]
      ? `${state.activeTab.toUpperCase()} · ${lines} 行`
      : "等待生成";
  }

  function downloadFile(name, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function resetTool() {
    state.image = null;
    state.analysis = null;
    state.output = { html: "", css: "", js: "" };
    state.activeTab = "html";
    els.imageInput.value = "";
    els.assetPath.value = "./design.jpg";
    els.previewStage.innerHTML = `
      <div class="empty-state">
        <strong>上传设计图后开始生成</strong>
        <span>工具会根据图片比例生成首屏、模块、看板或移动端结构，并同步输出 CSS 变量。</span>
      </div>
    `;
    els.imageMeta.textContent = "还没有上传图片";
    els.statusPill.textContent = "等待上传";
    els.statusPill.classList.remove("ready");
    els.generateBtn.disabled = true;
    els.downloadBtn.disabled = true;
    els.copyBtn.disabled = true;
    els.metricGrid.innerHTML = `
      <div class="metric"><small>尺寸</small><strong>-</strong></div>
      <div class="metric"><small>比例</small><strong>-</strong></div>
      <div class="metric"><small>明暗</small><strong>-</strong></div>
      <div class="metric"><small>建议</small><strong>-</strong></div>
    `;
    els.palette.innerHTML = "";
    els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "html"));
    updateCodeOutput();
  }

  els.imageInput.addEventListener("change", (event) => {
    handleFile(event.target.files[0]);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    els.uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.uploadBox.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.uploadBox.classList.remove("dragging");
    });
  });

  els.uploadBox.addEventListener("drop", (event) => {
    handleFile(event.dataTransfer.files[0]);
  });

  [
    els.projectName,
    els.pageType,
    els.outputMode,
    els.assetPath,
    els.includeReference,
    els.addCmsHints,
  ].forEach((control) => {
    control.addEventListener("input", generateAll);
    control.addEventListener("change", generateAll);
  });

  els.generateBtn.addEventListener("click", generateAll);
  els.resetBtn.addEventListener("click", resetTool);

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab;
      els.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      updateCodeOutput();
    });
  });

  els.copyBtn.addEventListener("click", async () => {
    const text = state.output[state.activeTab] || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.textContent = "已复制";
      setTimeout(() => { els.copyBtn.textContent = "复制当前代码"; }, 1200);
    } catch (error) {
      els.codeOutput.focus();
      els.codeOutput.select();
      document.execCommand("copy");
    }
  });

  els.downloadBtn.addEventListener("click", () => {
    if (!state.output.html) return;
    const htmlName = els.outputMode.value === "cms" ? "cms-snippet.html" : "index.html";
    downloadFile(htmlName, state.output.html);
    downloadFile("style.css", state.output.css);
    downloadFile("app.js", state.output.js);
  });

  resetTool();
})();
