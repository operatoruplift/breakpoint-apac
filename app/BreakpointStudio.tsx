'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Globe2, ImagePlus, LoaderCircle, MapPin, MoveUpRight, Plane, Search, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { CHAPTERS, getChapter, type Chapter } from './lib/chapters';
import { CARD_FORMATS, renderCard, type CardDesign, type CardFormat } from './lib/render-card';
import s from './breakpoint.module.css';
import Link from 'next/link';
import NextImage from 'next/image';
import { CHAPTER_ASSETS } from './lib/chapter-assets';
import { getRegionArtLabel } from './lib/region-art';

type Props = { initialChapter: string; initialAirport: string; initialDesign: string; initialFormat: string };
type Region = 'APAC' | 'All chapters';
const DESIGNS: { id: CardDesign; name: string; hint: string }[] = [
  { id: 'boarding', name: 'Boarding pass', hint: 'Cleared for takeoff' },
  { id: 'poster', name: 'The statement', hint: 'Loud. Proud. Yours.' },
  { id: 'minimal', name: 'Base template', hint: 'Your name. Your photo.' },
];
const FORMATS: CardFormat[] = ['landscape', 'square', 'story'];
const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const chapterLabel = (chapter: Chapter) => chapter.id === 'custom' ? chapter.name : `Superteam ${chapter.name}`;

