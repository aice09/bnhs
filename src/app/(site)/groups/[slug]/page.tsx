import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import PostCard from '@/components/PostCard';
import { getUser } from '@/lib/auth';
import { renderMarkdown } from '@/lib/content';
import { membershipBySlug } from '@/lib/groups';
import { one } from '@/lib/db';
import { requestJoin } from '../../portal/actions';
import { hasPerm } from '@/lib/perms';
import { CardGrid, ListRows } from '@/components/ItemGrid';
import AchievementBoard from '@/components/AchievementBoard';
import { sectionByKey } from '@/lib/sections';
import { getGroup, getSettings, groupItems, groupItemsBySection, groupPosts, listGroups } from '@/lib/queries';

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ requested?: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = await getGroup((await params).slug);
  if (!g) return {};
  const s = await getSettings();
  return { title: g.name, description: `${g.summary || g.name} – ${s.school_name}`, alternates: { canonical: `/groups/${g.slug}` } };
}

export default async function GroupPage({ params, searchParams }: Props) {
  const g = await getGroup((await params).slug);
  if (!g) notFound();
  const [items, posts, user, entries, others] = await Promise.all([groupItems(g.id), groupPosts(g.id, 6), getUser(), groupItemsBySection(g.id), listGroups([g.type])]);
  const blocks = entries.flatMap((e) => { const sec = sectionByKey(e.section ?? ''); const b = sec?.blocks.find((x) => x.key === e.block); return b ? [{ e, b, sec: sec! }] : []; });
  const keys = [...new Set(blocks.map((x) => `${x.sec.key}/${x.b.key}`))];
  const mine = user ? await membershipBySlug(user.id, g.slug) : null;
  const myStatus = user ? (await one<{ status: string }>('SELECT status FROM group_members WHERE group_id=$1 AND user_id=$2', [g.id, user.id]))?.status ?? '' : '';
  const requested = !!(await searchParams)?.requested;
  const more = others.filter((o) => o.id !== g.id).slice(0, 3);
  const nav = keys.map((k) => ({ id: k.replace('/', '-'), title: blocks.find((x) => `${x.sec.key}/${x.b.key}` === k)!.b.title }));
  const stats = keys.map((k) => ({ title: nav.find((n) => n.id === k.replace('/', '-'))!.title, n: blocks.filter((x) => `${x.sec.key}/${x.b.key}` === k).length, id: k.replace('/', '-') }));
  const canManage = !!mine || hasPerm(user, 'groups');
  return (
    <>
      <PageHero title={g.name} sub={g.summary} crumbs={[['Groups'], [g.name]]} image={g.image} />
      <div className="subnav"><div className="wrap">
        <a href="#about"><i className="fa-solid fa-circle-info" /> About</a>
        {nav.map((n) => <a key={n.id} href={`#${n.id}`}>{n.title}</a>)}
        {items.length > 0 && <a href="#resources">Resources</a>}
        {posts.length > 0 && <a href="#news">News</a>}
      </div></div>
      <section className="s"><div className="wrap two">
        <div>
          <div className="meta" id="about" style={{ marginBottom: 14 }}><span className="badge">{g.type}</span>{g.members > 0 && <span><i className="fa-solid fa-users" /> {g.members} member{g.members === 1 ? '' : 's'}</span>}</div>
          {stats.length > 0 && (
            <div className="qtiles" style={{ margin: '0 0 22px', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))' }}>
              {stats.map((x) => <a key={x.id} className="qtile" href={`#${x.id}`}><b style={{ fontSize: 26 }}>{x.n}</b>{x.title}</a>)}
              {posts.length > 0 && <a className="qtile" href="#news"><b style={{ fontSize: 26 }}>{posts.length}</b>News posts</a>}
            </div>)}
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(g.description || '') }} />
          {g.info && <div className="panelc" style={{ marginTop: 24 }}><h3><i className="fa-solid fa-circle-info" /> {g.type === 'Research Center' ? 'Center info' : 'Info'}</h3><div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(g.info) }} /></div>}
          {keys.map((k) => {
            const list = blocks.filter((x) => `${x.sec.key}/${x.b.key}` === k);
            const { b, sec } = list[0];
            const its = list.map((x) => x.e);
            return (
              <div key={k} id={k.replace('/', '-')} style={{ marginTop: 30 }}>
                <h2>{b.title}</h2>
                {b.layout === 'achievements'
                  ? <AchievementBoard items={its.map((i) => ({ id: i.id, title: i.title, meta: i.meta, description: i.description, image: i.image, icon: i.icon, category: i.category, event_date: i.event_date, tags: i.tags, url: i.url, group_name: null, group_slug: null, group_type: i.group_type }))} />
                  : b.layout === 'list' || b.layout === 'schedule' ? <ListRows detail items={its.map((i) => ({ ...i, group_name: null }))} /> : <CardGrid hideGroup detail items={its} />}
                <p className="help"><Link href={`/${sec.key}#${b.key}`}>See all {b.title.toLowerCase()} from the whole school →</Link></p>
              </div>);
          })}
          {items.length > 0 && <>
            <h2 id="resources" style={{ marginTop: 30 }}>Events, projects & resources</h2>
            {items.map((i) => (
              <div className="listrow" key={i.id}><span className="ico"><i className="fa-solid fa-calendar-day" /></span>
                <div><h3>{i.url ? <a href={i.url}>{i.title}</a> : i.title}</h3><small>{[i.kind, i.meta].filter(Boolean).join(' · ')}</small>{i.description && <p style={{ margin: '4px 0 0' }}>{i.description}</p>}</div></div>))}
          </>}
          {posts.length > 0 && <>
            <h2 id="news" style={{ marginTop: 30 }}>News from {g.name}</h2>
            <div className="grid g3">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
            <p><Link href={`/news?source=${g.slug}`}>All news from this group →</Link></p>
          </>}
        </div>
        <aside>
          <div className="side">
            <h3>About</h3>
            {g.adviser && <p><b>Adviser / head:</b> {g.adviser}</p>}
            {g.contact && <p><b>Contact:</b> {/@/.test(g.contact) ? <a href={`mailto:${g.contact}`}>{g.contact}</a> : /^[+\d][\d\s()-]{6,}$/.test(g.contact) ? <a href={`tel:${g.contact.replace(/\s/g, '')}`}>{g.contact}</a> : g.contact}</p>}
            <p style={{ margin: '0 0 10px' }}><Link href={`/news?source=${g.slug}`}><i className="fa-regular fa-newspaper" /> All news from this group</Link></p>
            {myStatus === 'pending' || requested
              ? <p className="badge warn" style={{ display: 'inline-block' }}><i className="fa-solid fa-hourglass-half" /> Join request pending approval</p>
              : !user
                ? <Link className="btn sm" href="/portal/login"><i className="fa-solid fa-right-to-bracket" /> Sign in to apply to join</Link>
                : !mine && user.role !== 'admin'
                  ? <form action={requestJoin.bind(null, g.slug)}><button className="btn sm"><i className="fa-solid fa-user-plus" /> Apply to join</button></form> : null}
            {canManage && <p style={{ margin: '10px 0 0' }}><Link className="btn sm out" href={`/portal/groups/${g.slug}`}><i className="fa-solid fa-gear" /> {mine ? 'Group dashboard' : 'Manage group'}</Link></p>}
          </div>
          {nav.length > 0 && <div className="side"><h3>On this page</h3><ul className="archive">{nav.map((n) => <li key={n.id}><a href={`#${n.id}`}>{n.title}</a></li>)}</ul></div>}
          {more.length > 0 && <div className="side"><h3>Other {g.type.toLowerCase()}s</h3>
            <ol className="pop">{more.map((o) => <li key={o.id}><span><Link href={`/groups/${o.slug}`}>{o.name}</Link></span></li>)}</ol></div>}
        </aside>
      </div></section>
    </>
  );
}
