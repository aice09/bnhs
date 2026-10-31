import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { renderMarkdown } from '@/lib/content';
import { getPage } from '@/lib/queries';
import { ABOUT_SLUGS as ALLOWED } from '@/lib/sections';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = ALLOWED.includes(slug) ? await getPage(slug) : null;
  return page ? { title: page.title, description: `${page.subtitle}. ${page.content.replace(/[#*\[\]()>_`-]/g, '').slice(0, 130)}`, alternates: { canonical: `/about/${slug}` } } : {};
}

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = ALLOWED.includes(slug) ? await getPage(slug) : null;
  if (!page) notFound();
  return (
    <>
      <PageHero title={page.title} sub={page.subtitle} crumbs={[['About', '/about'], [page.title]]} />
      <section className="s"><div className="wrap">
        <article className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
      </div></section>
    </>
  );
}
