import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DateBadge from '@/components/DateBadge';
import PageHero from '@/components/PageHero';
import { fmtDate, renderMarkdown, splitTags } from '@/lib/content';
import { getItemById, getSettings, listItems, groupItemsBySection } from '@/lib/queries';
import { sectionByKey } from '@/lib/sections';

type Props = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

const load = async (id: string) => (/^\d+$/.test(id) ? getItemById(Number(id)) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const it = await load((await params).id);
  if (!it) return {};
  const s = await getSettings();
  return { title: it.title, description: (it.description || `${it.title} – ${s.school_name}`).slice(0, 160), alternates: { canonical: `/items/${it.id}` },
    openGraph: it.image ? { images: [it.image] } : undefined };
}

export default async function ItemPage({ params }: Props) {
  const it = await load((await params).id);
  if (!it) notFound();
  const sec = sectionByKey(it.section ?? '');
  const block = sec?.blocks.find((b) => b.key === it.block);
  const siblings = (it.group_id ? await groupItemsBySection(it.group_id) : await listItems(it.section ?? ''))
    .filter((x) => x.id !== it.id && x.section === it.section && x.block === it.block).slice(0, 3);
  const tags = splitTags(it.tags).filter((t) => t !== 'sample');
  const ext = /^https?:/.test(it.url);
  const base = sec ? `/${sec.key}` : '/';
  return (
    <>
      <PageHero title={it.title} sub={it.meta} crumbs={[...(sec ? [[sec.label, base] as [string, string]] : []), ...(it.group_name && it.group_slug ? [[it.group_name, `/groups/${it.group_slug}`] as [string, string]] : []), [it.title]]} />
      <section className="s"><div className="wrap">
        <div className="postlayout">
          <div>
            <div className="evmeta">
              {it.event_date ? <DateBadge date={it.event_date} /> : <span className="dbadge"><i className={`fa-solid fa-${it.icon || 'star'}`} /></span>}
              <div>
                {it.event_date && <b>{fmtDate(it.event_date, { dateStyle: 'long' })}</b>}
                {block && <div><i className="fa-solid fa-layer-group" /> <Link href={`${base}#${block.key}`}>{block.title}</Link></div>}
                {it.category && <div><i className="fa-solid fa-tag" /> {it.category}</div>}
                {it.extra && <div><i className="fa-solid fa-location-dot" /> {it.extra}</div>}
                {it.group_name && it.group_slug && <div><i className="fa-solid fa-users" /> <Link href={`/groups/${it.group_slug}`}>{it.group_name}</Link></div>}
              </div>
            </div>
            {it.image && <img className="detail-img" src={it.image} alt={it.title} />}
            {it.description && <article className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(it.description) }} />}
            {tags.length > 0 && <div className="tagrow big"><i className="fa-solid fa-tags" /> {tags.map((t) => <Link key={t} href={`/news?tag=${t}`}>#{t}</Link>)}</div>}
            <div className="row" style={{ marginTop: 18 }}>
              {it.url && <a className="btn" href={it.url} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>Open link <i className="fa-solid fa-arrow-up-right-from-square" /></a>}
              {it.group_slug && <Link className="btn out" href={`/groups/${it.group_slug}`}>← {it.group_name}</Link>}
              {sec && <Link className="btn out" href={base}>← All {sec.label.toLowerCase()}</Link>}
            </div>
          </div>
          <aside>
            {siblings.length > 0 && <div className="side"><h3>More {block?.title.toLowerCase() ?? 'items'}</h3>
              <ol className="pop">{siblings.map((r) => <li key={r.id}><span><Link href={`/items/${r.id}`}>{r.title}</Link>{r.event_date && <><br /><small className="meta">{fmtDate(r.event_date)}</small></>}</span></li>)}</ol></div>}
          </aside>
        </div>
      </div></section>
    </>
  );
}
