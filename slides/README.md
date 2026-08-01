# NoteDeck — a monetizable micro-app (Mardox "6-Figure Apps" style)

**What it is:** paste plain notes → get a clean, presentable slide deck instantly.
Present fullscreen, export to PDF. 100% client-side — no backend, no accounts,
no hosting cost beyond the static site you already have.

**Live path:** `/slides/` on the same deployment as the exit calculators
(e.g. `https://exit.fisherandfisher.au/slides/`). It also works opened straight
from disk or on any static host (Cloudflare Pages, Netlify, GitHub Pages).

## The monetization model

Classic freemium micro-app, one-time payment (no subscription to manage):

| | Free | Pro (one-time, default A$29) |
|---|---|---|
| Slides per deck | 8 | Unlimited |
| Themes | 2 | All 6 |
| "Made with NoteDeck" badge | On slides + PDF | Removed |

Pro is unlocked with a **license key** (`NDK-XXXXX-XXXXX-XXXXX`) that the buyer
pastes in once. Keys are validated offline in the browser — no server needed.

## Launch checklist (≈30 minutes)

1. **Create a payment link.** Easiest options:
   - [Stripe Payment Links](https://stripe.com/au/payments/payment-links): create a A$29 one-time product called "NoteDeck Pro".
   - Or [Gumroad](https://gumroad.com) / [Lemon Squeezy](https://lemonsqueezy.com) if you prefer them to handle GST/VAT for you.
2. **Wire it up.** In `slides/app.js`, set `CONFIG.paymentUrl` to your payment
   link (and adjust `CONFIG.price` if you change the price). Until you do, the
   "Get Pro" button shows a friendly "payments not connected yet" notice.
3. **Generate license keys:**
   ```bash
   node slides/generate-keys.mjs 50
   ```
   This prints 50 valid keys. Keep the list private.
4. **Deliver keys automatically.** In Stripe/Gumroad, set the post-purchase
   confirmation email to include one key per customer (paste a batch into your
   payment provider's fulfilment note, or send them manually at first — at
   early volume, manual is fine and lets you talk to every customer).
5. **Deploy.** Merge to `main`; Cloudflare Pages picks it up automatically if
   the site is already connected. The page is in `sitemap.xml` for SEO.

## How the license works (honest notes)

- Keys are checked with a salted hash **in the browser** (`app.js`), and the
  generator (`generate-keys.mjs`) uses the same salt. Anyone technical enough
  to read the source could forge a key — that's the accepted trade-off for a
  zero-backend product, and it's how most indie micro-apps start.
- When revenue justifies it, upgrade to real verification: Gumroad's license
  API or a Stripe webhook + a tiny Cloudflare Worker (still ~free) that issues
  and checks keys server-side.
- Changing `licenseSalt` invalidates every key already sold — don't.

## Ideas to grow it (straight from the micro-app playbook)

- The free tier's "Made with NoteDeck" badge on shared PDFs is the built-in
  viral loop — every exported free deck advertises the app.
- Add a dedicated domain later (e.g. `notedeck.app`) once it has traction;
  everything is relative-path so it moves with zero code changes.
- Post it on Product Hunt / Hacker News / LinkedIn with a 30-second demo GIF.
- Price-test: A$19 vs A$29 vs A$39. One-time pricing converts far better than
  subscriptions for tools like this.

## Files

- `index.html` — landing page + the app (editor, live preview, pricing, FAQ)
- `slides.css` — site styles, 6 slide themes, print/PDF layout
- `app.js` — parser, renderer, presenting, exporting, license gating (all vanilla JS)
- `generate-keys.mjs` — offline license key generator (run with Node)
