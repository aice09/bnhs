'use client';

import { useMemo, useState } from 'react';
import type { Item } from '@/lib/queries';

const PAGE = 10;

export default function PartnerGrid({ partners }: { partners: Item[] }) {
  const tabs = useMemo(() => ['All', ...Array.from(new Set(partners.map((p) => p.category).filter(Boolean)))], [partners]);
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(0);
  const list = tab === 'All' ? partners : partners.filter((p) => p.category === tab);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = list.slice(cur * PAGE, cur * PAGE + PAGE);
  const go = (n: number) => setPage((n + pages) % pages);

  return (
    <div className="partner-browser">
      {tabs.length > 2 && (
        <div className="partner-tabs" role="tablist" aria-label="Partner categories">
          {tabs.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''}
              onClick={() => { setTab(t); setPage(0); }}>{t === 'All' ? 'All Partners' : t}</button>))}
        </div>)}
      <div className="partner-carousel">
        {pages > 1 && <button type="button" className="pc-arrow" onClick={() => go(cur - 1)} aria-label="Previous partners"><i className="fa-solid fa-chevron-left" /></button>}
        <div className="partner-logos">
          {shown.map((p) => {
            const body = (
              <>
                <div className="partner-logo">
                  {p.image ? <img src={p.image} alt={`${p.title} logo`} loading="lazy" /> : <span aria-hidden="true"><i className={`fa-solid fa-${p.icon || 'handshake'}`} /></span>}
                </div>
                <strong>{p.title}</strong>
                {p.meta && <small>{p.meta}</small>}
              </>
            );
            return p.url
              ? <a className="partner-logo-card" href={p.url} key={p.id} {...(/^https?:/.test(p.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{body}</a>
              : <div className="partner-logo-card" key={p.id}>{body}</div>;
          })}
        </div>
        {pages > 1 && <button type="button" className="pc-arrow" onClick={() => go(cur + 1)} aria-label="Next partners"><i className="fa-solid fa-chevron-right" /></button>}
      </div>
      {pages > 1 && (
        <div className="pc-dots">{Array.from({ length: pages }, (_, n) => <button type="button" key={n} className={n === cur ? 'on' : ''} onClick={() => setPage(n)} aria-label={`Page ${n + 1}`} />)}</div>)}
    </div>
  );
}
