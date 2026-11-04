import type { Metadata } from 'next';
import BreakpointStudio from './BreakpointStudio';

export const metadata: Metadata = {
  title: { absolute: 'APAC is going to Breakpoint · The chapter card studio' },
  description: 'Make your Breakpoint 2026 card with Superteam Vietnam, Korea, Japan and the rest of your crew. Pick your chapter, personalize your card, and see you in London.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'APAC is going to Breakpoint',
    description: 'Your chapter. Your card. Your way to London. Make a personalized Breakpoint 2026 graphic.',
    url: '/', siteName: 'Breakpoint chapter card studio',
  },
  twitter: { card: 'summary', title: 'APAC is going to Breakpoint', description: 'Make your chapter card for Breakpoint 2026.' },
};

export default async function BreakpointPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : '';
  return <BreakpointStudio initialChapter={value('chapter')} initialAirport={value('from')} initialDesign={value('design')} initialFormat={value('format')} />;
}
