/**
 * Page wiring: navigation, static content rendering, charts, and the two
 * interactive calculators. All numbers come from data.js — nothing here
 * is a hardcoded market figure.
 */

function renderAllDynamicContent() {
  renderListingTable();
  renderVolumeTable();
  renderSources();
  renderCatShareDonut();
  renderCatFoodSalesBar();
  renderListingsChart();
  renderScenarioBarChart();
  updateUnitEconomics();
  updateSimulator();
  updateStartupCapital();
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  renderAllDynamicContent();
  initUnitEconomicsCalculator();
  initSimulator();
  initStartupCapitalCalculator();
});

// Re-render everything JS builds (charts, tables, calculator outputs) when
// the language switches — data-i18n elements are handled by i18n.js itself.
document.addEventListener("locale-changed", renderAllDynamicContent);

/* ---------- shared scenario math ---------- */

function scenarioMonthlyResult(s) {
  const contributionPerUnit = s.sellingPrice - s.landedCost - s.otherVariableCost;
  const operating = s.bagsPerMonth * contributionPerUnit - s.fixedCosts;
  return { contributionPerUnit, operating };
}

/* ---------- navigation ---------- */

function initNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.innerHTML = open
      ? '<svg width="20" height="20"><use href="#i-x"/></svg>'
      : '<svg width="20" height="20"><use href="#i-menu"/></svg>';
  });
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.innerHTML = '<svg width="20" height="20"><use href="#i-menu"/></svg>';
    });
  });

  const sections = Array.from(links.querySelectorAll("a")).map((a) => ({
    link: a,
    el: document.querySelector(a.getAttribute("href")),
  })).filter((s) => s.el);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const match = sections.find((s) => s.el === entry.target);
        if (!match) return;
        if (entry.isIntersecting) {
          sections.forEach((s) => s.link.classList.remove("is-active"));
          match.link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s.el));
}

/* ---------- static tables ---------- */

function renderListingTable() {
  const body = document.getElementById("listingTableBody");
  body.innerHTML = DATA.listings
    .map((l) => {
      const price = l.low === l.high ? formatIDR(l.low) : formatIDR(l.low) + " – " + formatIDR(l.high);
      return (
        "<tr><td>" + t("table.listing") + " " + l.id + "</td><td>" + price + "</td>" +
        '<td><a href="' + l.url + '" target="_blank" rel="noopener">' + t("table.viewOnShopee") + ' <svg width="12" height="12"><use href="#i-external"/></svg></a></td></tr>'
      );
    })
    .join("");
}

function renderVolumeTable() {
  const body = document.getElementById("volumeTableBody");
  body.innerHTML = DATA.volumeTable
    .map(
      (r) =>
        "<tr><td>" + r.bags.toLocaleString(numberLocale()) + "</td><td>" +
        formatIDR(r.revenue) + "</td><td>" + formatIDR(r.contribution) + "</td></tr>"
    )
    .join("");
}

function renderSources() {
  const container = document.getElementById("sourcesList");
  container.innerHTML = DATA.sourcesList
    .map((entry) => {
      const s = SOURCES[entry.key];
      const linkHtml = s.url
        ? '<a class="source-card__link" href="' + s.url + '" target="_blank" rel="noopener">' + t("sources.openSource") + ' <svg width="12" height="12"><use href="#i-external"/></svg></a>'
        : '<span class="tag tag--unverified">' + t("sources.noUrl") + "</span>";
      return (
        '<div class="source-card">' +
          '<div class="source-card__head">' +
            '<div><div class="source-card__title">' + s.title + "</div>" +
            '<div class="source-card__meta">' + s.name + " — " + s.date + "</div></div>" +
          "</div>" +
          '<div class="source-card__used"><strong>' + t("sources.usedFor") + '</strong> ' + t("sources.usedFor_" + entry.key) + "</div>" +
          '<div class="source-card__stat">' + t("sources.stat_" + entry.key) + "</div>" +
          linkHtml +
        "</div>"
      );
    })
    .join("");
}

/* ---------- static charts ---------- */