function normalizeHandle(input: string) {
  return input.trim().replace(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i, '').split(/[?#/]/)[0].replace(/^@/, '');
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function BreakpointStudio({ initialChapter, initialAirport, initialDesign, initialFormat }: Props) {
  const [chapterId, setChapterId] = useState(() => getChapter(initialChapter || 'vn').id);
  const [region, setRegion] = useState<Region>('APAC');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [airport, setAirport] = useState(initialAirport);
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customAirport, setCustomAirport] = useState('');
  const [design, setDesign] = useState<CardDesign>(DESIGNS.some(item => item.id === initialDesign) ? initialDesign as CardDesign : 'boarding');
  const [format, setFormat] = useState<CardFormat>(FORMATS.includes(initialFormat as CardFormat) ? initialFormat as CardFormat : 'landscape');
  const [photo, setPhoto] = useState<HTMLImageElement>();
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [renderError, setRenderError] = useState('');
  const [showXLink, setShowXLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef(0);
  const profileRef = useRef(0);
  const nameEditRef = useRef(0);
  const selected = getChapter(chapterId);
  const chapter: Chapter = useMemo(() => custom ? {
    ...selected, id: 'custom', name: customName.trim() || 'Your community', nativeName: 'Together, we go further', flag: '🌏',
    city: customCity.trim() || 'Your city', airport: customAirport.trim() || 'APAC', handle: '',
    departures: [{ code: customAirport.trim() || 'APAC', city: customCity.trim() || 'Your city' }],
  } : selected, [custom, customName, customCity, customAirport, selected]);
  const departure = useMemo(() => chapter.departures.find(item => item.code === airport) || chapter.departures[0] || { code: chapter.airport, city: chapter.city }, [chapter, airport]);
  const cleanHandle = normalizeHandle(handle);
  const shareText = `I’m going to @SolanaConf Breakpoint 2026 with ${chapterLabel(chapter)}! ${departure.city} → London. See you at Olympia, 15-17 November. #Breakpoint2026`;
  const composerUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;
  const invalidHandle = !!cleanHandle && !X_HANDLE.test(cleanHandle);
  const options = useMemo(() => ({ chapter, name: name.trim(), handle: X_HANDLE.test(cleanHandle) ? cleanHandle : '', role: role.trim(), departure, design, format, photo, zoom, offsetX, offsetY }), [chapter, name, cleanHandle, role, departure, design, format, photo, zoom, offsetX, offsetY]);
  const visibleChapters = CHAPTERS.filter(item => (region === 'All chapters' || item.region === 'APAC') && `${item.name} ${item.nativeName} ${item.city}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    let cancelled = false;
    const buffer = document.createElement('canvas');
    renderCard(buffer, options).then(() => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = buffer.width;
      canvas.height = buffer.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(buffer, 0, 0);
      setReady(true);
      setRenderError('');
    }).catch(() => { if (!cancelled) setRenderError('The preview could not render. Try another style or refresh the page.'); });
    return () => { cancelled = true; };
  }, [options]);

  useEffect(() => () => { uploadRef.current += 1; profileRef.current += 1; }, []);

  function chooseChapter(id: string) {
    setChapterId(id);
    setAirport('');
    setCustom(false);
    setMessage('');
  }

  async function loadPhoto(file?: File) {
    if (!file) return;
    setError('');
    setMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG or WebP photo.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('That photo is a little big. Choose one under 8 MB.');
      return;
    }
    const version = ++uploadRef.current;
    setPhotoBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > 36_000_000) throw new Error('dimensions');
      if (version !== uploadRef.current) return;
      setPhoto(image);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setMessage('Photo added. Adjust the crop below.');
    } catch {
      if (version === uploadRef.current) setError('We could not open that photo. Try a smaller JPG, PNG or WebP.');
    } finally {
      URL.revokeObjectURL(url);
      if (version === uploadRef.current) setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function importProfile() {
    if (!X_HANDLE.test(cleanHandle) || importing) return;
    const version = ++profileRef.current;
    const nameVersion = nameEditRef.current;
    setPhotoBusy(false);
    const photoVersion = ++uploadRef.current;
    setImporting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/breakpoint/profile?handle=${encodeURIComponent(cleanHandle)}`, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(response.status === 404 ? 'not-found' : 'unavailable');
      const profile: { name?: unknown } = await response.json();
      const image = new Image();
      image.src = `/api/breakpoint/profile?handle=${encodeURIComponent(cleanHandle)}&photo=1`;
      await image.decode();
      if (version !== profileRef.current || photoVersion !== uploadRef.current) return;
      if (typeof profile.name === 'string' && nameVersion === nameEditRef.current) setName(profile.name.slice(0, 36));
      setPhoto(image);
      setZoom(1); setOffsetX(0); setOffsetY(0);
      setMessage('Public X photo and name imported. Make it your own.');
    } catch (cause) {
      if (version === profileRef.current) setError(cause instanceof Error && cause.message === 'not-found' ? 'That public X profile was not found. You can add your name and photo manually.' : 'X import is unavailable right now. You can add your name and photo manually.');
    } finally {
      if (version === profileRef.current) setImporting(false);
    }
  }

  async function makeBlob() {
    const canvas = document.createElement('canvas');
    await renderCard(canvas, options);
    return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
  }

  async function download() {
    if (invalidHandle || exporting) return;
    setExporting(true);
    setError('');
    try {
      const blob = await makeBlob();
      saveBlob(blob, `breakpoint-2026-${chapter.id}-${format}.png`);
      setMessage('Your card is downloaded. London is calling.');
    } catch { setError('The download failed. Please try again.'); }
    finally { setExporting(false); }
  }

  async function copyCard() {
    setError('');
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': makeBlob() })]);
      setMessage('Card copied. Paste it into your post.');
    } catch { setError('Image copying is unavailable in this browser. Download your card and attach it to your post.'); }
  }

  async function copyLink() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = 'studio';
    url.searchParams.set('chapter', selected.id);
    url.searchParams.set('from', departure.code);
    url.searchParams.set('design', design);
    url.searchParams.set('format', format);
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage('Chapter preset link copied. Your name and photo are not included.');
      setError('');
    } catch { setError('Link copying is unavailable. You can share this page using your browser.'); }
  }

  async function share() {
    if (invalidHandle || exporting) return;
    setError('');
    const text = shareText;
    const composer = composerUrl;
    setShowXLink(true);
    if (navigator.share && navigator.canShare?.({ files: [new File([], 'breakpoint.png', { type: 'image/png' })] })) {
      try {
        const file = new File([await makeBlob()], `breakpoint-${chapter.id}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ text, files: [file] });
          setMessage('Card shared. See you in London.');
          return;
        }
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') return;
      }
    }
    let copy: Promise<void> | undefined;
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        copy = navigator.clipboard.write([new ClipboardItem({ 'image/png': makeBlob() })]);
      }
    } catch { /* The download and composer remain available when image copying is unsupported. */ }
    window.open(composer, '_blank', 'noopener,noreferrer');
    try {
      if (copy) { await copy; setMessage('Card copied. Paste it into your X post.'); return; }
    } catch { /* Clipboard permission can be declined without blocking the composer link. */ }
    setMessage('Attach your downloaded card to the X post. You can also copy the image first.');
  }

  const dimensions = CARD_FORMATS[format];
  const updateRange = (setter: (value: number) => void) => (event: ChangeEvent<HTMLInputElement>) => setter(Number(event.target.value));

  return <div className={s.page} style={{ '--chapter-accent': chapter.accent } as CSSProperties}>
    <a className={s.skipLink} href="#studio">Skip to the card studio</a>
    <header className={s.header}>
      <Link href="/" className={s.brand} aria-label="Breakpoint card studio home"><NextImage src="/brand/breakpoint.svg" width={200} height={24} alt="Breakpoint" className={s.brandImage} unoptimized /><span className={s.brandYear}>APAC</span></Link>
      <nav className={s.nav} aria-label="Main navigation"><a href="#studio">Card studio</a><a href="#chapters">The chapters <span>{CHAPTERS.length}</span></a></nav>
      <a href="https://solana.com/breakpoint" target="_blank" rel="noopener noreferrer" className={s.ticketLink}>London is calling <ArrowUpRight size={16} /></a>
    </header>

    <main id="main">
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroCopy}>
          <div className={s.eyebrow}><span className={s.liveDot} /> SUPERTEAM × BREAKPOINT 2026 <span className={s.eyebrowLine} /></div>
          <h1 id="hero-title">GOING TO<br /><span>BREAKPOINT.</span><MoveUpRight className={s.heroArrow} strokeWidth={1.2} aria-hidden="true" /></h1>
          <div className={s.heroBottom}><p>Show it to everyone.<br />Your chapter. Your culture. Your way to London.</p><a href="#studio" className={s.roundLink} aria-label="Make your Breakpoint card"><ArrowDown size={24} /></a></div>
        </div>
        <div className={s.destination}>
          <div className={s.destinationTop}><span>YOUR NEXT DESTINATION</span><Globe2 size={18} /></div>
          <div className={s.airportRoute}><span className={s.flapCode}>{departure.code.split('').map((letter, index) => <i key={`${departure.code}-${index}`}>{letter}</i>)}</span><div><Plane size={22} /><span /></div><span className={s.flapCode}>{'LON'.split('').map((letter, index) => <i key={index}>{letter}</i>)}</span></div>
          <div className={s.destinationBottom}><span>15-17 NOV 2026<br /><strong>OLYMPIA, LONDON</strong></span><span className={s.destinationStamp}>{!custom && CHAPTER_ASSETS[chapter.id] ? <NextImage src={CHAPTER_ASSETS[chapter.id].logo} width={56} height={56} alt={chapterLabel(chapter)} unoptimized /> : <>LET’S<br />GO.</>}</span></div>
          <div className={s.perforation} />
          <div className={s.destinationFooter}><span>BUILD TOGETHER. SHOW UP TOGETHER.</span><span>↗</span></div>
        </div>
      </section>

      <div className={s.marquee} aria-hidden="true"><div>{Array.from({ length: 3 }, (_, index) => <span key={index}>VIETNAM <i>✳</i> KOREA <i>✳</i> JAPAN <i>✳</i> INDIA <i>✳</i> SINGAPORE <i>✳</i> MALAYSIA <i>✳</i> THAILAND <i>✳</i> AUSTRALIA <i>✳</i> </span>)}</div></div>

      <section id="studio" className={s.studio} aria-labelledby="studio-title">
        <div className={s.sectionHeading}><div><p className={s.kicker}>THE PRE-FLIGHT CHECK</p><h2 id="studio-title">Make it <span>official.*</span></h2></div><p>*The card, that is. You still need a ticket.<br />A little chapter pride goes a long way.</p></div>
        <div className={s.workspace}>
          <div className={s.controls}>
            <section className={s.formSection} aria-labelledby="chapter-label">
              <div className={s.stepTitle}><span>01</span><h3 id="chapter-label">Choose your crew</h3><Globe2 size={16} /></div>
              <label className={s.label} htmlFor="chapter">Your chapter</label>
              <div className={s.selectWrap}><select id="chapter" value={custom ? 'custom' : chapterId} onChange={event => event.target.value === 'custom' ? setCustom(true) : chooseChapter(event.target.value)}>{CHAPTERS.map(item => <option key={item.id} value={item.id}>{item.flag} {chapterLabel(item)}</option>)}<option value="custom">🌏 My community / another chapter</option></select><ChevronDown size={16} /></div>
              {custom ? <div className={s.customFields}><label className={s.label} htmlFor="custom-name">Community name<input id="custom-name" value={customName} onChange={event => setCustomName(event.target.value)} placeholder="Your community" maxLength={40} /></label><div className={s.twoFields}><label className={s.label} htmlFor="custom-city">Departure city<input id="custom-city" value={customCity} onChange={event => setCustomCity(event.target.value)} placeholder="Your city" maxLength={30} /></label><label className={s.label} htmlFor="custom-airport">Airport code<input id="custom-airport" value={customAirport} onChange={event => setCustomAirport(event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="SGN" maxLength={3} /></label></div></div> : <><div className={s.chapterIdentity}>{CHAPTER_ASSETS[chapter.id] && <NextImage src={CHAPTER_ASSETS[chapter.id].logo} width={42} height={42} alt={`${chapterLabel(chapter)} logo`} unoptimized />}<div><strong>{chapterLabel(chapter)}</strong><span>{getRegionArtLabel(chapter.id)}</span></div></div><label className={s.label} htmlFor="departure">Flying from</label><div className={s.selectWrap}><select id="departure" value={departure.code} onChange={event => setAirport(event.target.value)}>{chapter.departures.map(item => <option key={item.code} value={item.code}>{item.code} · {item.city}</option>)}</select><Plane size={16} /></div></>}
            </section>

            <section className={s.formSection} aria-labelledby="details-label">
              <div className={s.stepTitle}><span>02</span><h3 id="details-label">A little more you</h3><Sparkles size={16} /></div>
              <div className={s.twoFields}><label className={s.label} htmlFor="name">Your name <span>optional</span><input id="name" value={name} onChange={event => { nameEditRef.current += 1; setName(event.target.value); }} placeholder="Your name here" maxLength={36} autoComplete="off" /></label><label className={s.label} htmlFor="handle">X handle <span>optional</span><div className={s.handleInput}><span>@</span><input id="handle" value={handle} onChange={event => { profileRef.current += 1; setImporting(false); setHandle(event.target.value); }} placeholder="you" maxLength={80} spellCheck={false} autoCapitalize="none" autoComplete="off" aria-invalid={invalidHandle} aria-describedby={invalidHandle ? 'handle-error' : undefined} /></div></label></div>
              {invalidHandle && <p id="handle-error" className={s.fieldError}>Use an X handle with 1-15 letters, numbers or underscores.</p>}
              <div className={s.importRow}><button type="button" disabled={!X_HANDLE.test(cleanHandle) || importing} onClick={() => void importProfile()}>{importing ? <LoaderCircle size={13} className={s.spinner} /> : <ArrowDown size={13} />}{importing ? 'Importing…' : 'Import from X'}</button><span>Sends your public handle to<br />goingtobreakpoint.com.</span></div>
              <label className={s.label} htmlFor="role">What do you do? <span>optional</span><input id="role" value={role} onChange={event => setRole(event.target.value)} placeholder="Builder. Creator. Perpetually online." maxLength={50} /></label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className={s.fileInput} onChange={event => void loadPhoto(event.target.files?.[0])} aria-label="Upload your photo" />
              <button className={`${s.upload} ${dragging ? s.uploadDragging : ''}`} onClick={() => fileRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void loadPhoto(event.dataTransfer.files[0]); }} disabled={photoBusy} type="button">{photoBusy ? <LoaderCircle size={23} className={s.spinner} /> : photo ? <Check size={23} /> : <ImagePlus size={23} />}<span><strong>{photoBusy ? 'Opening your photo…' : photo ? 'Photo added. Looking good.' : 'Drop your photo here'}</strong><small>{photo ? 'Click to choose a different photo' : 'or click to browse · JPG, PNG, WebP · 8 MB max'}</small></span><Upload size={16} /></button>
              {photo && <div className={s.cropControls}><div className={s.cropHeading}><span>Find your best angle</span><button type="button" onClick={() => { uploadRef.current += 1; setPhoto(undefined); setPhotoBusy(false); setMessage('Photo removed.'); }}><X size={13} /> Remove</button></div><label>Zoom<input aria-label="Photo zoom" type="range" min="1" max="3" step="0.05" value={zoom} onChange={updateRange(setZoom)} /></label><label>Horizontal<input aria-label="Photo horizontal position" type="range" min="-1" max="1" step="0.02" value={offsetX} onChange={updateRange(setOffsetX)} /></label><label>Vertical<input aria-label="Photo vertical position" type="range" min="-1" max="1" step="0.02" value={offsetY} onChange={updateRange(setOffsetY)} /></label></div>}
              <p className={s.privacyNote}><ShieldCheck size={13} /> Photo edits happen in your browser. No upload required.</p>
            </section>

            <section className={s.formSection} aria-labelledby="style-label"><div className={s.stepTitle}><span>03</span><h3 id="style-label">Pick your energy</h3></div><div className={s.designs} role="group" aria-label="Card design">{DESIGNS.map((item, index) => <button key={item.id} type="button" onClick={() => setDesign(item.id)} className={`${s.design} ${design === item.id ? s.designActive : ''}`} aria-pressed={design === item.id}><span className={`${s.designSwatch} ${s[`swatch${index}`]}`}><span /><span /><span /></span><strong>{item.name}</strong><small>{item.hint}</small>{design === item.id && <Check size={12} className={s.designCheck} />}</button>)}</div></section>
          </div>

          <div className={s.previewColumn}>
            <div className={s.previewTop}><span><span className={s.liveDot} /> LIVE PREVIEW</span><span>LOOKING GOOD FROM HERE ↙</span></div>
            <div className={`${s.previewStage} ${format === 'story' ? s.storyStage : ''}`}><span className={s.stageCrossOne}>+</span><span className={s.stageCrossTwo}>+</span><div className={s.previewCard}><canvas ref={canvasRef} role="img" aria-label={`Breakpoint 2026 card for ${name.trim() || 'you'} with ${chapterLabel(chapter)}, flying from ${departure.city} to London`} data-ready={ready}>Your personalized Breakpoint card. Use the download button to save the PNG.</canvas></div><div className={s.previewCaption}><span>{!custom && CHAPTER_ASSETS[chapter.id] && <NextImage src={CHAPTER_ASSETS[chapter.id].logo} width={22} height={22} alt="" unoptimized />}{chapterLabel(chapter)}</span><span>{design === 'minimal' ? 'THE BASE TEMPLATE' : getRegionArtLabel(chapter.id)}</span></div></div>
            <div className={s.exportPanel}><div className={s.exportTop}><div className={s.formatPicker} role="group" aria-label="Image format">{FORMATS.map(item => <button key={item} type="button" aria-pressed={format === item} onClick={() => setFormat(item)} className={format === item ? s.formatActive : ''}>{item === 'landscape' ? 'Landscape' : item === 'square' ? 'Square' : 'Story'}</button>)}</div><span className={s.resolution}>{dimensions.width} × {dimensions.height} <span>PNG</span></span></div><button type="button" onClick={() => void download()} disabled={!ready || exporting || invalidHandle || !!renderError} className={s.downloadButton}>{exporting ? <LoaderCircle size={19} className={s.spinner} /> : <ArrowDownToLine size={19} />}<span>{exporting ? 'Preparing your card…' : 'Download my card'}</span><ArrowUpRight size={20} /></button><div className={s.shareRow}><button type="button" onClick={() => void share()} disabled={!ready || invalidHandle}><span className={s.xLogo}>𝕏</span> Share the good news <ArrowUpRight size={14} /></button><button type="button" onClick={() => void copyCard()} disabled={!ready || invalidHandle}><Copy size={14} /> Copy image</button><button type="button" onClick={() => void copyLink()} disabled={custom} title={custom ? 'Preset links are available for listed chapters' : 'Copy this chapter and style preset'}><Globe2 size={14} /> Preset link</button></div>{showXLink && <a href={composerUrl} target="_blank" rel="noopener noreferrer" className={s.composerFallback}>Open the X composer <ArrowUpRight size={13} /></a>}<div className={s.feedback} aria-live="polite" role="status">{(error || renderError) ? <p className={s.error}>{error || renderError}</p> : message ? <p><Check size={13} /> {message}</p> : <p>No sign-up. No wallet. Just you and your crew.</p>}</div></div>
            <div className={s.previewFootnote}><span>YOUR CARD IS A STATEMENT,<br />NOT AN EVENT TICKET.</span><a href="https://solana.com/breakpoint" target="_blank" rel="noopener noreferrer">Get the real thing <ArrowUpRight size={14} /></a></div>
          </div>
        </div>
      </section>

      <section id="chapters" className={s.chapterSection} aria-labelledby="chapters-title"><div className={s.sectionHeading}><div><p className={s.kicker}>LOCAL ROOTS. GLOBAL ENERGY.</p><h2 id="chapters-title">Find your <span>people.</span></h2></div><p>From the first hello to the last side event.<br />There’s a crew for you.</p></div><div className={s.directoryToolbar}><div className={s.regionTabs} role="group" aria-label="Filter chapters">{(['APAC', 'All chapters'] as Region[]).map(item => <button key={item} type="button" aria-pressed={region === item} className={region === item ? s.regionActive : ''} onClick={() => setRegion(item)}>{item}<span>{item === 'APAC' ? CHAPTERS.filter(chapter => chapter.region === 'APAC').length : CHAPTERS.length}</span></button>)}</div><label className={s.search}><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a chapter" aria-label="Search chapters" />{search && <button type="button" aria-label="Clear chapter search" onClick={() => setSearch('')}><X size={14} /></button>}</label></div><div className={s.chapterGrid}>{visibleChapters.map(item => <a key={item.id} href="#studio" className={`${s.chapterCard} ${!custom && chapterId === item.id ? s.chapterSelected : ''}`} onClick={() => chooseChapter(item.id)}><div className={s.chapterCardTop}><span className={s.flag}>{CHAPTER_ASSETS[item.id] ? <NextImage src={CHAPTER_ASSETS[item.id].logo} width={44} height={44} alt={`${chapterLabel(item)} logo`} unoptimized /> : item.flag}</span><span className={s.chapterCode}>{item.airport} → LON</span>{!custom && chapterId === item.id ? <span className={s.selectedCheck}><Check size={14} /></span> : <ArrowUpRight size={18} />}</div><h3>{item.name.replace(/^Superteam /, '')}</h3><p className={s.regionArtLabel}>{getRegionArtLabel(item.id)}</p><div className={s.chapterCardBottom}><span>{item.nativeName}</span><span className={s.chapterDot} style={{ background: item.accent }} /></div></a>)}</div>{visibleChapters.length === 0 && <div className={s.noResults}>No chapters found. Try another name, or choose “All chapters”.</div>}<div className={s.missingChapter}><Globe2 size={20} /><p>Your crew missing? <span>There’s room for everyone.</span></p><a href="#studio" onClick={() => setCustom(true)}>Make a community card <ArrowRight size={16} /></a></div></section>

      <section className={s.sendOff}><span>THE INTERNET IS GREAT.</span><h2>In person is <em>better.</em></h2><a href="#studio">See you at Breakpoint <ArrowUpRight size={22} /></a><span className={s.sendOffStar} aria-hidden="true">✳</span></section>
    </main>
    <footer className={s.footer}><Link href="/" className={s.footerBrand}><NextImage src="/brand/breakpoint.svg" width={180} height={22} alt="Breakpoint" unoptimized /><span>APAC ROLL CALL</span></Link><p>Regional art, chapter logos, and a card that’s yours. Inspired by <a href="https://goingtobreakpoint.com/" target="_blank" rel="noopener noreferrer">Going to Breakpoint <ArrowUpRight size={11} /></a>.<br />Independent project. Not an official Solana or Superteam event registration.</p><div><a href="https://superteam.fun/" target="_blank" rel="noopener noreferrer">Meet Superteam <ArrowUpRight size={14} /></a><a href="https://solana.com/breakpoint" target="_blank" rel="noopener noreferrer"><MapPin size={13} /> London · 15-17 Nov 2026</a></div></footer>
  </div>;
}
