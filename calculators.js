/* ============================================================
   Shared calculator logic — business valuation + dual-asset exit
   Indicative Australian SME EBITDA multiple ranges by industry.
   These are general guide ranges only, not valuation advice.
   ============================================================ */

const INDUSTRY_MULTIPLES = {
  "manufacturing":        { label: "Manufacturing & Engineering",        low: 3.0, high: 5.0 },
  "professional":         { label: "Professional Services",             low: 2.5, high: 4.0 },
  "healthcare":           { label: "Healthcare & Allied Health",        low: 3.0, high: 5.0 },
  "construction":         { label: "Construction & Trades",             low: 2.0, high: 3.5 },
  "transport":            { label: "Transport & Logistics",             low: 2.5, high: 4.0 },
  "wholesale":            { label: "Wholesale & Distribution",          low: 2.5, high: 4.0 },
  "retail":               { label: "Retail",                            low: 1.5, high: 3.0 },
  "hospitality":          { label: "Hospitality & Food Service",        low: 1.5, high: 2.5 },
  "agriculture":          { label: "Agriculture & Agribusiness",        low: 3.0, high: 5.0 },
  "tech":                 { label: "Technology / Software",             low: 4.0, high: 8.0 },
  "automotive":           { label: "Automotive & Repair",               low: 2.0, high: 3.5 },
  "other":                { label: "Other / Not Listed",                low: 2.0, high: 3.5 }
};

/**
 * Returns { low, high, multLow, multHigh } for a business.
 * ownerDependence: "low" | "medium" | "high"
 * Size adjustment: very small EBITDA pools trade at compressed multiples;
 * larger, management-run businesses attract a premium.
 */
function valueBusiness(industryKey, ebitda, ownerDependence) {
  const ind = INDUSTRY_MULTIPLES[industryKey] || INDUSTRY_MULTIPLES.other;
  let multLow = ind.low;
  let multHigh = ind.high;
  const mid = (multLow + multHigh) / 2;

  if (ownerDependence === "low") {
    multLow = mid;                       // buyer confidence: upper half of range
  } else if (ownerDependence === "high") {
    multHigh = mid;                      // key-person risk: lower half of range
    multLow = multLow * 0.85;
  }

  let sizeFactor = 1;
  if (ebitda > 0 && ebitda < 200000) sizeFactor = 0.8;
  else if (ebitda >= 1000000) sizeFactor = 1.1;

  multLow = Math.round(multLow * sizeFactor * 10) / 10;
  multHigh = Math.round(multHigh * sizeFactor * 10) / 10;

  return {
    low: ebitda * multLow,
    high: ebitda * multHigh,
    multLow: multLow,
    multHigh: multHigh
  };
}

function fmtAUD(n) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  });
}

function fmtRange(low, high) {
  return fmtAUD(low) + " – " + fmtAUD(high);
}

function readNumber(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(String(el.value).replace(/[^0-9.\-]/g, ""));
  return isNaN(v) ? 0 : v;
}

function populateIndustrySelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  Object.keys(INDUSTRY_MULTIPLES).forEach(function (key) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = INDUSTRY_MULTIPLES[key].label;
    sel.appendChild(opt);
  });
}
