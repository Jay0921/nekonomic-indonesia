/**
 * Centralized data & financial assumptions.
 * Indonesia Pet-Care Market Opportunity — Starting with Cat Litter
 *
 * Edit figures here. Every number used in the page, charts, and calculators
 * is read from this file so there is exactly one place to update sources
 * or assumptions.
 *
 * badge values used throughout the UI:
 *   "verified"   — sourced market data (historical or forecast, see source)
 *   "target"     — a commercial target we are proposing, not a market fact
 *   "assumption" — a hypothetical input with no supplier/market confirmation
 *   "calculated" — a number derived from the above via a formula
 */

const SOURCES = {
  euromonitorPetCare: {
    name: "Euromonitor International",
    title: "Pet Care in Indonesia",
    date: "June 2026",
    url: "https://www.euromonitor.com/pet-care-in-indonesia/report",
  },
  euromonitorPetProducts: {
    name: "Euromonitor International",
    title: "Pet Products in Indonesia",
    date: "June 2026",
    url: "https://www.euromonitor.com/pet-products-in-indonesia/report",
  },
  marketResearchSummary: {
    name: "MarketResearch.com",
    title: "Euromonitor International — Pet Products Indonesia (report summary)",
    date: "2026",
    url: "https://www.marketresearch.com/Euromonitor-International-v746/Pet-Products-Indonesia-45430907/",
  },
  petfoodIndustry1: {
    name: "PetfoodIndustry",
    title: "How Cats Stole Indonesia's Pet Food Market",
    date: "July 10, 2025",
    url: "https://www.petfoodindustry.com/global-commerce/article/15745418/how-cats-stole-indonesias-pet-food-market",
  },
  petfoodIndustry2: {
    name: "PetfoodIndustry",
    title: "Cats Dominate Indonesia's US$237 Million Pet Food Market",
    date: "2025",
    url: "https://www.petfoodindustry.com/regions/central-western-southern-asia/article/15742617/cats-dominate-indonesias-us237-million-pet-food-market",
  },
  shopee: {
    name: "Shopee Indonesia",
    title: "Life Cat 7L Tofu Cat Litter — marketplace listings",
    date: "observed October 2026",
    url: null,
  },
};

