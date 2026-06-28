const palette = {
  ink: "#171716",
  red: "#b52d24",
  teal: "#136f68",
  blue: "#325d78",
  gold: "#c3942f",
  paper: "#f4f1e8",
  muted: "#686157",
};

const charts = [];
let siteData = null;
let activeMediaRank = "central";
let activeComment = "positive";

const $ = (selector) => document.querySelector(selector);

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function shortDate(value) {
  const parts = String(value).split("-");
  return parts.length === 3 ? `${parts[1]}.${parts[2]}` : value;
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function makeChart(id, option) {
  const element = document.getElementById(id);
  if (!element || !window.echarts) return null;
  const chart = echarts.init(element, null, { renderer: "canvas" });
  chart.setOption(option);
  charts.push(chart);
  return chart;
}

function axisBase() {
  return {
    axisLine: { lineStyle: { color: "rgba(23,23,22,.38)" } },
    axisTick: { show: false },
    axisLabel: { color: palette.muted, fontSize: 11 },
    splitLine: { lineStyle: { color: "rgba(23,23,22,.09)" } },
  };
}

function renderMeta(data) {
  const meta = data.meta;
  document.title = meta.title;
  const titleNode = $("#reportTitle");
  if (titleNode) titleNode.innerHTML = "村支书耳环<br />事件舆情<br />分析报告";
  setText("#reportSubtitle", meta.subtitle);
  setText("#reportPeriod", meta.period);
  setText("#reportSource", meta.docSource);
  setText("#metricTotal", formatNumber(meta.total));
  setText("#metricPeak", shortDate(meta.peakDate));
  setText("#metricHot", `${meta.hotSearchCount}`);
  setText("#metricComments", formatNumber(meta.commentTotal));
}

function renderOverview(data) {
  $("#overviewList").innerHTML = data.overview
    .map(
      (item, index) => `
        <div class="overview-item">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <p>${item}</p>
        </div>
      `,
    )
    .join("");

  $("#insightGrid").innerHTML = data.insights
    .map(
      (item) => `
        <article class="insight-card">
          <span>${item.k}</span>
          <strong>${item.v}</strong>
          <p>${item.d}</p>
        </article>
      `,
    )
    .join("");
}

function renderTimeline(data) {
  $("#timelineList").innerHTML = data.timeline
    .map(
      (item) => `
        <article class="timeline-item">
          <time class="timeline-time">${item.time}</time>
          <div class="timeline-card">
            <p>${item.title}</p>
            ${item.note ? `<small>${item.note}</small>` : ""}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderHotSearch(data) {
  $("#hotSearchList").innerHTML = data.hotSearch
    .map(
      (item) => `
        <article class="hot-item" title="${item.title}">
          <div class="hot-platform">${item.platform}</div>
          <div class="hot-title">
            <strong>${item.title}</strong>
            <span>${item.time} / ${item.duration} / 热度 ${item.heat}</span>
          </div>
          <div class="hot-rank">#${item.rank}</div>
        </article>
      `,
    )
    .join("");
}

function renderKeywords(data) {
  const max = Math.max(...data.keywords.map((item) => item.value));
  $("#keywordBoard").innerHTML = data.keywords
    .map((item) => {
      const size = 14 + (item.value / max) * 17;
      return `
        <span class="keyword-chip" style="font-size:${size.toFixed(1)}px">
          ${item.name}<small>${formatNumber(item.value)}</small>
        </span>
      `;
    })
    .join("");
}

function renderMediaSummary(data) {
  $("#mediaSummary").innerHTML = data.mediaSummary
    .map(
      (item) => `
        <article class="media-summary-item">
          <span>${item.label}</span>
          <strong>${item.orgs}</strong>
          <em>${item.posts}</em>
        </article>
      `,
    )
    .join("");
}

function renderMediaRank(data) {
  const rows = data.mediaRanks[activeMediaRank] || [];
  $("#mediaRankList").innerHTML = rows
    .map(
      (item) => `
        <article class="rank-item">
          <span class="rank-no">${item.rank}</span>
          <div class="rank-name">
            <strong>${item.name}</strong>
            <span>${item.org}</span>
          </div>
          <span class="rank-posts">${formatNumber(item.posts)}</span>
        </article>
      `,
    )
    .join("");
}

function renderSpread(data) {
  setText("#spreadLayer", data.propagation.maxLayer);
  setText("#spreadReposts", formatNumber(data.propagation.reposts));
  setText("#spreadReach", formatNumber(data.propagation.reach));

  $("#influencerList").innerHTML = data.influencers
    .map(
      (item) => `
        <div class="influencer-row">
          <b>${item.rank}</b>
          <div>
            <strong title="${item.name}">${item.name}</strong>
            <span>${formatNumber(item.fans)} 粉丝 / 第 ${item.layer} 层 / ${item.posts} 条</span>
          </div>
          <em>${formatNumber(item.reposts)}</em>
        </div>
      `,
    )
    .join("");
}

function renderComments(data) {
  const rows = data.comments[activeComment] || [];
  $("#commentList").innerHTML = rows
    .map(
      (item) => `
        <article class="comment-item">
          <p>${item.text}</p>
          <span>${item.time} / 触达 ${item.reach}</span>
        </article>
      `,
    )
    .join("");
}

function renderConclusion(data) {
  $("#conclusionList").innerHTML = data.conclusion
    .map(
      (item, index) => `
        <article class="conclusion-item">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <p>${item}</p>
        </article>
      `,
    )
    .join("");
}

function renderCharts(data) {
  const dates = data.trend.dates.map(shortDate);
  makeChart("trendChart", {
    color: [palette.red],
    tooltip: { trigger: "axis" },
    grid: { left: 48, right: 20, top: 28, bottom: 42 },
    xAxis: { type: "category", data: dates, boundaryGap: false, ...axisBase() },
    yAxis: { type: "value", ...axisBase() },
    series: [
      {
        name: "声量",
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 4 },
        areaStyle: { color: "rgba(181,45,36,.13)" },
        markPoint: {
          symbolSize: 58,
          itemStyle: { color: palette.red },
          label: { color: "#fff", formatter: "峰值" },
          data: [{ type: "max", name: "峰值" }],
        },
        data: data.trend.daily,
      },
    ],
  });

  const mediaNames = Object.keys(data.trend.dailyMedia).slice(0, 6);
  makeChart("mediaStackChart", {
    color: [palette.red, palette.teal, palette.blue, palette.gold, "#6d5a8f", "#7c7a65"],
    tooltip: { trigger: "axis" },
    legend: { top: 0, textStyle: { color: palette.muted }, itemWidth: 10, itemHeight: 10 },
    grid: { left: 48, right: 16, top: 44, bottom: 42 },
    xAxis: { type: "category", data: dates, ...axisBase() },
    yAxis: { type: "value", ...axisBase() },
    series: mediaNames.map((name) => ({
      name,
      type: "bar",
      stack: "total",
      emphasis: { focus: "series" },
      barMaxWidth: 20,
      data: data.trend.dailyMedia[name],
    })),
  });

  makeChart("sentimentChart", {
    color: [palette.blue, palette.red, palette.teal],
    tooltip: { trigger: "item", formatter: "{b}<br />{c} 条 ({d}%)" },
    series: [
      {
        type: "pie",
        radius: ["46%", "74%"],
        center: ["50%", "52%"],
        label: { formatter: "{b}\n{d}%", color: palette.ink, fontWeight: 700 },
        labelLine: { length: 14, length2: 8 },
        data: data.sentiment.map((item) => ({ name: item.name, value: item.value })),
      },
    ],
  });

  makeChart("regionChart", {
    color: [palette.teal],
    tooltip: { trigger: "axis" },
    grid: { left: 52, right: 12, top: 16, bottom: 26 },
    xAxis: { type: "value", ...axisBase() },
    yAxis: {
      type: "category",
      data: data.regions.map((item) => item.name).reverse(),
      ...axisBase(),
    },
    series: [
      {
        name: "声量",
        type: "bar",
        barWidth: 14,
        data: data.regions.map((item) => item.value).reverse(),
      },
    ],
  });

  makeChart("mediaChart", {
    color: [palette.red, palette.teal, palette.blue, palette.gold, "#6d5a8f", "#7d7a63"],
    tooltip: { trigger: "item", formatter: "{b}<br />{c} 条 ({d}%)" },
    legend: { bottom: 0, textStyle: { color: palette.muted } },
    series: [
      {
        type: "pie",
        roseType: "radius",
        radius: ["24%", "72%"],
        center: ["50%", "44%"],
        label: { color: palette.ink, formatter: "{b}" },
        data: data.mediaType.slice(0, 8).map((item) => ({ name: item.name, value: item.value })),
      },
    ],
  });

  makeChart("sourceChart", {
    color: [palette.blue],
    tooltip: { trigger: "axis" },
    grid: { left: 82, right: 18, top: 16, bottom: 28 },
    xAxis: { type: "value", ...axisBase() },
    yAxis: {
      type: "category",
      data: data.sourceSite.map((item) => item.name).reverse(),
      ...axisBase(),
    },
    series: [
      {
        name: "条数",
        type: "bar",
        barWidth: 15,
        data: data.sourceSite.map((item) => item.value).reverse(),
      },
    ],
  });

  makeChart("layerChart", {
    color: [palette.red, palette.teal, palette.blue, palette.gold, "#6d5a8f"],
    tooltip: { trigger: "item", formatter: "{b}<br />{c}%" },
    series: [
      {
        type: "pie",
        radius: ["38%", "72%"],
        label: { formatter: "{b}\n{c}%", color: palette.ink },
        data: data.layers,
      },
    ],
  });

  makeChart("topicsChart", {
    color: [palette.red],
    tooltip: { trigger: "axis" },
    grid: { left: 16, right: 24, top: 16, bottom: 86, containLabel: true },
    xAxis: {
      type: "category",
      data: data.topics.slice(0, 8).map((item) => item.text),
      axisLabel: { color: palette.muted, interval: 0, rotate: 32, width: 96, overflow: "truncate" },
      axisLine: { lineStyle: { color: "rgba(23,23,22,.38)" } },
      axisTick: { show: false },
    },
    yAxis: { type: "value", ...axisBase() },
    series: [
      {
        name: "热度",
        type: "bar",
        barWidth: 24,
        data: data.topics.slice(0, 8).map((item) => item.heat),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  });
}

function bindTabs(data) {
  document.querySelectorAll(".rank-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeMediaRank = button.dataset.rank;
      document.querySelectorAll(".rank-tab").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      renderMediaRank(data);
    });
  });

  document.querySelectorAll(".comment-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeComment = button.dataset.comment;
      document.querySelectorAll(".comment-tab").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      renderComments(data);
    });
  });
}

function render(data) {
  siteData = data;
  renderMeta(data);
  renderOverview(data);
  renderTimeline(data);
  renderHotSearch(data);
  renderKeywords(data);
  renderMediaSummary(data);
  renderMediaRank(data);
  renderSpread(data);
  renderComments(data);
  renderConclusion(data);
  renderCharts(data);
  bindTabs(data);
  if (window.lucide) lucide.createIcons();
}

fetch("data.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Failed to load data.json: ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch((error) => {
    console.error(error);
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div style="padding:16px;background:#b52d24;color:#fff">数据加载失败：${error.message}</div>`,
    );
  });

window.addEventListener("resize", () => {
  charts.forEach((chart) => chart.resize());
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => charts.forEach((chart) => chart.resize()), 250);
});
