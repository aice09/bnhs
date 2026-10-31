import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';
import multiavatar from '@multiavatar/multiavatar';
import { getSettings } from '@/lib/queries';
import { AVATAR_STYLES } from '@/lib/avatar';

const PALETTE = ['#0c2f6b', '#1d5fc0', '#f5b301', '#e8f0fb', '#c0293d'];
const clean = (v: string | null, max: number) => (v ?? '').slice(0, max);

function initials(name: string, seed: string) {
  const letters = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  const hue = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${hue} 45% 32%)"/><text x="50" y="50" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="700" fill="#fff">${letters.replace(/[<&>]/g, '')}</text></svg>`;
}

// Boring Avatars "beam" look, drawn directly (the library needs react-dom/server, which Next forbids in routes).
function beam(seed: string) {
  const h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);
  const pick = (n: number) => PALETTE[(h >> n) % PALETTE.length]!;
  const bg = pick(0), face = pick(3), ey = (h >> 6) % 2 ? 6 : 4, mouth = (h >> 8) % 2;
  const tx = ((h >> 4) % 9) - 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/><rect width="100" height="100" fill="${face}" transform="translate(${tx} 8) rotate(${(h % 360)} 50 50) scale(1.2)" rx="${(h >> 2) % 2 ? 50 : 14}"/><g transform="translate(${tx / 2} 0)"><rect x="30" y="${44 - ey}" width="6" height="${ey + 6}" rx="3" fill="#fff"/><rect x="64" y="${44 - ey}" width="6" height="${ey + 6}" rx="3" fill="#fff"/>${mouth ? '<path d="M36 64 Q50 78 64 64" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>' : '<rect x="40" y="64" width="20" height="8" rx="4" fill="#fff"/>'}</g></svg>`;
}

// One avatar style is chosen by the administrator and used for everyone who has no photo.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const seed = clean(u.searchParams.get('seed'), 120) || 'guest';
  const name = clean(u.searchParams.get('name'), 120);
  const asked = u.searchParams.get('style');
  const style = asked && AVATAR_STYLES.some(([k]) => k === asked) ? asked : (await getSettings()).avatar_style || 'none';
  let svg: string;
  if (style === 'notion') svg = createAvatar(notionists, { seed, backgroundColor: ['e8f0fb', 'fdf3d0', 'dfeaf8'] }).toString();
  else if (style === 'multiavatar') svg = multiavatar(seed);
  else if (style === 'boring') svg = beam(seed);
  else svg = initials(name, seed);
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' } });
}
