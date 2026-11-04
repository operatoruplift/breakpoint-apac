import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { RequestMeta } from './apiHelpers';

type Entry = { count: number; resetAt: number };
const windowMs = 60 * 60 * 1000;
const buckets = new Map<string, Entry>();
let lastCleanup = 0;

function consume(key: string, limit: number, now: number) {
  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    if (buckets.size >= 10_000 && !entry) return { allowed: false, retryAfterSeconds: 60 };
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}

/** Per-process quotas; the shared ceiling also bounds clients rotating forwarded headers. */
export async function checkPublicRouteRate(request: Request, bucket: string, kind: 'submission' | 'signal' = 'submission') {
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
    lastCleanup = now;
  }
  const source = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unidentified').split(',')[0].trim().slice(0,128);
  const identity = createHash('sha256').update(source).digest('hex');
  const personal = consume(`${bucket}:${identity}`, kind === 'signal' ? 120 : 10, now);
  if (!personal.allowed) return personal;
  return consume(`${bucket}:all`, 1200, now);
}

export function rateLimitedResponse(meta: RequestMeta, retryAfterSeconds = 60) {
  return NextResponse.json({ error: 'rate_limited', requestId: meta.requestId, message: 'Too many requests. Try again shortly.' }, {
    status: 429, headers: { ...meta.headers, 'Retry-After': String(retryAfterSeconds) },
  });
}
