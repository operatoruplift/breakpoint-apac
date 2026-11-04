import type { NextConfig } from 'next';

const production = process.env.NODE_ENV === 'production';
const config: NextConfig = {
  async redirects() {
    return [{ source: '/breakpoint', destination: '/', permanent: false }];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: [
        "default-src 'self'", `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`,
        "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
        `connect-src 'self'${production ? '' : ' ws:'}`, "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
      ].join('; ') },
    ] }];
  },
};
export default config;