function renderCatShareDonut() {
  const el = document.getElementById("chart-cat-share");
  const fs = DATA.cats.foodShare;
  renderDonut(
    el,
    [
      { label: t("chart.cats"), value: fs.cats, color: "var(--forest-500)", footnote: t("chart.catShareFootnote") },
      { label: t("chart.dogs"), value: fs.dogs, color: "var(--clay-600)", footnote: t("chart.catShareFootnote") },
    ],
    { centerValue: formatPct(fs.cats, 1), centerSub: t("chart.catShareSub"), ariaLabel: t("cats.chart1Title") }
  );
}

function renderCatFoodSalesBar() {
  const el = document.getElementById("chart-cat-food-sales");
  const fsales = DATA.cats.foodSales;
  renderBarChart(
    el,
    [
      { label: "2022", value: fsales.y2022, color: "var(--forest-400)", footnote: t("chart.catFoodHistorical") },
      { label: "2023", value: fsales.y2023, color: "var(--forest-700)", footnote: t("chart.catFoodGrowth") },
    ],
    { ariaLabel: t("cats.chart2Title"), valueFormatter: (v) => formatIDR(v, { abbreviate: true }) }
  );
}

function renderListingsChart() {
  const el = document.getElementById("chart-listings");
  const bars = DATA.listings.map((l) => ({
    label: t("table.listing") + " " + l.id,
    low: l.low,
    high: l.high,
    color: "var(--forest-500)",
    footnote: t("chart.listingFootnote"),
  }));
  renderHBarChart(el, bars, {
    markerValue: DATA.simulationPrice,
    markerLabel: t("chart.marker"),
    ariaLabel: t("pricing.chartTitle"),
  });
}

function renderScenarioBarChart() {
  const el = document.getElementById("chart-scenario-bar");
  const sc = DATA.simulator.scenarios;
  const bars = Object.keys(sc).map((key) => {
    const s = sc[key];
    const { contributionPerUnit, operating } = scenarioMonthlyResult(s);
    return {
      label: t("scenario." + key),
      value: operating,
      footnote: s.bagsPerMonth.toLocaleString(numberLocale()) + " " + t("table.bagsPerMonth") + " · Rp " + contributionPerUnit.toLocaleString(numberLocale()) + " contribution/bag",
    };
  });
  renderBarChart(el, bars, {
    ariaLabel: t("simulator.scenarioBarTitle"),
    valueFormatter: (v) => formatIDR(v, { abbreviate: true }),
    legend: [
      { color: "var(--good)", label: t("chart.operatingProfit") },
      { color: "var(--critical)", label: t("chart.operatingLoss") },
    ],
  });
}

/* ---------- unit economics calculator ---------- */

function computeUnitEconomics(i) {
  const feeAmount = i.price * (i.feePct / 100);
  const grossProfit = i.price - i.landed;
  const grossMargin = i.price > 0 ? (grossProfit / i.price) * 100 : 0;
  const contribution = grossProfit - feeAmount - i.fulfill - i.ads - i.promo;
  const contributionMargin = i.price > 0 ? (contribution / i.price) * 100 : 0;
  return { feeAmount, grossProfit, grossMargin, contribution, contributionMargin };
}

function readUEInputs() {
  return {
    price: Number(document.getElementById("ue-price").value),
    landed: Number(document.getElementById("ue-landed").value),
    feePct: Number(document.getElementById("ue-fee").value),
    fulfill: Number(document.getElementById("ue-fulfill").value),
    ads: Number(document.getElementById("ue-ads").value),
    promo: Number(document.getElementById("ue-promo").value),
  };
}

function updateUnitEconomics() {
  const inputs = readUEInputs();
  document.getElementById("ue-price-val").textContent = formatIDR(inputs.price);
  document.getElementById("ue-landed-val").textContent = formatIDR(inputs.landed);
  document.getElementById("ue-fee-val").textContent = formatPct(inputs.feePct, 1);
  document.getElementById("ue-fulfill-val").textContent = formatIDR(inputs.fulfill);
  document.getElementById("ue-ads-val").textContent = formatIDR(inputs.ads);
  document.getElementById("ue-promo-val").textContent = formatIDR(inputs.promo);

  const out = computeUnitEconomics(inputs);
  document.getElementById("ue-gross-profit").textContent = formatIDR(out.grossProfit);
  document.getElementById("ue-gross-margin").textContent = formatPct(out.grossMargin, 1);
  document.getElementById("ue-contribution").textContent = formatIDR(out.contribution);
  document.getElementById("ue-contribution-margin").textContent = formatPct(out.contributionMargin, 1);

  const warning = document.getElementById("ue-warning");
  warning.style.display = out.contribution <= 0 ? "flex" : "none";

  return { inputs, out };
}

