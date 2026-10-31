'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';

type Col = { key: string; title: string };
type Props = {
  columns: Col[];
  rows: Record<string, any>[];
  // When set, an actions column with Edit/Delete is appended (admin usage).
  resource?: string;
  pageLength?: number;
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function cell(key: string, v: any) {
  if (typeof v === 'boolean') return v ? '<i class="fa-solid fa-check" style="color:var(--g6)"></i> Yes' : 'No';
  if (/(_at|date)$/.test(key) && v) return esc(new Date(v).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }));
  if (key === 'link' && v) { const [h, t] = String(v).split('|'); return `<a href="${esc(h)}">${esc(t)}</a>`; }
  if (key === 'url' && v) return `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">${esc(v)}</a>`;
  return esc(v);
}

export default function DataTable({ columns, rows, resource, pageLength = 10 }: Props) {
  const ref = useRef<HTMLTableElement>(null);
  const router = useRouter();

  useEffect(() => {
    let table: any;
    let cancelled = false;
    (async () => {
      const mod: any = await import('datatables.net-dt');
      if (cancelled || !ref.current) return;
      const DataTable = mod.default ?? mod;
      const cols: any[] = columns.map((c) => ({ title: c.title, data: c.key, render: (v: any) => cell(c.key, v) }));
      if (resource)
        cols.push({
          title: 'Actions', data: 'id', orderable: false, searchable: false,
          render: (id: number) =>
            `<a class="btn sm out" href="/admin/${resource}/${id}"><i class="fa-solid fa-pen"></i> Edit</a> ` +
            (resource === 'pages' ? '' : `<button class="btn sm danger" data-del="${id}"><i class="fa-solid fa-trash"></i></button>`),
        });
      table = new DataTable(ref.current, { data: rows, columns: cols, pageLength, order: [] });
    })();
    return () => { cancelled = true; table?.destroy?.(); };
  }, [columns, rows, resource, pageLength]);

  useEffect(() => {
    if (!resource) return;
    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button[data-del]') as HTMLElement | null;
      if (!btn || !confirm('Delete this item? This cannot be undone.')) return;
      const res = await fetch(`/api/admin/${resource}/${btn.dataset.del}`, { method: 'DELETE' });
      if (res.ok) router.refresh(); else alert('Delete failed.');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [resource, router]);

  return (
    <div className="dtw">
      <table ref={ref} className="display" style={{ width: '100%' }} />
    </div>
  );
}
