import type { Metadata } from 'next';
import { avatarUrl } from '@/lib/avatar';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AlumniNav from '@/components/AlumniNav';
import PageHero from '@/components/PageHero';
import { getAlumnus, getSettings, listAlumni, personHistory } from '@/lib/queries';

type Props = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

const load = async (id: string) => (/^\d+$/.test(id) ? getAlumnus(Number(id)) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await load((await params).id);
  if (!a) return {};
  const s = await getSettings();
  return { title: `${a.name} – Alumni`, description: `${a.name}${a.grad_year ? `, batch ${a.grad_year}` : ''} – ${s.school_name} alumni.`, alternates: { canonical: `/alumni/${a.id}` } };
}

export default async function AlumnusPage({ params }: Props) {
  const a = await load((await params).id);
  if (!a) notFound();
  const others = (await listAlumni()).filter((x) => x.id !== a.id && (x.grad_year === a.grad_year || x.featured)).slice(0, 4);
  const hist = await personHistory(a.id);
  const facts: [string, string, string | number | null][] = [
    ['graduation-cap', 'Batch', a.grad_year], ['book', 'Strand / program', a.program],
    ['briefcase', 'Occupation', a.occupation], ['building', 'Employer', a.employer], ['location-dot', 'Location', a.location],
  ];
  return (
    <>
      <PageHero title={a.name} sub={[a.grad_year && `Batch ${a.grad_year}`, a.program].filter(Boolean).join(' · ')} crumbs={[['Alumni', '/alumni'], ['Directory', '/alumni/directory'], [a.name]]} />
      <AlumniNav active="/alumni/directory" />
      <section className="s"><div className="wrap">
        <div className="profile">
          <aside className="pside card">
            <div className="pbig"><img src={a.photo || avatarUrl(a.id, a.name)} alt={a.name} loading="lazy" /></div>
            <div className="body" style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 2px' }}>{a.name} <i className="fa-solid fa-circle-check" style={{ color: 'var(--g6)', fontSize: 16 }} title="Verified alumnus" /></h2>
              <p className="meta" style={{ margin: 0 }}>{[a.occupation, a.employer].filter(Boolean).join(' at ') || 'Alumnus'}</p>
              <div className="pbtns">
                {a.show_contact && a.contact_email && <a className="btn" href={`mailto:${a.contact_email}`}><i className="fa-solid fa-envelope" /> Contact</a>}
                {/^https:\/\//.test(a.linkedin) && <a className="btn out" href={a.linkedin} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin" /> LinkedIn</a>}
              </div>
            </div>
          </aside>
          <div className="pmain">
            <div className="card"><div className="body"><h3>About</h3>
              {a.bio ? <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{a.bio}</p> : <p className="meta" style={{ margin: 0 }}>This alumnus has not added a bio yet.</p>}</div></div>
            <div className="card" style={{ marginTop: 16 }}><div className="body"><h3>Details</h3>
              <ul className="pfacts">{facts.filter(([, , v]) => v).map(([icon, label, v]) => (
                <li key={label}><i className={`fa-solid fa-${icon}`} /><span><small>{label}</small><b>{v}</b></span></li>))}</ul></div></div>
            {hist.groups.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}><div className="body"><h3>Groups &amp; history</h3>
                <ul className="hist">{hist.groups.map((g) => (
                  <li key={g.slug + g.joined}><span className={'dot' + (g.status === 'active' ? ' on' : '')} /><div>
                    <b>{g.listed ? <Link href={`/groups/${g.slug}`}>{g.name}</Link> : g.name}</b> <small>{g.title || g.role}</small><br />
                    <small>{g.joined.slice(0, 4)}{g.left ? ` – ${g.left.slice(0, 4)}` : ' – present'}</small></div></li>))}</ul></div></div>)}
            {hist.achievements.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}><div className="body"><h3>Achievements</h3>
                <ul className="hist">{hist.achievements.map((x) => <li key={x.id}><span className="dot on" /><div><Link href={`/items/${x.id}`}><b>{x.title}</b></Link><br /><small>{x.event_date ?? x.category}</small></div></li>)}</ul></div></div>)}
            {hist.papers.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}><div className="body"><h3>Research &amp; publications</h3>
                <ul className="hist">{hist.papers.map((r) => <li key={r.id}><span className="dot on" /><div><b>{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> : r.title}</b><br /><small>{[r.venue, r.year].filter(Boolean).join(' · ')}</small></div></li>)}</ul></div></div>)}
            {a.show_contact && a.contact_email && (
              <div className="card" style={{ marginTop: 16 }}><div className="body"><h3>Contact</h3>
                <p style={{ margin: 0 }}><i className="fa-solid fa-envelope" /> <a href={`mailto:${a.contact_email}`}>{a.contact_email}</a></p></div></div>)}
          </div>
        </div>
        {others.length > 0 && (
          <div className="block"><h2>More alumni</h2>
            <div className="grid g4">{others.map((o) => (
              <Link key={o.id} href={`/alumni/${o.id}`} className="card pcard" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="pphoto"><img src={o.photo || avatarUrl(o.id, o.name)} alt={o.name} loading="lazy" /></div>
                <div className="body" style={{ textAlign: 'center' }}><h3 style={{ margin: 0 }}>{o.name}</h3>
                  <small className="meta">{o.grad_year ? `Batch ${o.grad_year}` : ''}</small></div></Link>))}</div></div>)}
        <p style={{ marginTop: 24 }}><Link className="btn out" href="/alumni/directory">← Back to directory</Link></p>
      </div></section>
    </>
  );
}
