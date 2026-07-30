# Exit Calculators (Structural Exit OS)

Two free, static, SEO-ready calculators for Australian business owners planning an exit:

- **`/business-valuation-calculator/`** — indicative business value range from normalised EBITDA × Australian SME industry multiples, adjusted for owner dependence and size. For owners who don't own their premises.
- **`/dual-asset-exit-calculator/`** — the flagship. For owner-occupiers: models the business **and** the commercial freehold side by side, comparing "sell everything" vs "sell the business, keep the property and lease it to the buyer" (the Asset First / dual-asset exit approach).

Plus landing page (`index.html`), `about.html`, `privacy.html`, `robots.txt` and `sitemap.xml`.

Everything is plain HTML/CSS/JS — no build step, no framework, no backend. All calculator inputs are processed in the browser; nothing is stored or transmitted.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy (free) — Cloudflare Pages

1. Push this repo to GitHub (done if you're reading this there).
2. In Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**, pick this repo.
3. Build settings: framework **None**, build command **(empty)**, output directory **/** (root).
4. Add your custom domain under the project's **Custom domains** tab.

Vercel, Netlify or Hostinger static hosting work identically.

## Before launch checklist

- [ ] Buy a domain (e.g. `dualassetexit.com.au` or similar) and connect it.
- [ ] Replace `YOURDOMAIN` in `sitemap.xml` and `robots.txt` with the live domain.
- [ ] Submit the sitemap in [Google Search Console](https://search.google.com/search-console).
- [ ] Swap the `mailto:` link in the dual-asset page's lead CTA for a GoHighLevel form embed (marked with an HTML comment in `dual-asset-exit-calculator/index.html`).
- [ ] Review the indicative industry multiples in `calculators.js` and adjust to taste — they're deliberately conservative general ranges.
- [ ] Once there's some traffic: apply for Google AdSense (privacy policy and content pages required for approval are already in place).

## Where the numbers live

All valuation assumptions are in one file, `calculators.js`:

- `INDUSTRY_MULTIPLES` — low/high EBITDA multiple per industry.
- `valueBusiness()` — owner-dependence adjustment (upper/lower half of range) and size factor (×0.8 under $200k EBITDA, ×1.1 over $1m).
- The dual-asset page estimates market rent at a 6% yield when not provided.

## Disclaimer

These tools output general, indicative, pre-tax figures only and are not financial, legal, tax or valuation advice.
