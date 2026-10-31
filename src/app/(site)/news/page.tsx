import type { Metadata } from 'next';
import Link from 'next/link';
import { describe } from '@/lib/site';
import PageHero from '@/components/PageHero';
import PostCard from '@/components/PostCard';
import { fmtDate } from '@/lib/content';
import { featuredPost, listPosts, popularPosts, postCategories, postSources, getSettings, postMonths, tagCloud } from '@/lib/queries';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'News & Announcements', description: describe(s, 'Latest news, announcements and events'), alternates: { canonical: '/news' } };
}

const LIMIT = 9;
const monthLabel = (m: string) => new Date(m + '-01T00:00:00Z').toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default async function News({ searchParams }: { searchParams: Promise<{ category?: string; source?: string; tag?: string; month?: string; q?: string; page?: string; sort?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const tag = sp.tag?.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || undefined;
  const month = /^\d{4}-\d{2}$/.test(sp.month || '') ? sp.month : undefined;
  const [{ items, total }, cats, popular, featured, sources, months, cloud] = await Promise.all([
    listPosts({ category: sp.category, group: sp.source, tag, month, q, page, limit: LIMIT, sort: sp.sort }), postCategories(), popularPosts(5), featuredPost(), postSources(), postMonths(), tagCloud(18),
  ]);
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const sort = ['oldest', 'popular'].includes(sp.sort || '') ? sp.sort : undefined;
  const href = (p: number, category = sp.category, srt = sort, source = sp.source, tg = tag, mo = month) => {
    const u = new URLSearchParams();
    if (category) u.set('category', category);
    if (source) u.set('source', source);
    if (tg) u.set('tag', tg);
    if (mo) u.set('month', mo);
    if (q) u.set('q', q);
    if (srt) u.set('sort', srt);
    if (p > 1) u.set('page', String(p));
    const qs = u.toString();
    return '/news' + (qs ? '?' + qs : '');
  };
  const all = cats.reduce((n, c) => n + Number(c.n), 0);
  return (
    <>
      <PageHero title="News & Announcements" sub="Updates, stories and milestones from our school community." crumbs={[['News']]} />
      <section className="s"><div className="wrap">
        <form className="search" action="/news" role="search">
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {sp.source && <input type="hidden" name="source" value={sp.source} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          {month && <input type="hidden" name="month" value={month} />}
          <input type="search" name="q" defaultValue={q} placeholder="Search news and announcements…" aria-label="Search news" />
          <button className="btn" type="submit"><i className="fa-solid fa-magnifying-glass" /> Search</button>
        </form>
        <div className="tabs">
          <Link href={href(1, '')} className={!sp.category ? 'on' : ''}>All ({all})</Link>
          {cats.map((c) => <Link key={c.category} href={href(1, c.category)} className={sp.category === c.category ? 'on' : ''}>{c.category} ({c.n})</Link>)}
        </div>
        <div className="chips" aria-label="Filter by source">
          <span className="meta" style={{ alignSelf: 'center' }}>From:</span>
          <Link className={'chip' + (!sp.source ? ' on' : '')} href={href(1, sp.category, sort, '')}>Everyone</Link>
          <Link className={'chip' + (sp.source === 'school' ? ' on' : '')} href={href(1, sp.category, sort, 'school')}>School</Link>
          {sources.map((g) => <Link key={g.slug} className={'chip' + (sp.source === g.slug ? ' on' : '')} href={href(1, sp.category, sort, g.slug)}>{g.name} ({g.n})</Link>)}
          {tag && <Link className="chip on" href={href(1, sp.category, sort, sp.source, '')}>#{tag} ✕</Link>}
          {month && <Link className="chip on" href={href(1, sp.category, sort, sp.source, tag, '')}>{monthLabel(month)} ✕</Link>}
          {(sp.category || sp.source || tag || month || q) && <Link className="chip" href="/news"><i className="fa-solid fa-rotate-left" /> Clear all</Link>}
        </div>
        <div className="two">
          <div>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="meta">Sort by:
                {[[undefined, 'Latest'], ['oldest', 'Oldest'], ['popular', 'Most viewed']].map(([k, l]) => <Link key={l} href={href(1, sp.category, k)} style={{ fontWeight: k === sort ? 700 : 400, marginLeft: 8 }}>{l}</Link>)}
              </span>
            </div>
            <p className="meta">Showing {total ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, total)} of {total} posts</p>
            {items.length ? <div className="grid g3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>{items.map((p) => <PostCard key={p.id} p={p} />)}</div>
              : <div className="alert">No posts found.</div>}
            {pages > 1 && (
              <nav className="pager" aria-label="Pagination">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <Link key={n} href={href(n)} className={n === page ? 'on' : ''}>{n}</Link>)}
              </nav>
            )}
          </div>
          <aside>
            {featured && <div className="side"><h3><i className="fa-solid fa-star" style={{ color: 'var(--gold)' }} /> Top story</h3><span className="tag">{featured.category}</span>
              <h3 style={{ marginTop: 8 }}><Link href={`/news/${featured.slug}`} style={{ textDecoration: 'none' }}>{featured.title}</Link></h3>
              <p className="meta">{fmtDate(featured.published_at)}</p><p>{featured.excerpt}</p>
              <Link className="btn sm" href={`/news/${featured.slug}`}>Read full story</Link></div>}
            {cloud.length > 0 && <div className="side"><h3>Popular tags</h3>
              <div className="tagrow">{cloud.map((c) => <Link key={c.tag} href={href(1, sp.category, sort, sp.source, c.tag)} className={c.tag === tag ? 'on' : ''}>#{c.tag} <small>{c.n}</small></Link>)}</div></div>}
            {months.length > 0 && <div className="side"><h3>Archive</h3>
              <ul className="archive">{months.map((m) => <li key={m.month}><Link href={href(1, sp.category, sort, sp.source, tag, m.month)} style={{ fontWeight: m.month === month ? 700 : 400 }}>{monthLabel(m.month)} <small>({m.n})</small></Link></li>)}</ul></div>}
            <div className="side"><h3>Popular posts</h3>
              <ol className="pop">{popular.map((p) => <li key={p.id}><span><Link href={`/news/${p.slug}`}>{p.title}</Link><br /><small className="meta">{fmtDate(p.published_at)}</small></span></li>)}</ol></div>
          </aside>
        </div>
      </div></section>
    </>
  );
}
