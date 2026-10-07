# WCRP Dev Ops Store — Railway Dynamic Tebex Build

This build is designed for Railway and keeps the storefront catalog synchronized with Tebex.

## Railway variables

Required:
- `TEBEX_PUBLIC_TOKEN` — your Tebex public/headless token. Never use a private/secret token here.

Optional:
- `STORE_NAME=WCRP | Dev Ops`
- `STORE_SUPPORT_URL=https://discord.gg/YOURINVITE`
- `STORE_HERO_TEXT=...`
- `STORE_LOGO=https://...`
- `STORE_HERO_IMAGE=https://...`
- `CATALOG_CACHE_SECONDS=45`

Railway provides `PORT` automatically. `server.js` binds to `0.0.0.0` and reads `PORT`.

## Automatic catalog updates

The browser loads `/api/catalog`. The Railway server retrieves the current Tebex categories/packages and caches the successful result briefly (45 seconds by default). The page refreshes its catalog every 60 seconds while open and refreshes again when a visitor returns to the tab.

Adding, removing, renaming, repricing, recategorizing, or changing package imagery in Tebex therefore does not require a GitHub commit or Railway redeploy. Tebex remains the catalog source of truth.

Basket/sign-in/checkout continue to use Tebex Headless Checkout. The public token is exposed to the browser for those Headless API calls; never place private Tebex credentials in the frontend or `TEBEX_PUBLIC_TOKEN`.

## Deploy

1. Put these files at the root of a GitHub repository.
2. Create/connect a Railway service to that repository.
3. Add `TEBEX_PUBLIC_TOKEN` in Railway Variables.
4. Deploy.
5. In Railway Networking, generate a public domain (or attach your custom domain).
6. Open `/health` to confirm the service is online.

## Health

`GET /health` returns JSON when the web service is running.


## Tebex package/cart setup

This build uses the Tebex Headless add-package payload documented by Tebex: `package_id` and `quantity`. Basket authentication is kept on the Tebex basket and is not resent as a package option.

For consistent GBP pricing, set the webstore/base currency to GBP in Tebex. The storefront intentionally displays the currency and amount returned by Tebex rather than performing a fake browser-side conversion. If Tebex returns EUR, fix the Tebex store/currency configuration so checkout and displayed prices remain authoritative and consistent.

When creating a package, publish it to the desired category and configure its deliverables in Tebex. Tebex supports Discord Actions as package deliverables if you want Tebex itself to assign/remove Discord roles, or webhooks if WCRP DevOps should handle entitlement automation.

## v1.2 visual refresh
- Reworked the storefront proportions, typography, hero treatment, cards, spacing and navigation to match the supplied WCRP reference screenshots more closely.
- Bundles the supplied WCRP Dev Ops transparent logo as `wcrp-dev-logo.png` and uses it by default.
- Keeps the live Tebex catalog/cart behavior from v1.1.
