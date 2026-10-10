# Indonesia Pet-Care Market Opportunity — Starting with Cat Litter

A static, dependency-free presentation site built from `proposal.md`. No build
step, no Node/npm required — it's plain HTML, CSS, and vanilla JS.

## Running it

Just open `index.html` in a browser:

```
open index.html
```

or serve it locally (recommended, so relative asset loading behaves exactly
like a real deploy):

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

- `index.html` — all page content and structure (hero + 11 sections): Market Opportunity, Nekonomic (cat economy), Why Cat Litter, Pricing, Unit Economics, Simulator, Startup Capital, Growth, Risks, FAQ, Sources.
- `data.js` — **single source of truth** for every number on the page: market stats, cat-economy stats, Shopee listing prices + URLs, unit-economics/simulator/startup-capital defaults & ranges, scenario presets, and the source registry (title/date/URL). Edit figures here.
- `charts.js` — small SVG chart renderer (donut, vertical bar, horizontal bar with ranges + marker line, waterfall) plus a shared hover tooltip and IDR number formatting. No external charting library.
- `app.js` — wires up navigation, renders static tables/sources/charts from `data.js`, and runs the interactive calculators (Unit Economics, Profitability & Break-Even Simulator with scenario presets, Startup Capital).
- `styles.css` — design tokens (forest-green brand palette + warm-neutral surfaces) and all component styles.
- `auth.js` — optional client-side password gate (see below).
- `i18n.js` — English / Bahasa Indonesia translation dictionary and language switcher (see below).
- `proposal.md` — the original content/design brief this site was built from.

## Language (EN / ID)

The site ships with a full Bahasa Indonesia translation alongside English, switched with the EN/ID toggle in the top nav. The choice persists in `localStorage` and survives reloads.

**How it works:**

- `i18n.js` holds one dictionary, `I18N = { en: {...}, id: {...} }`, keyed by dotted paths (e.g. `hero.title`, `unitEcon.fieldPrice`). `t("some.key")` looks up the current locale's string, falling back to English if a key is missing in Indonesian rather than showing nothing.
- Static text in `index.html` carries a `data-i18n="key"` attribute (or `data-i18n-placeholder="key"` for input placeholders). `applyI18n()` walks every tagged element and sets its `innerHTML` from the dictionary — values can contain inline HTML (`<strong>`, `<a href="#section">`, badge `<span>`s), so an `id` entry must mirror the `en` entry's tag structure with just the visible text translated.
- JS-rendered content (charts, tables, calculator output labels in `app.js`/`charts.js`) calls `t()` directly instead of hardcoding English strings, and the whole set of chart/table render functions re-runs on a `locale-changed` event so switching languages rebuilds the SVGs with translated labels, not just the surrounding page text.
- Numbers follow Indonesian convention in `id` mode: `.` as the thousands separator and `,` as the decimal mark (the reverse of English), handled by `formatIDR`/`formatPct` in `charts.js` reading the `CURRENT_LOCALE` this file sets.
- Abbreviated amounts (`Rp 60M`, `Rp 1.2T`) use **locale-specific unit letters**, not just reformatted numbers — Indonesian commonly uses "M" for *Miliar* (billion), which collides with the English "M" for *Million*. To avoid a 1000x misread, Indonesian abbreviations use T / M / Jt / Rb (Triliun / Miliar / Juta / Ribu) while English keeps T / B / M / K.

**Adding a new translation key:** add the English string under `I18N.en` at some dotted path, add the Bahasa Indonesia string at the same path under `I18N.id`, then either add `data-i18n="that.path"` to the HTML element or call `t("that.path")` from JS. Report titles and publisher names in the Sources section (e.g. "Euromonitor International") are deliberately left untranslated in both languages — they're citations to real English-titled reports.

## Password protection

`auth.js` shows a password prompt and hides the page until it's entered correctly, then remembers the unlock in the browser's `localStorage`.

**This is not real security.** There's no server, so the page's HTML and this script are downloadable by anyone with the URL regardless of the prompt — view-source or the Network tab bypasses it instantly. It only stops casual visitors, link previews, and search engines from seeing content at a glance. If you need actual access control (e.g. publishing this on GitHub Pages), put it behind something server-enforced instead: Netlify/Vercel's built-in password protection, or Cloudflare Access in front of a custom domain.

To change the password (currently `nekonomic-indonesia`):

```
node -e "console.log(require('crypto').createHash('sha256').update('your-new-password').digest('hex'))"
```

Paste the output into `TARGET_HASH` in `auth.js`. To remove the gate entirely, delete the `<script src="auth.js">` tag and the `#authGate` div from `index.html` (and drop `auth.js`).

## Design conventions used throughout

- **Forest green** = verified or observed data; **clay/orange** = a hypothetical assumption or proposed target; **status green/red** = profit vs. loss, used only for that purpose.
- Every slider and output is tagged `VERIFIED`, `TARGET`, `ASSUMPTION`, or `CALCULATED` so it's always clear what's a market fact versus a modeling input.
- Where the proposal explicitly says a figure hasn't been verified (e.g. a standalone cat-litter market size), the page shows "Data not yet verified" instead of a number.

## Updating figures or assumptions

All of it lives in `data.js`. Change a value there and every stat card, chart,
table, and calculator default that references it updates automatically — there
is no other place a number is duplicated.