function initUnitEconomicsCalculator() {
  const ids = ["ue-price", "ue-landed", "ue-fee", "ue-fulfill", "ue-ads", "ue-promo"];
  ids.forEach((id) => document.getElementById(id).addEventListener("input", updateUnitEconomics));
  updateUnitEconomics();

  document.getElementById("ue-send-to-sim").addEventListener("click", () => {
    const { inputs, out } = updateUnitEconomics();
    const otherVariable = Math.round(out.feeAmount + inputs.fulfill + inputs.ads + inputs.promo);
    setSlider("sim-price", inputs.price);
    setSlider("sim-landed", inputs.landed);
    setSlider("sim-other", otherVariable);
    clearScenarioActive();
    updateSimulator();
    document.getElementById("simulator").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ---------- profitability simulator ---------- */

function setSlider(id, value) {
  const el = document.getElementById(id);
  el.value = value;
}

function clearScenarioActive() {
  document.querySelectorAll("#scenarioButtons .scenario-btn").forEach((b) => b.classList.remove("is-active"));
}

function readSimInputs() {
  return {
    units: Number(document.getElementById("sim-units").value),
    price: Number(document.getElementById("sim-price").value),
    landed: Number(document.getElementById("sim-landed").value),
    other: Number(document.getElementById("sim-other").value),
    fixed: Number(document.getElementById("sim-fixed").value),
  };
}

function computeSimulator(i) {
  const grossProfitPerUnit = i.price - i.landed;
  const contributionPerUnit = grossProfitPerUnit - i.other;
  const revenue = i.units * i.price;
  const grossProfit = i.units * grossProfitPerUnit;
  const contribution = i.units * contributionPerUnit;
  const operating = contribution - i.fixed;
  const breakEven = contributionPerUnit > 0 ? i.fixed / contributionPerUnit : null;
  return { grossProfitPerUnit, contributionPerUnit, revenue, grossProfit, contribution, operating, breakEven };
}

function updateSimulator() {
  const inputs = readSimInputs();
  document.getElementById("sim-units-val").textContent = inputs.units.toLocaleString(numberLocale());
  document.getElementById("sim-price-val").textContent = formatIDR(inputs.price);
  document.getElementById("sim-landed-val").textContent = formatIDR(inputs.landed);
  document.getElementById("sim-other-val").textContent = formatIDR(inputs.other);
  document.getElementById("sim-fixed-val").textContent = formatIDR(inputs.fixed);

  const out = computeSimulator(inputs);
  document.getElementById("sim-revenue").textContent = formatIDR(out.revenue);
  document.getElementById("sim-gross-profit").textContent = formatIDR(out.grossProfit);
  document.getElementById("sim-contribution").textContent = formatIDR(out.contribution);

  const opEl = document.getElementById("sim-operating");
  opEl.textContent = formatIDR(out.operating);
  opEl.classList.toggle("is-negative", out.operating < 0);
  opEl.classList.toggle("is-positive", out.operating >= 0);

  const beEl = document.getElementById("sim-breakeven");
  beEl.textContent = out.breakEven !== null
    ? Math.ceil(out.breakEven).toLocaleString(numberLocale()) + " " + t("table.bagsPerMonth")
    : t("table.notAchievable");

  const warning = document.getElementById("sim-warning");
  warning.style.display = out.contributionPerUnit <= 0 ? "flex" : "none";

  renderMonthlyWaterfall(inputs, out);
  return { inputs, out };
}

function renderMonthlyWaterfall(inputs, out) {
  const el = document.getElementById("chart-monthly-waterfall");
  const cogs = inputs.units * inputs.landed;
  const otherCost = inputs.units * inputs.other;
  const steps = [
    { label: t("chart.wfRevenue"), start: 0, end: out.revenue, kind: "total" },
    { label: t("chart.wfCogs"), start: out.revenue, end: out.revenue - cogs, kind: "decrease" },
    { label: t("chart.wfGrossProfit"), start: 0, end: out.grossProfit, kind: "subtotal" },
    { label: t("chart.wfOtherCosts"), start: out.grossProfit, end: out.contribution, kind: "decrease" },
    { label: t("chart.wfContribution"), start: 0, end: out.contribution, kind: "subtotal" },
    { label: t("chart.wfFixedCosts"), start: out.contribution, end: out.operating, kind: "decrease" },
    { label: t("chart.wfResult"), start: 0, end: out.operating, kind: "result" },
  ];
  renderWaterfall(el, steps, { ariaLabel: t("simulator.waterfallTitle") });
}

function initSimulator() {
  const ids = ["sim-units", "sim-price", "sim-landed", "sim-other", "sim-fixed"];
  ids.forEach((id) =>
    document.getElementById(id).addEventListener("input", () => {
      clearScenarioActive();
      updateSimulator();
    })
  );

  document.querySelectorAll("#scenarioButtons .scenario-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-scenario");
      const s = DATA.simulator.scenarios[key];
      setSlider("sim-units", s.bagsPerMonth);
      setSlider("sim-price", s.sellingPrice);
      setSlider("sim-landed", s.landedCost);
      setSlider("sim-other", s.otherVariableCost);
      setSlider("sim-fixed", s.fixedCosts);
      document.querySelectorAll("#scenarioButtons .scenario-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      updateSimulator();
    });
  });

  // initialize from the "base" preset so displayed numbers match the static tables
  const base = DATA.simulator.scenarios.base;
  setSlider("sim-units", base.bagsPerMonth);
  setSlider("sim-price", base.sellingPrice);
  setSlider("sim-landed", base.landedCost);
  setSlider("sim-other", base.otherVariableCost);
  setSlider("sim-fixed", base.fixedCosts);
  updateSimulator();
}

