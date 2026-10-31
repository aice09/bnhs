import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { auditPage } from '@/lib/platform';

export const metadata = { title: 'Audit log' };

export default async function AuditLog({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdmin('platform');
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, size } = await auditPage(page, q);
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => `/admin/platform/audit?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  return (
    <>
      <p><Link href="/admin/platform">← Digital platform</Link></p>
      <h1>Audit log</h1>
      <p className="help">Who did what across the CMS and portals: sign-ins, content and account changes, approvals, and group join/leave decisions. Entries cannot be edited or deleted here.</p>
      <form className="row" style={{ marginBottom: 12 }}><input name="q" defaultValue={q} placeholder="Search person, action or item" style={{ flex: 1, maxWidth: 360 }} /><button className="btn sm">Search</button></form>
      <div className="panel"><table className="tbl"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Where</th><th>Details</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={5}>No entries yet.</td></tr>}
        {rows.map((r) => <tr key={r.id}><td style={{ whiteSpace: 'nowrap' }}>{r.created_at}</td><td>{r.actor || '—'}</td><td>{r.action}</td><td>{r.entity}</td><td>{r.detail}</td></tr>)}
      </tbody></table></div>
      <div className="row">{page > 1 && <Link className="btn sm out" href={href(page - 1)}>← Newer</Link>}<span className="help">Page {page} of {pages} · {total} entries</span>{page < pages && <Link className="btn sm out" href={href(page + 1)}>Older →</Link>}</div>
    </>
  );
}
