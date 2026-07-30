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

## Deploy Option A — on the existing site via GoHighLevel (fisherandfisher.au/dual-exit-calculator)

GHL can't host this multi-page static site directly, but it can serve the calculator at a path on the existing domain:

1. In GHL: **Sites → your fisherandfisher.au website → New page**, set the page path to `dual-exit-calculator`.
2. Add a full-width section with a **Custom Code** element.
3. Paste the entire contents of **`ghl-embed/dual-exit-calculator-embed.html`** into it. Save and publish.

The embed is fully self-contained (styles scoped under `.daxc`, no external files) and adapts automatically: if the visitor leaves the property fields blank it acts as a business-only valuation calculator, so one page serves both audiences. Add your own headline, supporting copy and a GHL form/CTA around it on the page — that's where the leads come from.

## Deploy Option B — standalone SEO site at exit.fisherandfisher.au (free, Cloudflare Pages)

The site is pre-configured for `exit.fisherandfisher.au` (canonicals, sitemap, robots.txt).

1. In Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**, pick this repo and the `main` branch (after merging the PR). Build settings: framework **None**, build command **(empty)**, output directory **/** (root).
2. In the Pages project → **Custom domains** → add `exit.fisherandfisher.au`.
3. In the DNS for `fisherandfisher.au` (wherever the domain is managed), add the **CNAME** record Cloudflare shows you: name `exit`, target `<project>.pages.dev`.
4. In [Google Search Console](https://search.google.com/search-console), add `exit.fisherandfisher.au` as a property and submit `https://exit.fisherandfisher.au/sitemap.xml`.

Running both deployments is the intended setup: the GHL page (`fisherandfisher.au/dual-exit-calculator`) for your funnel and podcast links, and this standalone site for Google search traffic.

## Tracking who came from the calculators

Every outbound button and footer link back to `fisherandfisher.au` is tagged with UTM parameters
(`utm_source=exit-calculator`, `utm_campaign=exit-tools`, plus a `utm_content` value naming the exact button).
GoHighLevel attribution and Google Analytics will both show these visitors as coming from the calculator,
per button. The GHL embed uses `utm_medium=embed`; the standalone site uses `utm_medium=referral`.

**Two placeholder URLs must be updated** (marked with `TODO` comments in the three files that use them —
both calculator pages and the GHL embed):

- `https://fisherandfisher.au/scorecard` → your live scorecard page
- `https://fisherandfisher.au/book-a-chat` → your live booking/calendar page

## Before launch checklist

- [ ] Merge the PR, connect the repo to Cloudflare Pages, add the `exit` CNAME (steps above).
- [ ] Replace the two placeholder URLs (`/scorecard`, `/book-a-chat`) with live GHL page URLs — search the repo for `TODO`.
- [ ] Create the GHL page at `fisherandfisher.au/dual-exit-calculator` and paste in `ghl-embed/dual-exit-calculator-embed.html`.
- [ ] Submit the sitemap in [Google Search Console](https://search.google.com/search-console).
- [ ] Review the indicative industry multiples in `calculators.js` and adjust to taste — they're deliberately conservative general ranges.
- [ ] Optional, once there's traffic: apply for Google AdSense (privacy policy and content pages are already in place). For this site, leads are worth far more than ad revenue — consider skipping ads entirely.

## Where the numbers live

All valuation assumptions are in one file, `calculators.js`:

- `INDUSTRY_MULTIPLES` — low/high EBITDA multiple per industry.
- `valueBusiness()` — owner-dependence adjustment (upper/lower half of range) and size factor (×0.8 under $200k EBITDA, ×1.1 over $1m).
- The dual-asset page estimates market rent at a 6% yield when not provided.

## Disclaimer

These tools output general, indicative, pre-tax figures only and are not financial, legal, tax or valuation advice.
