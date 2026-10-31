'use client';

import Link from 'next/link';
import { avatarUrl } from '@/lib/avatar';
import { useMemo, useState } from 'react';

export type AlumRow = { id: number; name: string; grad_year: number | null; program: string; occupation: string; employer: string; location: string; photo: string; featured: boolean };

const PAGE = 12;

export default function AlumniDirectory({ rows }: { rows: AlumRow[] }) {
  const [q, setQ] = useState('');
  const [batch, setBatch] = useState('');
  const [program, setProgram] = useState('');
  const [page, setPage] = useState(1);
  const batches = useMemo(() => [...new Set(rows.map((r) => r.grad_year).filter(Boolean) as number[])].sort((a, b) => b - a), [rows]);
  const programs = useMemo(() => [...new Set(rows.map((r) => r.program).filter(Boolean))].sort(), [rows]);
  const shown = rows.filter((r) =>
    (!batch || String(r.grad_year) === batch) && (!program || r.program === program) &&
    (!q || `${r.name} ${r.occupation} ${r.employer} ${r.location} ${r.program}`.toLowerCase().includes(q.toLowerCase())));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages);
  const slice = shown.slice((cur - 1) * PAGE, cur * PAGE);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };
  return (
    <div>
      <div className="afilters">
        <div className="asearch"><i className="fa-solid fa-magnifying-glass" />
          <input type="search" placeholder="Search by name, occupation, employer or place…" value={q} onChange={(e) => reset(setQ)(e.target.value)} aria-label="Search alumni" /></div>
        <label>Batch <select value={batch} onChange={(e) => reset(setBatch)(e.target.value)}><option value="">All</option>{batches.map((b) => <option key={b}>{b}</option>)}</select></label>
        {programs.length > 0 && <label>Strand / program <select value={program} onChange={(e) => reset(setProgram)(e.target.value)}><option value="">All</option>{programs.map((p) => <option key={p}>{p}</option>)}</select></label>}
      </div>
      <p className="meta">Showing {shown.length === 0 ? 0 : (cur - 1) * PAGE + 1}–{Math.min(cur * PAGE, shown.length)} of {shown.length} alumni</p>
      {shown.length === 0 ? <div className="empty">No alumni match your search.</div> : (
        <div className="grid g4">
          {slice.map((a) => (
            <Link key={a.id} href={`/alumni/${a.id}`} className="card pcard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="pphoto"><img src={a.photo || avatarUrl(a.id, a.name)} alt={a.name} loading="lazy" /></div>
              <div className="body" style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0 }}>{a.name}</h3>
                <small className="meta">{a.grad_year ? `Batch ${a.grad_year}` : ''}{a.program ? ` · ${a.program}` : ''}</small>
                {(a.occupation || a.employer) && <p style={{ margin: '6px 0 0' }}>{[a.occupation, a.employer].filter(Boolean).join(', ')}</p>}
                {a.location && <small className="meta"><i className="fa-solid fa-location-dot" /> {a.location}</small>}
                <span className="more">View profile</span>
              </div>
            </Link>))}
        </div>)}
      {pages > 1 && (
        <div className="chips" style={{ justifyContent: 'center', marginTop: 20 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button type="button" key={n} className={'chip' + (n === cur ? ' on' : '')} onClick={() => setPage(n)}>{n}</button>))}
        </div>)}
    </div>
  );
}
