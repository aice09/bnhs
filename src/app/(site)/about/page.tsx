import type { Metadata } from 'next';
import Link from 'next/link';
import { describe } from '@/lib/site';
import PageHero from '@/components/PageHero';
import { renderMarkdown } from '@/lib/content';
import { buildNav } from '@/lib/nav';
import { enabledPages, getPage, getSettings } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: `About ${s.school_name}`, description: describe(s, 'Who we are: history, mission, vision, philosophy and school profile'), alternates: { canonical: '/about' } };
}

export default async function About() {
  const [page, pages] = await Promise.all([getPage('about-us'), enabledPages()]);
  const links = buildNav(pages).find((g) => g.label === 'About')?.items.filter((i) => i.href !== '/about') ?? [];
  return (
    <>
      <PageHero title={page?.title || 'About Us'} sub={page?.subtitle} crumbs={[['About']]} />
      <section className="s"><div className="wrap two">
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page?.content || '') }} />
        <aside><div className="side"><h3>Explore</h3>{links.map((l) => <p key={l.href} style={{ margin: '8px 0' }}><Link href={l.href}><i className="fa-solid fa-angle-right" /> {l.label}</Link></p>)}</div></aside>
      </div></section>
    </>
  );
}
