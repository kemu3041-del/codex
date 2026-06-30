const form = document.querySelector("#analysisForm");
const customerNameInput = document.querySelector("#customerName");
const websiteUrlInput = document.querySelector("#websiteUrl");
const industryInput = document.querySelector("#industry");
const renewalWindowInput = document.querySelector("#renewalWindow");
const serviceLevelInput = document.querySelector("#serviceLevel");
const generateBtn = document.querySelector("#generateBtn");
const sampleBtn = document.querySelector("#sampleBtn");
const resetBtn = document.querySelector("#resetBtn");
const printBtn = document.querySelector("#printBtn");
const formNote = document.querySelector("#formNote");
const emptyState = document.querySelector("#emptyState");
const reportView = document.querySelector("#reportView");
const agentItems = [...document.querySelectorAll("#agentFlow li")];

const reportDate = document.querySelector("#reportDate");
const reportTitle = document.querySelector("#reportTitle");
const reportSummary = document.querySelector("#reportSummary");
const renewalScore = document.querySelector("#renewalScore");
const renewalLevel = document.querySelector("#renewalLevel");
const kpiGrid = document.querySelector("#kpiGrid");
const trendChart = document.querySelector("#trendChart");
const trafficBadge = document.querySelector("#trafficBadge");
const trafficInsights = document.querySelector("#trafficInsights");
const channelBars = document.querySelector("#channelBars");
const seoBadge = document.querySelector("#seoBadge");
const seoInsights = document.querySelector("#seoInsights");
const healthRing = document.querySelector("#healthRing");
const securityList = document.querySelector("#securityList");
const activityStack = document.querySelector("#activityStack");
const assetMatrix = document.querySelector("#assetMatrix");
const complianceMatrix = document.querySelector("#complianceMatrix");
const adviceGrid = document.querySelector("#adviceGrid");
const integrationList = document.querySelector("#integrationList");
const detailDrawer = document.querySelector("#detailDrawer");
const detailKicker = document.querySelector("#detailKicker");
const detailTitle = document.querySelector("#detailTitle");
const detailBody = document.querySelector("#detailBody");

const stages = ["profile", "traffic", "seo", "security", "market", "advice"];
let currentReport = null;

const samples = {
  name: "上海云启智能科技有限公司",
  url: "https://www.yunqi-example.com",
  industry: "智能制造",
  renewalWindow: "60",
  serviceLevel: "官网 + SEO + 数据看板"
};

