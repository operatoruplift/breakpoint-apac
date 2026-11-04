import type { Chapter } from './chapters';
import { CHAPTER_ASSETS } from './chapter-assets';
import { drawRegionArtScene, getRegionArtLabel } from './region-art';

export type CardDesign = 'boarding' | 'poster' | 'minimal';
export type CardFormat = 'landscape' | 'square' | 'story';

export const CARD_FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  landscape: { width: 1600, height: 900, label: 'Landscape' },
  square: { width: 1080, height: 1080, label: 'Square' },
  story: { width: 1080, height: 1920, label: 'Story' },
};

export type CardOptions = {
  chapter: Chapter;
  name: string;
  handle: string;
  role: string;
  departure: { code: string; city: string };
  design: CardDesign;
  format: CardFormat;
  photo?: HTMLImageElement;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

type Box = { x: number; y: number; width: number; height: number };
type Palette = { background: string; ink: string; muted: string; accent: string; ticket: string; ticketInk: string };
type CardLayout = {
  margin: number;
  headlineTop: number;
  headlineSize: number;
  headlineWidth: number;
  chapterTop: number;
  chapterSize: number;
  chapterWidth: number;
  art: Box;
  photo: Box;
  ticket: Box;
  identityTop: number;
  footerTop: number;
};

const BODY_FONT = 'Favorit, Arial, Helvetica, sans-serif';
const DISPLAY_FONT = '"Breakpoint Display", "Arial Black", Arial, sans-serif';
const MONO_FONT = '"Courier New", monospace';
const BRAND_LIME = '#d4ff00';
const imageCache = new Map<string, Promise<HTMLImageElement>>();
const renderVersions = new WeakMap<HTMLCanvasElement, number>();
let fontsReady: Promise<void> | undefined;

function loadImage(path: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(path);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const url = new URL(path, window.location.href);
    if (url.origin !== window.location.origin) {
      reject(new Error('Card graphics must be served from this site.'));
      return;
    }
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      reject(new Error('Card graphics took too long to load. Please try again.'));
    }, 15000);
    image.onload = () => {
      window.clearTimeout(timeout);
      if (image.naturalWidth && image.naturalHeight) resolve(image);
      else reject(new Error('A card graphic could not be read. Please try again.'));
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('A card graphic could not be loaded. Please try again.'));
    };
    image.src = url.href;
  });
  imageCache.set(path, pending);
  void pending.catch(() => imageCache.delete(path));
  return pending;
}

function loadFonts(): Promise<void> {
  if (!fontsReady) {
    // fonts.ready alone does not request a face that has only been used on canvas.
    fontsReady = Promise.all([
      document.fonts.load('400 48px "Breakpoint Display"'),
      document.fonts.load('400 24px Favorit'),
    ]).then(([display, body]) => {
      if (!display.length || !body.length) throw new Error('The Breakpoint fonts could not be loaded. Please refresh and try again.');
    }).catch((error: unknown) => {
      fontsReady = undefined;
      throw error;
    });
  }
  return fontsReady;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function clean(value: string, fallback = ''): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120) || fallback;
}

function palette(design: CardDesign, accent: string): Palette {
  const safeAccent = /^#[\da-f]{6}$/i.test(accent) ? accent : '#dcff65';
  if (design === 'minimal') {
    return { background: '#fafaf5', ink: '#101010', muted: '#555650', accent: BRAND_LIME, ticket: BRAND_LIME, ticketInk: '#101010' };
  }
  if (design === 'poster') {
    return { background: BRAND_LIME, ink: '#101010', muted: '#40462a', accent: safeAccent, ticket: '#101010', ticketInk: '#fafaf5' };
  }
  return { background: '#101010', ink: '#fafaf5', muted: '#b5b5ab', accent: safeAccent, ticket: BRAND_LIME, ticketInk: '#101010' };
}

