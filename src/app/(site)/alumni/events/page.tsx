import type { Metadata } from 'next';
import Link from 'next/link';
import AlumniNav, { fmtDate } from '@/components/AlumniNav';
import DateBadge from '@/components/DateBadge';
import PageHero from '@/components/PageHero';
import { getSettings, listItems } from '@/lib/queries';
import type { Item } from '@/lib/queries';
import { describe } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Alumni Events', description: describe(s, 'Reunions, homecoming and alumni activities'), alternates: { canonical: '/alumni/events' } };
}

function Row({ e }: { e: Item }) {
  return (
    <div className="evrow">
      <DateBadge date={e.event_date} />
      {e.image && <div className="evimg"><img src={e.image} alt="" loading="lazy" /></div>}
      <div className="evbody">
        <h3><Link href={`/alumni/events/${e.id}`}>{e.title}</Link></h3>
        <small className="meta">{[e.category, e.event_date ? fmtDate(e.event_date) : e.meta, e.extra].filter(Boolean).join(' · ')}</small>
        {e.description && <p style={{ margin: '4px 0 0' }}>{e.description}</p>}
      </div>
      <Link className="btn" href={`/alumni/events/${e.id}`}>Details</Link>
    </div>
  );
}

export default async function Events() {
  const events = (await listItems('alumni')).filter((i) => i.block === 'events');
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => !e.event_date || e.event_date >= today).sort((a, b) => (a.event_date ?? '9').localeCompare(b.event_date ?? '9'));
  const past = events.filter((e) => e.event_date && e.event_date < today).sort((a, b) => b.event_date!.localeCompare(a.event_date!));
  return (
    <>
      <PageHero title="Alumni Events" sub="Reunite. Network. Create impact." crumbs={[['Alumni', '/alumni'], ['Events']]} />
      <AlumniNav active="/alumni/events" />
      <section className="s"><div className="wrap">
        <div className="block" style={{ marginTop: 0 }}><h2>Upcoming events</h2>
          {upcoming.length ? upcoming.map((e) => <Row key={e.id} e={e} />) : <div className="empty">No upcoming events right now.</div>}</div>
        {past.length > 0 && <div className="block"><h2>Past events</h2>{past.map((e) => <Row key={e.id} e={e} />)}</div>}
      </div></section>
    </>
  );
}