const DATA = {
  market: {
    petCare: {
      valueLabel: "Rp 10.44T",
      valueIDR: 10438000000000,
      year: 2026,
      type: "forecast",
      growthPct: 6,
      sourceKey: "euromonitorPetCare",
    },
    petProducts: {
      valueLabel: "Rp 559B",
      valueIDR: 559000000000,
      year: 2026,
      type: "forecast",
      growthPct: 3,
      sourceKey: "euromonitorPetProducts",
    },
  },

  cats: {
    population: {
      valueLabel: "5.1M",
      value: 5100000,
      year: 2023,
      type: "historical",
      sourceKey: "petfoodIndustry1",
    },
    foodShare: {
      cats: 77.5,
      dogs: 22.5,
      year: 2023,
      type: "historical",
      sourceKey: "petfoodIndustry1",
    },
    foodSales: {
      y2022: 2100000000000,
      y2023: 2800000000000,
      growthPct: 32.2,
      type: "historical",
      sourceKey: "petfoodIndustry1",
    },
  },

  // Preliminary, non-exhaustive sample of advertised Shopee listing prices
  // for a single comparable product (Life Cat 7L tofu litter), reviewed
  // October 2026. Not a market average, not transaction data.
  listings: [
    { id: "A", low: 57500, high: 57500, url: "https://shopee.co.id/Life-Cat-Litter-Pasir-Tofu-Gumpal-Matcha-7L-i.1345300615.26112373571" },
    { id: "B", low: 59999, high: 59999, url: "https://shopee.co.id/Life-Cat-Tofu-Soya-Cat-Litter-7L-Pasir-Kucing-Tofu-Gumpal-7-Liter-i.205630779.22968191552" },
    { id: "C", low: 63900, high: 63900, url: "https://shopee.co.id/Life-Cat-Tofu-Soya-Cat-Litter-7L-Pasir-Kucing-Tofu-Gumpal-7-Liter-i.41184187.22841222578" },
    { id: "D", low: 69900, high: 69900, url: "https://shopee.co.id/Life-Cat-Tofu-Soya-Cat-Litter-7L-Pasir-Kucing-Tofu-Gumpal-7-Liter-i.11078005.19878643717" },
    { id: "E", low: 75000, high: 78000, url: "https://shopee.co.id/LIFE-CAT-Tofu-Soya-Cat-Litter-7L-Pasir-Kucing-Tofu-soya-Gumpal-Wangi-7-liter-i.125082310.19647644698" },
  ],

  // The price used throughout the financial simulation. It sits inside the
  // observed listing range above, but it is a proposed target, not an
  // established market average.
  simulationPrice: 60000,

  // Repeat-purchase illustration (Section 03). Purely hypothetical.
  repeatPurchase: {
    bagsPerMonth: 2,
    bagsPerYear: 24,
    pricePerBag: 60000,
    annualValuePerCustomer: 1440000,
  },

  // Unit economics calculator (Section 06) — granular cost breakdown.
  unitEconomics: {
    defaults: {
      sellingPrice: 60000,
      landedCost: 33000,
      marketplaceFeePct: 10, // 6,000 / 60,000
      fulfillmentCost: 4000,
      advertisingCost: 5000,
      promoCost: 0,
    },
    ranges: {
      sellingPrice: { min: 35000, max: 100000, step: 1000 },
      landedCost: { min: 15000, max: 70000, step: 1000 },
      marketplaceFeePct: { min: 0, max: 20, step: 0.5 },
      fulfillmentCost: { min: 0, max: 15000, step: 500 },
      advertisingCost: { min: 0, max: 20000, step: 500 },
      promoCost: { min: 0, max: 10000, step: 500 },
    },
  },

  // Illustrative monthly volume table (Section 07). Not forecasts.
  volumeTable: [
    { bags: 500, revenue: 30000000, contribution: 6000000 },
    { bags: 1000, revenue: 60000000, contribution: 12000000 },
    { bags: 2000, revenue: 120000000, contribution: 24000000 },
    { bags: 3000, revenue: 180000000, contribution: 36000000 },
    { bags: 5000, revenue: 300000000, contribution: 60000000 },
    { bags: 10000, revenue: 600000000, contribution: 120000000 },
  ],

  breakEven: {
    fixedCosts: 25000000,
    contributionPerUnit: 12000,
    resultBags: 2084,
  },

  // Profitability simulator defaults + scenario presets (Sections 07–08).
  // "otherVariableCost" lumps marketplace fees + fulfillment + advertising,
  // matching the scenario table in the proposal.
  simulator: {
    defaults: {
      bagsPerMonth: 3000,
      sellingPrice: 60000,
      landedCost: 33000,
      otherVariableCost: 15000,
      fixedCosts: 25000000,
    },
    ranges: {
      bagsPerMonth: { min: 0, max: 10000, step: 100 },
      sellingPrice: { min: 35000, max: 100000, step: 1000 },
      landedCost: { min: 15000, max: 70000, step: 1000 },
      otherVariableCost: { min: 0, max: 40000, step: 500 },
      fixedCosts: { min: 0, max: 60000000, step: 1000000 },
    },
    scenarios: {
      conservative: {
        label: "Conservative",
        bagsPerMonth: 1000,
        sellingPrice: 60000,
        landedCost: 38000,
        otherVariableCost: 14000,
        fixedCosts: 25000000,
      },
      base: {
        label: "Base",
        bagsPerMonth: 3000,
        sellingPrice: 60000,
        landedCost: 33000,
        otherVariableCost: 15000,
        fixedCosts: 25000000,
      },
      optimistic: {
        label: "Optimistic",
        bagsPerMonth: 5000,
        sellingPrice: 60000,
        landedCost: 30000,
        otherVariableCost: 14000,
        fixedCosts: 25000000,
      },
    },
  },

  // Startup capital calculator — one-time cost to launch, separate from the
  // recurring monthly economics above. Every figure is an unconfirmed
  // planning assumption (no vendor quotes), sized to be directionally
  // reasonable for a small-scale marketplace launch.
  startupCapital: {
    defaults: {
      inventoryBags: 1000,
      landedCost: 33000,
      storeSetup: 5000000,
      legalSetup: 10000000,
      marketingBudget: 10000000,
      runwayMonths: 3,
    },
    ranges: {
      inventoryBags: { min: 200, max: 5000, step: 100 },
      landedCost: { min: 15000, max: 70000, step: 1000 },
      storeSetup: { min: 0, max: 20000000, step: 500000 },
      legalSetup: { min: 0, max: 50000000, step: 1000000 },
      marketingBudget: { min: 0, max: 50000000, step: 1000000 },
      runwayMonths: { min: 0, max: 6, step: 1 },
    },
  },

  sourcesList: [
    { key: "euromonitorPetCare", usedFor: "2026 overall Indonesian pet-care retail market forecast and annual growth.", stat: "Rp 10.438 trillion and +6% growth in 2026 (forecast)." },
    { key: "euromonitorPetProducts", usedFor: "Pet-products market size, 2026 growth, and qualitative cat-litter outlook.", stat: "Rp 559 billion and +3% growth in 2026 (forecast). Cat litter flagged as a dynamic, strong-performing category." },
    { key: "marketResearchSummary", usedFor: "Additional publicly accessible summary of the Pet Products in Indonesia report.", stat: "Corroborates the Rp 559 billion / +3% figures above." },
    { key: "petfoodIndustry1", usedFor: "Pet cat population, cat food sales, and cat share of the pet food market.", stat: "5.1M pet cats (2023); 77.5% cat share of pet food value (2023); cat food sales grew Rp 2.1T → Rp 2.8T, +32.2% (2022–2023)." },
    { key: "petfoodIndustry2", usedFor: "Supporting historical cat food market figures, drawing on USDA FAS-related research.", stat: "Corroborates cat-dominant share of Indonesia's pet food market." },
    { key: "shopee", usedFor: "Preliminary advertised retail price comparison for one comparable product (Life Cat 7L tofu litter).", stat: "5 listings observed, Rp 57,500–78,000. See Section 04 for links." },
  ],
};
