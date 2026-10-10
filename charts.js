/**
 * Minimal dependency-free SVG chart helpers + shared number formatting.
 * Renders fixed-viewBox SVGs that scale fluidly via CSS; tooltips are a
 * single shared floating element positioned from element bounding rects
 * so they work regardless of SVG scale.
 */

/* ---------- formatting ----------
 * id-ID convention: "." as the thousands separator, "," as the decimal
 * mark (opposite of en-US) — CURRENT_LOCALE is set by i18n.js.
 */

function numberLocale() {
  return typeof CURRENT_LOCALE !== "undefined" && CURRENT_LOCALE === "id" ? "id-ID" : "en-US";
}

function formatIDR(n, opts) {
  opts = opts || {};
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (opts.abbreviate) {
    return sign + "Rp " + abbreviateNumber(abs);
  }
  return sign + "Rp " + Math.round(abs).toLocaleString(numberLocale());
}

function abbreviateNumber(abs) {
  // "M" is ambiguous (English Million vs. Indonesian Miliar/billion) — use
  // locale-specific suffixes so a switch never silently implies a 1000x
  // unit error. id-ID: T=Triliun, M=Miliar, Jt=Juta, Rb=Ribu.
  const id = numberLocale() === "id-ID";
  if (abs >= 1e12) return trimDecimal(abs / 1e12) + "T";
  if (abs >= 1e9) return trimDecimal(abs / 1e9) + (id ? "M" : "B");
  if (abs >= 1e6) return trimDecimal(abs / 1e6) + (id ? "Jt" : "M");
  if (abs >= 1e3) return trimDecimal(abs / 1e3) + (id ? "Rb" : "K");
  return String(Math.round(abs));
}

function trimDecimal(n) {
  const d = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  let s = n.toFixed(d).replace(/\.0+$/, "");
  if (numberLocale() === "id-ID") s = s.replace(".", ",");
  return s;
}

function formatPct(n, decimals) {
  decimals = decimals === undefined ? 1 : decimals;
  let s = n.toFixed(decimals);
  if (numberLocale() === "id-ID") s = s.replace(".", ",");
  return s + "%";
}

/* ---------- shared tooltip ---------- */

const ChartTooltip = (function () {
  let el = null;
  function ensure() {
    if (!el) {
      el = document.createElement("div");
      el.className = "chart-tooltip";
      el.setAttribute("role", "tooltip");
      document.body.appendChild(el);
    }
    return el;
  }
  function show(rect, html) {
    const t = ensure();
    t.innerHTML = html;
    t.style.display = "block";
    const top = rect.top + window.scrollY - t.offsetHeight - 10;
    let left = rect.left + window.scrollX + rect.width / 2 - t.offsetWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - t.offsetWidth - 8));
    const useBelow = top < window.scrollY + 8;
    t.style.top = (useBelow ? rect.bottom + window.scrollY + 10 : top) + "px";
    t.style.left = left + "px";
    t.classList.toggle("chart-tooltip--below", useBelow);
  }
  function hide() {
    if (el) el.style.display = "none";
  }
  return { show, hide };
})();

function bindTooltip(markEl, htmlFn) {
  markEl.addEventListener("mouseenter", () => {
    markEl.classList.add("is-hovered");
    ChartTooltip.show(markEl.getBoundingClientRect(), htmlFn());
  });
  markEl.addEventListener("mousemove", () => {
    ChartTooltip.show(markEl.getBoundingClientRect(), htmlFn());
  });
  markEl.addEventListener("mouseleave", () => {
    markEl.classList.remove("is-hovered");
    ChartTooltip.hide();
  });
  markEl.addEventListener("focus", () => {
    markEl.classList.add("is-hovered");
    ChartTooltip.show(markEl.getBoundingClientRect(), htmlFn());
  });
  markEl.addEventListener("blur", () => {
    markEl.classList.remove("is-hovered");
    ChartTooltip.hide();
  });
}

/* ---------- svg helpers ---------- */

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (attrs) {
    for (const k in attrs) el.setAttribute(k, attrs[k]);
  }
  return el;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function renderLegend(container, items) {
  const wrap = document.createElement("div");
  wrap.className = "chart-legend";
  items.forEach((it) => {
    const row = document.createElement("span");
    row.className = "chart-legend__item";
    row.innerHTML =
      '<span class="chart-legend__swatch" style="background:' +
      it.color +
      '"></span>' +
      '<span>' + it.label + (it.value !== undefined ? ' <b>' + it.value + '</b>' : '') + '</span>';
    wrap.appendChild(row);
  });
  container.appendChild(wrap);
}

