import Link from 'next/link';
import type { Item } from '@/lib/queries';

const isExt = (u: string) => /^https?:/.test(u);

function Media({ it }: { it: Item }) {
  if (it.image) return <div className="thumb"><img src={it.image} alt={it.title} loading="lazy" /></div>;
  return null;
}

export function StatGrid({ items }: { items: Item[] }) {
  return (
    <div className="facts big">
      {items.map((it) => (
        <div className="fact" key={it.id}>
          {it.icon && <i className={`fa-solid fa-${it.icon}`} />}
          <b>{it.meta}</b><strong>{it.title}</strong>
          {it.description && <span>{it.description}</span>}
        </div>
      ))}
    </div>
  );
}

export function CardGrid({ items, hideGroup, detail }: { items: Item[]; hideGroup?: boolean; detail?: boolean }) {
  return (
    <div className="grid g3">
      {items.map((it) => {
        const body = (
          <>
            <Media it={it} />
            <div className="body">
              {!it.image && <span className="pico"><i className={`fa-solid fa-${it.icon || 'star'}`} /></span>}
              {it.meta && <span className="meta">{it.meta}</span>}
              <h3>{it.title}</h3>
              {it.description && <p>{it.description}</p>}
              {it.group_name && !hideGroup && <span className="gchip"><i className="fa-solid fa-users" /> {it.group_name}</span>}
              {(it.url || detail) && <span className="more">{it.url ? 'Learn more' : 'View details'} <i className="fa-solid fa-arrow-right" /></span>}
            </div>
          </>
        );
        if (!it.url && detail) return <Link className="card" key={it.id} href={`/items/${it.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{body}</Link>;
        return it.url
          ? <a className="card" key={it.id} href={it.url} style={{ textDecoration: 'none', color: 'inherit' }} {...(/^https?:/.test(it.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{body}</a>
          : <div className="card" key={it.id}>{body}</div>;
      })}
    </div>
  );
}

export function LinkGrid({ items }: { items: Item[] }) {
  return (
    <div className="linkgrid">
      {items.map((it) => {
        const ext = /^https?:/.test(it.url);
        return (
          <a className="linkc" key={it.id} href={it.url || undefined} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <b>{it.icon && <i className={`fa-solid fa-${it.icon}`} />} {it.title} {it.url && <i className="fa-solid fa-arrow-right" />}</b>
            {it.description && <p>{it.description}</p>}
          </a>
        );
      })}
    </div>
  );
}

export function ListRows({ items, detail }: { items: Item[]; detail?: boolean }) {
  return (
    <div>
      {items.map((it) => (
        <div className="listrow" key={it.id}>
          <span className="ico"><i className={`fa-solid fa-${it.icon || 'circle-dot'}`} /></span>
          <div>
            <h3>{it.url ? <a href={it.url} {...(isExt(it.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{it.title}</a> : detail ? <Link href={`/items/${it.id}`}>{it.title}</Link> : it.title}</h3>
            <small>{[it.meta, it.category, it.extra].filter(Boolean).join(' · ')}{it.group_name && it.group_slug && <> · <Link href={`/groups/${it.group_slug}`}>{it.group_name}</Link></>}</small>
            {it.description && <p style={{ margin: '4px 0 0' }}>{it.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
