import type { Settings } from './queries';

export const siteUrl = () => process.env.SITE_URL || 'http://localhost:3000';

// Short, reusable bits of text built from the school settings, so no page hard-codes a school name or place.
export const place = (s: Settings) => [s.city, s.province].filter(Boolean).join(', ');
export const fullPlace = (s: Settings) => [s.street, s.city, s.province].filter(Boolean).join(', ');
export const schoolLabel = (s: Settings) => (s.short_name && s.short_name !== s.school_name ? `${s.school_name} (${s.short_name})` : s.school_name);

export function describe(s: Settings, what: string) {
  return `${what} – ${s.school_name}${place(s) ? ', ' + place(s) : ''}.`;
}
