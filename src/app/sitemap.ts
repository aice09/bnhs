import type { MetadataRoute } from 'next';
import { buildNav } from '@/lib/nav';
import { allPostSlugs, enabledPages, listAlumni, listGroups } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const fixed: [string, number][] = [
    ['', 1], ['/academics', 0.9], ['/admissions', 0.9], ['/news', 0.8], ['/faculty', 0.6], ['/downloads', 0.5], ['/contact', 0.7],
  ];
  const pages = await enabledPages().catch(() => []);
  for (const g of buildNav(pages))
    for (const href of [g.href, ...g.items.map((i) => i.href)])
      if (href && !fixed.some(([p]) => p === href)) fixed.push([href, href === '/about/history' ? 0.8 : 0.6]);
  const groups = await listGroups().catch(() => []);
  const alumni = await listAlumni().catch(() => []);
  const posts = await allPostSlugs().catch(() => []);
  return [
    ...fixed.map(([p, priority]) => ({ url: base + p, changeFrequency: 'weekly' as const, priority })),
    ...['/alumni/directory', '/alumni/events', '/alumni/stories'].map((p) => ({ url: base + p, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...groups.map((g) => ({ url: `${base}/groups/${g.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...alumni.map((a) => ({ url: `${base}/alumni/${a.id}`, changeFrequency: 'monthly' as const, priority: 0.3 })),
    ...posts.map((p) => ({ url: `${base}/news/${p.slug}`, lastModified: new Date(p.updated_at), priority: 0.6 })),
  ];
}