/* ---------- startup capital calculator ---------- */

function readStartupCapitalInputs() {
  return {
    bags: Number(document.getElementById("sc-bags").value),
    landed: Number(document.getElementById("sc-landed").value),
    store: Number(document.getElementById("sc-store").value),
    legal: Number(document.getElementById("sc-legal").value),
    marketing: Number(document.getElementById("sc-marketing").value),
    runwayMonths: Number(document.getElementById("sc-runway").value),
  };
}

function computeStartupCapital(i) {
  const conservative = DATA.simulator.scenarios.conservative;
  const monthlyLoss = Math.abs(Math.min(0, scenarioMonthlyResult(conservative).operating));
  const inventoryCost = i.bags * i.landed;
  const onetimeCost = i.store + i.legal + i.marketing;
  const runwayBuffer = i.runwayMonths * monthlyLoss;
  const total = inventoryCost + onetimeCost + runwayBuffer;
  return { monthlyLoss, inventoryCost, onetimeCost, runwayBuffer, total };
}

function updateStartupCapital() {
  const inputs = readStartupCapitalInputs();
  document.getElementById("sc-bags-val").textContent = inputs.bags.toLocaleString(numberLocale());
  document.getElementById("sc-landed-val").textContent = formatIDR(inputs.landed);
  document.getElementById("sc-store-val").textContent = formatIDR(inputs.store);
  document.getElementById("sc-legal-val").textContent = formatIDR(inputs.legal);
  document.getElementById("sc-marketing-val").textContent = formatIDR(inputs.marketing);
  document.getElementById("sc-runway-val").textContent = inputs.runwayMonths + " " + t(inputs.runwayMonths === 1 ? "startup.month" : "startup.months");

  const out = computeStartupCapital(inputs);
  document.getElementById("sc-runway-note").textContent =
    "= " + inputs.runwayMonths + " × " + formatIDR(out.monthlyLoss) + " " + t("startup.runwayNote");
  document.getElementById("sc-inventory-cost").textContent = formatIDR(out.inventoryCost);
  document.getElementById("sc-onetime-cost").textContent = formatIDR(out.onetimeCost);
  document.getElementById("sc-runway-cost").textContent = formatIDR(out.runwayBuffer);
  document.getElementById("sc-total").textContent = formatIDR(out.total);
}

function initStartupCapitalCalculator() {
  const ids = ["sc-bags", "sc-landed", "sc-store", "sc-legal", "sc-marketing", "sc-runway"];
  ids.forEach((id) => document.getElementById(id).addEventListener("input", updateStartupCapital));
  updateStartupCapital();
}
