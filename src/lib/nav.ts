import { ABOUT_SLUGS } from './sections';
import type { PageRow } from './queries';

export type NavGroup = { label: string; href?: string; items: { href: string; label: string }[] };

type P = Pick<PageRow, 'slug' | 'title' | 'menu' | 'sort'>;

const href = (slug: string) => (slug === 'about-us' ? '/about' : ABOUT_SLUGS.includes(slug) ? `/about/${slug}` : `/${slug}`);

// Builds the public menu from enabled CMS pages, so disabling a page removes it from the menu.
export function buildNav(pages: P[]): NavGroup[] {
  const of = (menu: string) => pages.filter((p) => p.menu === menu).map((p) => ({ href: href(p.slug), label: p.title }));
  const has = (slug: string) => pages.some((p) => p.slug === slug);
  return [
    { label: 'About', href: '/about', items: [...of('about'), { href: '/faculty', label: 'Faculty & Staff' }] },
    { label: 'Academics', href: '/academics', items: [{ href: '/academics', label: 'Academic Programs' }, ...of('academics')] },
    { label: 'Student Life', items: of('student-life') },
    { label: 'Admissions', href: '/admissions', items: [{ href: '/admissions', label: 'Enrollment' }, ...of('admissions'), { href: '/downloads', label: 'Downloads' }] },
    { label: 'News', href: '/news', items: [] },
    ...(has('partnerships') ? [{ label: 'Partnerships', href: '/partnerships', items: [] }] : []),
    { label: 'Contact', href: '/contact', items: [] },
  ].filter((g) => g.items.length > 0 || g.href);
}