/* ---------- donut chart ---------- */

function polarPoint(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function donutArcPath(cx, cy, rOuter, rInner, a0, a1) {
  const o0 = polarPoint(cx, cy, rOuter, a1);
  const o1 = polarPoint(cx, cy, rOuter, a0);
  const i0 = polarPoint(cx, cy, rInner, a1);
  const i1 = polarPoint(cx, cy, rInner, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    "M", o0.x, o0.y,
    "A", rOuter, rOuter, 0, large, 0, o1.x, o1.y,
    "L", i1.x, i1.y,
    "A", rInner, rInner, 0, large, 1, i0.x, i0.y,
    "Z",
  ].join(" ");
}

function renderDonut(container, segments, opts) {
  opts = opts || {};
  clearEl(container);
  const vb = { w: 320, h: 260 };
  const cx = vb.w / 2;
  const cy = 118;
  const rOuter = 92;
  const rInner = 56;
  const total = segments.reduce((s, d) => s + d.value, 0);
  const gapDeg = 2.2;

  const svg = svgEl("svg", {
    viewBox: "0 0 " + vb.w + " " + vb.h,
    class: "chart-svg",
    role: "img",
    "aria-label": opts.ariaLabel || "Donut chart",
  });

  let angle = 0;
  segments.forEach((seg) => {
    const sweep = (seg.value / total) * 360;
    const a0 = angle + gapDeg / 2;
    const a1 = angle + sweep - gapDeg / 2;
    const path = svgEl("path", {
      d: donutArcPath(cx, cy, rOuter, rInner, a0, a1),
      fill: seg.color,
      class: "chart-mark",
      tabindex: "0",
    });
    bindTooltip(path, () =>
      '<strong>' + seg.label + '</strong><br>' +
      formatPct(seg.value, 1) + (seg.footnote ? '<br><span class="tt-muted">' + seg.footnote + '</span>' : "")
    );
    svg.appendChild(path);
    angle += sweep;
  });

  // center label
  const centerVal = svgEl("text", {
    x: cx, y: cy - 6, class: "chart-center-value", "text-anchor": "middle",
  });
  centerVal.textContent = opts.centerValue || "";
  const centerSub = svgEl("text", {
    x: cx, y: cy + 16, class: "chart-center-sub", "text-anchor": "middle",
  });
  centerSub.textContent = opts.centerSub || "";
  svg.appendChild(centerVal);
  svg.appendChild(centerSub);

  container.appendChild(svg);
  renderLegend(
    container,
    segments.map((s) => ({ color: s.color, label: s.label, value: formatPct(s.value, 1) }))
  );
}

/* ---------- vertical bar chart (supports +/- with zero baseline) ---------- */

function renderBarChart(container, bars, opts) {
  opts = opts || {};
  clearEl(container);
  const vb = { w: 560, h: 300 };
  const margin = { top: 28, right: 16, bottom: 44, left: 16 };
  const plotW = vb.w - margin.left - margin.right;
  const plotH = vb.h - margin.top - margin.bottom;

  const max = Math.max(0, ...bars.map((b) => b.value));
  const min = Math.min(0, ...bars.map((b) => b.value));
  const range = max - min || 1;
  const zeroY = margin.top + plotH * (max / range);

  const svg = svgEl("svg", {
    viewBox: "0 0 " + vb.w + " " + vb.h,
    class: "chart-svg",
    role: "img",
    "aria-label": opts.ariaLabel || "Bar chart",
  });

  // zero baseline
  svg.appendChild(
    svgEl("line", {
      x1: margin.left, x2: vb.w - margin.right, y1: zeroY, y2: zeroY,
      class: "chart-baseline",
    })
  );

  const n = bars.length;
  const slot = plotW / n;
  const barW = Math.min(64, slot * 0.46);

  bars.forEach((b, i) => {
    const cx = margin.left + slot * (i + 0.5);
    const h = (Math.abs(b.value) / range) * plotH;
    const y = b.value >= 0 ? zeroY - h : zeroY;
    const color = b.color || (b.value >= 0 ? "var(--good)" : "var(--critical)");

    const rect = svgEl("rect", {
      x: cx - barW / 2, y: y, width: barW, height: Math.max(h, 1),
      rx: 4, fill: color, class: "chart-mark", tabindex: "0",
    });
    bindTooltip(rect, () =>
      '<strong>' + b.label + '</strong><br>' +
      (opts.valueFormatter ? opts.valueFormatter(b.value) : formatIDR(b.value, { abbreviate: true })) +
      (b.footnote ? '<br><span class="tt-muted">' + b.footnote + '</span>' : "")
    );
    svg.appendChild(rect);

    // value label
    const label = svgEl("text", {
      x: cx, y: b.value >= 0 ? y - 8 : y + h + 16,
      class: "chart-value-label", "text-anchor": "middle",
    });
    label.textContent = opts.valueFormatter ? opts.valueFormatter(b.value) : formatIDR(b.value, { abbreviate: true });
    svg.appendChild(label);

    // category label
    const cat = svgEl("text", {
      x: cx, y: vb.h - margin.bottom + 20, class: "chart-axis-label", "text-anchor": "middle",
    });
    cat.textContent = b.label;
    svg.appendChild(cat);
  });

  container.appendChild(svg);
  if (opts.legend) renderLegend(container, opts.legend);
}

/* ---------- horizontal bar chart (price comparison, with ranges + marker) ---------- */

function renderHBarChart(container, bars, opts) {
  opts = opts || {};
  clearEl(container);
  const vb = { w: 560, h: 36 * bars.length + 56 };
  const margin = { top: 36, right: 24, bottom: 20, left: 96 };
  const plotW = vb.w - margin.left - margin.right;
  const plotH = vb.h - margin.top - margin.bottom;
  const maxVal = Math.max(opts.markerValue || 0, ...bars.map((b) => b.high)) * 1.08;

  const svg = svgEl("svg", {
    viewBox: "0 0 " + vb.w + " " + vb.h,
    class: "chart-svg",
    role: "img",
    "aria-label": opts.ariaLabel || "Horizontal bar chart",
  });

  const rowH = plotH / bars.length;
  const barH = Math.min(22, rowH * 0.55);
  const x = (v) => margin.left + (v / maxVal) * plotW;

  // gridlines
  [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
    const gx = margin.left + f * plotW;
    svg.appendChild(svgEl("line", { x1: gx, x2: gx, y1: margin.top - 8, y2: vb.h - margin.bottom, class: "chart-grid" }));
  });

  bars.forEach((b, i) => {
    const cy = margin.top + rowH * (i + 0.5);
    const x0 = x(0);
    const x1 = x(b.low);
    const x2 = x(b.high);

    const rect = svgEl("rect", {
      x: x0, y: cy - barH / 2, width: Math.max(x1 - x0, 2), height: barH,
      rx: 4, fill: b.color || "var(--forest-500)", class: "chart-mark", tabindex: "0",
    });
    bindTooltip(rect, () =>
      '<strong>' + b.label + '</strong><br>' +
      (b.low === b.high ? formatIDR(b.low) : formatIDR(b.low) + " – " + formatIDR(b.high)) +
      '<br><span class="tt-muted">' + (b.footnote || "") + '</span>'
    );
    svg.appendChild(rect);

    if (b.high > b.low) {
      const rangeRect = svgEl("rect", {
        x: x1, y: cy - barH / 2, width: Math.max(x2 - x1, 2), height: barH,
        rx: 4, fill: b.color || "var(--forest-500)", opacity: 0.35, class: "chart-mark",
      });
      svg.appendChild(rangeRect);
    }

    const valueLabel = svgEl("text", {
      x: x2 + 8, y: cy + 4, class: "chart-value-label chart-value-label--inline",
    });
    valueLabel.textContent = b.low === b.high ? formatIDR(b.low) : formatIDR(b.low) + "–" + formatIDR(b.high);
    svg.appendChild(valueLabel);

    const rowLabel = svgEl("text", {
      x: margin.left - 10, y: cy + 4, class: "chart-axis-label", "text-anchor": "end",
    });
    rowLabel.textContent = b.label;
    svg.appendChild(rowLabel);
  });

  if (opts.markerValue) {
    const mx = x(opts.markerValue);
    svg.appendChild(
      svgEl("line", {
        x1: mx, x2: mx, y1: margin.top - 14, y2: vb.h - margin.bottom,
        class: "chart-marker-line",
      })
    );
    const mLabel = svgEl("text", {
      x: mx, y: margin.top - 20, class: "chart-marker-label", "text-anchor": "middle",
    });
    mLabel.textContent = opts.markerLabel || formatIDR(opts.markerValue);
    svg.appendChild(mLabel);
  }

  container.appendChild(svg);
}

