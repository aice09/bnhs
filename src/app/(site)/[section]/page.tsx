import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DataTable from '@/components/DataTable';
import GroupCard from '@/components/GroupCard';
import { CardGrid, LinkGrid, ListRows, StatGrid } from '@/components/ItemGrid';
import PostCard from '@/components/PostCard';
import PageHero from '@/components/PageHero';
import AchievementBoard from '@/components/AchievementBoard';
import { renderMarkdown } from '@/lib/content';
import { getPage, getSettings, listGroups, listItems, postsAbout, type Group, type Item } from '@/lib/queries';
import { sectionByKey } from '@/lib/sections';

const DETAIL = new Set(['athletics', 'research', 'student-groups', 'achievements', 'innovation', 'impact', 'library']);

function AchievementExtras({ items }: { items: Item[] }) {
  const all = items.filter((i) => i.block === 'achievements');
  const feat = all.find((i) => i.featured);
  const recent = [...all].filter((i) => i.event_date).sort((a, b) => (b.event_date! > a.event_date! ? 1 : -1)).slice(0, 3);
  const byYear = new Map<string, number>();
  for (const i of all) if (i.event_date) byYear.set(i.event_date.slice(0, 4), (byYear.get(i.event_date.slice(0, 4)) ?? 0) + 1);
  const years = [...byYear.entries()].sort().slice(-6);
  const max = Math.max(1, ...years.map(([, n]) => n));
  const spot = items.filter((i) => i.block === 'spotlight');
  return (
    <>
      {feat && (
        <div className="featbanner" style={feat.image ? { backgroundImage: `url(${feat.image})` } : undefined}>
          <div className="in">
            <div>
              <span className="tag gold"><i className="fa-solid fa-star" /> Featured achievement</span>
              <h2>{feat.title}</h2>
              <p>{feat.description}</p>
              <Link className="btn" href={`/items/${feat.id}`}>Read full story <i className="fa-solid fa-arrow-right" /></Link>
            </div>
            <ul>
              {feat.category && <li><i className="fa-solid fa-trophy" /> {feat.category}</li>}
              {feat.meta && <li><i className="fa-solid fa-award" /> {feat.meta}</li>}
              {feat.group_name && <li><i className="fa-solid fa-users" /> {feat.group_name}</li>}
              {feat.extra && <li><i className="fa-solid fa-location-dot" /> {feat.extra}</li>}
            </ul>
          </div>
        </div>)}
      {(recent.length > 0 || spot.length > 0) && (
        <div className="three">
          <div className="panelc"><h3>Recent achievements</h3>
            {recent.map((i) => <div className="recent" key={i.id}>{i.image && <img src={i.image} alt="" />}<div><Link href={`/items/${i.id}`}>{i.title}</Link><small>{i.event_date}</small></div></div>)}</div>
          <div className="panelc"><h3>Achievements by year</h3>
            <div className="ychart">{years.map(([y, n]) => <div key={y}><b>{n}</b><i style={{ height: `${(n / max) * 100}%` }} /><span>{y}</span></div>)}</div></div>
          {spot.length > 0 && <div className="panelc"><h3>Spotlight areas</h3>
            <div className="spot">{spot.map((i) => <a key={i.id} href={i.url || '#'} style={i.image ? { backgroundImage: `url(${i.image})` } : undefined}><span>{i.title}</span></a>)}</div></div>}
        </div>)}
    </>
  );
}

