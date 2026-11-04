import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const inter = localFont({ src: [
  { path: '../public/fonts/inter-400.woff2', weight: '400' },
  { path: '../public/fonts/inter-500.woff2', weight: '500' },
  { path: '../public/fonts/inter-600.woff2', weight: '600' },
], variable: '--font-inter', display: 'swap' });
const manrope = localFont({ src: [
  { path: '../public/fonts/manrope-500.woff2', weight: '500' },
  { path: '../public/fonts/manrope-600.woff2', weight: '600' },
], variable: '--font-manrope', display: 'swap' });
const mono = localFont({ src: '../public/fonts/geist-mono-variable.woff2', variable: '--font-geist-mono', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3107')),
  title: 'APAC is going to Breakpoint',
  description: 'Your chapter. Your card. Your way to London. A community card studio for Breakpoint 2026.',
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0b0b', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${inter.variable} ${manrope.variable} ${mono.variable}`}><body>{children}</body></html>;
}