/* ---------- waterfall chart ---------- */
/**
 * steps: [{ label, start, end, kind }]
 *   kind: 'total' | 'subtotal' | 'decrease' | 'increase' | 'result'
 */
function renderWaterfall(container, steps, opts) {
  opts = opts || {};
  clearEl(container);
  const vb = { w: 620, h: 320 };
  const margin = { top: 28, right: 16, bottom: 72, left: 16 };
  const plotW = vb.w - margin.left - margin.right;
  const plotH = vb.h - margin.top - margin.bottom;

  const allVals = steps.flatMap((s) => [s.start, s.end]);
  const max = Math.max(0, ...allVals);
  const min = Math.min(0, ...allVals);
  const range = max - min || 1;
  const zeroY = margin.top + plotH * (max / range);
  const valueToY = (v) => margin.top + plotH * ((max - v) / range);

  const svg = svgEl("svg", {
    viewBox: "0 0 " + vb.w + " " + vb.h,
    class: "chart-svg",
    role: "img",
    "aria-label": opts.ariaLabel || "Waterfall chart",
  });

  svg.appendChild(
    svgEl("line", { x1: margin.left, x2: vb.w - margin.right, y1: zeroY, y2: zeroY, class: "chart-baseline" })
  );

  const n = steps.length;
  const slot = plotW / n;
  const barW = Math.min(58, slot * 0.56);

  const colorFor = (s) => {
    if (s.kind === "decrease") return "var(--clay-600)";
    if (s.kind === "increase") return "var(--forest-500)";
    if (s.kind === "result") return s.end >= 0 ? "var(--good)" : "var(--critical)";
    return "var(--ink-tertiary)"; // total / subtotal
  };

  steps.forEach((s, i) => {
    const cx = margin.left + slot * (i + 0.5);
    const yTop = valueToY(Math.max(s.start, s.end));
    const yBottom = valueToY(Math.min(s.start, s.end));
    const h = Math.max(yBottom - yTop, 2);

    const rect = svgEl("rect", {
      x: cx - barW / 2, y: yTop, width: barW, height: h, rx: 4,
      fill: colorFor(s), class: "chart-mark", tabindex: "0",
    });
    const delta = s.end - s.start;
    bindTooltip(rect, () =>
      '<strong>' + s.label + '</strong><br>' +
      (s.kind === "decrease" || s.kind === "increase"
        ? (delta >= 0 ? "+" : "") + formatIDR(delta, { abbreviate: true })
        : formatIDR(s.end, { abbreviate: true }))
    );
    svg.appendChild(rect);

    const labelVal = svgEl("text", {
      x: cx, y: yTop - 8, class: "chart-value-label", "text-anchor": "middle",
    });
    labelVal.textContent =
      s.kind === "decrease" || s.kind === "increase"
        ? (delta >= 0 ? "+" : "") + formatIDR(delta, { abbreviate: true })
        : formatIDR(s.end, { abbreviate: true });
    svg.appendChild(labelVal);

    const catLabel = svgEl("text", {
      x: cx, y: vb.h - margin.bottom + 22, class: "chart-axis-label chart-axis-label--wrap", "text-anchor": "middle",
    });
    const words = s.label.split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");
    const tspan1 = svgEl("tspan", { x: cx, dy: "0" });
    tspan1.textContent = line1;
    catLabel.appendChild(tspan1);
    if (line2) {
      const tspan2 = svgEl("tspan", { x: cx, dy: "13" });
      tspan2.textContent = line2;
      catLabel.appendChild(tspan2);
    }
    svg.appendChild(catLabel);

    if (i < n - 1) {
      const nx = margin.left + slot * (i + 1.5);
      const connY = valueToY(s.end);
      svg.appendChild(
        svgEl("line", {
          x1: cx + barW / 2, x2: nx - barW / 2, y1: connY, y2: connY, class: "chart-connector",
        })
      );
    }
  });

  container.appendChild(svg);
}
