import { expect, test } from '@playwright/test';
import { checkPublicRouteRate } from '../../lib/public-route-rate';
import { withRequestMeta } from '../../lib/apiHelpers';

test('an already limited source cannot exhaust the shared budget for other visitors', async () => {
  const bucket = `isolated-${crypto.randomUUID()}`;
  const noisy = new Request('https://studio.invalid/api/breakpoint/profile', { headers: { 'x-forwarded-for': '192.0.2.1' } });
  for (let index = 0; index < 1500; index++) {
    expect((await checkPublicRouteRate(noisy, bucket, 'signal')).allowed).toBe(index < 120);
  }
  const visitor = new Request(noisy.url, { headers: { 'x-forwarded-for': '192.0.2.2' } });
  expect((await checkPublicRouteRate(visitor, bucket, 'signal')).allowed).toBe(true);
});

test('rotating forwarded identities still hits the bounded instance ceiling', async () => {
  const bucket = `rotating-${crypto.randomUUID()}`;
  for (let index = 0; index <= 1200; index++) {
    const request = new Request('https://studio.invalid/api/breakpoint/profile', { headers: { 'x-forwarded-for': `source-${index}` } });
    const verdict = await checkPublicRouteRate(request, bucket, 'signal');
    expect(verdict.allowed).toBe(index < 1200);
    if (!verdict.allowed) expect(verdict.retryAfterSeconds).toBeGreaterThan(0);
  }
});

test('request IDs preserve bounded safe references and replace unsafe ones', () => {
  const safe = withRequestMeta(new Request('https://studio.invalid', { headers: { 'x-request-id': 'req_safe_reference' } }), 'fixture');
  expect(safe.headers['X-Request-Id']).toBe('req_safe_reference');
  const unsafe = withRequestMeta(new Request('https://studio.invalid', { headers: { 'x-request-id': 'X'.repeat(200) } }), 'fixture');
  expect(unsafe.requestId).toMatch(/^req_[a-f\d-]{36}$/);
});
