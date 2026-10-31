import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardGrid } from '@/components/ItemGrid';
import PageHero from '@/components/PageHero';
import PostCard from '@/components/PostCard';
import SdgGrid from '@/components/SdgGrid';
import { renderMarkdown } from '@/lib/content';
import { getPage, getSettings, listItems, postsSdg } from '@/lib/queries';
import { SDGS, SDG_ABOUT_URL, focusGoals } from '@/lib/sdg';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [page, st] = await Promise.all([getPage('sdg'), getSettings()]);
  if (!page) return {};
  return { title: page.title, description: `${page.subtitle}. Sustainable Development Goals at ${st.school_name}.`, alternates: { canonical: '/sdg' } };
}

export default async function SdgPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const g = Number((await searchParams).goal);
  const goal = Number.isInteger(g) && g >= 1 && g <= 17 ? g : null;
  const [page, s] = await Promise.all([getPage('sdg'), getSettings()]);
  if (!page) notFound();
  const [items, news] = await Promise.all([listItems('sdg'), postsSdg(goal, 9)]);
  const focus = focusGoals(s.sdg_focus);
  return (
    <>
      <PageHero title={page.title} sub={page.subtitle} crumbs={[[page.title]]} image={page.image} />
      <div className="subnav"><div className="wrap">
        <a href="#what">What is SDG?</a><a href="#goals">The 17 goals</a>
        {items.length > 0 && <a href="#projects">Our projects</a>}{news.length > 0 && <a href="#news">News</a>}
      </div></div>
      <section className="s"><div className="wrap">
        <div className="block sdg-what" id="what">
          <div>
            <h2>What is SDG?</h2>
            <p>The <b>Sustainable Development Goals (SDGs)</b> are 17 goals adopted by all United Nations member states in 2015 as a shared plan for peace and prosperity for people and the planet, to be reached by 2030. They cover education, health, poverty, climate, equality and more, and call on governments, schools, businesses and communities to act together.</p>
            <a className="btn" href={SDG_ABOUT_URL} target="_blank" rel="noopener noreferrer">Read more at the United Nations <i className="fa-solid fa-arrow-up-right-from-square" /></a>
          </div>
          <div className="sdg-wheel"><img src="/sdg/goal-4.jpg" alt="SDG 4 Quality Education" width={180} height={180} /></div>
        </div>

        {page.content && <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />}

        <div className="block" id="goals">
          <h2>The 17 Sustainable Development Goals</h2>
          <p className="blurb">Select a goal to open it on the United Nations SDG website.{focus.length > 0 && ' Goals with a gold outline are our focus.'}</p>
          <SdgGrid focus={s.sdg_focus} />
        </div>

        {items.length > 0 && <div className="block" id="projects"><h2>Our SDG projects</h2><CardGrid items={items} /></div>}
        {(news.length > 0 || goal) && <div className="block" id="news"><h2>SDG news{goal && <> · SDG {goal}: {SDGS[goal - 1].title}</>}</h2>
          <div className="sdg-filter"><Link href="/sdg#news" className={goal ? '' : 'on'}>All</Link>{SDGS.map((x) => <Link key={x.n} href={`/sdg?goal=${x.n}#news`} className={goal === x.n ? 'on' : ''}>SDG {x.n}</Link>)}</div><div className="grid g3">{news.map((p) => <PostCard key={p.id} p={p} />)}</div>
          {news.length === 0 && <p className="help">No stories for this goal yet.</p>}</div>}
      </div></section>
    </>
  );
}