type Props = { params: Promise<{ section: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const page = sectionByKey(section) ? await getPage(section) : null;
  if (!page) return {};
  const st = await getSettings();
  return {
    title: page.title,
    description: `${page.subtitle}. ${page.content.replace(/[#*\[\]()>_`-]/g, '').slice(0, 130)}`.trim() + ` – ${st.school_name}`,
    alternates: { canonical: `/${section}` },
  };
}

export default async function SectionPage({ params, searchParams }: Props & { searchParams: Promise<{ type?: string }> }) {
  const { section } = await params;
  const sec = sectionByKey(section);
  const page = sec ? await getPage(section) : null;
  if (!sec || !page) notFound();
  const { type } = await searchParams;
  const [items, allGroups, news] = await Promise.all([
    listItems(section),
    sec.groupTypes || sec.excludeGroupTypes ? listGroups(sec.groupTypes, sec.excludeGroupTypes) : Promise.resolve([] as Group[]),
    sec.newsTags ? postsAbout(sec.newsTags, sec.groupTypes ?? [], 3) : Promise.resolve([]),
  ]);
  const types = [...new Set(allGroups.map((g) => g.type))];
  const groups = type ? allGroups.filter((g) => g.type === type) : allGroups;
  const blocks = sec.blocks.map((b) => ({ b, items: items.filter((i) => i.block === b.key) })).filter((x) => x.items.length > 0 && !(sec.key === 'achievements' && x.b.key === 'spotlight'));
  const nav: [string, string][] = [
    ...blocks.map(({ b }) => [b.key, b.title] as [string, string]),
    ...(allGroups.length ? [['groups', sec.groupTypes ? 'Groups & teams' : 'Student groups'] as [string, string]] : []),
    ...(news.length ? [['news', 'Latest news'] as [string, string]] : []),
  ];
  const empty = blocks.length === 0 && allGroups.length === 0;
  return (
    <>
      <PageHero title={page.title} sub={page.subtitle} crumbs={[[page.title]]} image={page.image} />
      {nav.length > 1 && <div className="subnav"><div className="wrap">{nav.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</div></div>}
      <section className="s"><div className="wrap">
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
        {sec.cta && <p style={{ marginTop: 18 }}><Link className="btn" href={sec.cta.href}><i className={`fa-solid fa-${sec.cta.icon}`} /> {sec.cta.label}</Link></p>}
        {empty && <div className="empty" style={{ marginTop: 28 }}>Content for this page is coming soon.</div>}
        {blocks.map(({ b, items: its }) => (
          <div className="block" id={b.key} key={b.key}>
            <h2>{b.title}</h2>
            {b.blurb && <p className="blurb">{b.blurb}</p>}
            {b.layout === 'stats' && <StatGrid items={its} />}
            {b.layout === 'achievements' && <AchievementBoard items={its.map((i) => ({ id: i.id, title: i.title, meta: i.meta, description: i.description, image: i.image, icon: i.icon, category: i.category, event_date: i.event_date, tags: i.tags, url: i.url, group_name: i.group_name, group_slug: i.group_slug, group_type: i.group_type }))} />}
            {b.layout === 'cards' && <CardGrid items={its} detail={DETAIL.has(sec.key)} />}
            {b.layout === 'links' && <LinkGrid items={its} />}
            {(b.layout === 'list' || b.layout === 'schedule') && <ListRows items={its} detail={DETAIL.has(sec.key)} />}
            {b.layout === 'catalogue' && (
              <DataTable
                columns={[{ key: 'title', title: 'Title' }, { key: 'meta', title: 'Author' }, { key: 'category', title: 'Category' }, { key: 'extra', title: 'Call no. / status' }]}
                rows={its.map((i) => ({ title: i.title, meta: i.meta, category: i.category, extra: i.extra }))} />
            )}
          </div>
        ))}
        {sec.key === 'achievements' && <AchievementExtras items={items} />}
        {allGroups.length > 0 && (
          <div className="block" id="groups">
            <h2>{sec.groupTypes ? 'Groups & teams' : 'Student groups & organizations'}</h2>
            {types.length > 1 && (
              <div className="chips">
                <Link className={'chip' + (!type ? ' on' : '')} href={`/${section}#groups`}>All</Link>
                {types.map((t) => <Link key={t} className={'chip' + (type === t ? ' on' : '')} href={`/${section}?type=${encodeURIComponent(t)}#groups`}>{t}</Link>)}
              </div>)}
            <div className="grid g3">{groups.map((g) => <GroupCard key={g.id} g={g} />)}</div>
          </div>
        )}
        {news.length > 0 && (
          <div className="block" id="news">
            <h2>Latest news</h2>
            <div className="grid g3">{news.map((p) => <PostCard key={p.id} p={p} />)}</div>
          </div>
        )}
      </div></section>
    </>
  );
}
