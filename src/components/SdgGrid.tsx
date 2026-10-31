import { SDGS, focusGoals, sdgIcon, sdgUrl } from '@/lib/sdg';

// Official UN icons; every tile opens that goal on the UN SDG website.
export function SdgChips({ sdg }: { sdg: string }) {
  const list = sdg.split(',').map(Number).filter(Boolean);
  if (!list.length) return null;
  return <div className="sdg-chips">{list.map((n) => <a key={n} href={`/sdg?goal=${n}#news`} title={`SDG ${n}`}><img src={sdgIcon(n)} alt={`SDG ${n}`} width={44} height={44} /></a>)}</div>;
}

export default function SdgGrid({ focus = '', onlyFocus = false, titles = false }: { focus?: string; onlyFocus?: boolean; titles?: boolean }) {
  const f = focusGoals(focus);
  const list = onlyFocus && f.length ? SDGS.filter((g) => f.includes(g.n)) : SDGS;
  return (
    <div className="sdg-grid">
      {list.map((g) => (
        <a key={g.n} className={'sdg-tile' + (f.includes(g.n) ? ' focus' : '')} href={sdgUrl(g.n)} target="_blank" rel="noopener noreferrer" title={`SDG ${g.n}: ${g.title} – ${g.text}`}>
          <img src={sdgIcon(g.n)} alt={`SDG ${g.n}: ${g.title}`} loading="lazy" width={200} height={200} />
          {titles && <span>{g.title}</span>}
        </a>))}
    </div>
  );
}
