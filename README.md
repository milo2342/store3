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
