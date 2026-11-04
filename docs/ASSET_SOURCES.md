# Public brand and chapter assets

Retrieved on 23 October 2026 for the user-requested Breakpoint chapter card generator.

## Source and use

- Official event: [Solana Breakpoint](https://solana.com/breakpoint). Its unchanged BP26 navigation mark, pixel edge, and desktop footer wordmark are retained under `/brand/`. The user wrote breakpoint.com; that domain currently shows an unrelated domain placeholder, so the project uses the Solana event identity visible on the supplied reference site.
- Reference implementation: [Going to Breakpoint](https://goingtobreakpoint.com/). The public site supplies the unchanged Breakpoint SVG wordmark, BP26 Extended and Favorit Regular webfont files, Italy and Ferno/France chapter marks, and original chapter artwork. Its published Astro HTML, stylesheet and browser JavaScript were inspected for palette, typography, graphic composition, chapter identity, and export/share behavior. No private repository or unpublished source was accessed.
- Chapter identities: [Superteam official directory](https://superteam.fun/). Its public directory links to each official chapter and publishes the Cloudinary logo image URLs used for 25 of the 27 chapters. The two remaining marks (Italy and Ferno/France) come directly from the supplied reference site's chapter list.
- All 27 marks are stored unchanged. The nine APAC entries (Vietnam, Korea, Japan, Thailand, Singapore, Malaysia, India, Australia, Kazakhstan) use the official directory logos. No synthesized chapter marks or flag-substitute logos are used.
- The new regional vector compositions in the generator are original illustrations inspired by the named cultural and architectural motifs; they are separate from the unchanged chapter marks.
- Publicly served artwork and type remain the property of their respective owners. Their inclusion does not assert an official partnership, endorsement, audit, or ownership transfer.

## Technical contract

`app/lib/chapter-assets.ts` exports `CHAPTER_ASSETS`, keyed by the project's chapter IDs, with `logo` and optional `referenceBackground` same-origin URLs. Same-origin raster marks work in browser Canvas exports without third-party CORS dependencies. The original SVG wordmark is `/brand/breakpoint.svg`; the two webfonts are at `/brand/fonts/bp26-extended.woff2` and `/brand/fonts/favorit-regular.woff2`.

Seven complete original reference canvases and three supporting artwork files are retained under `/brand/reference/`. Complete canvases already contain artwork and text and therefore require their original photo/text placements if used as templates. Availability in the registry does not mean that a new regional card renders that original canvas.

Reference palette inspected from its published CSS: canvas `#0b0b0b`, foreground `#ffffff`, muted `#a2a2a2`, green `#14f195`, purple `#9945ff`, blue `#3c91ff`, pink `#ff7a85`.

A machine-readable copy of every source URL, size, and SHA256 is at `public/brand/asset-manifest.json`. Files were downloaded directly from the listed URLs and their bytes were not edited.

## Source inventory

| Local public asset / original source | Bytes | SHA256 |
| --- | ---: | --- |
| [brand/fonts/favorit-regular.woff2](https://goingtobreakpoint.com/fonts/favorit-regular.woff2) | 33,888 | `6ec3b84234088f8eb9f0a8e5b6c01c32e17571a285884322229815bbe8f2e0d3` |
| [brand/fonts/bp26-extended.woff2](https://goingtobreakpoint.com/fonts/bp26-extended.woff2) | 12,716 | `82e68397532b8ef5398f9930e68464370cfacaf23c4b7c54510dad0152fcc6ed` |
| [brand/breakpoint.svg](https://goingtobreakpoint.com/t/breakpoint.svg) | 5,500 | `c3f277af75684abd3e52a758c6e44f5dee7063aea68162c96b3e7d17a3a3a224` |
| [chapters/ae.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/uae.png) | 1,803 | `181c813d5c0c37312ec1eeba20e089ad5d7fad76f299ae2ea4c34ca57706d0b1` |
| [chapters/es.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/spain.jpg) | 12,417 | `3ddb743c52156e3a3055892a1b8bee6b41bb5c57b60faaf22097c4b21458e13d` |
| [chapters/pl.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/poland.png) | 3,917 | `170ad4a446a74db4ed014ee4c486314f853d3b7201a242a49bb6bcdcb851abf2` |
| [chapters/br.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/brazil.png) | 21,725 | `2e8303e49f1b05c12cee53813d877a21fdb30a170ab1860e671a244863d80e06` |
| [chapters/ua.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/ukraine.jpg) | 9,290 | `b3d5fc668476787395284795f59f6a3a15dac981a600f6d5cc62c8b2a144e1e4` |
| [chapters/nl.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/netherlands.jpg) | 10,115 | `9b52ebe722af309dd4a272debb761060d6b275dcec43984043d3d99ec50a05f2` |
| [chapters/kz.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/kazakhstan) | 2,595 | `9206ecaaf41f193697cc60955566b3073dd376bb6ce04ddce53293f39672ac3a` |
| [chapters/ar.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/argentina.jpg) | 10,718 | `46f5b17f1abd41e37a0240690090b429a7e9a4b2476ec9adbf274b91698ab10c` |
| [chapters/th.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/thailand.png) | 4,281 | `3ef881b599de43b494c7aaf9515294322a5f66690612a992f15e293d2406124b` |
| [chapters/vn.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/vietnam) | 345,758 | `ac5f9a1f92cfbd74b6146c6ae4d372901c241831d51fa6549c5f016835cb298e` |
| [chapters/jp.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/japan.png) | 3,811 | `6f3ce7f87200626a1161a7ca081c999ad4080fc2e8e0ecaea8dc1443a4a4bbda` |
| [chapters/sg.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/singapore.png) | 9,008 | `67282f00d0c3b3d457ba6691095daa437500650cd7f1853bd58b96eb4c603441` |
| [chapters/balkan.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/balkan.png) | 15,140 | `038ca47e8965f4ce354ccad038d6fe2acc5ddf508d27e2954f542bd2fae8a15e` |
| [chapters/kr.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/korea.png) | 5,358 | `7baa62224afce5b8edc8bba30984a97002324e43205d705133ab6a2eaca05650` |
| [chapters/de.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/germany.jpg) | 8,846 | `fc3520955390fa3f6ed8f713072cb5118611f60f55a387260f80d380ee65f9db` |
| [chapters/us.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/usa) | 3,131 | `c02ae8db738709b4fb3d6d328ad0ddc719e25308971204616a58196a48e7cdf5` |
| [chapters/ie.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/ireland.jpg) | 7,017 | `9701afd7ae5baf60a364844afdf5ec29d70441210be5caf662c960d2427b0ea5` |
| [chapters/ge.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/georgia.jpg) | 13,110 | `2c2c96d9658111733f28b8b38713890cd67f900097b430cf4877a53f8e2b2722` |
| [chapters/uk.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/uk.png) | 3,043 | `e608ac4c97d2bdd8bc9b249a776a83a2f41c0ffc22c3961833ade84c10cb7b56` |
| [chapters/my.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/malaysia.jpg) | 5,763 | `248be04b6e88cb7106e97f6cf829d9b907f6d3345d6cf0ff0d694c0f0e251de8` |
| [chapters/tr.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/v1732825014/assets/superteams/logos/turkey.jpg) | 5,211 | `505760351ce8aa4708d5494b6ab4a6e167b52ea5cfed2b850e5b10728c34b9c1` |
| [chapters/ca.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/v1779083445/IMG_3222_rzwlit.jpg) | 48,091 | `07c8de254fd6a3ec76b4c6e9ff98e66a84ad093a2ab973e12497626341a1f6b2` |
| [chapters/in.jpg](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/india.jpg) | 5,841 | `4a073bedcf98a151bf24cef09c7df8d73b3c71810967fe69efdb747c401f7fbf` |
| [chapters/au.png](https://res.cloudinary.com/dgvnuwspr/image/upload/v1772436841/2_avgpvg.png) | 62,643 | `89326418b45813b48c96d5c611c57fb80f0e97fa8de78eceb39a4f3f8f293e81` |
| [chapters/ng.png](https://res.cloudinary.com/dgvnuwspr/image/upload/assets/superteams/logos/nigeria.png) | 11,501 | `a25b7a05ab9b4458493bf7d4b3ab22c4597340c6a98ebd5235f5dcbec44f450a` |
| [chapters/it.jpg](https://goingtobreakpoint.com/logo/it.jpg) | 9,273 | `bec8b23cbd27f5eb78f2ab059f0315635b6672c63d0b9c2b0be7147f881fdacb` |
| [chapters/fr.jpg](https://goingtobreakpoint.com/logo/fr.jpg) | 11,828 | `126fcf3434bc40661f6d17b3dc0071e9dc5ba002e2784227fdc26a1ed94a1607` |
| [brand/reference/de.jpg](https://goingtobreakpoint.com/t/de.jpg) | 131,157 | `b05b98e631b57296e4d734b2fb4cdab3e3735caea998367ca9533187798f40a0` |
| [brand/reference/nl.jpg](https://goingtobreakpoint.com/t/nl.jpg) | 159,336 | `8cfce4a34623b6bc944218b1142f4cde7e97508ebc57a889fd8126b43b4c47e8` |
| [brand/reference/ie.jpg](https://goingtobreakpoint.com/t/ie.jpg) | 85,364 | `b4d1f1786d5a4eff9dab69e2e9512ee62476fc9b2b258ce5c8211c5f6142e7d5` |
| [brand/reference/ie-over.png](https://goingtobreakpoint.com/t/ie-over.png) | 14,718 | `529b1a1bda95604db54a1e9c506de9bf4de949f7392d8c815244bdddc4d2f114` |
| [brand/reference/pl.jpg](https://goingtobreakpoint.com/t/pl.jpg) | 56,421 | `e80fc2fa82e95c9ddd829b7aaed178d37d56fc252428efdb1d48962349308fc8` |
| [brand/reference/it-london.jpg](https://goingtobreakpoint.com/t/it-london.jpg) | 95,030 | `455c5b98100d1ece9aa8605d233b92ee70268f46cc8bc0c68f9035139ca77514` |
| [brand/reference/tr.jpg](https://goingtobreakpoint.com/t/tr.jpg) | 151,543 | `83036036fc7266edcdfd2a33fda9f96a22f8156ef9ad48a7b3b38e0fc97c1971` |
| [brand/reference/br.jpg](https://goingtobreakpoint.com/t/br.jpg) | 170,804 | `bd62df90826dccb7e6e4bc10d837fc598e21eba044bd02a79c1c01e865ef2677` |
| [brand/reference/ca.jpg](https://goingtobreakpoint.com/t/ca.jpg) | 132,979 | `abfb8e182754111de0712749c0f60067f6b3dfed62e75e0424e8f7c2ea78a86c` |
| [brand/reference/ca-over.png](https://goingtobreakpoint.com/t/ca-over.png) | 45,402 | `78097c901b3b4a5dc8c0ced7913f701ae355941659703dd0eaaf8afd5275a576` |

| [brand/bp26-mark.svg](https://solana.com/breakpoint-assets/assets/nav-bp26.svg) | 1,785 | `f8e21457a1c31b585cc0a7e8ad0348dfb4e40aa054242c93e7046bd8f47c9d59` |
| [brand/pixel-edge.svg](https://solana.com/breakpoint-assets/assets/pixel-edge.svg) | 435 | `ca73ff0cae7a8a018df7be86a368bdc13286edbd8308c6106311a971b345ddc1` |
| [brand/official-breakpoint-wordmark.svg](https://solana.com/breakpoint-assets/assets/breakpoint-footer-logo-desktop.svg) | 5,643 | `556146ec953fc4466a8deea941e741fb7fb1a0048d7750f3b3dc4acc30308bcb` |
