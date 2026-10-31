import Link from 'next/link';
import type { Item } from '@/lib/queries';

export default function StoryCards({ items }: { items: Item[] }) {
  return (
    <div className="grid g3">
      {items.map((it) => (
        <Link className="card" key={it.id} href={`/alumni/stories/${it.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {it.image && <div className="thumb"><img src={it.image} alt={it.title} loading="lazy" /></div>}
          <div className="body">
            {it.category && <span className="tag">{it.category}</span>}
            <h3>{it.title}</h3>
            {it.meta && <span className="meta">{it.meta}</span>}
            {it.description && <p>{it.description.length > 140 ? it.description.slice(0, 140) + '…' : it.description}</p>}
            <span className="more">Read story <i className="fa-solid fa-arrow-right" /></span>
          </div>
        </Link>))}
    </div>
  );
}
