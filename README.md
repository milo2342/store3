# WCRP Dev Ops Store — Netlify-style Railway build

This rebuild uses the storefront layout and interaction code recovered from the pasted Netlify change output, with the WCRP DEV logo bundled locally.

## Railway
1. Upload these files to the root of the store GitHub repository.
2. Keep/start with `npm start`.
3. Add `TEBEX_PUBLIC_TOKEN` in Railway Variables. This is the Tebex **public** token only.
4. Optional: `STORE_NAME`, `STORE_SUPPORT_URL`, `STORE_HERO_TEXT`.
5. The server listens on Railway's `PORT`; locally it defaults to `8080`.
6. In Public Networking, target the port shown in the deployment log. If Railway does not inject PORT, it will be 8080.

## Tebex
Packages/categories are loaded live from the Tebex Headless API. Adding/removing/changing a Tebex package updates the site without editing the storefront code. Prices/currency are displayed from Tebex; configure GBP in Tebex if you want checkout and storefront prices in pounds.

The cart is a Tebex basket. Authentication options are supplied by Tebex. Checkout redirects to Tebex.

## Logo
The WCRP DEV logo is loaded from the configured Discord CDN URL, so this repository remains completely flat with no asset folders.


## Cart / sign-in notes
- Add to cart now adds the package to the Tebex basket immediately; authentication is required before checkout, not before adding.
- Authentication buttons are generated only from providers returned by Tebex. If Discord is enabled for your Tebex store, a prominent **Sign in with Discord** button appears automatically. The storefront does not fake a Discord login that Tebex has not authorized.
- Checkout uses the checkout URL returned by the live Tebex basket.
- Packages with required Tebex options cannot be safely one-click added without option values; the cart now shows a clear error instead of silently failing. Configure those product options in Tebex or add an option-selection UI for that product.


## Cart sync fix
This build uses Tebex's documented Headless basket package endpoint under `/accounts/{publicToken}/{basketIdent}/packages` and immediately uses the basket returned by the POST response to update the on-site cart. This prevents a successful Tebex add from being followed by a stale on-site cart read. Removal uses the matching documented endpoint as well.
