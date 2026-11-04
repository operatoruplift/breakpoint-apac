import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { withRequestMeta } from '../../lib/apiHelpers';
import { rateLimitedResponse } from '../../lib/public-route-rate';

const source = ts.transpileModule(readFileSync('app/api/breakpoint/profile/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const requestId = 'req_breakpoint_profile_fixture';
const json = (body: unknown) => Response.json(body);
const profile = () => json({ name: 'Superteam Vietnam', handle: 'SuperteamVN', privateField: 'discard-me' });

/** Execute the actual route with provider and quota fixtures; never contact the network. */
function harness({ fetchImpl = async () => profile(), allowed = true, timeout = false }: {
  fetchImpl?: (url: string, options: RequestInit) => Promise<Response>;
  allowed?: boolean;
  timeout?: boolean;
} = {}) {
  const state = { fetches: [] as { url: string; options: RequestInit }[], budgets: [] as string[], timeouts: [] as number[] };
  const controller = new AbortController();
  if (timeout) controller.abort();
  const moduleRecord = { exports: {} };
  new Script(source, { filename: 'app/api/breakpoint/profile/route.ts' }).runInNewContext({
    module: moduleRecord, exports: moduleRecord.exports, Response, Request, Headers, URL, Uint8Array,
    TextDecoder, Error, Object,
    AbortSignal: { timeout: (milliseconds: number) => { state.timeouts.push(milliseconds); return controller.signal; } },
    fetch: async (url: string, options: RequestInit) => {
      state.fetches.push({ url, options });
      return fetchImpl(url, options);
    },
    require(name: string) {
      if (name === 'next/server') return { NextResponse: Response };
      if (name === '@/lib/apiHelpers') return { withRequestMeta };
      if (name === '@/lib/public-route-rate') return {
        checkPublicRouteRate: async (_request: Request, bucket: string, kind: string) => {
          state.budgets.push(`${bucket}:${kind}`);
          return { allowed, retryAfterSeconds: 42 };
        }, rateLimitedResponse,
      };
      throw new Error(`Unexpected route dependency: ${name}`);
    },
  });
  const route = moduleRecord.exports as { GET: (request: Request) => Promise<Response> };
  return {
    state,
    get: (query = 'handle=SuperteamVN') => route.GET(new Request(`https://app.invalid/api/breakpoint/profile?${query}`, {
      headers: { 'X-Request-Id': requestId },
    })),
  };
}

function expectPrivate(response: Response) {
  expect(response.headers.get('x-request-id')).toBe(requestId);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('cdn-cache-control')).toBe('no-store');
  expect(response.headers.get('vercel-cdn-cache-control')).toBe('no-store');
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
}

test('imports only the public name and matching handle through a fixed provider URL', async () => {
  const h = harness();
  const response = await h.get();
  expect(response.status).toBe(200);
  expectPrivate(response);
  expect(await response.json()).toEqual({
    name: 'Superteam Vietnam', handle: 'SuperteamVN',
    photoUrl: '/api/breakpoint/profile?handle=SuperteamVN&photo=1',
  });
  expect(h.state.budgets).toEqual(['breakpoint:profile:signal']);
  expect(h.state.timeouts).toEqual([10_000]);
  expect(h.state.fetches[0]).toMatchObject({
    url: 'https://goingtobreakpoint.com/x/SuperteamVN',
    options: { method: 'GET', redirect: 'error', cache: 'no-store', headers: { Accept: 'application/json' } },
  });
  expect(h.state.fetches[0].options.signal).toBeInstanceOf(AbortSignal);
});

test('normalizes control characters and bounds the imported display name', async () => {
  const h = harness({ fetchImpl: async () => json({ name: ` \u0000\u202e${'A'.repeat(150)}\u2066 `, handle: 'superteamvn' }) });
  const response = await h.get();
  expect(await response.json()).toMatchObject({ name: 'A'.repeat(100), handle: 'superteamvn' });
});

for (const query of [
  '', 'handle=', 'handle=%40SuperteamVN', 'handle=../../internal', 'handle=https://private.invalid',
  'handle=abcdefghijklmnop', 'handle=Vi%E1%BB%87tnam', 'handle=SuperteamVN%20',
  'handle=SuperteamVN&handle=Other', 'handle=SuperteamVN&photo=0',
  'handle=SuperteamVN&photo=1&photo=1',
]) {
  test(`refuses malformed handle parameters before provider access: ${query || '(missing)'}`, async () => {
    const h = harness();
    const response = await h.get(query);
    expect(response.status).toBe(400);
    expectPrivate(response);
    expect(await response.json()).toEqual({ error: 'invalid_handle', requestId });
    expect(h.state.fetches).toEqual([]);
  });
}

test('enforces the quota for JSON and photo requests without contacting the provider', async () => {
  const h = harness({ allowed: false });
  for (const query of ['handle=SuperteamVN', 'handle=SuperteamVN&photo=1']) {
    const response = await h.get(query);
    expect(response.status).toBe(429);
    expectPrivate(response);
    expect(response.headers.get('retry-after')).toBe('42');
  }
  expect(h.state.fetches).toEqual([]);
});

for (const [upstreamStatus, status, error] of [
  [404, 404, 'profile_not_found'], [401, 502, 'profile_unavailable'],
  [429, 502, 'profile_unavailable'], [500, 502, 'profile_unavailable'],
] as const) {
  test(`maps provider status ${upstreamStatus} to ${status} without echoing its body`, async () => {
    const h = harness({ fetchImpl: async () => new Response('private provider diagnostic', { status: upstreamStatus }) });
    const response = await h.get();
    expect(response.status).toBe(status);
    expectPrivate(response);
    expect(await response.json()).toEqual({ error, requestId });
  });
}

for (const timeout of [false, true]) {
  test(`maps ${timeout ? 'timeout' : 'transport or redirect failure'} without exposing provider diagnostics`, async () => {
    const h = harness({ timeout, fetchImpl: async () => { throw new Error('private provider diagnostic'); } });
    const response = await h.get();
    expect(response.status).toBe(timeout ? 504 : 502);
    expectPrivate(response);
    expect(await response.json()).toEqual({ error: timeout ? 'profile_timeout' : 'profile_unavailable', requestId });
  });
}

for (const body of [null, [], { name: '', handle: 'SuperteamVN' }, { name: '\u0000', handle: 'SuperteamVN' },
  { name: 'Name', handle: 'Other' }, { name: 'Name', handle: '../redirect' }, { name: 12, handle: 'SuperteamVN' }]) {
  test(`refuses malformed provider document ${JSON.stringify(body)}`, async () => {
    const h = harness({ fetchImpl: async () => json(body) });
    const response = await h.get();
    expect(response.status).toBe(502);
    expectPrivate(response);
    expect(await response.json()).toEqual({ error: 'profile_unavailable', requestId });
  });
}

test('refuses unexpected content types, invalid JSON, and oversized JSON streams', async () => {
  for (const upstream of [
    new Response('<script>private diagnostic</script>', { headers: { 'content-type': 'text/html' } }),
    new Response('not json', { headers: { 'content-type': 'application/json' } }),
    new Response(new Uint8Array(128 * 1024 + 1), { headers: { 'content-type': 'application/json' } }),
    new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': String(128 * 1024 + 1) } }),
  ]) {
    const h = harness({ fetchImpl: async () => upstream });
    const response = await h.get();
    expect(response.status).toBe(502);
    expectPrivate(response);
    expect(await response.json()).toEqual({ error: 'profile_unavailable', requestId });
  }
});

test('proxies JPEG bytes through the same fixed origin and quota', async () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
  const h = harness({ fetchImpl: async () => new Response(jpeg, { headers: { 'content-type': 'image/jpeg' } }) });
  const response = await h.get('handle=SuperteamVN&photo=1');
  expect(response.status).toBe(200);
  expectPrivate(response);
  expect(response.headers.get('content-type')).toBe('image/jpeg');
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(jpeg);
  expect(h.state.fetches[0].url).toBe('https://goingtobreakpoint.com/x/SuperteamVN.jpg');
  expect(h.state.budgets).toEqual(['breakpoint:profile:signal']);
});

test('refuses SVG, fake JPEG content, and oversized photos', async () => {
  for (const upstream of [
    new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }),
    new Response('<svg/>', { headers: { 'content-type': 'image/jpeg' } }),
    new Response(new Uint8Array(5 * 1024 * 1024 + 1), { headers: { 'content-type': 'image/jpeg' } }),
    new Response('jpeg', { headers: { 'content-type': 'image/jpeg', 'content-length': String(5 * 1024 * 1024 + 1) } }),
  ]) {
    const h = harness({ fetchImpl: async () => upstream });
    const response = await h.get('handle=SuperteamVN&photo=1');
    expect(response.status).toBe(502);
    expectPrivate(response);
  }
});

test('the running standalone proxy accepts public requests and validates before provider access', async ({ request }) => {
  const response = await request.get('/api/breakpoint/profile?handle=%40invalid', { headers: { 'X-Request-Id': requestId } });
  expect(response.status()).toBe(400);
  expect(response.headers()['x-request-id']).toBe(requestId);
  expect(response.headers()['cache-control']).toBe('private, no-store');
  expect(await response.json()).toEqual({ error: 'invalid_handle', requestId });
});