function layout(format: CardFormat): CardLayout {
  if (format === 'landscape') {
    return {
      margin: 64, headlineTop: 168, headlineSize: 120, headlineWidth: 1030,
      chapterTop: 368, chapterSize: 30, chapterWidth: 970,
      art: { x: 64, y: 454, width: 1000, height: 150 },
      photo: { x: 1166, y: 181, width: 350, height: 350 },
      ticket: { x: 64, y: 626, width: 1472, height: 146 },
      identityTop: 802, footerTop: 876,
    };
  }
  if (format === 'story') {
    return {
      margin: 58, headlineTop: 234, headlineSize: 122, headlineWidth: 964,
      chapterTop: 474, chapterSize: 34, chapterWidth: 964,
      art: { x: 58, y: 1195, width: 964, height: 248 },
      photo: { x: 282, y: 626, width: 516, height: 516 },
      ticket: { x: 58, y: 1480, width: 964, height: 210 },
      identityTop: 1738, footerTop: 1874,
    };
  }
  return {
    margin: 50, headlineTop: 152, headlineSize: 110, headlineWidth: 980,
    chapterTop: 355, chapterSize: 28, chapterWidth: 555,
    art: { x: 50, y: 461, width: 560, height: 251 },
    photo: { x: 678, y: 401, width: 300, height: 300 },
    ticket: { x: 50, y: 760, width: 980, height: 160 },
    identityTop: 950, footerTop: 1048,
  };
}

function roundedRect(ctx: CanvasRenderingContext2D, box: Box, radius: number): void {
  const r = Math.min(radius, box.width / 2, box.height / 2);
  ctx.beginPath();
  ctx.moveTo(box.x + r, box.y);
  ctx.lineTo(box.x + box.width - r, box.y);
  ctx.quadraticCurveTo(box.x + box.width, box.y, box.x + box.width, box.y + r);
  ctx.lineTo(box.x + box.width, box.y + box.height - r);
  ctx.quadraticCurveTo(box.x + box.width, box.y + box.height, box.x + box.width - r, box.y + box.height);
  ctx.lineTo(box.x + r, box.y + box.height);
  ctx.quadraticCurveTo(box.x, box.y + box.height, box.x, box.y + box.height - r);
  ctx.lineTo(box.x, box.y + r);
  ctx.quadraticCurveTo(box.x, box.y, box.x + r, box.y);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  maxWidth: number,
  weight = 700,
  family = BODY_FONT,
): void {
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  // Canvas scales unusually long names within the same box used in the preview.
  ctx.fillText(clean(value), x, y, maxWidth);
  ctx.restore();
}

