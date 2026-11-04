/** Public marks are preserved unchanged; provenance and hashes: docs/ASSET_SOURCES.md. */
export type ChapterAsset = {
  logo: string;
  referenceBackground?: string;
};

/** Same-origin assets keep previews and Canvas PNG exports CORS-safe. */
export const CHAPTER_ASSETS: Record<string, ChapterAsset> = {
  ae: { logo: '/chapters/ae.png' },
  es: { logo: '/chapters/es.jpg' },
  pl: { logo: '/chapters/pl.png', referenceBackground: '/brand/reference/pl.jpg' },
  br: { logo: '/chapters/br.png', referenceBackground: '/brand/reference/br.jpg' },
  ua: { logo: '/chapters/ua.jpg' },
  nl: { logo: '/chapters/nl.jpg', referenceBackground: '/brand/reference/nl.jpg' },
  kz: { logo: '/chapters/kz.png' },
  ar: { logo: '/chapters/ar.jpg' },
  th: { logo: '/chapters/th.png' },
  vn: { logo: '/chapters/vn.png' },
  jp: { logo: '/chapters/jp.png' },
  sg: { logo: '/chapters/sg.png' },
  balkan: { logo: '/chapters/balkan.png' },
  kr: { logo: '/chapters/kr.png' },
  de: { logo: '/chapters/de.jpg', referenceBackground: '/brand/reference/de.jpg' },
  us: { logo: '/chapters/us.png' },
  ie: { logo: '/chapters/ie.jpg', referenceBackground: '/brand/reference/ie.jpg' },
  ge: { logo: '/chapters/ge.jpg' },
  uk: { logo: '/chapters/uk.png' },
  my: { logo: '/chapters/my.jpg' },
  tr: { logo: '/chapters/tr.jpg', referenceBackground: '/brand/reference/tr.jpg' },
  ca: { logo: '/chapters/ca.jpg', referenceBackground: '/brand/reference/ca.jpg' },
  in: { logo: '/chapters/in.jpg' },
  au: { logo: '/chapters/au.png' },
  ng: { logo: '/chapters/ng.png' },
  it: { logo: '/chapters/it.jpg' },
  fr: { logo: '/chapters/fr.jpg' },
};
