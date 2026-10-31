import Link from 'next/link';
import { fmtDate, splitTags } from '@/lib/content';
import type { Post } from '@/lib/queries';

export default function PostCard({ p }: { p: Post }) {
  const tags = splitTags(p.tags).filter((t) => t !== 'sample').slice(0, 3);
  return (
    <article className="card">
      <Link href={`/news/${p.slug}`} className="thumb" aria-hidden tabIndex={-1}>
        {p.image ? <img src={p.image} alt="" loading="lazy" /> : <i className="fa-solid fa-newspaper" />}
      </Link>
      <div className="body">
        <div className="meta">
          <Link className="tag" href={`/news?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
          {p.group_name && <Link className="tag gold" href={`/news?source=${p.group_slug ?? ''}`}><i className="fa-solid fa-users" /> {p.group_name}</Link>}
          {p.placement !== 'Normal' && <span className="tag gold"><i className="fa-solid fa-star" /> {p.placement === 'Main' ? 'Top story' : 'Highlight'}</span>}
          <time dateTime={p.published_at}>{fmtDate(p.published_at)}</time>
        </div>
        <h3><Link href={`/news/${p.slug}`}>{p.title}</Link></h3>
        <p>{p.excerpt}</p>
        {tags.length > 0 && <div className="tagrow">{tags.map((t) => <Link key={t} href={`/news?tag=${t}`}>#{t}</Link>)}</div>}
        <Link className="more" href={`/news/${p.slug}`}>Read more <i className="fa-solid fa-arrow-right" /></Link>
      </div>
    </article>
  );
}
