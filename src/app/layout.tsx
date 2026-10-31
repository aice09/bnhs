import type { Metadata, Viewport } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';
import { getSettings } from '@/lib/queries';
import { fullPlace, place, siteUrl } from '@/lib/site';
import { themeCss, themeFromSettings } from '@/lib/theme';

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: themeFromSettings(await getSettings()).dark, width: 'device-width', initialScale: 1 };
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.school_name || 'School website';
  const where = place(s);
  const logo = s.logo_url || '/logo.png';
  const desc = `Official website of ${name}${s.short_name ? ` (${s.short_name})` : ''}${s.levels_text ? `, ${s.levels_text}` : ''}${where ? ` in ${fullPlace(s)}` : ''}. History, programs, admissions, news and contact.`;
  const kw = (s.seo_keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name}${s.short_name ? ` (${s.short_name})` : ''}${where ? ` | ${where}` : ''}`, template: `%s | ${name}` },
    description: desc,
    keywords: kw,
    applicationName: name,
    authors: [{ name }],
    alternates: { canonical: '/' },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    icons: { icon: logo, apple: logo },
    openGraph: { type: 'website', locale: s.locale || 'en_PH', siteName: name, url: '/', title: `${name}${where ? ' – ' + where : ''}`, description: desc, images: [logo] },
    twitter: { card: 'summary_large_image' },
    other: s.latitude && s.longitude ? {
      'geo.region': s.country_code && s.province ? `${s.country_code}` : '', 'geo.placename': fullPlace(s),
      'geo.position': `${s.latitude};${s.longitude}`, ICBM: `${s.latitude}, ${s.longitude}`,
    } : undefined,
  };
}

export default async function Root({ children }: { children: React.ReactNode }) {
  const css = themeCss(themeFromSettings(await getSettings()));
  return (
    <html lang="en">
      <head><style dangerouslySetInnerHTML={{ __html: css }} /></head>
      <body>{children}</body>
    </html>
  );
}
