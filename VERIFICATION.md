# Verification — October 23, 2026

## Current branding update

- `pnpm test`: 59 passed against the production build before the final regional-art contrast adjustment.
- Scoped ESLint for `app/lib/region-art.ts`: passed after that adjustment.
- Final local `pnpm build` and strict lint: passed after the contrast adjustment.
- Final local studio browser checks: 16 passed after the contrast adjustment.
- Final TypeScript check and lint for the deployment-aware test assertions: passed.

The browser suite exercises chapter and airport changes, local photo upload/cropping/removal, actual PNG downloads and pixels, the three designs and export dimensions, custom communities, directory search, preset links, profile import and failure recovery, upload/import races, name-edit preservation, sharing fallback and mobile overflow. Provider fixtures cover bounded response streams, request IDs, fixed-origin requests and quota behavior. Dependency-fork tests exercise the installed package through its actual consumer.

## Visual and asset checks

All 27 regional illustrations were rendered in Chromium and visually inspected as a contact sheet. The final contrast pass increases dark-card architecture and motif legibility without changing geometry. The renderer provides Boarding pass, The statement and Base template designs across landscape, square and story formats. The Base template uses neutral geometric artwork with the same name/photo upload and export controls.

All 27 real chapter logos, the reference's BP26 Extended/Favorit fonts and wordmark, and public Solana Breakpoint marks are bundled locally. Sources and SHA256 hashes are in `docs/ASSET_SOURCES.md` and `public/brand/asset-manifest.json`. New card compositions and regional illustrations are original work. Retained reference canvases are source materials, not the generated chapter backgrounds. No private source repository was accessed.

## Earlier standalone baseline

The initial standalone version passed its production build, TypeScript, strict lint, 56 browser tests, full-tree and production dependency audits with zero known vulnerabilities, and code/security review. Those earlier results do not replace the final checks for this update.

The optional profile proxy previously returned a public profile and a valid JPEG from the reference service; its timeout path also behaved as expected. Provider availability remains external, and manual card creation does not depend on it.

## Production deployment

[breakpoint-apac.vercel.app](https://breakpoint-apac.vercel.app/) is deployed on Vercel. Deployment `dpl_DvHJL1yZe7TEbpx4rRLtrQpF6iYw` reached READY, and an anonymous homepage request returned HTTP 200. Vercel built the uploaded Next.js source with Node.js 24 in 19 seconds.

Post-deployment checks confirmed all 27 logos, the reference fonts/wordmark, all nine APAC exports, name/photo uploads, all three export sizes, Base template, presets, directory search, profile import recovery, clipboard PNG generation and X composer text. Independent visual checks passed at 1440px desktop, 390px mobile and a short 1280×720 desktop window, with no console/page errors, clipping or trapped controls.

The latest remote Playwright run completed 15 of 16 checks; the desktop sharing test hit a 60-second click-stability timeout while scrolling to the Share button. Trace review found successful asset loads and no browser errors; once the click ran, all PNG/composer assertions passed. The same test passed in earlier production runs, and independent Share → Copy → Share checks passed within ten seconds at 1280×720. This remains a test-actionability limitation, not a reproduced share-handler failure. Remote tests allow more initial loading time; the local limits and functional assertions remain unchanged.

The deployed profile API returned HTTP 200 for the public SuperteamVN name/handle and a valid 20,430-byte JPEG; malformed handles returned HTTP 400 with request IDs and private no-store responses. Vercel error/fatal runtime-log queries returned no entries during the post-deployment verification window. All 82 deployed runtime source/asset files match the final local source hashes. Deployment was from uploaded source files, without a Git commit or remote connection.
