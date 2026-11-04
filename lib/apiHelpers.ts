export type RequestMeta = { requestId: string; startedAt: string; route: string; headers: { 'X-Request-Id': string } };

export function withRequestMeta(request: Request, route: string): RequestMeta {
  const provided = request.headers.get('x-request-id');
  const requestId = provided && /^[A-Za-z0-9_-]{8,80}$/.test(provided) ? provided : `req_${crypto.randomUUID()}`;
  return { requestId, route, startedAt: new Date().toISOString(), headers: { 'X-Request-Id': requestId } };
}