function hashText(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

function getTodayLabel() {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日生成 · 近一年客户经营分析`;
}

function resetFlow() {
  agentItems.forEach((item) => {
    item.classList.remove("active", "done");
  });
}

function setStage(stage) {
  const activeIndex = stages.indexOf(stage);
  agentItems.forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
    item.classList.toggle("done", index < activeIndex);
  });
}

function completeFlow() {
  agentItems.forEach((item) => {
    item.classList.remove("active");
    item.classList.add("done");
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildReportData({ name, url, industry, renewalWindow, serviceLevel }) {
  const seed = hashText(`${name}${url.hostname}${industry}${serviceLevel}`);
  const base = (mod, min) => (seed % mod) + min;
  const trafficBase = base(42000, 18000);
  const growth = base(31, 8);
  const searchScore = base(32, 52);
  const healthScore = base(24, 68);
  const marketScore = base(35, 46);
  const contentScore = base(30, 54);
  const score = clamp(Math.round((growth * 1.2 + searchScore + healthScore + marketScore + contentScore) / 4.7), 52, 96);
  const monthLabels = ["7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月", "6月"];
  const trend = monthLabels.map((label, index) => {
    const wave = Math.sin((index + seed % 6) / 2) * 9;
    const seasonal = index > 8 ? 14 : index > 4 ? 7 : 0;
    return {
      label,
      value: clamp(Math.round(42 + wave + seasonal + growth / 3 + (seed % (index + 9))), 28, 92)
    };
  });

  const channelData = [
    {
      name: "百度 SEO",
      value: clamp(searchScore + base(16, -6), 34, 95),
      source: "百度资源平台、site 指令抽样、品牌词 SERP 截面",
      reading: "主要判断中文搜索入口是否稳定，尤其是品牌词、产品词和解决方案词是否能回到官网。",
      risk: "若品牌词结果被 B2B 黄页、招聘页或旧新闻占位，续费时需要强调官网权威入口治理。"
    },
    {
      name: "Google",
      value: clamp(searchScore + base(20, -10), 26, 92),
      source: "Google Search Console、索引覆盖、国际品牌词抽样",
      reading: "用于判断客户是否具备英文搜索、出海展示和海外采购场景的基础可见度。",
      risk: "若 Google 可见度低，建议补充英文产品页、schema 标记和多语言站点地图。"
    },
    {
      name: "GEO 问答",
      value: clamp(base(38, 28), 24, 88),
      source: "AI 搜索问答模拟、FAQ 覆盖、结构化摘要可读性",
      reading: "关注官网内容能否被 AI 搜索理解、引用和归纳，尤其是服务范围、优势、案例和资质。",
      risk: "若官网缺少问答型内容，AI 结果容易引用第三方平台，品牌解释权会被削弱。"
    },
    {
      name: "品牌词",
      value: clamp(base(24, 58), 42, 96),
      source: "客户全称、简称、域名词、核心产品品牌词搜索结果",
      reading: "品牌词代表老客户维护价值：官网是否仍是客户线上可信入口。",
      risk: "品牌词强但内容旧，续费话术应从“保稳定”升级到“更新资产”。"
    },
    {
      name: "行业长尾词",
      value: clamp(base(32, 40), 28, 90),
      source: `${industry} 行业词、产品场景词、解决方案词、地域词组合`,
      reading: "长尾词决定新增业务机会，适合包装 SEO/GEO 内容增长服务。",
      risk: "长尾覆盖不足时，官网只能承接熟客访问，难以承担增量获客。"
    }
  ];

  const activities = [
    {
      id: "wechat",
      name: "公众号更新",
      value: base(16, 3),
      unit: "篇",
      desc: "可从公众号文章频率、关键词和产品场景中提炼官网专题内容。",
      source: "公众号历史文章、标题关键词、阅读主题、菜单入口",
      breakdown: ["产品/方案类内容", "客户案例类内容", "活动通知类内容", "品牌观点类内容"],
      recommendation: "把高价值文章同步为官网新闻、案例或 FAQ，避免内容只沉淀在微信生态内。"
    },
    {
      id: "news",
      name: "新闻稿 / 媒体露出",
      value: base(9, 1),
      unit: "条",
      desc: "适合补充官网新闻中心、品牌背书页和搜索结果素材。",
      source: "新闻搜索、媒体稿、行业协会报道、客户品牌词结果页",
      breakdown: ["品牌报道", "产品发布", "行业奖项", "合作签约"],
      recommendation: "把第三方媒体露出汇总为官网背书区，提升续费沟通中的品牌可信资产。"
    },
    {
      id: "campaign",
      name: "专题活动",
      value: base(6, 1),
      unit: "个",
      desc: "建议沉淀为活动专题页，形成可复用的获客入口。",
      source: "官网专题、展会活动页、报名页、线下会议宣传页",
      breakdown: ["展会专题", "新品活动", "招商活动", "客户培训"],
      recommendation: "将一次性活动转成可归档专题，保留活动成果、图文、报名线索和后续转化入口。"
    },
    {
      id: "esg",
      name: "ESG / 责任信息",
      value: base(5, 0),
      unit: "项",
      desc: "若客户重视招投标或出海，ESG 内容可提升可信度。",
      source: "官网社会责任栏目、ESG 报告、公益动态、绿色制造相关信息",
      breakdown: ["环境责任", "社会责任", "治理合规", "员工与安全"],
      recommendation: "如果客户面向大企业采购或海外客户，建议独立建设 ESG/资质能力页面。"
    }
  ];

  const assets = [
    {
      id: "case",
      name: "案例与解决方案",
      score: clamp(contentScore + 8, 0, 99),
      desc: `${industry}客户需要把项目成果、行业场景和交付能力前置展示。`,
      criteria: ["行业覆盖度", "客户痛点表达", "交付结果证明", "可转化 CTA"],
      source: "官网案例栏目、产品详情页、销售资料、公众号案例文章",
      nextStep: "补齐行业案例模板，将客户背景、问题、方案、成果和相关产品串成可复用模块。"
    },
    {
      id: "newsReuse",
      name: "新闻 / 公众号复用",
      score: clamp(contentScore + base(18, -6), 0, 99),
      desc: "将外部动态同步为官网栏目，可提升客户对持续维护价值的感知。",
      criteria: ["更新频率", "栏目同步率", "搜索可收录性", "品牌背书强度"],
      source: "公众号、新闻稿、媒体报道、官网动态栏目更新时间",
      nextStep: "建立月度内容同步机制，把外部发布内容转成官网可收录资产。"
    },
    {
      id: "faq",
      name: "搜索问答素材",
      score: clamp(searchScore + base(16, -8), 0, 99),
      desc: "围绕品牌词、产品词、服务词整理 FAQ，支撑 GEO 和搜索摘要。",
      criteria: ["问题覆盖", "答案结构化", "行业术语解释", "Schema 适配"],
      source: "客服问答、销售常见问题、搜索下拉词、AI 问答模拟",
      nextStep: "新增 FAQ 与术语解释栏目，把服务优势写成 AI 和搜索都容易读取的问答结构。"
    }
  ];

  const serviceOpportunities = [
    {
      id: "renewal-review",
      tag: "续费主张",
      title: "年度官网经营复盘报告",
      priority: "P0",
      desc: `结合近一年访问、搜索收录和安全健康数据，向客户说明官网仍在承担 ${industry} 业务的品牌可信、线索承接和招投标背书。`,
      source: "访问趋势、搜索可见度、站点健康度、公开内容资产",
      deliverable: "续费复盘 PDF、管理层摘要、季度复盘会议、风险清单",
      value: "把续费从“维护费”转换为“线上经营基础设施续约”。"
    },
    {
      id: "seo-geo-growth",
      tag: "增购服务",
      title: "SEO/GEO 内容增长包",
      priority: "P0",
      desc: "按月输出新闻、案例、FAQ、专题页和搜索词优化，让官网从静态展示升级为持续增长资产。",
      source: "关键词缺口、GEO 问答覆盖、公众号内容复用、行业长尾词机会",
      deliverable: "关键词库、FAQ 页面、行业专题、结构化数据、月度收录报告",
      value: "帮助客户把已有内容转成可被搜索和 AI 问答捕捉的官网资产。"
    },
    {
      id: "security-ops",
      tag: "风险提醒",
      title: "站点安全与稳定运维包",
      priority: "P1",
      desc: `续费窗口为 ${renewalWindow} 天内，建议先发送体检报告，再安排复盘会，降低客户只按价格判断的概率。`,
      source: "HTTPS、证书、可用性、备份、页面性能、异常访问记录",
      deliverable: "月度巡检、证书提醒、备份策略、可用性告警、性能优化建议",
      value: "将客户难以感知的维护工作可视化，提升续费合理性。"
    },
    {
      id: "campaign-archive",
      tag: "内容资产",
      title: "活动专题与案例资产库",
      priority: "P1",
      desc: "把公众号、新闻、活动、展会和案例沉淀为官网栏目，让客户每次营销动作都能形成长期可复用资产。",
      source: "公众号更新、新闻媒体、活动专题、ESG 动态、销售案例素材",
      deliverable: "活动专题模板、案例模板、新闻同步规范、内容归档后台字段",
      value: "让官网承接客户全网动作，减少内容散落在第三方平台后的浪费。"
    },
    {
      id: "data-dashboard",
      tag: "数据产品",
      title: "客户线上经营数据看板",
      priority: "P2",
      desc: "把访问、搜索、内容、安全和营销动作做成客户月度看板，增强后续续费和增购的证据链。",
      source: "GA4/百度统计、Search Console、百度资源平台、爬虫、运维监控",
      deliverable: "客户看板、月报推送、异常提醒、销售跟进摘要",
      value: "把一次性报告产品化为持续服务，形成下一年度续费抓手。"
    }
  ];

  const integrations = [
    {
      id: "webAnalytics",
      title: "网站数据",
      desc: "GA4、百度统计、服务器日志、SaaS 站点访问事件。",
      fields: ["PV/UV", "来源渠道", "页面停留", "转化事件", "移动端占比"],
      method: "通过授权 API 或站点统计代码读取，按月汇总成趋势和异常说明。",
      output: "访问趋势、来源结构、热门页面、低效页面、续费价值证据。"
    },
    {
      id: "searchIndex",
      title: "搜索收录",
      desc: "百度资源平台、Google Search Console、站点地图和关键词排名。",
      fields: ["索引覆盖", "展现/点击", "关键词排名", "站点地图状态", "GEO 覆盖"],
      method: "授权平台数据 + 定期 SERP 抽样 + AI 问答模拟，形成搜索可见度评分。",
      output: "收录健康、品牌词防守、长尾词机会、FAQ/GEO 建议。"
    },
    {
      id: "publicContent",
      title: "公开内容",
      desc: "官网新闻、公众号、媒体稿、活动专题、招聘和 ESG 信息。",
      fields: ["发布时间", "主题标签", "内容类型", "引用平台", "可复用页面"],
      method: "通过公开页面抓取和人工校验，识别客户一年内的营销动作。",
      output: "内容资产矩阵、活动归档建议、官网栏目更新计划。"
    },
    {
      id: "opsSecurity",
      title: "运维安全",
      desc: "HTTPS 证书、可用性监控、漏洞扫描、备份和页面性能。",
      fields: ["证书到期", "可用率", "响应时间", "备份状态", "安全风险"],
      method: "结合巡检脚本、监控接口和人工复核，生成风险等级和处理建议。",
      output: "站点健康分、风险清单、续费前体检报告。"
    }
  ];

  const nameSignals = [
    { test: /国|央|集团|控股|能源|电力|通信|铁路|交通|城投|水务|燃气/.test(name), label: "疑似国央企/大型集团客户", type: "国央企 / 大型集团", risk: "高" },
    { test: /医院|大学|学院|学校|研究院|中心|协会|政府|局|委/.test(name), label: "疑似公共机构或事业单位", type: "公共机构 / 事业单位", risk: "高" },
    { test: /进出口|国际|海外|跨境|贸易/.test(name) || !url.hostname.endsWith(".cn"), label: "存在海外展示或跨境业务信号", type: "出海 / 跨境经营主体", risk: "中高" }
  ];
  const matchedSignal = nameSignals.find((item) => item.test);
  const subjectType = matchedSignal ? matchedSignal.type : `${industry} 民营 / 商业客户`;
  const complianceLevel = matchedSignal ? matchedSignal.risk : industry === "医疗健康" || industry === "教育培训" ? "中高" : "中";
  const isPublicOrState = /国央企|公共机构|事业单位|大型集团/.test(subjectType);
  const isOverseas = /出海|跨境/.test(subjectType) || /\.(com|net|org|io|co)$/i.test(url.hostname);
  const complianceProfile = {
    type: subjectType,
    level: complianceLevel,
    summary: isPublicOrState
      ? "该客户可能更关注信创适配、国产化部署、等保测评、数据安全和供应商合规材料。续费沟通应避免只谈页面维护，需要补充安全合规与国产化适配价值。"
      : isOverseas
        ? "该客户存在海外展示或跨境业务信号，官网可能需要关注 Cookie 告知、隐私政策、GDPR/CCPA 适配、多语言内容与海外访问性能。"
        : "该客户以商业经营展示为主，合规重点通常集中在隐私政策、表单授权、备案、SSL、安全巡检和数据留存说明。",
    signals: [
      matchedSignal ? matchedSignal.label : `名称与行业显示为 ${industry} 商业客户`,
      `官网域名：${url.hostname}`,
      `已有服务：${serviceLevel}`,
      `续费窗口：${renewalWindow} 天内`
    ],
    requirements: [
      {
        name: "国产化 / 信创适配",
        score: isPublicOrState ? clamp(base(24, 68), 0, 99) : clamp(base(28, 34), 0, 99),
        applies: isPublicOrState ? "重点关注" : "按需评估",
        desc: "国央企、政企、公共机构客户更可能关注国产服务器、国产数据库、中间件、浏览器兼容和私有化部署材料。"
      },
      {
        name: "数据安全 / 等保",
        score: isPublicOrState || industry === "医疗健康" ? clamp(base(22, 70), 0, 99) : clamp(base(26, 45), 0, 99),
        applies: isPublicOrState || industry === "医疗健康" ? "重点关注" : "基础关注",
        desc: "涉及用户表单、会员、预约、医疗教育信息或业务系统对接时，需要明确数据采集、存储、备份、权限和日志策略。"
      },
      {
        name: "GDPR / 海外隐私",
        score: isOverseas ? clamp(base(20, 72), 0, 99) : clamp(base(24, 32), 0, 99),
        applies: isOverseas ? "重点关注" : "低频触发",
        desc: "海外站点、多语言站点或面向欧盟访客时，应关注 Cookie 同意、隐私政策、数据主体权利和跨境传输说明。"
      },
      {
        name: "备案 / 内容合规",
        score: clamp(base(24, 55), 0, 99),
        applies: "基础必查",
        desc: "国内官网需关注 ICP 备案、公安备案、版权信息、地图/资质/宣传用语、行业监管禁用表述。"
      }
    ],
    actions: [
      "续费报告中增加“合规影响判断”页，作为销售复盘和客户内部审批材料。",
      "若为国央企或公共机构，建议提供信创兼容清单、私有化部署说明和安全巡检制度。",
      "若存在海外站点，建议补 Cookie 告知、隐私政策、多语言 SEO 与海外访问速度优化。",
      "把合规巡检做成年度服务包，而不是临时问题修补。"
    ]
  };

  return {
    name,
    url,
    industry,
    renewalWindow,
    serviceLevel,
    score,
    scoreLabel: score >= 82 ? "高把握续费" : score >= 68 ? "需要价值复盘" : "建议重点挽留",
    trafficBase,
    growth,
    searchScore,
    healthScore,
    marketScore,
    contentScore,
    trend,
    channelData,
    activities,
    assets,
    complianceProfile,
    serviceOpportunities,
    integrations,
    security: [
      healthScore > 78 ? "HTTPS、证书与基础可用性表现良好，可作为稳定运维成果展示。" : "建议在续费前补充 HTTPS、证书过期、备份与可用性巡检。",
      "建议加入季度安全扫描、异常访问提醒和页面篡改监测。",
      "移动端核心页面仍需关注首屏速度、表单可达性和图片体积。"
    ]
  };
}

function renderKpis(data) {
  const kpis = [
    { label: "近一年访问量", value: formatNumber(data.trafficBase), tip: `同比预估 +${data.growth}%` },
    { label: "搜索可见度", value: `${data.searchScore}/100`, tip: "百度 / Google / GEO 综合" },
    { label: "站点健康度", value: `${data.healthScore}/100`, tip: "安全、可用性、性能" },
    { label: "服务机会", value: `${data.serviceOpportunities.length} 项`, tip: "续费 + 增购建议", detail: "opportunities" }
  ];

  kpiGrid.innerHTML = kpis
    .map(
      (item) => {
        const tag = item.detail ? "button" : "div";
        const attrs = item.detail ? ` type="button" data-detail="${item.detail}"` : "";
        return `
        <${tag} class="kpi-card ${item.detail ? "clickable-card" : ""}"${attrs}>
          <small>${item.label}</small>
          <strong>${item.value}</strong>
          <span>${item.tip}</span>
        </${tag}>
      `;
      }
    )
    .join("");
}

function renderTrend(data) {
  trendChart.innerHTML = data.trend
    .map(
      (item) => `
        <div class="bar" style="height:${item.value}%" data-label="${item.label}" title="${item.label}: ${item.value}"></div>
      `
    )
    .join("");
  trafficBadge.textContent = data.growth >= 24 ? "增长明显" : "稳定运营";
  trafficInsights.innerHTML = [
    {
      title: "访问价值复盘",
      desc: `近一年官网访问量约 ${formatNumber(data.trafficBase)}，趋势呈 ${data.growth >= 20 ? "持续增长" : "稳中有升"}，适合在续费沟通中强调官网仍在承担品牌展示、线索承接和老客户信任背书。`
    },
    {
      title: "内容运营切入",
      desc: `建议把 ${data.industry} 的案例、产品应用、活动专题和客户证言拆成可持续更新栏目，让客户感知到网站不是一次性交付物。`
    }
  ]
    .map((item) => `<div class="insight-item"><div><strong>${item.title}</strong><p>${item.desc}</p></div></div>`)
    .join("");
}

function renderSeo(data) {
  channelBars.innerHTML = data.channelData
    .map(
      (item) => `
        <button class="channel-row clickable-row" type="button" data-detail="seo:${item.name}">
          <strong>${item.name}</strong>
          <div class="channel-track"><div class="channel-fill" style="width:${item.value}%"></div></div>
          <span>${item.value}</span>
        </button>
      `
    )
    .join("");

  seoBadge.textContent = data.searchScore >= 74 ? "可见度较好" : "需补强";
  seoInsights.innerHTML = [
    {
      title: "搜索续费理由",
      desc: `当前搜索可见度为 ${data.searchScore}/100。该分值不是单看排名，而是综合收录覆盖、品牌词入口稳定性、行业长尾词机会、Google/百度双端可见度和 GEO 问答可引用性。`
    },
    {
      title: "分析解读",
      desc: `如果官网只在品牌词下可见，续费价值应强调“权威入口与风险防守”；如果行业长尾词和 GEO 得分偏低，续费后可顺势转入内容增长包，用案例、FAQ 和专题页提升新增流量。`
    },
    {
      title: "来源与动作",
      desc: "点击上方任一搜索渠道，可查看对应数据来源、判断口径、风险解释和建议落地动作。"
    }
  ]
    .map((item) => `<div class="insight-item"><div><strong>${item.title}</strong><p>${item.desc}</p></div></div>`)
    .join("");
}

function renderHealthAndMarket(data) {
  healthRing.style.setProperty("--score", `${data.healthScore}%`);
  healthRing.querySelector("span").textContent = data.healthScore;
  securityList.innerHTML = data.security.map((item) => `<li>${item}</li>`).join("");

  activityStack.innerHTML = data.activities
    .map(
      (item) => `
        <button class="activity-item clickable-row" type="button" data-detail="activity:${item.id}">
          <div>
            <strong>${item.name}</strong>
            <p>${item.desc} 当前识别 ${item.value}${item.unit}，点击查看来源拆分与复用建议。</p>
          </div>
          <span>${item.value}${item.unit}</span>
        </button>
      `
    )
    .join("");

  assetMatrix.innerHTML = data.assets
    .map(
      (item) => `
        <button class="asset-item clickable-row" type="button" data-detail="asset:${item.id}">
          <div class="asset-score">${item.score}</div>
          <div>
            <strong>${item.name}</strong>
            <p>${item.desc} 点击查看评分维度、证据来源和下一步内容规划。</p>
          </div>
        </button>
      `
    )
    .join("");

  complianceMatrix.innerHTML = `
    <button class="compliance-item clickable-card" type="button" data-detail="compliance">
      <small>主体判断</small>
      <strong>${data.complianceProfile.type}</strong>
      <p>${data.complianceProfile.summary}</p>
    </button>
    ${data.complianceProfile.requirements
      .slice(0, 3)
      .map(
        (item) => `
          <button class="compliance-item mini clickable-row" type="button" data-detail="compliance:${item.name}">
            <span>${item.score}</span>
            <div>
              <strong>${item.name}</strong>
              <p>${item.applies}</p>
            </div>
          </button>
        `
      )
      .join("")}
  `;
}

function renderAdvice(data) {
  adviceGrid.innerHTML = data.serviceOpportunities
    .map(
      (item) => `
        <button class="advice-item clickable-card" type="button" data-detail="opportunity:${item.id}">
          <em>${item.tag} · ${item.priority}</em>
          <strong>${item.title}</strong>
          <p>${item.desc}</p>
        </button>
      `
    )
    .join("");
}

function renderIntegrations(data) {
  integrationList.innerHTML = data.integrations
    .map(
      (item) => `
        <button class="integration-item clickable-card" type="button" data-detail="integration:${item.id}">
          <strong>${item.title}</strong>
          <p>${item.desc}</p>
        </button>
      `
    )
    .join("");
}

function renderReport(data) {
  currentReport = data;
  reportDate.textContent = getTodayLabel();
  reportTitle.textContent = `${data.name} · 续费分析报告`;
  reportSummary.textContent = `基于 ${data.url.hostname} 的演示分析，当前客户属于“${data.scoreLabel}”类型。建议围绕网站稳定运营、搜索可见度、公开内容资产和 ${data.industry} 行业增长机会组织续费沟通。`;
  renewalScore.textContent = data.score;
  renewalLevel.textContent = data.scoreLabel;
  renderKpis(data);
  renderTrend(data);
  renderSeo(data);
  renderHealthAndMarket(data);
  renderAdvice(data);
  renderIntegrations(data);
  emptyState.classList.add("hidden");
  reportView.classList.remove("hidden");
  printBtn.disabled = false;
}

function listMarkup(items) {
  return `<ul class="detail-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function metricMarkup(items) {
  return `<div class="detail-metrics">${items.map((item) => `<div><small>${item.label}</small><strong>${item.value}</strong><span>${item.desc}</span></div>`).join("")}</div>`;
}

function sourceFlowMarkup(items) {
  return `<div class="source-flow">${items.map((item, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${item.title}</strong><p>${item.desc}</p></div>`).join("")}</div>`;
}

function openDetail(type) {
  if (!currentReport || !type) return;

  const [kind, id] = type.split(":");
  let title = "分析详情";
  let kicker = "Analysis source";
  let body = "";

  if (kind === "seo") {
    const channel = currentReport.channelData.find((item) => item.name === id);
    if (!channel) return;
    title = `${channel.name} · 搜索可见度解读`;
    kicker = "Search visibility source";
    body = `
      ${metricMarkup([
        { label: "渠道分值", value: channel.value, desc: "基于收录、排名、入口稳定性和内容可读性综合模拟。" },
        { label: "总体可见度", value: currentReport.searchScore, desc: "百度 / Google / GEO / 品牌词 / 长尾词加权结果。" },
        { label: "建议优先级", value: channel.value < 60 ? "P0" : "P1", desc: channel.value < 60 ? "续费后优先补齐。" : "保持监测并继续扩展。" }
      ])}
      <section class="detail-section"><h3>数据来源</h3><p>${channel.source}</p></section>
      <section class="detail-section"><h3>分析解读</h3><p>${channel.reading}</p><p>${channel.risk}</p></section>
      ${sourceFlowMarkup([
        { title: "抓取/授权数据", desc: "读取搜索平台、站点地图、品牌词抽样或 AI 问答模拟结果。" },
        { title: "识别入口质量", desc: "判断官网是否承接品牌词、产品词、行业词和问答结果。" },
        { title: "形成续费建议", desc: "将稳定入口、缺口词、GEO 内容和结构化 FAQ 转成服务包。" }
      ])}
    `;
  }

  if (kind === "activity") {
    const activity = currentReport.activities.find((item) => item.id === id);
    if (!activity) return;
    title = `${activity.name} · 全网营销动作来源`;
    kicker = "Marketing activity evidence";
    body = `
      ${metricMarkup([
        { label: "识别数量", value: `${activity.value}${activity.unit}`, desc: "用于衡量客户近一年公开营销活跃度。" },
        { label: "复用价值", value: activity.value >= 6 ? "高" : "中", desc: "数量越高，越适合沉淀为官网栏目和专题。" },
        { label: "建议动作", value: activity.value === 0 ? "补素材" : "建归档", desc: activity.value === 0 ? "先补齐基础内容。" : "把外部动作回流到官网。" }
      ])}
      <section class="detail-section"><h3>量化来源</h3><p>${activity.source}</p></section>
      <section class="detail-section"><h3>数量拆分口径</h3>${listMarkup(activity.breakdown.map((item, index) => `${item}：模拟识别 ${Math.max(0, Math.round(activity.value / activity.breakdown.length) + (index % 2))}${activity.unit}`))}</section>
      <section class="detail-section"><h3>分析建议</h3><p>${activity.recommendation}</p></section>
    `;
  }

  if (kind === "asset") {
    const asset = currentReport.assets.find((item) => item.id === id);
    if (!asset) return;
    title = `${asset.name} · 内容资产评分说明`;
    kicker = "Content asset scoring";
    body = `
      ${metricMarkup([
        { label: "资产分值", value: asset.score, desc: "分值越高，越适合作为续费价值证明和增购切入点。" },
        { label: "成熟度", value: asset.score >= 75 ? "可放大" : "需补强", desc: asset.score >= 75 ? "建议包装服务成果。" : "建议先补栏目结构。" },
        { label: "关联模块", value: "SEO/GEO", desc: "内容资产会直接影响搜索收录和 AI 问答可见度。" }
      ])}
      <section class="detail-section"><h3>评分维度</h3>${listMarkup(asset.criteria)}</section>
      <section class="detail-section"><h3>证据来源</h3><p>${asset.source}</p></section>
      <section class="detail-section"><h3>下一步规划</h3><p>${asset.nextStep}</p></section>
    `;
  }

  if (kind === "opportunities") {
    title = "服务机会 · 续费与增购建议总览";
    kicker = "Service opportunity map";
    body = `
      ${metricMarkup([
        { label: "机会数量", value: `${currentReport.serviceOpportunities.length}项`, desc: "覆盖续费、防风险、增长、内容资产和数据产品。" },
        { label: "优先级", value: "P0-P2", desc: "按续费影响、落地成本和客户感知排序。" },
        { label: "跟进窗口", value: `${currentReport.renewalWindow}天`, desc: "建议在续费到期前完成报告发送与复盘会。" }
      ])}
      <section class="detail-section"><h3>机会列表</h3>${listMarkup(currentReport.serviceOpportunities.map((item) => `${item.priority} · ${item.title}：${item.value}`))}</section>
    `;
  }

  if (kind === "security") {
    title = "网站安全与健康 · 巡检详情";
    kicker = "Security health evidence";
    body = `
      ${metricMarkup([
        { label: "站点健康度", value: currentReport.healthScore, desc: "由 HTTPS、可用性、备份、性能和风险项综合模拟。" },
        { label: "风险级别", value: currentReport.healthScore >= 82 ? "低" : currentReport.healthScore >= 72 ? "中" : "中高", desc: "用于判断续费前是否需要先做体检修复。" },
        { label: "续费价值", value: "可视化", desc: "把日常维护、安全巡检和稳定性保障转成客户能理解的报告。" }
      ])}
      <section class="detail-section"><h3>巡检来源</h3>${listMarkup([
        "HTTPS 证书状态、到期时间、TLS 基础配置。",
        "首页、核心栏目、表单页的可用性和响应时间。",
        "备份策略、恢复演练记录、后台账号权限和日志留存。",
        "移动端首屏速度、图片体积、表单可达性和异常脚本。"
      ])}</section>
      <section class="detail-section"><h3>当前解读</h3>${listMarkup(currentReport.security)}</section>
      ${sourceFlowMarkup([
        { title: "自动巡检", desc: "定期检测证书、可用性、响应时间、页面状态码和关键资源加载。" },
        { title: "人工复核", desc: "对后台权限、备份策略、表单链路、异常内容和移动端体验做复核。" },
        { title: "续费转化", desc: "将隐性维护工作转成安全体检报告、风险清单和年度运维服务包。" }
      ])}
    `;
  }

  if (kind === "compliance") {
    const profile = currentReport.complianceProfile;
    const requirement = id ? profile.requirements.find((item) => item.name === id) : null;
    title = requirement ? `${requirement.name} · 合规影响说明` : "客户主体与合规影响 · 判断详情";
    kicker = "Subject and compliance analysis";
    body = requirement
      ? `
        ${metricMarkup([
          { label: "影响分", value: requirement.score, desc: "表示该合规项对续费与后续服务的影响程度。" },
          { label: "适用判断", value: requirement.applies, desc: "由客户名称、行业、域名和服务范围模拟推断。" },
          { label: "主体类型", value: profile.type, desc: "用于判断是否需要引入专项合规服务。" }
        ])}
        <section class="detail-section"><h3>合规说明</h3><p>${requirement.desc}</p></section>
        <section class="detail-section"><h3>建议动作</h3>${listMarkup(profile.actions)}</section>
      `
      : `
        ${metricMarkup([
          { label: "主体类型", value: profile.type, desc: "基于客户名称、行业和域名信号模拟判断。" },
          { label: "合规影响", value: profile.level, desc: "影响越高，越适合包装为续费前专项体检。" },
          { label: "服务切入", value: "合规巡检", desc: "可延伸为信创、隐私、安全和内容合规服务。" }
        ])}
        <section class="detail-section"><h3>判断信号</h3>${listMarkup(profile.signals)}</section>
        <section class="detail-section"><h3>合规影响说明</h3><p>${profile.summary}</p></section>
        <section class="detail-section"><h3>合规项评分</h3>${listMarkup(profile.requirements.map((item) => `${item.name}：${item.score}/100，${item.applies}。${item.desc}`))}</section>
        ${sourceFlowMarkup([
          { title: "主体识别", desc: "根据客户全称、行业、域名、服务范围识别国央企、公共机构、出海业务或普通商业主体。" },
          { title: "政策映射", desc: "将主体类型映射到信创、等保、数据安全、GDPR、备案和内容合规要求。" },
          { title: "服务建议", desc: "输出续费前合规体检、国产化适配、隐私政策完善和安全运维服务机会。" }
        ])}
      `;
  }

  if (kind === "opportunity") {
    const opportunity = currentReport.serviceOpportunities.find((item) => item.id === id);
    if (!opportunity) return;
    title = `${opportunity.title} · 服务拆解`;
    kicker = "Renewal and upsell package";
    body = `
      ${metricMarkup([
        { label: "优先级", value: opportunity.priority, desc: "用于销售跟进排序。" },
        { label: "服务类型", value: opportunity.tag, desc: "对应续费主张或增购服务包。" },
        { label: "客户价值", value: "明确", desc: "可直接转化为沟通话术和交付项。" }
      ])}
      <section class="detail-section"><h3>提出依据</h3><p>${opportunity.source}</p></section>
      <section class="detail-section"><h3>建议交付物</h3><p>${opportunity.deliverable}</p></section>
      <section class="detail-section"><h3>续费沟通价值</h3><p>${opportunity.value}</p></section>
    `;
  }

  if (kind === "integration") {
    const integration = currentReport.integrations.find((item) => item.id === id);
    if (!integration) return;
    title = `${integration.title} · 真实系统落地说明`;
    kicker = "Productized data source";
    body = `
      <section class="detail-section"><h3>接入字段</h3>${listMarkup(integration.fields)}</section>
      <section class="detail-section"><h3>采集方式</h3><p>${integration.method}</p></section>
      <section class="detail-section"><h3>产品化输出</h3><p>${integration.output}</p></section>
      ${sourceFlowMarkup([
        { title: "数据采集", desc: "通过授权 API、埋点、爬虫或监控任务获取原始数据。" },
        { title: "口径清洗", desc: "按客户、域名、月份、栏目和渠道统一口径。" },
        { title: "报告生成", desc: "输出续费报告、销售摘要、风险提醒和服务机会。" }
      ])}
    `;
  }

  detailKicker.textContent = kicker;
  detailTitle.textContent = title;
  detailBody.innerHTML = body;
  detailDrawer.classList.remove("hidden");
}

function closeDetail() {
  detailDrawer.classList.add("hidden");
}

async function runAnalysis(values) {
  generateBtn.disabled = true;
  printBtn.disabled = true;
  generateBtn.textContent = "Agent 分析中...";
  formNote.textContent = "正在模拟客户画像、访问数据、搜索收录、安全健康和全网营销分析。";
  resetFlow();

  for (const stage of stages) {
    setStage(stage);
    await wait(360);
  }

  const data = buildReportData(values);
  renderReport(data);
  completeFlow();
  generateBtn.disabled = false;
  generateBtn.textContent = "重新生成续费分析报告";
  formNote.textContent = "报告已生成。演示数据为本地模拟，真实产品需接入统计、搜索、爬虫和安全检测数据源。";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  let url;
  try {
    url = normalizeUrl(websiteUrlInput.value);
  } catch (error) {
    websiteUrlInput.focus();
    formNote.textContent = "请输入有效网址，例如 https://www.example.com";
    return;
  }

  const name = customerNameInput.value.trim();
  if (!name) {
    customerNameInput.focus();
    formNote.textContent = "请先输入客户名称全称。";
    return;
  }

  runAnalysis({
    name,
    url,
    industry: industryInput.value,
    renewalWindow: renewalWindowInput.value,
    serviceLevel: serviceLevelInput.value
  });
});

sampleBtn.addEventListener("click", () => {
  customerNameInput.value = samples.name;
  websiteUrlInput.value = samples.url;
  industryInput.value = samples.industry;
  renewalWindowInput.value = samples.renewalWindow;
  serviceLevelInput.value = samples.serviceLevel;
  formNote.textContent = "已填充示例客户，可以直接生成报告。";
});

resetBtn.addEventListener("click", () => {
  form.reset();
  resetFlow();
  currentReport = null;
  closeDetail();
  emptyState.classList.remove("hidden");
  reportView.classList.add("hidden");
  printBtn.disabled = true;
  generateBtn.textContent = "生成续费分析报告";
  formNote.textContent = "演示版在浏览器本地运行，不会真实访问客户网站。";
});

printBtn.addEventListener("click", () => {
  window.print();
});

document.addEventListener("click", (event) => {
  const detailTrigger = event.target.closest("[data-detail]");
  if (detailTrigger) {
    openDetail(detailTrigger.dataset.detail);
    return;
  }

  if (event.target.closest("[data-close-detail]")) {
    closeDetail();
  }
});

document.addEventListener("keydown", (event) => {
  const detailTrigger = event.target.closest("[data-detail]");
  if (detailTrigger && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openDetail(detailTrigger.dataset.detail);
    return;
  }

  if (event.key === "Escape") {
    closeDetail();
  }
});
