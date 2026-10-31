import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/queries';
import { place } from '@/lib/site';
import { themeFromSettings } from '@/lib/theme';

export const alt = 'School';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function Image() {
  const s = await getSettings();
  const t = themeFromSettings(s);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: `linear-gradient(115deg,${t.dark},${t.accent})`, color: '#fff' }}>
        <div style={{ fontSize: 28, letterSpacing: 6, color: t.gold }}>{place(s).toUpperCase()}</div>
        <div style={{ fontSize: 80, fontWeight: 700, marginTop: 20, lineHeight: 1.1 }}>{s.school_name}</div>
        <div style={{ fontSize: 34, marginTop: 24, color: '#e8eef9' }}>{s.tagline}</div>
      </div>
    ),
    size,
  );
}
