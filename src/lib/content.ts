import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(md: string): string {
  const html = marked.parse(md || '', { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });
}

export function fmtDate(d: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-PH', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'item';
}

// Tags are stored as a lowercase comma separated list: "Research, Grade 12" -> "research,grade-12".
export function normTags(input: string): string {
  return [...new Set(input.split(',').map((t) => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean))].slice(0, 8).join(',');
}
export const splitTags = (tags: string) => tags.split(',').filter(Boolean);
