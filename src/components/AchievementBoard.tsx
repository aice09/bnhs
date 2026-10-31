'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type Ach = {
  id: number; title: string; meta: string; description: string; image: string; icon: string; category: string;
  event_date: string | null; tags: string; url: string; group_name: string | null; group_slug: string | null; group_type?: string | null;
};

// Short label for the card corner: the field (athletics, research…) rather than the long list of names.
const FIELD: Record<string, string> = { 'Sports Team': 'Athletics', 'Research Center': 'Research', Publication: 'Journalism', 'Arts & Culture': 'Arts', 'Academic Club': 'Academics', 'Community Service': 'Community' };
const fieldOf = (i: { group_type?: string | null; category: string; tags: string }) =>
  (i.group_type && FIELD[i.group_type]) || ['athletics', 'research', 'journalism', 'arts', 'academics'].map((t) => t[0].toUpperCase() + t.slice(1)).find((t) => i.tags.toLowerCase().split(',').includes(t.toLowerCase())) || i.category || 'Achievement';

const ICONS: Record<string, string> = {
  Awards: 'trophy', Research: 'flask', Students: 'users', Faculty: 'chalkboard-user', Institutional: 'building', Community: 'handshake', International: 'globe',
};
const fmt = (d: string | null) => (d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');

export default function AchievementBoard({ items }: { items: Ach[] }) {
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [cat, setCat] = useState('');
  const cats = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))], [items]);
  const years = useMemo(() => [...new Set(items.map((i) => i.event_date?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse(), [items]);
  const shown = items.filter((i) =>
    (!cat || i.category === cat) && (!year || i.event_date?.startsWith(year)) &&
    (!q || `${i.title} ${i.description} ${i.tags} ${i.group_name ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div className="chips achips">
        <button type="button" className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat('')}><i className="fa-solid fa-table-cells-large" /> All achievements</button>
        {cats.map((c) => (
          <button type="button" key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}><i className={`fa-solid fa-${ICONS[c] ?? 'star'}`} /> {c}</button>))}
      </div>
      <div className="afilters">
        <div className="asearch"><i className="fa-solid fa-magnifying-glass" /><input type="search" placeholder="Search achievements…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search achievements" /></div>
        <label>Year <select value={year} onChange={(e) => setYear(e.target.value)}><option value="">All years</option>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
      </div>
      {shown.length === 0 ? <div className="empty">No achievements match your filters.</div> : (
        <div className="grid g4">
          {shown.map((i) => (
            <article className="card acard" key={i.id}>
              <div className="thumb">{i.image ? <img src={i.image} alt={i.title} loading="lazy" /> : <i className={`fa-solid fa-${i.icon || 'trophy'}`} />}</div>
              <div className="body">
                <div className="ameta"><span className="tag">{fieldOf(i)}</span><time>{fmt(i.event_date)}</time></div>
                <h3><Link href={`/items/${i.id}`}>{i.title}</Link></h3>
                {i.meta && <p className="awho" title={i.meta}><i className="fa-solid fa-user" /> {i.meta}</p>}
                {i.description && <p>{i.description}</p>}
                <div className="atags">{i.tags.split(',').filter((t) => t && t !== 'sample').slice(0, 3).map((t) => <button type="button" key={t} onClick={() => { setQ(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t}</button>)}</div>
                {i.group_name && (i.group_slug ? <Link className="gchip" href={`/groups/${i.group_slug}`}><i className="fa-solid fa-users" /> {i.group_name}</Link> : <div className="meta"><i className="fa-solid fa-users" /> {i.group_name}</div>)}
                <Link className="more" href={`/items/${i.id}`}>Read more <i className="fa-solid fa-arrow-right" /></Link>
              </div>
            </article>))}
        </div>)}
    </div>
  );
}