function trackedText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  maxWidth: number,
  spacing = 2.1,
): void {
  ctx.save();
  ctx.font = `700 ${size}px ${MONO_FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  const characters = Array.from(clean(value));
  const widths = characters.map((character) => ctx.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, characters.length - 1) * spacing;
  const scale = total > maxWidth ? maxWidth / total : 1;
  ctx.translate(x, y);
  ctx.scale(scale, 1);
  let cursor = 0;
  characters.forEach((character, index) => {
    ctx.fillText(character, cursor, 0);
    cursor += widths[index] + spacing;
  });
  ctx.restore();
}

function containImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, box: Box): void {
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, box.x + (box.width - width) / 2, box.y + (box.height - height) / 2, width, height);
}

function wordmark(ctx: CanvasRenderingContext2D, image: HTMLImageElement, box: Box, color: string): void {
  // Tint the supplied transparent SVG without replacing or approximating its paths.
  const mask = document.createElement('canvas');
  mask.width = Math.ceil(box.width);
  mask.height = Math.ceil(box.height);
  const maskContext = mask.getContext('2d');
  if (!maskContext) throw new Error('Your browser could not draw the Breakpoint logo.');
  containImage(maskContext, image, { x: 0, y: 0, width: box.width, height: box.height });
  maskContext.globalCompositeOperation = 'source-in';
  maskContext.fillStyle = color;
  maskContext.fillRect(0, 0, mask.width, mask.height);
  ctx.drawImage(mask, box.x, box.y);
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.moveTo(x + width - 15, y - 12);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width - 15, y + 12);
  ctx.stroke();
  ctx.restore();
}

function backdrop(ctx: CanvasRenderingContext2D, width: number, height: number, card: CardLayout, colors: Palette, design: CardDesign): void {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.fillStyle = design === 'poster' ? '#101010' : colors.accent;
  ctx.globalAlpha = design === 'minimal' ? 0.07 : 0.13;
  // Flat offset ribbons follow the reference site's angular, printed identity.
  for (let index = 0; index < 3; index += 1) {
    const left = card.photo.x - 34 + index * 24;
    const top = card.photo.y - 27 + index * 14;
    ctx.beginPath();
    ctx.moveTo(left, top + 42);
    ctx.lineTo(left + 42, top);
    ctx.lineTo(left + card.photo.width + 40, top);
    ctx.lineTo(left + card.photo.width, top + card.photo.height + 40);
    ctx.lineTo(left - 24, top + card.photo.height + 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function regionalArtwork(ctx: CanvasRenderingContext2D, options: CardOptions, card: CardLayout, colors: Palette): void {
  const box = card.art;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  if (options.design === 'minimal' || options.chapter.id === 'custom') {
    // The base template deliberately has no country-specific landmarks.
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2;
    for (let index = 0; index < 5; index += 1) {
      const inset = index * 22;
      ctx.beginPath();
      ctx.moveTo(box.x + inset, box.y + box.height);
      ctx.lineTo(box.x + box.width * 0.23 + inset, box.y + 24);
      ctx.lineTo(box.x + box.width - inset, box.y + 24);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    trackedText(ctx, 'SEE YOU IN LONDON', box.x + 12, box.y + box.height - 34, 17, colors.ink, box.width - 24, 2.1);
  } else {
    trackedText(ctx, getRegionArtLabel(options.chapter.id).toUpperCase(), box.x, box.y, 11, colors.muted, box.width, 1.4);
    ctx.translate(box.x, box.y + 24);
    drawRegionArtScene(ctx, options.chapter.id, box.width, box.height - 24, colors.accent, options.design);
  }
  ctx.restore();
}

function initials(name: string): string {
  const words = clean(name, 'Your Name').split(/\s+/);
  return (words.length > 1 ? `${Array.from(words[0])[0]}${Array.from(words[words.length - 1])[0]}` : Array.from(words[0]).slice(0, 2).join('')).toUpperCase();
}

function photoIsLocal(photo: HTMLImageElement): boolean {
  const source = photo.currentSrc || photo.src;
  if (/^(blob:|data:image\/)/i.test(source)) return true;
  try {
    return new URL(source, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function portrait(ctx: CanvasRenderingContext2D, options: CardOptions, card: CardLayout, colors: Palette): void {
  const box = card.photo;
  const round = options.design === 'minimal' ? 18 : box.width / 2;
  ctx.save();
  roundedRect(ctx, { x: box.x - 11, y: box.y - 11, width: box.width + 22, height: box.height + 22 }, round + 11);
  ctx.fillStyle = options.design === 'poster' ? '#101010' : colors.accent;
  ctx.fill();
  roundedRect(ctx, box, round);
  ctx.clip();
  ctx.fillStyle = '#242424';
  ctx.fillRect(box.x, box.y, box.width, box.height);
  const photo = options.photo;
  if (photo && photo.complete && photo.naturalWidth > 0 && photo.naturalHeight > 0) {
    if (!photoIsLocal(photo)) throw new Error('Upload a local photo so your card can be downloaded securely.');
    const scale = Math.max(box.width / photo.naturalWidth, box.height / photo.naturalHeight) * clamp(options.zoom, 1, 3);
    const imageWidth = photo.naturalWidth * scale;
    const imageHeight = photo.naturalHeight * scale;
    const excessX = (imageWidth - box.width) / 2;
    const excessY = (imageHeight - box.height) / 2;
    ctx.drawImage(photo, box.x - excessX + clamp(options.offsetX, -1, 1) * excessX, box.y - excessY + clamp(options.offsetY, -1, 1) * excessY, imageWidth, imageHeight);
  } else {
    ctx.fillStyle = '#242424';
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.strokeStyle = BRAND_LIME;
    ctx.globalAlpha = 0.18;
    for (let index = 0; index < 7; index += 1) {
      ctx.beginPath();
      ctx.arc(box.x + box.width / 2, box.y + box.height * 1.02, box.width * (0.22 + index * 0.11), Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.font = `400 ${box.width * 0.29}px ${DISPLAY_FONT}`;
    ctx.fillStyle = '#fafaf5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(options.name), box.x + box.width / 2, box.y + box.height * 0.47, box.width * 0.74);
    ctx.font = `700 ${box.width * 0.034}px ${MONO_FONT}`;
    ctx.fillStyle = '#d2d2c8';
    ctx.fillText('NEXT STOP: LONDON', box.x + box.width / 2, box.y + box.height * 0.71, box.width * 0.76);
  }
  ctx.restore();
  const badgeWidth = options.format === 'story' ? 110 : 82;
  const badgeHeight = options.format === 'story' ? 58 : 43;
  const badge = { x: box.x + box.width - badgeWidth + 12, y: box.y + box.height - badgeHeight + 7, width: badgeWidth, height: badgeHeight };
  roundedRect(ctx, badge, badgeHeight / 2);
  ctx.fillStyle = colors.ink;
  ctx.fill();
  text(ctx, clean(options.chapter.id).toUpperCase(), badge.x + 16, badge.y + 11, badgeHeight * 0.43, colors.background, badge.width - 32, 700, MONO_FONT);
}

function header(ctx: CanvasRenderingContext2D, options: CardOptions, width: number, card: CardLayout, colors: Palette, brand: HTMLImageElement, chapterLogo?: HTMLImageElement): void {
  const y = options.format === 'story' ? 86 : 48;
  wordmark(ctx, brand, { x: card.margin, y, width: 358, height: 35 }, colors.ink);
  trackedText(ctx, 'LONDON  /  NOV 15–17, 2026', card.margin, y + 47, 12, colors.muted, 358, 1.2);
  const chapterWidth = options.format === 'landscape' ? 426 : 390;
  const chapterX = width - card.margin - chapterWidth;
  if (chapterLogo) {
    const tile = { x: chapterX, y: y - 8, width: 66, height: 66 };
    roundedRect(ctx, tile, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.save();
    roundedRect(ctx, tile, 7);
    ctx.clip();
    containImage(ctx, chapterLogo, { x: tile.x + 4, y: tile.y + 4, width: tile.width - 8, height: tile.height - 8 });
    ctx.restore();
  }
  const textX = chapterX + (chapterLogo ? 82 : 0);
  const textWidth = width - card.margin - textX;
  trackedText(ctx, options.chapter.id === 'custom' ? 'COMMUNITY' : 'SUPERTEAM', textX, y + 1, 12, colors.muted, textWidth, 1.8);
  text(ctx, options.chapter.name.toUpperCase(), textX, y + 24, 23, colors.ink, textWidth, 400, DISPLAY_FONT);
  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(card.margin, y + 79);
  ctx.lineTo(width - card.margin, y + 79);
  ctx.stroke();
  ctx.restore();
}

function headlines(ctx: CanvasRenderingContext2D, options: CardOptions, card: CardLayout, colors: Palette): void {
  const landscape = options.format === 'landscape';
  const story = options.format === 'story';
  const headingSize = landscape ? 48 : story ? 54 : 42;
  trackedText(ctx, 'I’M GOING TO', card.margin, card.headlineTop, headingSize, colors.ink, card.headlineWidth, landscape ? 1.8 : 1.2);
  const titleY = card.headlineTop + (story ? 78 : 64);
  text(ctx, 'BREAKPOINT', card.margin - 4, titleY, card.headlineSize, colors.ink, card.headlineWidth, 400, DISPLAY_FONT);
  trackedText(ctx, `${options.chapter.id === 'custom' ? '' : 'SUPERTEAM '}${options.chapter.name.toUpperCase()}`, card.margin, card.chapterTop, card.chapterSize, colors.ink, card.chapterWidth, story ? 2 : 1.5);
  text(ctx, options.chapter.nativeName, card.margin, card.chapterTop + 46, story ? 25 : 21, colors.muted, card.chapterWidth, 400);
}

function ticket(ctx: CanvasRenderingContext2D, options: CardOptions, card: CardLayout, colors: Palette): void {
  const box = card.ticket;
  const landscape = options.format === 'landscape';
  const story = options.format === 'story';
  const routeWidth = box.width * (landscape ? 0.56 : 0.58);
  roundedRect(ctx, box, 4);
  ctx.fillStyle = colors.ticket;
  ctx.fill();
  // Rounded perforations and a dashed tear line evoke a real boarding pass.
  ctx.fillStyle = colors.background;
  for (const y of [box.y, box.y + box.height]) {
    ctx.beginPath();
    ctx.arc(box.x + routeWidth, y, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.strokeStyle = colors.ticketInk;
  ctx.globalAlpha = 0.28;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(box.x + routeWidth, box.y + 19);
  ctx.lineTo(box.x + routeWidth, box.y + box.height - 19);
  ctx.stroke();
  ctx.restore();
  const inset = landscape ? 34 : 26;
  const codeSize = landscape ? 58 : story ? 80 : 56;
  const citySize = landscape ? 16 : 15;
  const top = box.y + (story ? 26 : 17);
  trackedText(ctx, 'DEPARTING', box.x + inset, top, 13, colors.ticketInk, routeWidth * 0.42, 2);
  trackedText(ctx, 'ARRIVING', box.x + routeWidth * 0.56, top, 13, colors.ticketInk, routeWidth * 0.37, 2);
  const codeY = top + 27;
  text(ctx, clean(options.departure.code, options.chapter.airport).toUpperCase(), box.x + inset - 3, codeY, codeSize, colors.ticketInk, routeWidth * 0.37, 400, DISPLAY_FONT);
  text(ctx, 'LON', box.x + routeWidth * 0.56 - 3, codeY, codeSize, colors.ticketInk, routeWidth * 0.37, 400, DISPLAY_FONT);
  arrow(ctx, box.x + routeWidth * 0.435, codeY + codeSize * 0.46, routeWidth * 0.075, colors.ticketInk);
  const cityY = codeY + codeSize + (story ? 11 : 5);
  text(ctx, clean(options.departure.city, options.chapter.city), box.x + inset, cityY, citySize, colors.ticketInk, routeWidth * 0.42, 400);
  text(ctx, 'London, UK', box.x + routeWidth * 0.56, cityY, citySize, colors.ticketInk, routeWidth * 0.37, 400);
  const eventX = box.x + routeWidth + inset;
  const eventWidth = box.width - routeWidth - inset * 2;
  trackedText(ctx, 'SAVE THE DATE', eventX, top, 13, colors.ticketInk, eventWidth, 2);
  text(ctx, 'NOV 15–17', eventX - 1, top + 34, landscape ? 35 : story ? 39 : 29, colors.ticketInk, eventWidth, 400, DISPLAY_FONT);
  trackedText(ctx, 'OLYMPIA LONDON', eventX, top + (landscape ? 88 : story ? 109 : 87), landscape ? 16 : 13, colors.ticketInk, eventWidth, 1.4);
  if (story) text(ctx, '2026 · SEE YOU THERE', eventX, top + 143, 14, colors.ticketInk, eventWidth, 400, MONO_FONT);
}

function identity(ctx: CanvasRenderingContext2D, options: CardOptions, width: number, card: CardLayout, colors: Palette): void {
  const name = clean(options.name, 'Your Name');
  const role = clean(options.role, 'Builder');
  const handle = clean(options.handle).replace(/^@+/, '');
  const landscape = options.format === 'landscape';
  const story = options.format === 'story';
  text(ctx, name, card.margin, card.identityTop, story ? 58 : landscape ? 39 : 42, colors.ink, landscape ? width * 0.54 : width - card.margin * 2, 400, DISPLAY_FONT);
  const subtitle = handle ? `@${handle}  /  ${role}` : role;
  text(ctx, subtitle, card.margin, card.identityTop + (story ? 82 : landscape ? 48 : 57), story ? 25 : 19, colors.muted, landscape ? width * 0.54 : width - card.margin * 2, 400);
  if (landscape) {
    trackedText(ctx, 'ONE COMMUNITY.', width - card.margin - 355, card.identityTop + 1, 18, colors.muted, 355, 2.3);
    trackedText(ctx, 'EVERY TIME ZONE.', width - card.margin - 355, card.identityTop + 31, 18, colors.ink, 355, 2.3);
  }
  trackedText(ctx, `BP26 / ${clean(options.chapter.id).toUpperCase()} → LON`, card.margin, card.footerTop, 13, colors.muted, width * 0.5, 1.3);
  text(ctx, 'COMMUNITY MADE · SEE YOU IN LONDON', width * 0.53, card.footerTop, 11, colors.muted, width * 0.47 - card.margin, 400, MONO_FONT);
}

/** Paints the exact, full-resolution canvas used for both preview and PNG export. */
export async function renderCard(canvas: HTMLCanvasElement, options: CardOptions): Promise<void> {
  if (typeof document === 'undefined') return;
  const version = (renderVersions.get(canvas) ?? 0) + 1;
  renderVersions.set(canvas, version);
  const chapterAsset = CHAPTER_ASSETS[options.chapter.id];
  const [brand, chapterLogo] = await Promise.all([
    loadImage('/brand/breakpoint.svg'),
    chapterAsset ? loadImage(chapterAsset.logo) : Promise.resolve(undefined),
    loadFonts(),
  ]);
  if (renderVersions.get(canvas) !== version) return;
  const dimensions = CARD_FORMATS[options.format] ?? CARD_FORMATS.landscape;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create the card canvas.');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const card = layout(options.format);
  const colors = palette(options.design, options.chapter.accent);
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);
  backdrop(ctx, dimensions.width, dimensions.height, card, colors, options.design);
  regionalArtwork(ctx, options, card, colors);
  header(ctx, options, dimensions.width, card, colors, brand, chapterLogo);
  headlines(ctx, options, card, colors);
  portrait(ctx, options, card, colors);
  ticket(ctx, options, card, colors);
  identity(ctx, options, dimensions.width, card, colors);
}
