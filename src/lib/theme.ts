// Color theme helpers (safe for client and server).
export type Theme = { dark: string; primary: string; accent: string; light: string; gold: string };

export const DEFAULT_THEME: Theme = { dark: '#071b3f', primary: '#0c2f6b', accent: '#1d5fc0', light: '#e8f0fb', gold: '#f5b301' };

// Ready-made palettes in the spirit of colorhunt.co: darkest, main, accent, light tint, highlight.
export const PALETTES: { name: string; theme: Theme }[] = [
  { name: 'Navy & Gold', theme: DEFAULT_THEME },
  { name: 'Forest Green', theme: { dark: '#0b3a22', primary: '#0f4d2e', accent: '#1a7a47', light: '#e7f3ec', gold: '#c9a227' } },
  { name: 'Maroon & Gold', theme: { dark: '#3b0d1a', primary: '#6b1426', accent: '#a8223a', light: '#f9ecee', gold: '#e0a526' } },
  { name: 'Royal Purple', theme: { dark: '#231651', primary: '#3d2a8c', accent: '#6d4fd6', light: '#efeafd', gold: '#f2b705' } },
  { name: 'Ocean Teal', theme: { dark: '#06283d', primary: '#0b4f6c', accent: '#0f8b8d', light: '#e3f4f4', gold: '#f6a609' } },
  { name: 'Slate Blue', theme: { dark: '#1b3c53', primary: '#234c6a', accent: '#456882', light: '#eaeef1', gold: '#e0a33a' } },
  { name: 'Charcoal & Orange', theme: { dark: '#1f2430', primary: '#2f3a4f', accent: '#d2491f', light: '#f4f1ec', gold: '#f2a900' } },
  { name: 'Earth & Sand', theme: { dark: '#2b2118', primary: '#4a3728', accent: '#8a5a2b', light: '#f5eee6', gold: '#d9a441' } },
  { name: 'Crimson & Navy', theme: { dark: '#10213f', primary: '#1c3566', accent: '#c0293d', light: '#f3f0f2', gold: '#f0b429' } },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: string) => HEX.test(v);

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
export function luminance(h: string) {
  const [r, g, b] = rgb(h).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const saturation = (h: string) => { const c = rgb(h); const mx = Math.max(...c), mn = Math.min(...c); return mx === 0 ? 0 : (mx - mn) / mx; };

// Darkens a color until it reads on a background (links, buttons with white text).
function ensureContrast(color: string, against: string, min: number) {
  let c = color;
  for (let i = 0; i < 12 && contrast(c, against) < min; i++) c = mix(c, '#000000', 0.12);
  return c;
}
// Lightens a color until dark text reads on it.
function ensureLight(color: string, min: number) {
  let c = color;
  for (let i = 0; i < 12 && contrast('#1a2438', c) < min; i++) c = mix(c, '#ffffff', 0.15);
  return c;
}

export function sanitizeTheme(t: Partial<Theme>): Theme {
  const out = { ...DEFAULT_THEME };
  for (const k of Object.keys(out) as (keyof Theme)[]) if (t[k] && isHex(t[k]!)) out[k] = t[k]!.toLowerCase();
  return out;
}

// Accepts a colorhunt.co palette URL (…/palette/1b3c53234c6a456882e3e3e3) or 3–5 hex codes and maps them to theme roles.
export function themeFromColors(input: string): Theme | null {
  const url = input.match(/palette\/([0-9a-f]{12,30})/i);
  const codes = url ? url[1].match(/.{6}/g)! : (input.match(/#?[0-9a-f]{6}\b/gi) || []).map((c) => c.replace('#', ''));
  const colors = [...new Set(codes.map((c) => '#' + c.toLowerCase()))].slice(0, 5);
  if (colors.length < 3) return null;
  const sorted = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const dark = sorted[0];
  const light = sorted[sorted.length - 1];
  const middle = sorted.slice(1, -1);
  const primary = ensureContrast(middle[0] ?? mix(dark, light, 0.25), '#ffffff', 7);
  const accent = ensureContrast(middle.length > 1 ? middle[middle.length - 1] : mix(primary, light, 0.35), '#ffffff', 4);
  const gold = [...middle, ...colors].sort((a, b) => saturation(b) - saturation(a)).find((c) => c !== dark && c !== light && luminance(c) > 0.25 && saturation(c) > 0.4) ?? '#f5b301';
  return { dark: mix(dark, '#000000', luminance(dark) > 0.08 ? 0.35 : 0), primary, accent, light: ensureLight(mix(light, '#ffffff', 0.55), 12), gold };
}

export function themeFromSettings(s: Record<string, string> | undefined): Theme {
  return sanitizeTheme({ dark: s?.theme_dark, primary: s?.theme_primary, accent: s?.theme_accent, light: s?.theme_light, gold: s?.theme_gold });
}

export const themeCss = (t: Theme) =>
  `:root{--g9:${t.dark};--g8:${t.primary};--g6:${t.accent};--g1:${t.light};--cream:${mix(t.light, '#ffffff', 0.6)};--gold:${t.gold};--on-gold:${luminance(t.gold) > 0.4 ? '#1a2438' : '#ffffff'}}`;
