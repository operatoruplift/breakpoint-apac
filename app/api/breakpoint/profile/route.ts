import { NextResponse } from 'next/server';
import { withRequestMeta } from '@/lib/apiHelpers';
import { checkPublicRouteRate, rateLimitedResponse } from '@/lib/public-route-rate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const TIMEOUT_MS = 10_000;
const JSON_LIMIT = 128 * 1024;
const PHOTO_LIMIT = 5 * 1024 * 1024;

/** Read the decompressed stream with a ceiling even when Content-Length is absent. */
async function readBounded(response: Response, limit: number): Promise<Uint8Array> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null && Number(declaredLength) > limit) {
    await response.body?.cancel();
    throw new Error('invalid_upstream_body');
  }
  if (!response.body) throw new Error('invalid_upstream_body');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let done = false;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) { done = true; break; }
      size += next.value.byteLength;
      if (size > limit) throw new Error('invalid_upstream_body');
      chunks.push(next.value);
    }
  } finally {
    if (!done) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

/** Optional public-profile import. The user chooses to send their handle to this provider. */
export async function GET(request: Request) {
  const meta = withRequestMeta(request, 'breakpoint.profile');
  const headers = {
    ...meta.headers,
    'Cache-Control': 'private, no-store',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  const refusal = (status: number, error: string) => NextResponse.json(
    { error, requestId: meta.requestId }, { status, headers },
  );

  let signal: AbortSignal | undefined;
  try {
    // The JSON and photo share one quota, so each import consumes two reads.
    const gate = await checkPublicRouteRate(request, 'breakpoint:profile', 'signal');
    if (!gate.allowed) {
      const response = rateLimitedResponse(meta, gate.retryAfterSeconds);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      return response;
    }

    const params = new URL(request.url).searchParams;
    const handle = params.get('handle') ?? '';
    const photo = params.get('photo');
    if (!HANDLE.test(handle) || params.getAll('handle').length !== 1
      || params.getAll('photo').length > 1 || (photo !== null && photo !== '1')) {
      return refusal(400, 'invalid_handle');
    }

    // Only this fixed origin is contacted; handles cannot add a path or a query.
    const upstreamUrl = `https://goingtobreakpoint.com/x/${handle}${photo === '1' ? '.jpg' : ''}`;
    signal = AbortSignal.timeout(TIMEOUT_MS);
    const upstream = await fetch(upstreamUrl, {
      method: 'GET', redirect: 'error', cache: 'no-store', signal,
      headers: { Accept: photo === '1' ? 'image/jpeg' : 'application/json' },
    });
    if (!upstream.ok) {
      await upstream.body?.cancel();
      return refusal(upstream.status === 404 ? 404 : 502,
        upstream.status === 404 ? 'profile_not_found' : 'profile_unavailable');
    }

    const contentType = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (contentType !== (photo === '1' ? 'image/jpeg' : 'application/json')) {
      await upstream.body?.cancel();
      return refusal(502, 'profile_unavailable');
    }
    const bytes = await readBounded(upstream, photo === '1' ? PHOTO_LIMIT : JSON_LIMIT);
    if (photo === '1') {
      if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
        return refusal(502, 'profile_unavailable');
      }
      return new NextResponse(bytes.buffer as ArrayBuffer, {
        headers: { ...headers, 'Content-Type': 'image/jpeg' },
      });
    }

    const profile: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!profile || typeof profile !== 'object') return refusal(502, 'profile_unavailable');
    const { name, handle: providerHandle } = profile as Record<string, unknown>;
    if (typeof name !== 'string' || typeof providerHandle !== 'string'
      || !HANDLE.test(providerHandle) || providerHandle.toLowerCase() !== handle.toLowerCase()) {
      return refusal(502, 'profile_unavailable');
    }
    const safeName = name.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, 100);
    if (!safeName) return refusal(502, 'profile_unavailable');
    return NextResponse.json({
      name: safeName,
      handle: providerHandle,
      photoUrl: `/api/breakpoint/profile?handle=${encodeURIComponent(providerHandle)}&photo=1`,
    }, { headers });
  } catch {
    return signal?.aborted ? refusal(504, 'profile_timeout') : refusal(502, 'profile_unavailable');
  }
}
