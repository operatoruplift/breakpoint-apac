import { mkdir, readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const preview = (page: Page) => page.locator('canvas[role="img"]');

async function canvasState(page: Page) {
  return preview(page).evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext('2d');
    if (!context) throw new Error('Canvas context is unavailable');
    const pixels = context.getImageData(0, 0, element.width, element.height).data;
    let fingerprint = 2166136261;
    let opaque = 0;
    const colors = new Set<number>();
    for (let index = 0; index < pixels.length; index += 404) {
      fingerprint = Math.imul(fingerprint ^ pixels[index], 16777619);
      fingerprint = Math.imul(fingerprint ^ pixels[index + 1], 16777619);
      fingerprint = Math.imul(fingerprint ^ pixels[index + 2], 16777619);
      if (pixels[index + 3] > 0) opaque += 1;
      colors.add((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
    }
    return { width: element.width, height: element.height, fingerprint, opaque, colors: colors.size };
  });
}

async function waitForPreview(page: Page) {
  await expect(preview(page)).toHaveAttribute('data-ready', 'true', { timeout: process.env.PLAYWRIGHT_BASE_URL ? 20_000 : 7_000 });
  await expect(page.getByRole('button', { name: 'Download my card' })).toBeEnabled();
  await expect.poll(async () => (await canvasState(page)).colors).toBeGreaterThan(10);
}

async function waitForChangedPreview(page: Page, previous: number) {
  await expect.poll(async () => (await canvasState(page)).fingerprint).not.toBe(previous);
}

async function photoFixture(page: Page) {
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo fixture canvas is unavailable');
    context.fillStyle = '#ff283d';
    context.fillRect(0, 0, 120, 80);
    context.fillStyle = '#1b62ed';
    context.fillRect(120, 0, 120, 80);
    context.fillStyle = '#16e383';
    context.fillRect(0, 80, 120, 80);
    context.fillStyle = '#ffde16';
    context.fillRect(120, 80, 120, 80);
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(80, 60, 25, 0, Math.PI * 2);
    context.fill();
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(encoded, 'base64');
}

async function downloadCard(page: Page) {
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my card' }).click();
  const download = await downloaded;
  const file = await download.path();
  if (!file) throw new Error('The card download did not produce a local PNG');
  const bytes = await readFile(file);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(await download.failure()).toBeNull();
  const pixels = await page.evaluate(async encoded => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Downloaded PNG cannot be decoded');
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set<number>();
    let opaque = 0;
    for (let index = 0; index < rgba.length; index += 404) {
      colors.add((rgba[index] << 16) | (rgba[index + 1] << 8) | rgba[index + 2]);
      if (rgba[index + 3] > 0) opaque += 1;
    }
    return { colors: colors.size, opaque };
  }, bytes.toString('base64'));
  expect(pixels.colors).toBeGreaterThan(10);
  expect(pixels.opaque).toBeGreaterThan(500);
  return { bytes, filename: download.suggestedFilename(), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test.describe('Breakpoint community card studio', () => {

  test('desktop studio renders a useful default preview and exports a real PNG', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('BREAKPOINT.');
    await expect(page.getByLabel('Your chapter', { exact: true })).toHaveValue('vn');
    await expect(page.getByLabel('Flying from', { exact: true })).toHaveValue('SGN');
    await waitForPreview(page);
    await expect(preview(page)).toHaveAccessibleName(/Vietnam, flying from Ho Chi Minh City to London/);
    const before = await canvasState(page);
    expect(before.opaque).toBeGreaterThan(500);
    await page.getByLabel('Your name', { exact: false }).fill('Linh Nguyen');
    await page.getByLabel('What do you do?', { exact: false }).fill('Building from APAC');
    await waitForChangedPreview(page, before.fingerprint);
    await expect(preview(page)).toHaveAccessibleName(/Linh Nguyen/);
    const png = await downloadCard(page);
    expect(png.filename).toBe('breakpoint-2026-vn-landscape.png');
    expect(png.width).toBe(before.width);
    expect(png.height).toBe(before.height);
    expect(png.bytes.length).toBeGreaterThan(10_000);
    await expect(page.getByRole('status')).toContainText('Your card is downloaded.');
    await mkdir('output', { recursive: true });
    await page.screenshot({ path: 'output/breakpoint-desktop.png', fullPage: true, animations: 'disabled' });
  });

  test('every listed APAC chapter has a working card and a valid default departure', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await waitForPreview(page);
    const chapters = [
      { id: 'vn', name: 'Vietnam', airport: 'SGN', city: 'Ho Chi Minh City', art: 'Lotus lines · Saigon skyline' },
      { id: 'kr', name: 'Korea', airport: 'ICN', city: 'Seoul', art: 'Hanok rooflines · N Seoul Tower' },
      { id: 'jp', name: 'Japan', airport: 'HND', city: 'Tokyo Haneda', art: 'Mount Fuji · Torii · Sakura' },
      { id: 'th', name: 'Thailand', airport: 'BKK', city: 'Bangkok', art: 'Wat Arun prang · Thai rooflines' },
      { id: 'sg', name: 'Singapore', airport: 'SIN', city: 'Singapore', art: 'Marina Bay · Supertree canopy' },
      { id: 'my', name: 'Malaysia', airport: 'KUL', city: 'Kuala Lumpur', art: 'Petronas towers · Batik geometry' },
      { id: 'in', name: 'India', airport: 'BLR', city: 'Bengaluru', art: 'Gateway arch · Mandala geometry' },
      { id: 'au', name: 'Australia', airport: 'SYD', city: 'Sydney', art: 'Sydney sails · Southern Cross' },
      { id: 'kz', name: 'Kazakhstan', airport: 'ALA', city: 'Almaty', art: 'Baiterek · Shanyrak geometry' },
    ];
    for (const chapter of chapters) {
      await expect(page.getByLabel('Your chapter').getByRole('option', { name: new RegExp(chapter.name) })).toHaveCount(1);
      const before = await canvasState(page);
      await page.getByLabel('Your chapter').selectOption(chapter.id);
      await expect(page.getByLabel('Flying from', { exact: true })).toHaveValue(chapter.airport);
      await expect(preview(page)).toHaveAccessibleName(new RegExp(`${chapter.name}, flying from ${chapter.city} to London`));
      if (chapter.id !== 'vn') await waitForChangedPreview(page, before.fingerprint);
      await expect(page.locator('#chapters').getByRole('heading', { name: chapter.name, exact: true })).toBeVisible();
      await expect(page.locator('#studio').getByText(chapter.art, { exact: true })).toHaveCount(2);
      await expect(page.locator('#chapters').getByText(chapter.art, { exact: true })).toBeVisible();
      const png = await downloadCard(page);
      expect(png.filename).toBe(`breakpoint-2026-${chapter.id}-landscape.png`);
      expect([png.width, png.height]).toEqual([1600, 900]);
    }
    await page.getByLabel('Your chapter').selectOption('vn');
    await page.getByLabel('Flying from', { exact: true }).selectOption('HAN');
    await expect(preview(page)).toHaveAccessibleName(/flying from Hanoi to London/);
    await page.getByLabel('Your chapter').selectOption('kr');
    await expect(page.getByLabel('Flying from', { exact: true })).toHaveValue('ICN');
    await page.getByLabel('Flying from', { exact: true }).selectOption('PUS');
    await expect(preview(page)).toHaveAccessibleName(/flying from Busan to London/);
  });

  test('all 27 chapter logos and the Breakpoint wordmark load as distinct local brand assets', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await waitForPreview(page);
    const wordmarks = page.getByRole('img', { name: 'Breakpoint', exact: true });
    await expect(wordmarks).toHaveCount(2);
    for (const mark of await wordmarks.all()) {
      await mark.scrollIntoViewIfNeeded();
      const markUrl = new URL(await mark.getAttribute('src') || '', page.url());
      expect(markUrl.origin).toBe(new URL(page.url()).origin);
      expect(markUrl.pathname).toBe('/brand/breakpoint.svg');
      await expect.poll(() => mark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    await page.getByRole('group', { name: 'Filter chapters' }).getByRole('button', { name: /All chapters/ }).click();
    const logos = page.locator('#chapters').getByRole('img', { name: /Superteam .+ logo/ });
    await expect(logos).toHaveCount(27);
    for (const logo of await logos.all()) {
      await logo.scrollIntoViewIfNeeded();
      await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
    }
    const loaded = await logos.evaluateAll((images: HTMLImageElement[]) => images.map(image => ({ src: image.currentSrc, alt: image.alt })));
    expect(new Set(loaded.map(image => image.src)).size).toBe(27);
    expect(new Set(loaded.map(image => image.alt)).size).toBe(27);
    for (const image of loaded) {
      const asset = new URL(image.src);
      expect(asset.origin).toBe(new URL(page.url()).origin);
      expect(asset.pathname).toMatch(/^\/chapters\/[a-z]+\.(?:png|jpg)$/);
    }
  });

  test('the neutral base template keeps names and local photos editable and exports without canvas taint', async ({ page }) => {
    await page.goto('/?chapter=vn&design=minimal');
    await waitForPreview(page);
    const base = page.getByRole('group', { name: 'Card design', exact: true }).getByRole('button', { name: /Base template/ });
    await expect(base).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('THE BASE TEMPLATE', { exact: true })).toBeVisible();
    const blank = await canvasState(page);
    await page.getByLabel('Your name', { exact: false }).fill('Mai Nguyen');
    await page.getByLabel('X handle', { exact: false }).fill('mai_builder');
    await page.getByLabel('Upload your photo').setInputFiles({ name: 'base-template-photo.png', mimeType: 'image/png', buffer: await photoFixture(page) });
    await expect(page.getByRole('status')).toContainText('Photo added.');
    await waitForChangedPreview(page, blank.fingerprint);
    await expect(preview(page)).toHaveAccessibleName(/Mai Nguyen with Superteam Vietnam/);
    const personalized = await canvasState(page);
    const png = await downloadCard(page);
    expect(png.filename).toBe('breakpoint-2026-vn-landscape.png');
    expect([png.width, png.height]).toEqual([1600, 900]);
    await page.getByRole('group', { name: 'Card design', exact: true }).getByRole('button', { name: /Boarding pass/ }).click();
    await waitForChangedPreview(page, personalized.fingerprint);
    await expect(page.getByLabel('Your name', { exact: false })).toHaveValue('Mai Nguyen');
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toBeVisible();
    await base.click();
    await expect.poll(async () => (await canvasState(page)).fingerprint).toBe(personalized.fingerprint);
    await expect(page.getByText('THE BASE TEMPLATE', { exact: true })).toBeVisible();
  });

  test('local photos change the canvas, support crop controls, and can be removed', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    const blank = await canvasState(page);
    await page.getByLabel('Upload your photo').setInputFiles({ name: 'local-portrait.png', mimeType: 'image/png', buffer: await photoFixture(page) });
    await expect(page.getByRole('status')).toContainText('Photo added.');
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toBeVisible();
    await waitForChangedPreview(page, blank.fingerprint);
    const uploaded = await canvasState(page);
    await page.getByRole('slider', { name: 'Photo zoom', exact: true }).focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toHaveValue('3');
    await waitForChangedPreview(page, uploaded.fingerprint);
    const zoomed = await canvasState(page);
    await page.getByRole('slider', { name: 'Photo horizontal position', exact: true }).focus();
    await page.keyboard.press('End');
    await page.getByRole('slider', { name: 'Photo vertical position', exact: true }).focus();
    await page.keyboard.press('Home');
    await expect(page.getByRole('slider', { name: 'Photo horizontal position', exact: true })).toHaveValue('1');
    await expect(page.getByRole('slider', { name: 'Photo vertical position', exact: true })).toHaveValue('-1');
    await waitForChangedPreview(page, zoomed.fingerprint);
    const png = await downloadCard(page);
    expect(png.width).toBe(blank.width);
    expect(png.height).toBe(blank.height);
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toHaveCount(0);
    await expect.poll(async () => (await canvasState(page)).fingerprint).toBe(blank.fingerprint);
  });

  test('each design changes the rendered card and format exports match their advertised dimensions', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    for (const design of ['The statement', 'Base template', 'Boarding pass']) {
      const before = await canvasState(page);
      const button = page.getByRole('group', { name: 'Card design', exact: true }).getByRole('button', { name: new RegExp(design) });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await waitForChangedPreview(page, before.fingerprint);
    }
    for (const format of [
      { name: 'Square', width: 1080, height: 1080 },
      { name: 'Story', width: 1080, height: 1920 },
      { name: 'Landscape', width: 1600, height: 900 },
    ]) {
      const button = page.getByRole('group', { name: 'Image format', exact: true }).getByRole('button', { name: format.name, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      const png = await downloadCard(page);
      await expect(page.getByText(`${png.width} × ${png.height}`, { exact: false })).toBeVisible();
      await expect.poll(async () => {
        const state = await canvasState(page);
        return [state.width, state.height];
      }).toEqual([png.width, png.height]);
      expect(png.filename).toBe(`breakpoint-2026-vn-${format.name.toLowerCase()}.png`);
      expect([png.width, png.height]).toEqual([format.width, format.height]);
    }
  });

  test('communities outside the directory can make a personalized card', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    await page.getByRole('link', { name: 'Make a community card' }).click();
    await page.getByLabel('Community name', { exact: true }).fill('Solana Manila');
    await page.getByLabel('Departure city', { exact: true }).fill('Manila');
    await page.getByLabel('Airport code', { exact: true }).fill('mnl');
    await expect(page.getByLabel('Airport code', { exact: true })).toHaveValue('MNL');
    await expect(preview(page)).toHaveAccessibleName(/Solana Manila, flying from Manila to London/);
    await expect(page.getByRole('button', { name: 'Preset link', exact: true })).toBeDisabled();
    const png = await downloadCard(page);
    expect(png.filename).toBe('breakpoint-2026-custom-landscape.png');
    await page.getByLabel('Your chapter').selectOption('jp');
    await expect(page.getByLabel('Community name', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Flying from', { exact: true })).toHaveValue('HND');
  });

  test('directory search can recover from no results and switch to chapters beyond APAC', async ({ page }) => {
    await page.goto('/');
    const directory = page.locator('#chapters');
    await page.getByLabel('Search chapters').fill('no-such-chapter-239');
    await expect(directory.getByText('No chapters found.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Clear chapter search' }).click();
    await expect(directory.getByRole('heading', { name: 'Vietnam', exact: true })).toBeVisible();
    await page.getByLabel('Search chapters').fill('Germany');
    await expect(directory.getByText('No chapters found.', { exact: false })).toBeVisible();
    await page.getByRole('group', { name: 'Filter chapters' }).getByRole('button', { name: /All chapters/ }).click();
    await expect(directory.getByRole('heading', { name: 'Germany', exact: true })).toBeVisible();
    await directory.getByRole('link').filter({ has: page.getByRole('heading', { name: 'Germany', exact: true }) }).click();
    await expect(page.getByLabel('Your chapter')).toHaveValue('de');
    await expect(page.getByLabel('Flying from', { exact: true })).toHaveValue('BER');
    await expect(preview(page)).toHaveAccessibleName(/Germany, flying from Berlin to London/);
  });

  test('preset links restore chapter, departure, design and size without personal details', async ({ page }) => {
    await page.goto('/?chapter=kr&from=PUS&design=minimal&format=story#studio');
    await waitForPreview(page);
    await expect(page.getByLabel('Your chapter')).toHaveValue('kr');
    await expect(page.getByLabel('Flying from', { exact: true })).toHaveValue('PUS');
    await expect(page.getByRole('button', { name: /Base template/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Story', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Your name', { exact: false }).fill('Private Person');
    await page.getByLabel('X handle', { exact: false }).fill('private_handle');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async (text: string) => { document.documentElement.dataset.copiedPreset = text; },
      } });
    });
    await page.getByRole('button', { name: 'Preset link', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Your name and photo are not included.');
    const copied = await page.locator('html').getAttribute('data-copied-preset');
    expect(copied).toBeTruthy();
    const url = new URL(copied!);
    expect(Object.fromEntries(url.searchParams)).toEqual({ chapter: 'kr', from: 'PUS', design: 'minimal', format: 'story' });
    expect(url.hash).toBe('#studio');
    expect(copied).not.toContain('Private');
    expect(copied).not.toContain('private_handle');
  });

  test('X import only runs on request and imports a public name and photo', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    const image = await photoFixture(page);
    const requests: string[] = [];
    await page.route('**/api/breakpoint/profile?**', async route => {
      const url = new URL(route.request().url());
      requests.push(url.search);
      expect(url.searchParams.get('handle')).toBe('APAC_builder');
      if (url.searchParams.get('photo') === '1') {
        await route.fulfill({ status: 200, contentType: 'image/png', body: image });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'APAC Builder' }) });
      }
    });
    await page.getByLabel('X handle', { exact: false }).fill('https://x.com/APAC_builder');
    expect(requests).toHaveLength(0);
    const before = await canvasState(page);
    await page.getByRole('button', { name: 'Import from X', exact: true }).click();
    await expect(page.getByLabel('Your name', { exact: false })).toHaveValue('APAC Builder');
    await expect(page.getByRole('status')).toContainText('Public X photo and name imported.');
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toBeVisible();
    await waitForChangedPreview(page, before.fingerprint);
    expect(requests).toHaveLength(2);
  });

  test('X import supersedes a pending local photo without leaving the upload control disabled', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    const image = await photoFixture(page);
    await page.route('**/api/breakpoint/profile?**', async route => {
      if (new URL(route.request().url()).searchParams.get('photo') === '1') {
        await route.fulfill({ status: 200, contentType: 'image/png', body: image });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Imported Builder' }) });
      }
    });
    await page.evaluate(() => {
      const decode = HTMLImageElement.prototype.decode;
      HTMLImageElement.prototype.decode = function (this: HTMLImageElement) {
        if (!this.src.startsWith('blob:')) return decode.call(this);
        document.documentElement.dataset.localDecodePending = 'true';
        return new Promise<void>((resolve, reject) => {
          document.addEventListener('release-local-photo-decode', () => {
            document.documentElement.dataset.localDecodePending = 'false';
            void decode.call(this).then(resolve, reject);
          }, { once: true });
        });
      };
    });
    await page.getByLabel('X handle', { exact: false }).fill('APAC_builder');
    await page.getByLabel('Upload your photo').setInputFiles({ name: 'pending-portrait.png', mimeType: 'image/png', buffer: image });
    await expect(page.locator('html')).toHaveAttribute('data-local-decode-pending', 'true');
    await expect(page.getByRole('button', { name: /Opening your photo/ })).toBeDisabled();
    await page.getByRole('button', { name: 'Import from X', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Public X photo and name imported.');
    await expect(page.getByLabel('Your name', { exact: false })).toHaveValue('Imported Builder');
    await expect(page.getByRole('button', { name: /Photo added\. Looking good\./ })).toBeEnabled();
    await page.evaluate(() => document.dispatchEvent(new Event('release-local-photo-decode')));
    await expect(page.locator('html')).toHaveAttribute('data-local-decode-pending', 'false');
    await expect(page.getByRole('button', { name: /Photo added\. Looking good\./ })).toBeEnabled();
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toBeVisible();
    expect((await downloadCard(page)).bytes.length).toBeGreaterThan(10_000);
  });

  test('editing a name during X import preserves the latest edit while importing the photo', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    const image = await photoFixture(page);
    let releaseMetadata: () => void = () => { throw new Error('Metadata gate is not ready'); };
    const metadataGate = new Promise<void>(resolve => { releaseMetadata = resolve; });
    let metadataRequested = false;
    await page.route('**/api/breakpoint/profile?**', async route => {
      if (new URL(route.request().url()).searchParams.get('photo') === '1') {
        await route.fulfill({ status: 200, contentType: 'image/png', body: image });
      } else {
        metadataRequested = true;
        await metadataGate;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Provider Display Name' }) });
      }
    });
    await page.getByLabel('Your name', { exact: false }).fill('First Name');
    await page.getByLabel('X handle', { exact: false }).fill('APAC_builder');
    await page.getByRole('button', { name: 'Import from X', exact: true }).click();
    await expect.poll(() => metadataRequested).toBe(true);
    await expect(page.getByRole('button', { name: 'Importing…', exact: true })).toBeDisabled();
    await page.getByLabel('Your name', { exact: false }).fill('My Latest Name');
    await expect(preview(page)).toHaveAccessibleName(/My Latest Name/);
    const withoutPhoto = await canvasState(page);
    releaseMetadata();
    await expect(page.getByRole('status')).toContainText('Public X photo and name imported.');
    await expect(page.getByLabel('Your name', { exact: false })).toHaveValue('My Latest Name');
    await expect(page.getByRole('slider', { name: 'Photo zoom', exact: true })).toBeVisible();
    await waitForChangedPreview(page, withoutPhoto.fingerprint);
    await expect(preview(page)).toHaveAccessibleName(/My Latest Name/);
  });

  test('failed mobile sharing and a blocked popup expose a usable X composer link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForPreview(page);
    await page.getByLabel('Your chapter').selectOption('jp');
    await page.getByLabel('Flying from', { exact: true }).selectOption('KIX');
    await page.getByRole('group', { name: 'Card design', exact: true }).getByRole('button', { name: /Base template/ }).click();
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
        document.documentElement.dataset.sharedText = data.text || '';
        document.documentElement.dataset.sharedImageType = data.files?.[0]?.type || '';
        throw new DOMException('Native share is unavailable', 'NotAllowedError');
      } });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        write: async () => { throw new DOMException('Clipboard access is unavailable', 'NotAllowedError'); },
      } });
      Object.defineProperty(window, 'open', { configurable: true, value: (url: string | URL) => {
        document.documentElement.dataset.blockedPopup = String(url);
        return null;
      } });
    });
    const composer = page.getByRole('link', { name: 'Open the X composer', exact: true });
    await expect(composer).toHaveCount(0);
    await page.getByRole('button', { name: /Share the good news/ }).click();
    await expect(page.getByRole('status')).toContainText('Attach your downloaded card to the X post.');
    await expect(composer).toBeVisible();
    await expect(composer).toHaveAttribute('target', '_blank');
    await expect(composer).toHaveAttribute('rel', /noopener/);
    const href = await composer.getAttribute('href');
    if (!href) throw new Error('The X composer fallback has no destination');
    const destination = new URL(href);
    expect(destination.origin).toBe('https://x.com');
    expect(destination.pathname).toBe('/intent/post');
    expect(destination.searchParams.get('text')).toBe('I’m going to @SolanaConf Breakpoint 2026 with Superteam Japan! Osaka → London. See you at Olympia, 15-17 November. #Breakpoint2026');
    await expect(page.locator('html')).toHaveAttribute('data-blocked-popup', href);
    await expect(page.locator('html')).toHaveAttribute('data-shared-image-type', 'image/png');
    await expect(page.locator('html')).toHaveAttribute('data-shared-text', destination.searchParams.get('text')!);
    expect(page.context().pages()).toHaveLength(1);
  });

  test('desktop sharing copies a real PNG before opening the correctly encoded X composer', async ({ page }) => {
    await page.goto('/');
    await waitForPreview(page);
    await page.getByLabel('Flying from', { exact: true }).selectOption('HAN');
    await page.getByLabel('Your name', { exact: false }).fill('Hanoi Builder');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        write: async (items: ClipboardItem[]) => {
          const png = await items[0].getType('image/png');
          const bytes = new Uint8Array(await png.arrayBuffer());
          const header = new DataView(bytes.buffer);
          document.documentElement.dataset.copiedPngSignature = Array.from(bytes.subarray(0, 8), value => value.toString(16).padStart(2, '0')).join('');
          document.documentElement.dataset.copiedPngDimensions = `${header.getUint32(16)}x${header.getUint32(20)}`;
          const image = await createImageBitmap(png);
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Copied PNG cannot be decoded');
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const colors = new Set<number>();
          for (let index = 0; index < pixels.length; index += 404) {
            colors.add((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
          }
          image.close();
          document.documentElement.dataset.copiedPngColors = String(colors.size);
        },
      } });
      Object.defineProperty(window, 'open', { configurable: true, value: (url: string | URL) => {
        document.documentElement.dataset.openedComposer = String(url);
        return null;
      } });
    });
    await page.getByRole('button', { name: /Share the good news/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-copied-png-signature', '89504e470d0a1a0a');
    await expect(page.locator('html')).toHaveAttribute('data-copied-png-dimensions', '1600x900');
    await expect.poll(async () => Number(await page.locator('html').getAttribute('data-copied-png-colors'))).toBeGreaterThan(10);
    const fallback = page.getByRole('link', { name: 'Open the X composer', exact: true });
    await expect(fallback).toBeVisible();
    const href = await fallback.getAttribute('href');
    if (!href) throw new Error('Desktop sharing did not expose the X composer destination');
    const composer = new URL(href);
    expect(composer.origin).toBe('https://x.com');
    expect(composer.pathname).toBe('/intent/post');
    expect(composer.searchParams.get('text')).toBe('I’m going to @SolanaConf Breakpoint 2026 with Superteam Vietnam! Hanoi → London. See you at Olympia, 15-17 November. #Breakpoint2026');
    await expect(page.locator('html')).toHaveAttribute('data-opened-composer', href);
    await expect(page.getByRole('status')).toContainText('Card copied. Paste it into your X post.');
    expect(page.context().pages()).toHaveLength(1);
  });

  test('failed X imports leave manual creation available and invalid handles prevent export', async ({ page }) => {
    await page.route('**/api/breakpoint/profile?**', route => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) }));
    await page.goto('/');
    await waitForPreview(page);
    await page.getByLabel('X handle', { exact: false }).fill('missing_profile');
    await page.getByRole('button', { name: 'Import from X', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('You can add your name and photo manually.');
    await page.getByLabel('Your name', { exact: false }).fill('Manual Builder');
    await expect(page.getByRole('button', { name: 'Download my card' })).toBeEnabled();
    await page.getByLabel('X handle', { exact: false }).fill('invalid handle!');
    await expect(page.getByLabel('X handle', { exact: false })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Use an X handle with 1-15 letters, numbers or underscores.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download my card' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Import from X', exact: true })).toBeDisabled();
    await page.getByLabel('X handle', { exact: false }).fill('');
    await expect(page.getByRole('button', { name: 'Download my card' })).toBeEnabled();
    expect((await downloadCard(page)).bytes.length).toBeGreaterThan(10_000);
  });

  test('mobile navigation and card creation fit the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForPreview(page);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('link', { name: 'Make your Breakpoint card', exact: true }).click();
    await expect(page).toHaveURL(/#studio$/);
    await page.getByLabel('Your chapter').selectOption('jp');
    await page.getByLabel('Your name', { exact: false }).fill('Tokyo Builder');
    await expect(preview(page)).toHaveAccessibleName(/Tokyo Builder with Superteam Japan/);
    await page.getByRole('button', { name: 'Square', exact: true }).click();
    const png = await downloadCard(page);
    expect(png.width).toBe(png.height);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await mkdir('output', { recursive: true });
    await page.screenshot({ path: 'output/breakpoint-mobile.png', fullPage: true, animations: 'disabled' });
  });
});
