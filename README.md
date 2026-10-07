# WCRP DevOps Store — Railway / Tebex Headless

Flat-file storefront build. There are no folders in the deployment ZIP.

## Railway
1. Put every file from the ZIP at the repository root.
2. Start with `npm start`.
3. Set `TEBEX_PUBLIC_TOKEN` to the Tebex Headless **public token**. Do not use a private API key.
4. Optional variables: `STORE_NAME`, `STORE_SUPPORT_URL`, `STORE_HERO_TEXT`.
5. The server uses Railway `PORT` and falls back to `8080`.

## Live Tebex catalog
Categories and packages are read from Tebex at runtime. Adding, removing, renaming, repricing, or changing package media in Tebex is reflected by the storefront without hard-coding products. The page refreshes the catalog periodically while open.

## Sign-in and purchase flow
The storefront creates one Tebex basket and keeps its basket ident in local storage. When the customer buys while signed out, it requests the basket-specific authentication providers from Tebex and prioritizes Discord when Tebex returns Discord. After Tebex redirects back, the same basket is polled until Tebex confirms the authenticated customer.

Adding a package uses Tebex's basket-only endpoint `/api/baskets/{basketIdent}/packages` with `package_id` and `quantity`. The POST response is used immediately for the website cart so a briefly stale follow-up GET cannot erase a successful add. Checkout uses `basket.links.checkout`.

Your existing Tebex Discord Actions remain responsible for assigning purchased Discord roles. The storefront does not grant Discord roles itself.

## Visual/cache note
Version 2.2 disables long-lived caching for HTML, JS, and CSS and also cache-busts the stylesheet/script URLs. This matters when redeploying visual changes: browsers should no longer keep a previous storefront design for 24 hours.

## Product pages
Clicking a product opens the full-page dark DevOps Store detail layout. If Tebex supplies package `media` images, they are rendered as a thumbnail gallery automatically.
