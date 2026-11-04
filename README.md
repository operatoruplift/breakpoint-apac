# Breakpoint APAC

A standalone community card studio inspired by [Going to Breakpoint](https://goingtobreakpoint.com/), redesigned for missing Superteam chapters and APAC. Independent project; no Operator Uplift application code, services or credentials are required.

Production: [breakpoint-apac.vercel.app](https://breakpoint-apac.vercel.app/).

## Run locally

Requires Node.js 22 or newer and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3107. Production: `pnpm build && pnpm start`.

## Included

- 27 chapters with real chapter logos, with Vietnam, Korea, Japan, Thailand, Singapore, Malaysia, India, Australia and Kazakhstan first.
- Chapter departure airports, searchable directory and custom community cards.
- Editable name, X handle and role; manual photo upload with zoom and position controls.
- Boarding pass and The statement designs with original regional architecture and cultural motifs for every chapter, plus a Base template focused on your name and profile photo.
- Landscape (1600×900), square (1080×1080) and story (1080×1920) PNG exports.
- Live full-resolution Canvas preview, clipboard PNG, native file sharing, X composer and shareable chapter/style presets.
- Optional public X name/photo import, with manual entry available if the provider is unavailable.
- Responsive layout, keyboard controls, labeled fields and reduced-motion support.

Generation is deterministic image compositing, as on the reference site. It does not call an AI image model or charge generation fees. Images are promotional cards, not event tickets.

## Branding and artwork

The studio uses the reference site's publicly served BP26 Extended and Favorit fonts and Breakpoint wordmark, plus public Solana Breakpoint marks and pixel styling. All 27 chapter marks are stored unchanged from Superteam's public directory and the reference site. Source URLs and file hashes are recorded in [docs/ASSET_SOURCES.md](docs/ASSET_SOURCES.md) and `public/brand/asset-manifest.json`.

Generated cards use new Canvas compositions and original regional illustrations: for example, Vietnam's lotus and Saigon skyline, Korea's hanok and N Seoul Tower, Japan's Fuji and torii, Singapore's Marina Bay and Supertrees, and Malaysia's Petronas towers and batik geometry. The neutral Base template keeps the same upload, name and sharing controls with geometric event artwork.

Original reference canvases are retained in `public/brand/reference/` for traceability; the new chapter designs do not render those complete canvases. The implementation draws on the reference's public HTML, CSS, browser JavaScript and assets. No private repository or unpublished source was accessed. Asset ownership remains with the respective owners; this independent community project does not claim official endorsement.

## Privacy and the optional profile service

Manual photos and text are composed in browser memory, without upload or persistence. Explicitly choosing **Import from X** sends the public handle through `/api/breakpoint/profile` to `goingtobreakpoint.com`. Only that handle is forwarded. The external provider's availability and retention are outside this project's control; the proxy itself uses private no-store responses and does not log or persist profiles. Downloading/copying stays on the device; native sharing and X posting are user actions.

The proxy validates handles, pins the upstream host, rejects redirects, bounds JSON/JPEG streams, times out after ten seconds and rate-limits requests. Quotas are per process: 120 requests per hour per source and a 1,200-per-hour instance ceiling, with two requests per successful import. A deployment that needs shared quotas across instances should attach a durable limiter.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test
```

Playwright uses the production server. Provider tests use bounded fixtures; browser tests exercise uploads, crop changes, real PNG downloads, formats, chapters, presets, profile import/failure and mobile layout. Test screenshots go into `output/`. For remote studio checks, run `PLAYWRIGHT_BASE_URL=https://breakpoint-apac.vercel.app pnpm exec playwright test tests/e2e/breakpoint-studio.spec.ts --workers=1`. See `VERIFICATION.md` for results and the observed remote click-stability limitation.

## Customize and deploy

- Chapter data: `app/lib/chapters.ts`.
- Card composition: `app/lib/render-card.ts`; regional illustrations: `app/lib/region-art.ts`; chapter marks: `app/lib/chapter-assets.ts`.
- Studio and styling: `app/BreakpointStudio.tsx`, `app/breakpoint.module.css`.
- Set `NEXT_PUBLIC_SITE_URL` to your production origin for canonical metadata. Deploy as a normal Next.js application with a Node.js runtime; static-only hosting cannot serve the optional profile proxy.
- `/breakpoint` redirects to the homepage for compatibility with existing preset links.

Event details were checked against [Solana's Breakpoint page](https://solana.com/breakpoint): November 15-17, 2026, Olympia London. Chapter coverage combines the reference's roster with [Superteam's directory](https://superteam.fun/), checked October 23, 2026. Brand and chapter asset provenance is in [docs/ASSET_SOURCES.md](docs/ASSET_SOURCES.md); retained open-source font licenses are in `public/fonts/`.

## Maintained dependency fork

`pnpm.overrides` routes the build-time `braces` dependency through the attributed MIT fork `@operator-uplift/braces@3.0.3-uplift.1` in `vendor/braces`. The unpatched upstream release is affected by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The fork enforces parser depth and iterative AST validation limits; its README records every modification and its original license is retained. This project is responsible for maintaining the vendored copy and reviewing upstream fixes before removing the override. `tests/e2e/vendor-braces.spec.ts` verifies the installed Next lint → fast-glob → micromatch consumer, normal nested/range patterns, and hostile strings and ASTs. No advisory exceptions are configured.

Run `pnpm audit` and `pnpm audit --prod` when updating dependencies; both must complete without advisories.
