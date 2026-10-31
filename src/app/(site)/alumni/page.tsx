import type { Metadata } from 'next';
import { avatarUrl } from '@/lib/avatar';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AlumniNav, { JoinButtons } from '@/components/AlumniNav';
import DateBadge from '@/components/DateBadge';
import { ListRows } from '@/components/ItemGrid';
import StoryCards from '@/components/StoryCards';
import PageHero from '@/components/PageHero';
import PostCard from '@/components/PostCard';
import { getUser } from '@/lib/auth';
import { renderMarkdown } from '@/lib/content';
import { getPage, getSettings, listAlumni, listItems, postsAbout } from '@/lib/queries';
import { describe } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Alumni', description: describe(s, 'Alumni network, directory, stories, events and career opportunities'), alternates: { canonical: '/alumni' } };
}

const TILES = [
  ['/alumni/directory', 'address-book', 'Alumni directory'], ['/alumni/events', 'calendar-days', 'Events & reunions'],
  ['/alumni/stories', 'book-open-reader', 'Alumni stories'], ['#opportunities', 'briefcase', 'Career & mentorship'],
  ['/contact', 'hand-holding-heart', 'Support the school'],
] as const;

export default async function Alumni() {
  const page = await getPage('alumni');
  if (!page) notFound();
  const [items, alumni, news, user] = await Promise.all([listItems('alumni'), listAlumni(), postsAbout(['alumni'], [], 3), getUser()]);
  const today = new Date().toISOString().slice(0, 10);
  const stories = items.filter((i) => i.block === 'stories').sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3);
  const events = items.filter((i) => i.block === 'events' && (!i.event_date || i.event_date >= today))
    .sort((a, b) => (a.event_date ?? '9').localeCompare(b.event_date ?? '9')).slice(0, 3);
  const opps = items.filter((i) => i.block === 'opportunities');
  const featured = alumni.filter((a) => a.featured).slice(0, 4);
  return (
    <>
      <PageHero title={page.title} sub={page.subtitle} crumbs={[[page.title]]} image={page.image} />
      <AlumniNav active="/alumni" />
      <section className="s"><div className="wrap">
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
        <JoinButtons isAlumni={user?.role === 'alumni'} />
        <div className="qtiles" style={{ marginTop: 26 }}>
          {TILES.map(([href, icon, label]) => <Link key={label} className="qtile" href={href}><i className={`fa-solid fa-${icon}`} />{label}</Link>)}
        </div>

        {stories.length > 0 && <div className="block"><div className="row between"><h2>Featured alumni stories</h2><Link href="/alumni/stories">View all <i className="fa-solid fa-arrow-right" /></Link></div><StoryCards items={stories} /></div>}

        {events.length > 0 && (
          <div className="block"><div className="row between"><h2>Upcoming alumni events</h2><Link href="/alumni/events">View all <i className="fa-solid fa-arrow-right" /></Link></div>
            <div className="grid g3">{events.map((e) => (
              <Link className="card" key={e.id} href={`/alumni/events/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}><div className="body" style={{ display: 'flex', gap: 14 }}>
                <DateBadge date={e.event_date} /><div><h3 style={{ margin: 0 }}>{e.title}</h3><small className="meta">{[e.category, e.extra].filter(Boolean).join(' · ')}</small></div></div></Link>))}</div></div>)}

        {featured.length > 0 && (
          <div className="block"><div className="row between"><h2>Featured alumni</h2><Link href="/alumni/directory">Open directory <i className="fa-solid fa-arrow-right" /></Link></div>
            <div className="grid g4">{featured.map((a) => (
              <Link key={a.id} href={`/alumni/${a.id}`} className="card pcard" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="pphoto"><img src={a.photo || avatarUrl(a.id, a.name)} alt={a.name} loading="lazy" /></div>
                <div className="body" style={{ textAlign: 'center' }}><h3 style={{ margin: 0 }}>{a.name}</h3>
                  <small className="meta">{a.grad_year ? `Batch ${a.grad_year}` : ''}{a.occupation ? ` · ${a.occupation}` : ''}</small></div>
              </Link>))}</div></div>)}

        {opps.length > 0 && <div className="block" id="opportunities"><h2>Career opportunities & mentorship</h2><ListRows items={opps} /></div>}
        {news.length > 0 && <div className="block" id="news"><h2>Alumni news</h2><div className="grid g3">{news.map((p) => <PostCard key={p.id} p={p} />)}</div></div>}

        <div className="give"><div><h3>Make a difference</h3><p>Share your time, advice or support for future learners of the school.</p></div>
          <Link className="btn" href="/contact"><i className="fa-solid fa-heart" /> Get in touch</Link></div>
      </div></section>
    </>
  );
}
