import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AlumniNav, { fmtDate } from '@/components/AlumniNav';
import DateBadge from '@/components/DateBadge';
import PageHero from '@/components/PageHero';
import { renderMarkdown } from '@/lib/content';
import { getItem, listItems } from '@/lib/queries';

type Kind = 'stories' | 'events';
const T = { stories: { label: 'Stories', one: 'Alumni story', back: 'All stories' }, events: { label: 'Events', one: 'Alumni event', back: 'All events' } };

const load = async (id: string, kind: Kind) => (/^\d+$/.test(id) ? getItem(Number(id), 'alumni', kind) : null);

export async function detailMeta(id: string, kind: Kind): Promise<Metadata> {
  const it = await load(id, kind);
  if (!it) return {};
  return { title: `${it.title} – ${T[kind].one}`, description: it.description.slice(0, 160), alternates: { canonical: `/alumni/${kind}/${it.id}` },
    openGraph: it.image ? { images: [it.image] } : undefined };
}

export default async function Detail({ id, kind }: { id: string; kind: Kind }) {
  const it = await load(id, kind);
  if (!it) notFound();
  const t = T[kind];
  const more = (await listItems('alumni')).filter((i) => i.block === kind && i.id !== it.id).slice(0, 3);
  const ext = /^https?:/.test(it.url);
  return (
    <>
      <PageHero title={it.title} sub={it.meta} crumbs={[['Alumni', '/alumni'], [t.label, `/alumni/${kind}`], [it.title]]} />
      <AlumniNav active={`/alumni/${kind}`} />
      <section className="s"><div className="wrap" style={{ maxWidth: 820 }}>
        {it.image && <img className="detail-img" src={it.image} alt={it.title} />}
        {kind === 'events' && (
          <div className="evmeta">
            <DateBadge date={it.event_date} />
            <div><b>{it.event_date ? fmtDate(it.event_date) : it.meta}</b>
              {it.extra && <div><i className="fa-solid fa-location-dot" /> {it.extra}</div>}
              {it.category && <div><i className="fa-solid fa-tag" /> {it.category}</div>}</div>
          </div>)}
        {kind === 'stories' && (it.category || it.event_date) && (
          <p className="meta">{[it.category, it.event_date && fmtDate(it.event_date)].filter(Boolean).join(' · ')}</p>)}
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(it.description) }} />
        <div className="row" style={{ marginTop: 20 }}>
          {it.url && <a className="btn" href={it.url} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{kind === 'events' ? 'Register / more info' : 'Learn more'} <i className="fa-solid fa-arrow-up-right-from-square" /></a>}
          <Link className="btn out" href={`/alumni/${kind}`}>← {t.back}</Link>
        </div>
        {more.length > 0 && (
          <div className="block"><h2>More {t.label.toLowerCase()}</h2>
            <div className="grid g3">{more.map((m) => (
              <Link className="card" key={m.id} href={`/alumni/${kind}/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="body"><h3>{m.title}</h3><small className="meta">{m.event_date ? fmtDate(m.event_date) : m.meta}</small></div></Link>))}</div></div>)}
      </div></section>
    </>
  );
}
